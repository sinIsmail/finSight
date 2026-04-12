from fastapi import APIRouter, File, UploadFile, Form
from fastapi.responses import StreamingResponse
from services.parser import parse_statement
from services.ai_service import extract_and_categorize_with_gemini
import json

router = APIRouter()

@router.post("/upload")
async def upload_statement(
    file: UploadFile = File(...), 
    model: str = Form("gemini-2.5-flash") # Accepts the user's choice from the frontend!
):
    
    async def process_pipeline():
        try:
            yield json.dumps({"status": "progress", "progress": 10, "message": "📡 Receiving document..."}) + "\n"
            contents = await file.read()
            
            yield json.dumps({"status": "progress", "progress": 20, "message": f"🔍 Booting {model} Engine..."}) + "\n"
            
            final_preview = []
            
            # The parser now yields chunks of raw text, NOT structured lists.
            for chunk_data in parse_statement(contents, file.filename):
                part_num = chunk_data.get('part', 1)
                total_parts = chunk_data.get('total_parts', 1)
                raw_text = chunk_data["raw_text"]
                
                yield json.dumps({"status": "progress", "progress": 40, "message": f"📑 OCR Read Document Part {part_num} of {total_parts}..."}) + "\n"
                
                yield json.dumps({"status": "progress", "progress": 60, "message": f"🧠 Passing Part {part_num} to {model} for Extraction..."}) + "\n"
                
                # Hand it directly to Gemini for pure data extraction
                smart_array = extract_and_categorize_with_gemini(raw_text, model)
                
                yield json.dumps({"status": "progress", "progress": 80, "message": f"💾 Consolidating JSON Payload (Part {part_num})..."}) + "\n"
                
                # Map the returned AI array directly into our final layout
                part_preview = []
                for item in smart_array:
                    mapped_item = {
                        "date": item.get("date", "Unknown"),
                        "description": item.get("description", "Unknown"),
                        "amount": item.get("amount", 0.0),
                        "type": item.get("type", "Unknown"),
                        "category": item.get("category", "Uncategorized")
                    }
                    part_preview.append(mapped_item)
                    final_preview.append(mapped_item)
                
                # Emit intermediate tables to the frontend instantly
                if part_num < total_parts:
                    yield json.dumps({
                        "status": "partial_data", 
                        "progress": 90, 
                        "message": f"🔄 Streamed Part {part_num}. Processing next half via LLM...", 
                        "data": {"preview_data": part_preview}
                    }) + "\n"
            
            yield json.dumps({
                "status": "success", 
                "progress": 100, 
                "message": "✅ Document Processing Complete!", 
                "data": {"preview_data": final_preview}
            }) + "\n"

        except Exception as e:
            yield json.dumps({"status": "error", "message": f"Pipeline failed: {str(e)}"}) + "\n"

    # Return the stream instead of a standard dictionary!
    return StreamingResponse(process_pipeline(), media_type="application/x-ndjson")
