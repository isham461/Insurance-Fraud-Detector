import os
import joblib
import pandas as pd

# Load the trained model globally so it's only loaded once at startup
MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'phase1_ai_core', 'xgboost_fraud_model.pkl'))
try:
    xgb_model = joblib.load(MODEL_PATH)
    print(f"Successfully loaded XGBoost model from {MODEL_PATH}")
except Exception as e:
    print(f"Warning: Failed to load XGBoost model. {e}")
    xgb_model = None

def scan_nlp_keywords(text: str) -> list[str]:
    keywords = ["pay immediately", "wire today", "no police", "cash", "untraceable"]
    detected = []
    text_lower = text.lower()
    for kw in keywords:
        if kw in text_lower:
            detected.append(kw)
    return detected

def predict_fraud_score(
    claimed_amount: float, 
    claim_text: str, 
    extracted_data: dict | None, 
    verification_data: dict | None, 
    has_evidence: bool = False
) -> dict:
    """
    Advanced multi-layered fraud scoring engine.
    """
    score = 0.35 # Fallback baseline
    reason_flags = []
    
    # Base XGBoost prediction
    police_report = 0
    if extracted_data and extracted_data.get("police_report_filed") is True:
        police_report = 1
        
    if xgb_model:
        try:
            input_df = pd.DataFrame({'amount': [claimed_amount], 'police_report': [police_report]})
            score = float(xgb_model.predict_proba(input_df)[0][1])
        except Exception as e:
            print(f"Error during ML prediction: {e}")
            
    # 1. Evidence Penalty
    if claimed_amount > 1000 and not has_evidence:
        score += 0.40
        reason_flags.append("Missing evidence for high claim")
        
    # 2. NLP Risk Indicators
    detected_keywords = scan_nlp_keywords(claim_text)
    if len(detected_keywords) >= 2:
        score += 0.15
        reason_flags.append("High-risk urgency keywords detected")
    elif len(detected_keywords) == 1:
        score += 0.05
        reason_flags.append(f"Suspicious keyword detected: '{detected_keywords[0]}'")
        
    # 3. Discrepancy Engine
    if has_evidence and verification_data and verification_data.get("invoiced_amount") is not None:
        try:
            receipt_total = float(verification_data["invoiced_amount"])
            if claimed_amount > 0:
                diff = abs(claimed_amount - receipt_total) / claimed_amount
                if diff > 0.20:
                    score = max(score, 0.85)
                    reason_flags.append(f"High Discrepancy (Amount mismatch: Claimed ${claimed_amount} vs Receipt ${receipt_total})")
        except ValueError:
            pass
            
    # Normalize score
    final_score = max(0.01, min(score, 0.99))
    
    # Determine risk level
    if final_score < 0.40:
        risk_level = "Low"
    elif final_score < 0.70:
        risk_level = "Medium"
    elif final_score < 0.90:
        risk_level = "High"
    else:
        risk_level = "Critical"
        
    return {
        "score": final_score,
        "risk_level": risk_level,
        "reason_flags": reason_flags
    }
