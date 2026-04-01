from sqlalchemy import Column, Integer, String, Float, Date
from database import Base

# Your existing table
class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    description = Column(String, index=True)
    amount = Column(Float)
    transaction_type = Column(String) 
    category = Column(String, default="Uncategorized")

# ✨ NEW: The FinSight AI Memory Cache
class PayeeDictionary(Base):
    __tablename__ = "payee_dictionary"

    id = Column(Integer, primary_key=True, index=True)
    raw_name = Column(String, unique=True, index=True) # e.g., "PaidtoZamZamTeaStall"
    clean_name = Column(String)                        # e.g., "Zam Zam Tea Stall"
    category = Column(String)                          # e.g., "Food & Dining"