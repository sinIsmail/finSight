from fastapi import APIRouter, File, UploadFile, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from models import Transaction
from services.parser import parse_statement
from services.ai_service import categorize_transactions_with_gemini
from datetime import datetime
import json

router = APIRouter()

@router.post("/upload")
async def upload_statement(file: UploadFile = File(...), db: Session = Depends(get_db)):
    
    # We create a generator that "yields" text chunks as it works
    async def process_pipeline():
        try:
            yield json.dumps({"status": "progress", "progress": 20, "message": "📡 Receiving document..."}) + "\n"
            contents = await file.read()
            
            # ... previous code ...
            yield json.dumps({"status": "progress", "progress": 40, "message": "🔍 Extracting raw tables..."}) + "\n"
            parsed_result = parse_statement(contents, file.filename)
            raw_list = parsed_result["preview_data"]
            
            # ✨ NEW: Update the progress message
            yield json.dumps({"status": "progress", "progress": 60, "message": "🧠 Checking AI Memory Cache..."}) + "\n"
            
            # ✨ NEW: Pass the `db` session into the function!
            smart_list = categorize_transactions_with_gemini(raw_list, db)
            
           
            # ... rest of the code ...
            yield json.dumps({"status": "progress", "progress": 80, "message": "💾 Saving to Neon database..."}) + "\n"
            for item in smart_list:
                tx_data = item.model_dump() if hasattr(item, "model_dump") else item
                try:
                    db_date = datetime.strptime(tx_data["date"], "%Y-%m-%d").date()
                except Exception:
                    db_date = datetime.now().date()

                new_tx = Transaction(
                    date=db_date,
                    description=tx_data["description"],
                    amount=tx_data["amount"],
                    transaction_type=tx_data["type"],
                    category=tx_data.get("category", "Uncategorized")
                )
                db.add(new_tx)
            
            db.commit() 
            
            final_preview = [tx.model_dump() if hasattr(tx, "model_dump") else tx for tx in smart_list]
            
            # The final yield sends the actual data to build the charts
            yield json.dumps({
                "status": "success", 
                "progress": 100, 
                "message": "✅ Complete!", 
                "data": {"preview_data": final_preview}
            }) + "\n"

        except Exception as e:
            db.rollback() 
            yield json.dumps({"status": "error", "message": str(e)}) + "\n"

    # Return the stream instead of a standard dictionary!
    return StreamingResponse(process_pipeline(), media_type="application/x-ndjson")
