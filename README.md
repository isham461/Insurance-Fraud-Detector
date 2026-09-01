# TrustScore AI 🛡️

TrustScore AI is a next-generation, AI-driven insurance fraud detection system. It utilizes Google's Gemini 3.6 Flash multimodal AI to analyze unstructured insurance claims alongside uploaded evidence (receipts, invoices, police reports), automatically flagging financial discrepancies and NLP risk markers in real-time.

## System Architecture 🏗️

The project is structured into three main phases/components:

1. **`phase1_ai_core/`**: The AI processing engine. Uses `google-generativeai` to perform multimodal OCR and semantic analysis, enforcing a strict JSON schema output.
2. **`phase2_backend/`**: The FastAPI server. Handles multipart file uploads, encrypts Personally Identifiable Information (PII) via AES-256 before database insertion, orchestrates the AI calls, and communicates with Supabase (Database & Storage) and the frontend (via WebSockets).
3. **`phase3_frontend/`**: The React Vite application. Features a dual-tab layout containing the Claimant Submission Portal and the fully interactive Adjuster Dashboard with real-time WebSocket updates, instant filtering, and optimistic UI actions.

## Tech Stack 💻
- **Frontend**: React, Vite, TypeScript, Vanilla CSS
- **Backend**: Python, FastAPI, Uvicorn, WebSockets
- **AI Engine**: Google Gemini 3.6 Flash
- **Database/Storage**: Supabase (PostgreSQL + Cloud Storage Bucket)

## Prerequisites & Setup ⚙️

### 1. Supabase Configuration
- Create a new project on [Supabase](https://supabase.com/).
- Create a table named `claims` with the following columns:
  - `id` (int8, primary key)
  - `claimant_name` (text, stores AES-256 encrypted names)
  - `incident_type` (text)
  - `claimed_amount` (numeric)
  - `incident_description` (text)
  - `evidence_url` (text)
  - `fraud_score` (numeric)
  - `risk_level` (text)
  - `risk_factors` (jsonb or text array)
  - `status` (text, default "PROCESSING")
- **CRITICAL**: Disable Row Level Security (RLS) on the `claims` table, OR create policies allowing `INSERT`, `SELECT`, and `UPDATE` for the public `anon` role.
- Create a public Storage Bucket named `evidence-files`.
- **CRITICAL**: Navigate to the Storage Policies and create a new policy allowing `INSERT` and `SELECT` for the `storage.objects` table, with the condition `bucket_id = 'evidence-files'`. 

### 2. Environment Variables
In the `phase1_ai_core/` directory, create a `.env` file:
```env
GEMINI_API_KEY=your_google_ai_studio_key_here
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_public_key
ENCRYPTION_KEY=your_32_byte_aes_encryption_key
```

## Running the Application 🚀

### Start the Backend
```bash
cd phase2_backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Start the Frontend
Open a new terminal window:
```bash
cd phase3_frontend
npm install
npm run dev
```

Navigate to `http://localhost:5173` in your browser.

## Features ✨
- **Multimodal AI**: Upload images of invoices; the AI will read the text, extract the exact billed amount, and compare it against the user's claimed amount.
- **PII Encryption**: Claimant names are encrypted on the backend using AES-256 before ever touching the database, ensuring GDPR/HIPAA compliance.
- **Real-time Adjuster Dashboard**: New claims instantly pop up on the dashboard via WebSockets. Adjusters can filter claims instantly without page reloads and Approve/Reject them with optimistic UI updates.
- **Aggressive File Sanitization**: Prevents path traversal and URL encoding bugs when handling strange screenshot filenames from MacOS/Windows.
