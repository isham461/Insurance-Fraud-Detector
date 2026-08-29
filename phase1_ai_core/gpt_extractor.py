import json
import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load variables from .env into the environment (specifically looking in phase1_ai_core)
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path)

# Configure the Gemini API client
api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
else:
    print("[WARNING] GEMINI_API_KEY not found in environment.")

# Use the recommended flash model available in this environment
model = genai.GenerativeModel('gemini-3.6-flash', generation_config={"response_mime_type": "application/json"})

def analyze_claim(claim_text: str, image_bytes: bytes = None) -> dict:
    """
    Sends the claim text and (optional) image to Gemini to perform the full fraud evaluation.
    """
    prompt = """
    You are an expert fraud detection AI. Analyze the user's claim description and the attached receipt/evidence image.
    1. Extract the exact billed total from the image.
    2. Compare the extracted total against the user's Claimed Amount.
    3. Flag any financial discrepancies or NLP risk markers (e.g., high urgency, vague details, cash payments).
    4. You MUST return a valid JSON object (without markdown formatting or code blocks) matching this exact schema:
    {
      "extracted_receipt_amount": float or null,
      "fraud_score": integer (0-100),
      "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "risk_factors": ["list of specific reasons justifying the score"]
    }
    """
    
    contents = []
    
    if image_bytes:
        contents.append({"mime_type": "image/jpeg", "data": image_bytes})
    
    # Always append the text and the system instruction
    contents.append(f"Claim Description: {claim_text}\n\n{prompt}")
    
    try:
        response = model.generate_content(contents)
        print("Gemini Raw Response:", response.text)
        
        # Parse and return JSON
        data = json.loads(response.text)
        return data
    except Exception as e:
        print(f"Error during Gemini Analysis: {e}")
        return {
            "extracted_receipt_amount": None,
            "fraud_score": 99,
            "risk_level": "CRITICAL",
            "risk_factors": [f"Error during AI processing: {str(e)}"]
        }

if __name__ == "__main__":
    dummy_claim = "My name is John Doe. On October 15, 2023, it was raining heavily and I slid into the car in front of me at the stop sign on Main St. I called the police and they filed a report. The estimated damage is $15,000."
    
    extracted_json = analyze_claim(dummy_claim)
    if extracted_json:
        print("\nExtracted JSON:")
        print(json.dumps(extracted_json, indent=2))
    else:
        print("\nFailed to extract JSON. Did you set GEMINI_API_KEY?")
