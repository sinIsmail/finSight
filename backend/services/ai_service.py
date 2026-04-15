"""
FinSight AI Service — Production Build
=======================================
Dual-platform extraction engine: Google Gemini, OpenRouter, and local Ollama.
Key improvements over v1:
  - Per-platform timeout + retry configuration
  - Error taxonomy: timeout vs rate-limit vs hard failure
  - Ollama: retries the SAME model on timeout before rotating
  - Exponential back-off between retries
  - Structured attempt log with error_type field for frontend diagnostics
"""

import os
import time
import json
import logging
import urllib.request
from typing import Literal, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("finsight.ai")


# ─── Free-Tier Model Registry ─────────────────────────────────────────────────

FREE_MODELS: dict[str, list[str]] = {
    "gemini": [
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b",
        "gemini-1.5-pro",
        "gemini-2.0-flash-lite-preview-02-05",
    ],
    "openrouter": [
        "meta-llama/llama-3.3-70b-instruct:free",
        "google/gemma-3-27b-it:free",
        "deepseek/deepseek-chat:free",
        "cognitivecomputations/dolphin3.0-r1-mistral-24b:free",
        "nouseresearch/hermes-3-llama-3.1-405b:free",
        "mistralai/mistral-nemo:free",
    ],
    "ollama": [
        "llama3.2",
        "llama3",
        "mistral",
        "qwen2.5",
        "deepseek-coder",
        "phi4",
    ],
}

DEFAULT_MODELS: dict[str, str] = {
    "gemini":     "gemini-1.5-flash",
    "openrouter": "meta-llama/llama-3.3-70b-instruct:free",
    "ollama":     "llama3.2",
}

# ─── Per-Platform Behaviour Config ───────────────────────────────────────────
#
#  timeout_seconds       — hard timeout passed to the HTTP client
#  same_model_retries    — how many times to retry the *same* model on a
#                          retryable error (timeout / 503) before rotating
#  backoff_base_seconds  — sleep between retries; doubles each attempt
#  rotate_on_timeout     — if False and a timeout is hit, we retry the same
#                          model (up to same_model_retries) instead of
#                          immediately jumping to the next one
#
PLATFORM_CONFIG: dict[str, dict] = {
    "gemini": {
        "timeout_seconds":      120,
        "same_model_retries":   1,
        "backoff_base_seconds": 2.0,
        "rotate_on_timeout":    False,   # Gemini is fast; timeout = real problem
    },
    "openrouter": {
        "timeout_seconds":      180,
        "same_model_retries":   1,
        "backoff_base_seconds": 2.0,
        "rotate_on_timeout":    False,
    },
    "ollama": {
        # Local models can be SLOW — give them time before we give up
        "timeout_seconds":      600,     # 10 minutes
        "same_model_retries":   2,       # Try the same local model 3× total
        "backoff_base_seconds": 8.0,     # Wait 8s, then 16s before rotating
        "rotate_on_timeout":    False,   # ← KEY FIX: don't rotate on timeout
    },
}


# ─── Dynamic Discovery Helpers ───────────────────────────────────────────────

def get_installed_ollama_models() -> list[str]:
    """Fetch models actually installed in local Ollama (non-blocking, 2s timeout)."""
    try:
        req = urllib.request.Request("http://localhost:11434/api/tags")
        with urllib.request.urlopen(req, timeout=2.0) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode())
                return [m["name"] for m in data.get("models", [])]
    except Exception:
        pass
    return []


# ─── Error Classification ─────────────────────────────────────────────────────

_RATE_LIMIT_KEYWORDS = [
    "429", "rate limit", "quota", "resource exhausted",
    "overloaded", "too many requests", "model_not_available",
]
_TIMEOUT_KEYWORDS = [
    "timeout", "timed out", "read timeout", "connect timeout",
    "readtimeout", "connectiontimeout",
]
_SERVER_ERROR_KEYWORDS = ["503", "502", "bad gateway", "service unavailable", "unavailable"]

_HARD_FAIL_KEYWORDS = [
    "invalid api key", "authentication", "401", "403",
    "model not found", "invalid model",
]


class ErrorType:
    RATE_LIMIT  = "rate_limit"    # → rotate model after brief sleep
    TIMEOUT     = "timeout"       # → may retry same model (platform-dependent)
    SERVER_ERR  = "server_error"  # → rotate model
    HARD_FAIL   = "hard_fail"     # → rotate model immediately (no sleep)
    PARSE_ERR   = "parse_error"   # → rotate model (bad JSON etc.)
    UNKNOWN     = "unknown"       # → rotate model


def classify_error(exc: Exception) -> str:
    msg = str(exc).lower()
    if any(k in msg for k in _HARD_FAIL_KEYWORDS):
        return ErrorType.HARD_FAIL
    if any(k in msg for k in _TIMEOUT_KEYWORDS):
        return ErrorType.TIMEOUT
    if any(k in msg for k in _RATE_LIMIT_KEYWORDS):
        return ErrorType.RATE_LIMIT
    if any(k in msg for k in _SERVER_ERROR_KEYWORDS):
        return ErrorType.SERVER_ERR
    if isinstance(exc, (json.JSONDecodeError, ValueError, KeyError, TypeError)):
        return ErrorType.PARSE_ERR
    return ErrorType.UNKNOWN


# ─── Extraction Prompt ────────────────────────────────────────────────────────

def _build_prompt(raw_text: str) -> str:
    return f"""You are a strict financial data extraction AI.
Extract ALL transactions from the following bank statement text.

Return ONLY a valid JSON object with a single key "transactions" containing an array.
Each item must have exactly these keys:
  - date        (string, format YYYY-MM-DD if possible)
  - description (string)
  - type        ("Debit" or "Credit")
  - amount      (number, always positive)
  - category    (string — infer from description:
                 Food, Transport, Shopping, Entertainment,
                 Health, Utilities, Transfer, Other)

Do NOT include any explanation, markdown, or commentary. Only pure JSON.

Bank Statement Text:
{raw_text}
"""


# ─── Platform Callers ─────────────────────────────────────────────────────────

def _call_gemini(prompt: str, model: str, timeout: int) -> list[dict]:
    from google import genai
    from google.genai import types

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise EnvironmentError("GEMINI_API_KEY is not set in .env")

    client = genai.Client(
        api_key=api_key,
        http_config={"timeout": timeout},
    )
    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.1,
        ),
    )
    raw = response.text.strip()
    if raw.startswith("```"):
        raw = "\n".join(raw.split("\n")[1:])
        raw = raw.rsplit("```", 1)[0].strip()

    parsed = json.loads(raw)
    if isinstance(parsed, list):
        return parsed
    return parsed.get("transactions", parsed.get("data", []))


def _call_openrouter(prompt: str, model: str, timeout: int) -> list[dict]:
    from openai import OpenAI

    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise EnvironmentError("OPENROUTER_API_KEY is not set in .env")

    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
        timeout=float(timeout),
    )
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.1,
    )
    raw = response.choices[0].message.content.strip()
    parsed = json.loads(raw)
    if isinstance(parsed, list):
        return parsed
    return parsed.get("transactions", parsed.get("data", []))


def _call_ollama(prompt: str, model: str, timeout: int) -> list[dict]:
    """
    Call local Ollama via its OpenAI-compatible endpoint.
    Uses a generous timeout so slow models aren't prematurely abandoned.
    """
    from openai import OpenAI

    client = OpenAI(
        base_url="http://localhost:11434/v1",
        api_key="ollama",
        timeout=float(timeout),
    )
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.1,
    )
    raw = response.choices[0].message.content.strip()
    parsed = json.loads(raw)
    if isinstance(parsed, list):
        return parsed
    return parsed.get("transactions", parsed.get("data", []))


# ─── Caller Dispatch ──────────────────────────────────────────────────────────

_CALLERS = {
    "gemini":     _call_gemini,
    "openrouter": _call_openrouter,
    "ollama":     _call_ollama,
}

Platform = Literal["gemini", "openrouter", "ollama"]


# ─── Main Fallback Engine ─────────────────────────────────────────────────────

def extract_with_fallback(
    raw_text: str,
    platform: Platform,
    starting_model: Optional[str] = None,
) -> tuple[list[dict], str, list[dict]]:
    """
    Extract transactions with automatic free-tier fallback.

    Per-model retry logic:
      • TIMEOUT on Ollama → retry the SAME model (up to same_model_retries)
        before rotating. This prevents premature model-switching when a local
        LLM is simply slow.
      • RATE_LIMIT / SERVER_ERR → rotate immediately after a brief back-off.
      • HARD_FAIL / PARSE_ERR  → rotate immediately (no sleep).

    Returns:
        (transactions, model_used, attempt_log)
        attempt_log entries: {model, attempt, status, error_type, error, duration_s}
    """
    cfg     = PLATFORM_CONFIG.get(platform, PLATFORM_CONFIG["gemini"])
    caller  = _CALLERS[platform]
    timeout = cfg["timeout_seconds"]

    # Build ordered model list
    if platform == "ollama":
        model_list = get_installed_ollama_models()
    else:
        model_list = FREE_MODELS.get(platform, [])

    ordered: list[str] = []
    if starting_model:
        ordered.append(starting_model)
    for m in model_list:
        if m not in ordered:
            ordered.append(m)

    if not ordered:
        logger.error(f"[{platform.upper()}] No models available.")
        return [], "none", []

    prompt      = _build_prompt(raw_text)
    attempt_log = []

    for model in ordered:
        max_tries = 1 + cfg["same_model_retries"]   # total attempts per model

        for attempt in range(1, max_tries + 1):
            t0 = time.time()
            try:
                logger.info(
                    f"[{platform.upper()}] Trying {model} (attempt {attempt}/{max_tries})…"
                )
                transactions = caller(prompt, model, timeout)

                if not isinstance(transactions, list):
                    raise ValueError(f"Expected list, got {type(transactions).__name__}")

                duration = round(time.time() - t0, 2)
                logger.info(
                    f"[{platform.upper()}] ✅ {model} → {len(transactions)} txns in {duration}s"
                )
                attempt_log.append({
                    "model": model, "attempt": attempt,
                    "status": "ok", "duration_s": duration,
                })
                return transactions, model, attempt_log

            except Exception as exc:
                duration   = round(time.time() - t0, 2)
                error_type = classify_error(exc)
                err_str    = str(exc)
                short_err  = err_str[:200]

                logger.warning(
                    f"[{platform.upper()}] ❌ {model} attempt {attempt} "
                    f"[{error_type}] after {duration}s — {short_err[:100]}"
                )
                attempt_log.append({
                    "model":      model,
                    "attempt":    attempt,
                    "status":     "failed",
                    "error_type": error_type,
                    "error":      short_err,
                    "duration_s": duration,
                })

                # ── Decide: retry same model, or break to next ──────────────
                should_retry_same = (
                    error_type == ErrorType.TIMEOUT
                    and not cfg["rotate_on_timeout"]
                    and attempt < max_tries
                )

                if error_type == ErrorType.HARD_FAIL:
                    # API key / auth issues — no point retrying any model
                    logger.error(
                        f"[{platform.upper()}] Hard failure ({short_err[:80]}). "
                        "Aborting all retries."
                    )
                    return [], "none", attempt_log

                if should_retry_same:
                    backoff = cfg["backoff_base_seconds"] * (2 ** (attempt - 1))
                    logger.info(
                        f"[{platform.upper()}] Timeout on '{model}' — "
                        f"retrying same model in {backoff}s "
                        f"(attempt {attempt + 1}/{max_tries})"
                    )
                    time.sleep(backoff)
                    continue   # retry same model

                # Rate-limit or server error: short sleep then rotate
                if error_type in (ErrorType.RATE_LIMIT, ErrorType.SERVER_ERR):
                    time.sleep(cfg["backoff_base_seconds"])

                # Any other error (parse, unknown): rotate immediately
                break   # move to next model in outer loop

    logger.error(f"[{platform.upper()}] All {len(ordered)} model(s) exhausted.")
    return [], "none", attempt_log