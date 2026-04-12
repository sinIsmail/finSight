from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time

from routers import upload

app = FastAPI(title="FinSight API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=False, 
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api", tags=["Upload"])

print(f"\n[{time.strftime('%H:%M:%S')}] 🚀 Booting up FinSight API (Stateless Mode)...")
print("-" * 50)

@app.get("/")
def read_root():
    return {"message": "Welcome to the FinSight API. System is operational (Stateless)."}

@app.get("/api/models")
def get_models():
    """Returns the free Gemini models available for the frontend starting UI."""
    return {
        "models": [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-flash"
        ],
        "default": "gemini-2.5-flash"
    }