import pandas as pd
import io
import pdfplumber
import re

def parse_statement(file_contents: bytes, filename: str):
    """Determines file type and routes to the correct parser."""
    if filename.lower().endswith('.csv'):
        return parse_csv(file_contents)
    elif filename.lower().endswith('.pdf'):
        return parse_pdf(file_contents)
    else:
        raise ValueError("Unsupported format. Please upload a CSV or PDF.")

def parse_csv(file_contents: bytes):
    try:
        df = pd.read_csv(io.BytesIO(file_contents))
        df = df.where(pd.notnull(df), None)
        return {
            "message": "CSV successfully read!",
            "total_rows_found": len(df),
            "preview_data": df.head(15).to_dict(orient="records")
        }
    except Exception as e:
        raise ValueError(f"Failed to parse CSV: {str(e)}")

def clean_phonepe_data(raw_data):
    """
    Hunts through the messy PDF text to find the ₹ symbol, 
    extracts the date/amount, and builds a clean database-ready object.
    """
    cleaned_transactions = []
    
    for i in range(len(raw_data)):
        # raw_data[i] is a list like ["18Feb,2026 PaidtoMrMAHAMMEDMAAZ ₹20"]
        # We grab the first string in that list
        if not raw_data[i]: continue
        row_text = str(raw_data[i][0]).strip()
        
        # If the row contains the Rupee symbol, it's the start of a transaction!
        if "₹" in row_text:
            try:
                # 1. Extract the Amount using Regex (looks for ₹ followed by numbers)
                amount_match = re.search(r'₹([\d,\.]+)', row_text)
                amount_str = amount_match.group(1).replace(',', '') if amount_match else "0"
                amount = float(amount_str)
                
                # 2. Extract the Date (looks for things like 18Feb,2026)
                date_match = re.search(r'^(\d{1,2}[A-Za-z]+,\d{4})', row_text)
                date_str = date_match.group(1) if date_match else "Unknown Date"
                
                # 3. Extract the Description (Remove the date and amount from the string)
                desc = row_text
                if date_match:
                    desc = desc.replace(date_match.group(1), "")
                if amount_match:
                    desc = desc.replace(f"₹{amount_match.group(1)}", "")
                
                desc = desc.strip()
                
                # 4. Clean up PhonePe's missing spaces
                transaction_type = "Unknown"
                if desc.startswith("Paidto"):
                    desc = desc.replace("Paidto", "Paid to ", 1)
                    transaction_type = "Debit"
                elif desc.startswith("Receivedfrom"):
                    desc = desc.replace("Receivedfrom", "Received from ", 1)
                    transaction_type = "Credit"

                # Build the beautiful, database-ready object
                cleaned_transactions.append({
                    "date": date_str,
                    "description": desc,
                    "amount": amount,
                    "type": transaction_type
                })
            except Exception as e:
                print(f"Skipped a messy row: {row_text}. Error: {e}")
                continue
                
    return cleaned_transactions

def parse_pdf(file_contents: bytes):
    """Extracts data from PDFs and sends it to the cleaner."""
    raw_extracted_data = []
    
    try:
        with pdfplumber.open(io.BytesIO(file_contents)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    lines = text.split('\n')
                    for line in lines:
                        if line.strip():
                            # We split by large gaps, or just keep the whole line if no gaps
                            columns = re.split(r'\s{2,}', line.strip())
                            raw_extracted_data.append(columns)
                                
        if not raw_extracted_data:
             raise ValueError("PDF read successfully, but it appears blank.")

        # --- NEW: Send the raw messy data through our PhonePe Cleaner! ---
        beautiful_data = clean_phonepe_data(raw_extracted_data)

        return {
            "message": "PDF successfully extracted and cleaned!",
            "total_rows_found": len(beautiful_data),
            "preview_data": beautiful_data 
        }
        
    except Exception as e:
        raise ValueError(f"Failed to read PDF. Error: {str(e)}")