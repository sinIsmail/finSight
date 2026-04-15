from sqlalchemy.orm import Session
from models import Transaction, PayeeDictionary
from datetime import datetime

def process_and_save_transactions(db: Session, ai_extracted_data: list):
    """
    Processes AI output, checks the Memory Cache for known payees, 
    and saves both the transactions and any new dictionary entries.
    """
    new_transactions = []

    for item in ai_extracted_data:
        raw_desc = item.get("description", "").strip()
        ai_category = item.get("category", "Uncategorized")
        
        # 1️⃣ Check the FinSight Memory Cache
        cached_payee = db.query(PayeeDictionary).filter(PayeeDictionary.raw_name == raw_desc).first()

        if cached_payee:
            # FAST PATH: We know this merchant! Override the AI.
            final_name = cached_payee.clean_name
            final_category = cached_payee.category
        else:
            # SLOW PATH: First time seeing this merchant. 
            final_name = raw_desc  
            final_category = ai_category
            
            # ✨ Learn it for next time: Save to the Dictionary
            new_dictionary_entry = PayeeDictionary(
                raw_name=raw_desc,
                clean_name=final_name,
                category=final_category
            )
            db.add(new_dictionary_entry)
            try:
                db.commit()
                db.refresh(new_dictionary_entry)
            except Exception as e:
                db.rollback() 

        # 2️⃣ Build the actual Transaction object
        try:
            txn_date = datetime.strptime(item.get("date").split("T")[0], "%Y-%m-%d").date()
        except:
            txn_date = None 

        new_txn = Transaction(
            date=txn_date,
            description=final_name,
            amount=float(item.get("amount", 0.0)),
            transaction_type=item.get("type", "DEBIT").upper(),
            category=final_category
        )
        new_transactions.append(new_txn)

    # 3️⃣ Save all new transactions to the database in one batch
    if new_transactions:
        db.add_all(new_transactions)
        db.commit()

    return {"message": f"Successfully saved {len(new_transactions)} transactions."}