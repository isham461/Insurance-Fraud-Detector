from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, Form, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
import sys
import encryption
from supabase_client import supabase

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'phase1_ai_core')))
try:
    from gpt_extractor import analyze_claim
except ImportError:
    print("[WARNING] Could not import gpt_extractor from phase1")

app = FastAPI(title="Insurance Fraud API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.post("/api/v1/claims")
async def submit_claim(
    claimant_name: str = Form(...),
    incident_type: str = Form(...),
    claimed_amount: float = Form(...),
    incident_description: str = Form(...),
    evidence_file: UploadFile = File(None)
):
    """
    Submit a claim via multipart/form-data, process with Gemini, and save to Supabase.
    """
    # 0. Validate File Type
    if evidence_file and evidence_file.filename:
        allowed_types = ["image/jpeg", "image/png", "application/pdf"]
        if evidence_file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, and PDF are allowed.")

    # 1. Read the image if provided
    image_bytes = None
    public_url = None
    if evidence_file and evidence_file.filename:
        image_bytes = await evidence_file.read()
        if supabase:
            # Upload to Supabase Storage
            import time
            import re
            safe_filename = re.sub(r'[^a-zA-Z0-9_.-]', '_', os.path.basename(evidence_file.filename))
            file_name = f"{int(time.time())}_{safe_filename}"
            try:
                # We assume a public bucket named "evidence-files" exists.
                supabase.storage.from_("evidence-files").upload(
                    file_name,
                    image_bytes,
                    {"content-type": evidence_file.content_type}
                )
                public_url = supabase.storage.from_("evidence-files").get_public_url(file_name)
                print(f"Uploaded to Supabase: {public_url}")
            except Exception as e:
                print(f"Failed to upload to Supabase Storage: {e}")

    # 2. Call the Gemini Fraud Engine
    claim_text = f"Claimant: {claimant_name}\\nIncident Type: {incident_type}\\nAmount: ${claimed_amount}\\nDescription: {incident_description}"
    print("Sending to Gemini Fraud Engine...")
    gemini_result = analyze_claim(claim_text, image_bytes)
    
    fraud_score = gemini_result.get("fraud_score", 0)
    risk_level = gemini_result.get("risk_level", "UNKNOWN")
    risk_factors = gemini_result.get("risk_factors", [])
    extracted_receipt_amount = gemini_result.get("extracted_receipt_amount")

    # Encrypt PII before saving to Database
    encrypted_name = encryption.encrypt_data(claimant_name)

    # 3. Save to Supabase 'claims' table
    db_id = None
    if supabase:
        try:
            insert_data = {
                "claimant_name": encrypted_name,
                "incident_type": incident_type,
                "claimed_amount": claimed_amount,
                "incident_description": incident_description,
                "evidence_url": public_url,
                "fraud_score": fraud_score,
                "risk_level": risk_level,
                "risk_factors": risk_factors,
                "extracted_receipt_amount": extracted_receipt_amount,
                "status": "PROCESSING"
            }
            response = supabase.table("claims").insert(insert_data).execute()
            if response.data:
                db_id = response.data[0].get("id")
                print(f"Inserted into Supabase DB with ID: {db_id}")
        except Exception as e:
            print(f"Failed to insert into Supabase DB (Table 'claims' might not exist): {e}")

    # 4. Broadcast via WebSocket
    response_payload = {
        "id": db_id,
        "claimant_name": claimant_name,
        "incident_type": incident_type,
        "claimed_amount": claimed_amount,
        "status": "PROCESSING",
        "fraud_score": fraud_score,
        "risk_level": risk_level,
        "reason_flags": risk_factors,
        "extracted_receipt_amount": extracted_receipt_amount,
        "evidence_url": public_url
    }
    
    await manager.broadcast(json.dumps({
        "event": "NEW_CLAIM",
        **response_payload
    }))

    return response_payload

@app.get("/api/v1/claims")
async def get_claims():
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase connection not initialized.")
    try:
        response = supabase.table("claims").select("*").order("created_at", desc=True).execute()
        claims = response.data
        
        for claim in claims:
            if claim.get("claimant_name"):
                try:
                    claim["claimant_name"] = encryption.decrypt_data(claim["claimant_name"])
                except Exception as e:
                    print(f"Error decrypting name for claim {claim.get('id')}: {e}")
                    claim["claimant_name"] = "Unknown (Decryption Failed)"
        return claims
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/api/v1/ws/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Client message: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

class ClaimUpdatePayload(BaseModel):
    status: str

@app.patch("/api/v1/claims/{claim_id}")
async def update_claim_status(claim_id: int, payload: ClaimUpdatePayload):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase connection not initialized.")
    
    try:
        response = supabase.table("claims").update({"status": payload.status}).eq("id", claim_id).execute()
        return {"message": "Status updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
