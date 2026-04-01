import json
import os
import google.generativeai as genai
from sqlalchemy.orm import Session
from models import PayeeDictionary

# Make sure your API key is configured
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
# Using the flash model for maximum speed
model = genai.GenerativeModel('gemini-2.0-flash')

def categorize_transactions_with_gemini(raw_transactions: list, db: Session):
    # 1. Extract only the UNIQUE messy names from the uploaded file
    unique_messy_names = list(set([tx["description"] for tx in raw_transactions]))

    # 2. Check the database: Do we already know any of these?
    existing_entries = db.query(PayeeDictionary).filter(PayeeDictionary.raw_name.in_(unique_messy_names)).all()
    
    # Build a dictionary of what we already know
    known_dict = {
        entry.raw_name: {"clean_name": entry.clean_name, "category": entry.category} 
        for entry in existing_entries
    }
    
    # 3. Figure out exactly what we DON'T know yet
    unknown_names = [name for name in unique_messy_names if name not in known_dict]

    # 4. Ask Gemini ONLY about the brand new, unknown names
    if unknown_names:
        prompt = f"""
        You are a financial AI. Clean these transaction names and assign a category.
        
        Rules:
        1. Return ONLY a JSON dictionary where the KEY is the exact messy name, and the VALUE is an object with 'clean_name' and 'category'.
        2. Categories MUST be one of: [Food & Dining, Transport, Shopping, Entertainment, Utilities, Health, Finance, Other].
        
        Messy Names to clean:
        {json.dumps(unknown_names)}
        """
        try:
            response = model.generate_content(
                prompt,
                generation_config={'response_mime_type': 'application/json'}
            )
            ai_new_dict = json.loads(response.text)
            
            # ✨ THE MAGIC: Save these new discoveries to the database so we never ask again!
            for messy_name, data in ai_new_dict.items():
                new_entry = PayeeDictionary(
                    raw_name=messy_name,
                    clean_name=data.get("clean_name", messy_name),
                    category=data.get("category", "Other")
                )
                db.add(new_entry)
                
                # Add it to our working dictionary so we can use it right now
                known_dict[messy_name] = data
                
            db.commit() # Save everything to Neon
            
        except Exception as e:
            print(f"Gemini failed: {e}")
            # Fallback: just use the messy name if the AI breaks
            for name in unknown_names:
                known_dict[name] = {"clean_name": name, "category": "Uncategorized"}

    # 5. Map the clean data back to the original massive list of transactions
    smart_list = []
    for tx in raw_transactions:
        messy_name = tx["description"]
        clean_data = known_dict.get(messy_name, {})
        
        smart_list.append({
            "date": tx["date"],
            "amount": tx["amount"],
            "type": tx["type"],
            "description": clean_data.get("clean_name", messy_name),
            "category": clean_data.get("category", "Uncategorized")
        })
        
    return smart_list