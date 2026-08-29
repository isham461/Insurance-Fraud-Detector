from sqlalchemy import Column, Integer, String, Float, DateTime
from pydantic import BaseModel
from database import Base
import datetime

# ==========================================
# SQLAlchemy Models (Database Tables)
# ==========================================
class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    claimant_name_encrypted = Column(String)  # Stored encrypted!
    incident_type = Column(String)
    claimed_amount = Column(Float)
    status = Column(String, default="PENDING")
    fraud_score = Column(Float, nullable=True) # To be updated by ML model
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# ==========================================
# Pydantic Schemas (API Data Validation)
# ==========================================
class ClaimCreate(BaseModel):
    claimant_name: str
    incident_type: str
    claimed_amount: float
    claim_text: str  # The raw text/PDF content to be sent to MongoDB and GPT
    proof_image: str | None = None # Base64 encoded image string

class ClaimResponse(BaseModel):
    id: int
    claimant_name: str
    incident_type: str
    claimed_amount: float
    status: str
    fraud_score: float | None
    risk_level: str | None = None
    reason_flags: list[str] | None = None

    class Config:
        orm_mode = True
