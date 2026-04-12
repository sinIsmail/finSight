from google import genai
import os
import json
from dotenv import load_dotenv

# Ensure environment variables are loaded from the .env file BEFORE doing anything else
load_dotenv()

def get_gemini_client():
    """Safely initializes the Gemini client, throwing a clear error if the key is missing."""
    api_key = os.getenv("GEMINI_API_KEY")
    
    # Check if the key is None or an empty string
    if not api_key or not api_key.strip():
        raise ValueError(
            "CRITICAL ERROR: GEMINI_API_KEY is missing or empty! "
            "Please check your .env file and ensure it looks like: GEMINI_API_KEY=AIzaSy..."
        )
    
    return genai.Client(api_key=api_key)


def extract_and_categorize_with_gemini(raw_text: str, model_name: str = "gemini-2.5-flash"):
    """
    Passes raw OCR text to Gemini to extract structured JSON data.
    Bypasses RegEx completely for maximum durability against changing PDF layouts.
    """
    # 1. Initialize the client with our safety wrapper
    try:
        client = get_gemini_client()
    except ValueError as e:
        print(e)
        return [] # Return empty array so the pipeline doesn't completely crash

    # 2. The Strict System Prompt (Based on the FinSight Architecture)
    prompt = f"""
    You are a strict financial data parser. Extract all transactions from the following OCR text.
    Ignore page numbers, headers, footers, and disclaimers.
    Clean the currency strings into flat numbers (e.g., convert "₹208" or " 25,000" into 208.00 and 25000.00).
    
    Categorize each transaction intelligently based on the merchant name using these specific categories:
    Food & Dining, Utilities, Transfers, Shopping, Entertainment, Health, Other.
    
    Output ONLY a valid JSON array of objects with the exact keys: 
    - date (ISO 8601 format, e.g., "YYYY-MM-DDTHH:MM:SS")
    - description (The merchant or sender/receiver name)
    - type ("CREDIT" or "DEBIT")
    - amount (number)
    - category (string from the list above)
    
    Here is the OCR text:
    -----------------------
    {raw_text}
    """
    
    try:
        # 3. Call the Model
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config={'response_mime_type': 'application/json'} # Forces JSON mode
        )
        
        # 4. Clean and Parse the Output
        raw_json = response.text.strip()
        
        # Safety net: Sometimes LLMs wrap JSON in markdown blockticks even in JSON mode
        if raw_json.startswith("```json"):
            raw_json = raw_json[7:]
        if raw_json.endswith("```"):
            raw_json = raw_json[:-3]
            
        extracted_data = json.loads(raw_json.strip())
        return extracted_data
            
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON from Gemini: {e}")
        print(f"Raw Output was: {response.text}")
        return []
    except Exception as e:
        print(f"Gemini AI Extraction Failed using {model_name}: {e}")
        return []