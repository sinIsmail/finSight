import time
import logging
import urllib.request
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import upload
from services.ai_service import FREE_MODELS, DEFAULT_MODELS

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)

app = FastAPI(
    title="FinSight API",
    description="Stateless AI-powered bank statement processor — Gemini + OpenRouter multi-platform",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api", tags=["Upload"])

print(f"\n[{time.strftime('%H:%M:%S')}] 🚀 FinSight API v2.0 — Multi-Platform AI Mode")
print(f"  Gemini free models:     {len(FREE_MODELS['gemini'])}")
print(f"  OpenRouter free models: {len(FREE_MODELS['openrouter'])}")
print("-" * 55)


@app.get("/")
def read_root():
    return {
        "message": "FinSight API v2.0 — Stateless, Multi-Platform AI",
        "platforms": list(FREE_MODELS.keys()),
    }


@app.get("/api/models")
def get_models():
    """
    Returns the complete free-tier model registry for both platforms, and dynamically grabs local Ollama models.
    """
    from services.ai_service import get_installed_ollama_models
    ollama_models = get_installed_ollama_models()

    return {
        "default_platform": "gemini",
        "gemini": {
            "models": FREE_MODELS["gemini"],
            "default": DEFAULT_MODELS["gemini"],
            "label": "Google Gemini",
            "icon": "✨",
        },
        "openrouter": {
            "models": FREE_MODELS["openrouter"],
            "default": DEFAULT_MODELS["openrouter"],
            "label": "OpenRouter",
            "icon": "🔀",
        },
        "ollama": {
            "models": ollama_models,
            "default": ollama_models[0] if ollama_models else "",
            "label": "Local Ollama",
            "icon": "🦙",
        },
    }