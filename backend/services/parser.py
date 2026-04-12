import pandas as pd
import io
import pdfplumber
import logging

# Silence the noisy PDFMiner font warnings
logging.getLogger("pdfminer").setLevel(logging.ERROR)

# ... rest of your parser code ...
def parse_statement(file_contents: bytes, filename: str):
    """Determines file type and routes to the correct parser."""
    if filename.lower().endswith('.csv'):
        yield parse_csv(file_contents)
    elif filename.lower().endswith('.pdf'):
        yield from parse_pdf(file_contents)
    else:
        raise ValueError("Unsupported format. Please upload a CSV or PDF.")

def parse_csv(file_contents: bytes):
    try:
        # Convert CSV payload directly to flat string for the LLM
        df = pd.read_csv(io.BytesIO(file_contents))
        df = df.where(pd.notnull(df), None)
        csv_string = df.to_string(index=False)
        return {
            "message": "CSV successfully read!",
            "part": 1,
            "total_parts": 1,
            "raw_text": csv_string
        }
    except Exception as e:
        raise ValueError(f"Failed to parse CSV: {str(e)}")

def parse_pdf(file_contents: bytes):
    """Extracts RAW text from PDFs and sends it to the AI in chunks."""
    try:
        with pdfplumber.open(io.BytesIO(file_contents)) as pdf:
            total_pages = len(pdf.pages)
            
            # Group pages into chunks of 5 to avoid blowing up AI token context
            chunk_size = 5
            chunks = []
            for i in range(0, total_pages, chunk_size):
                chunks.append((i, min(i + chunk_size, total_pages)))

            for part_index, (start_idx, end_idx) in enumerate(chunks):
                raw_text_block = ""
                
                for i in range(start_idx, end_idx):
                    page = pdf.pages[i]
                    text = page.extract_text()
                    if text:
                        raw_text_block += text + "\n\n"
                                    
                if raw_text_block.strip():
                    yield {
                        "message": f"PDF Part {part_index + 1} OCR extracted successfully!",
                        "part": part_index + 1,
                        "total_parts": len(chunks),
                        "raw_text": raw_text_block
                    }
        
    except Exception as e:
        raise ValueError(f"Failed to read PDF. Error: {str(e)}")