from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text 
import time # <-- NEW: Used for tracking seconds

# Import your modular routers and database engines
from routers import upload
from database import engine 
import models 

app = FastAPI(title="FinSight API")

# Update this section in main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=False, 
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api", tags=["Upload"])

# -------------------------------------------------------------------
# ✅ NEW: Safe Database Startup with Time Tracking
# -------------------------------------------------------------------
print(f"\n[{time.strftime('%H:%M:%S')}] ⏳ Booting up FinSight API...")
print(f"[{time.strftime('%H:%M:%S')}] 📡 Reaching out to Neon Database...")

try:
    start_time = time.time()
    # This is the line that was crashing the server
    models.Base.metadata.create_all(bind=engine)
    end_time = time.time()
    
    time_taken = round(end_time - start_time, 2)
    print(f"[{time.strftime('%H:%M:%S')}] ✅ Database connected successfully in {time_taken} seconds!")
except Exception as e:
    print(f"[{time.strftime('%H:%M:%S')}] ❌ DATABASE STARTUP FAILED!")
    print(f"[{time.strftime('%H:%M:%S')}] 🚨 Error: {e}")
    print(f"[{time.strftime('%H:%M:%S')}] ⚠️ API is running, but database features will fail.")
print("-" * 50)
# -------------------------------------------------------------------

@app.get("/")
def read_root():
    return {"message": "Welcome to the FinSight API. System is operational."}

@app.get("/api/test-db")
def test_db_connection():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "success", "message": "Successfully connected to the Neon PostgreSQL database!"}
    except Exception as e:
        return {"status": "error", "message": f"Database connection failed: {str(e)}"}