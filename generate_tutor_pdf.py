import os
from markdown_pdf import MarkdownPdf, Section

md_content = """# Your Personal AI & Backend Tutor Guide
Welcome! This guide is designed to help you completely understand Phase 1 (AI Core) and Phase 2 (Backend) of your Insurance Fraud Detection System. By the end of this document, you'll know exactly what FastAPI is, how we trained the machine learning model, and how every major script works line by line.

---

## 1. High-Level Concepts

### What is FastAPI?
FastAPI is a modern, fast web framework for building APIs (Application Programming Interfaces) with Python. Think of it as the "brain" or the "waiter" of a restaurant. 
- The Frontend (React/Vite) is the customer placing an order.
- The Backend (FastAPI) takes the order, goes to the kitchen (Database and AI model), gets the results, and hands them back to the customer.
It's incredibly fast and automatically creates documentation for you!

### How was the Model Trained?
We used **XGBoost** (eXtreme Gradient Boosting), a very powerful machine learning algorithm that builds a "forest" of decision trees. 
1. **The Data**: We gathered three historical datasets of insurance claims (`insurance_claims.csv`, `carclaims.csv`, `fraud_oracle.csv`).
2. **The Features**: We extracted the numerical claim amount and whether a police report was filed.
3. **The Target**: We looked at whether those historical claims were marked as "Fraud" (1) or "Not Fraud" (0).
4. **The Training**: The XGBoost algorithm analyzed all 31,000+ rows to find patterns (e.g., "High claim amount + No police report = High likelihood of fraud").
5. **The Output**: The algorithm's "knowledge" was saved into a file called `xgboost_fraud_model.pkl`. This file is like a compressed brain that we can load instantly whenever we need a prediction.

---

## 2. Phase 1: AI Core Explanation

This phase is responsible for talking to Google's Gemini LLM (for extracting data from text and images) and training the XGBoost model.

### Script: `gpt_extractor.py`
**Purpose:** Reads messy paragraphs or uploaded receipts and uses Google Gemini to turn them into clean, structured JSON data.

**Line-by-Line Breakdown:**
- `import google.generativeai as genai`: Imports the official Google SDK to talk to Gemini.
- `from dotenv import load_dotenv`: Allows us to read your secret `GEMINI_API_KEY` from the hidden `.env` file so it's not exposed in code.
- `def extract_claim_details(claim_text: str):`: A function that takes the raw user story (e.g., "I crashed my car on Main St...").
- `model = genai.GenerativeModel('gemini-1.5-flash', ...)`: Tells Google we want to use their fast 1.5-flash model and that it MUST reply in JSON format.
- `def verify_document(image_b64: str, claimed_amount: float):`: The function that handles receipt uploads. 
- `image_bytes = base64.b64decode(image_b64)`: The frontend sends the image as a giant string of text (Base64). This converts that text back into raw image bytes.
- `response = model.generate_content([{"mime_type": "image/jpeg", "data": image_bytes}, prompt])`: Sends the image and a strict prompt to Gemini Vision, asking it to read the receipt and compare the receipt amount with the user's claimed amount to find discrepancies.

### Script: `train_xgboost.py`
**Purpose:** Combines the three CSV files and trains the ML model.

**Line-by-Line Breakdown:**
- `def load_combined_data():`: Function to read all three `.csv` files using Pandas.
- `df1['total_claim_amount'].astype(float)`: Standardizes the claim amount into decimals.
- `pd.concat(...)`: Glues the three different datasets together into one giant table.
- `def train_xgboost(df):`: The main training function.
- `X = df[['amount', 'police_report']]`: Defines our "Features" (what the model learns from).
- `y = df['target']`: Defines our "Label" (the answer key: Fraud or Not Fraud).
- `X_train, X_test... = train_test_split(...)`: Splits the data so 80% is used for learning, and 20% is held back to test the model on data it has never seen.
- `model = xgb.XGBClassifier(...)`: Sets up the algorithm. `objective='binary:logistic'` means it will output a probability between 0 and 1.
- `model.fit(X_train, y_train)`: The actual "learning" step where the math happens.
- `joblib.dump(model, model_path)`: Saves the trained model to the hard drive as a `.pkl` file.

---

## 3. Phase 2: Backend Explanation

This phase is the FastAPI server that glues the frontend, database, AI, and ML together.

### Script: `models.py`
**Purpose:** Defines the rules for how data should look.
- `class Claim(Base):`: Tells SQLAlchemy (the database tool) how to create the PostgreSQL table. It specifies columns like `id`, `incident_type`, and `fraud_score`.
- `class ClaimCreate(BaseModel):`: Tells FastAPI exactly what data to expect from the Frontend. If the frontend forgets to send `claimant_name`, FastAPI will automatically throw a helpful error!

### Script: `ml_model.py`
**Purpose:** Loads the `.pkl` file and runs predictions live.
- `xgb_model = joblib.load(MODEL_PATH)`: When the server starts, it loads the trained model into memory so it doesn't have to read from the hard drive on every request.
- `def predict_fraud_score(... has_evidence: bool = False):`: The function that returns the fraud risk.
- `if not has_evidence: return 0.99`: This is your hard business rule! If the user didn't upload a receipt, it bypasses the ML entirely and flags it as 99% fraud.
- `prob_fraud = float(xgb_model.predict_proba(input_df)[0][1])`: If they did provide evidence, we pass the amount and police report flag to the XGBoost model. `predict_proba` returns the statistical probability of fraud.

### Script: `main.py`
**Purpose:** The central traffic cop. It handles API requests, coordinates all the other files, and sends live WebSocket updates.

**Line-by-Line Breakdown:**
- `app = FastAPI(...)`: Initializes the web server.
- `class ConnectionManager:`: Manages WebSockets. WebSockets are a persistent open connection. Instead of the frontend constantly asking "Any updates?", the backend can instantly push updates to the dashboard.
- `@app.post("/api/v1/claims")`: Defines the endpoint URL where claims are submitted.
- `encrypted_name = encryption.encrypt_data(claim.claimant_name)`: Secures PII by turning the name into a scrambled cipher.
- `db_claim = models.Claim(...)`: Saves the relational data (names, amounts) to the structured Postgres database.
- `extracted_data = extract_claim_details(claim.claim_text)`: Calls Phase 1 to get Gemini to parse the user's story.
- `if claim.proof_image: verification_data = verify_document(...)`: Calls Phase 1 to get Gemini Vision to audit the uploaded receipt.
- `score = ml_model.predict_fraud_score(...)`: Calls the ML model to get the final fraud risk.
- `claims_collection.insert_one(unstructured_doc)`: Saves all the messy AI outputs and raw text to MongoDB (which is great at handling unstructured data).
- `await manager.broadcast(...)`: Beams all this calculated data instantly to the Adjuster Dashboard over the WebSocket connection.

---

## Conclusion
You now have an incredibly robust architecture:
1. **FastAPI** handles high-speed routing.
2. **Postgres** securely holds encrypted PII.
3. **MongoDB** acts as a data lake for raw documents.
4. **Google Gemini (AI)** parses text and acts as a visual receipt auditor.
5. **XGBoost (ML)** provides mathematical probability scoring based on 30k+ historical records.

You can modify prompts in `gpt_extractor.py` to change how the AI reads documents, or tune the `scale_pos_weight` in `train_xgboost.py` to make the ML model more sensitive to fraud!
"""

pdf = MarkdownPdf(toc_level=2)
pdf.add_section(Section(md_content))
pdf.save("AI_Backend_Tutor_Guide.pdf")
print("PDF generated successfully at AI_Backend_Tutor_Guide.pdf")
