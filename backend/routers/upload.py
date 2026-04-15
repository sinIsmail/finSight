"""
FinSight Upload Router — Production Build
==========================================
Accepts file + platform + model, streams NDJSON progress events to the client.

Changes vs v1:
  • Platform-aware heartbeat messages (Ollama shows "Local model is generating…")
  • Heartbeat interval scales per platform (Ollama: 20s, others: 15s)
  • Model-switch events only fire when the FINAL model used differs from the
    starting model (prevents false-positives during same-model retries)
  • attempt_log is always forwarded so the frontend can show diagnostics
  • Stateless — no DB dependency
"""
import json
import asyncio
import logging
from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import StreamingResponse

from services.parser import parse_statement
from services.ai_service import (
    extract_with_fallback,
    FREE_MODELS,
    DEFAULT_MODELS,
    PLATFORM_CONFIG,
)

router = APIRouter()
logger = logging.getLogger("finsight.upload")


# ─── Heartbeat Config (per platform) ─────────────────────────────────────────

_HEARTBEAT_INTERVAL: dict[str, int] = {
    "gemini":     15,   # seconds between "still thinking" pings
    "openrouter": 15,
    "ollama":     20,   # local models are slower — less noise
}

_HEARTBEAT_MSG: dict[str, str] = {
    "gemini":     "📡 Gemini is processing (large statement)…",
    "openrouter": "📡 Remote model is still running…",
    "ollama":     "🦙 Local model is generating — please wait…",
}


# ─── SSE Helper ──────────────────────────────────────────────────────────────

def _sse(payload: dict) -> str:
    """Encode a dict as a newline-delimited JSON string (NDJSON / SSE body)."""
    return json.dumps(payload) + "\n"


# ─── Upload Endpoint ─────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_statement(
    file: UploadFile = File(...),
    platform: str = Form("gemini"),
    model: str = Form(""),
):
    """
    Stream-process a bank statement (PDF or CSV).

    Emitted event shapes
    ────────────────────
    progress     → {status, message, progress}
    partial_data → {status, message, progress, data: [transactions]}
    model_switch → {status, message, from_model, to_model}
    success      → {status, message, model_used, platform, attempt_log, data, progress}
    error        → {status, message, model_used, attempt_log?, progress?}
    """
    file_bytes = await file.read()
    filename   = file.filename or "upload"

    # Normalise platform
    platform = platform.lower().strip()
    if platform not in ("gemini", "openrouter", "ollama"):
        platform = "gemini"

    # Resolve starting model
    starting_model = model.strip() or DEFAULT_MODELS.get(platform, "")

    heartbeat_interval = _HEARTBEAT_INTERVAL.get(platform, 15)
    heartbeat_msg      = _HEARTBEAT_MSG.get(platform, "📡 AI is processing…")

    async def generate():
        all_transactions: list[dict] = []
        final_model_used             = starting_model
        full_attempt_log: list[dict] = []

        try:
            # ── Step 1: Parse file ────────────────────────────────────────────
            yield _sse({
                "status":   "progress",
                "message":  "📂 Parsing file…",
                "progress": 5,
            })
            await asyncio.sleep(0)

            try:
                chunks = list(parse_statement(file_bytes, filename))
            except ValueError as exc:
                yield _sse({
                    "status":     "error",
                    "message":    str(exc),
                    "model_used": starting_model,
                    "attempt_log": [],
                    "progress":   0,
                })
                return

            total_chunks = len(chunks)
            if total_chunks == 0:
                yield _sse({
                    "status":    "error",
                    "message":   "No readable content found in file.",
                    "model_used": starting_model,
                    "attempt_log": [],
                    "progress":  0,
                })
                return

            yield _sse({
                "status":   "progress",
                "message":  (
                    f"📄 File split into {total_chunks} chunk(s). "
                    "Starting AI extraction…"
                ),
                "progress": 10,
            })
            await asyncio.sleep(0)

            current_model = starting_model

            # ── Step 2: Process each chunk ────────────────────────────────────
            for idx, chunk in enumerate(chunks):
                part        = chunk["part"]
                total_parts = chunk["total_parts"]
                raw_text    = chunk["raw_text"]

                base_progress = 10 + int((idx / total_chunks) * 80)

                yield _sse({
                    "status":   "progress",
                    "message":  (
                        f"🤖 [{platform.upper()}] Extracting part {part}/{total_parts} "
                        f"with {current_model}…"
                    ),
                    "progress": base_progress,
                })
                await asyncio.sleep(0)

                # Run blocking AI call in thread-pool executor
                loop    = asyncio.get_event_loop()
                ai_task = loop.run_in_executor(
                    None,
                    extract_with_fallback,
                    raw_text,
                    platform,
                    current_model,
                )

                # ── Heartbeat: keep SSE connection alive while AI works ──────
                # We send a message every `heartbeat_interval` seconds.
                # This does NOT affect model selection — that logic lives
                # entirely inside extract_with_fallback on the thread.
                while not ai_task.done():
                    _, _ = await asyncio.wait([ai_task], timeout=heartbeat_interval)
                    if not ai_task.done():
                        yield _sse({
                            "status":   "progress",
                            "message":  heartbeat_msg,
                            "progress": base_progress,
                        })

                # ── Collect result ────────────────────────────────────────────
                transactions, model_used, attempt_log = await ai_task
                full_attempt_log.extend(attempt_log)

                # Fire a model_switch event if the AI service rotated models
                if model_used not in ("none", current_model):
                    yield _sse({
                        "status":     "model_switch",
                        "message":    (
                            f"⚡ Switched from {current_model} → {model_used} "
                            "(previous model was rate-limited or timed out)"
                        ),
                        "from_model": current_model,
                        "to_model":   model_used,
                    })
                    await asyncio.sleep(0)
                    current_model = model_used

                if model_used != "none":
                    final_model_used = model_used

                chunk_progress = base_progress + int(80 / total_chunks)

                if transactions:
                    all_transactions.extend(transactions)
                    yield _sse({
                        "status":   "partial_data",
                        "message":  (
                            f"✅ Part {part}/{total_parts} done — "
                            f"{len(transactions)} row(s) extracted"
                        ),
                        "progress": chunk_progress,
                        "data":     transactions,
                    })
                else:
                    yield _sse({
                        "status":   "progress",
                        "message":  (
                            f"⚠️ Part {part}/{total_parts}: No transactions found. "
                            "All models were exhausted for this chunk."
                        ),
                        "progress": chunk_progress,
                    })
                await asyncio.sleep(0)

                # Throttle between chunks (free-tier RPM limit)
                if idx < total_chunks - 1:
                    yield _sse({
                        "status":   "progress",
                        "message":  "⏳ Throttling between chunks (free-tier rate limit)…",
                        "progress": chunk_progress,
                    })
                    await asyncio.sleep(3)

            # ── Step 3: Final result ──────────────────────────────────────────
            yield _sse({
                "status":   "progress",
                "message":  "🔄 Finalising data…",
                "progress": 95,
            })
            await asyncio.sleep(0)

            if all_transactions:
                yield _sse({
                    "status":      "success",
                    "message":     (
                        f"🎉 Extracted {len(all_transactions)} transaction(s) "
                        f"using {final_model_used}"
                    ),
                    "model_used":  final_model_used,
                    "platform":    platform,
                    "attempt_log": full_attempt_log,
                    "data":        all_transactions,
                    "progress":    100,
                })
            else:
                yield _sse({
                    "status":      "error",
                    "message":     (
                        "❌ Could not extract any transactions. "
                        "All models were exhausted — check attempt_log for details."
                    ),
                    "model_used":  final_model_used,
                    "attempt_log": full_attempt_log,
                    "progress":    100,
                })

        except Exception as exc:
            logger.exception("Unexpected error during upload processing")
            yield _sse({
                "status":      "error",
                "message":     f"Unexpected server error: {exc}",
                "model_used":  starting_model,
                "attempt_log": full_attempt_log,
                "progress":    0,
            })

    return StreamingResponse(
        generate(),
        media_type="application/x-ndjson",
        headers={
            "X-Accel-Buffering": "no",   # Disable nginx buffering for live streaming
            "Cache-Control":     "no-cache",
        },
    )