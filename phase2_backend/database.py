import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from motor.motor_asyncio import AsyncIOMotorClient

# ==========================================
# PostgreSQL (Relational Data)
# ==========================================
# In production, use environment variables:
# PG_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/insurance_db")
PG_URL = "sqlite:///./insurance_claims.db"  # Using SQLite for local testing, swap to postgresql:// for prod
engine = create_engine(PG_URL, connect_args={"check_same_thread": False}) # connect_args only needed for SQLite
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ==========================================
# MongoDB (Unstructured Data)
# ==========================================
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
mongo_client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=2000)
mongo_db = mongo_client["insurance_db"]
claims_collection = mongo_db["unstructured_claims"]
