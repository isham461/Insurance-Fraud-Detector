# Enterprise Claims AI: Project Overview & Testing Guide

## 1. Project Overview

**Enterprise Claims AI** is a state-of-the-art, end-to-end insurance fraud detection system. It is designed to automatically process unstructured insurance claims, extract structured data using Large Language Models (LLMs), and evaluate the claim for potential fraud using Machine Learning.

The architecture is divided into four distinct phases:

### Phase 1: AI Core (Data & Intelligence)
This component acts as the "brain" of the system.
* **LLM Data Extraction**: Utilizes the Google Gemini 3.6-Flash API to read messy, unstructured claim text (e.g., "I hit a tree and need $5000") and intelligently extract structured JSON (Claimant Name, Date, Incident Type, Police Report Status, and a Summary).
* **Machine Learning**: Contains the framework for training advanced XGBoost and PyTorch models to detect fraudulent patterns in historical data.

### Phase 2: FastAPI Backend (The Engine)
This is the high-performance, asynchronous Python server that handles the business logic.
* **Security & Encryption**: Protects sensitive Personal Identifiable Information (PII), such as the claimant's name, using AES-256 encryption before it ever touches a database.
* **Data Storage**: Simultaneously saves highly structured relational data (claim amount, status) to an SQL Database (PostgreSQL/SQLite) and the raw unstructured text + AI summaries to a NoSQL Database (MongoDB).
* **Live WebSocket**: Establishes a persistent, real-time connection to the frontend to instantly push updates and fraud scores without requiring page reloads.
* **Fraud Inference Engine**: Computes a dynamic fraud risk score by evaluating the AI-extracted data against heuristic and ML rules (e.g., flagging high claim amounts with no police report).

### Phase 3: React Frontend (The User Interface)
A modern, responsive, and beautiful user interface built with React, TypeScript, and Vite.
* **Claimant Form**: A polished submission form where users can input their claim amount, incident type, and write a raw description of the incident.
* **Adjuster Dashboard**: A "glassmorphism" styled live dashboard designed for insurance adjusters. As soon as a claim is submitted, it instantly appears here via WebSocket, complete with the calculated Fraud Risk and the AI-generated summary of the incident.

### Phase 4: DevOps & Deployment (Infrastructure)
The operational backbone that prepares the system for production.
* **Containerization**: Includes `Dockerfile`s for both the frontend and backend to ensure they run consistently anywhere.
* **Kubernetes (K8s)**: Contains deployment manifests for scaling the application in a cloud cluster.
* **CI/CD & Orchestration**: Includes GitHub Actions for automated testing and Apache Airflow DAGs for scheduling nightly database syncs.

---

## 2. Step-by-Step Testing Guide

Follow these steps to test the entire system end-to-end on your local machine.

### Step 1: Verify the Backend is Running
The Python FastAPI server must be running to process claims.
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd /Users/ishamazik/Documents/Usecase/phase2_backend
   ```
2. Start the server (if it isn't running already):
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Step 2: Verify the Frontend is Running
The React web interface must be running to submit claims.
1. Open a **new** terminal tab and navigate to the frontend folder:
   ```bash
   cd /Users/ishamazik/Documents/Usecase/phase3_frontend
   ```
2. Start the React development server:
   ```bash
   npm run dev
   ```

### Step 3: Open the Application
Open your web browser and go to: **http://localhost:5173**

### Step 4: Perform a Test Submission
1. On the left side of the screen, fill out the **Submit Insurance Claim** form.
2. Enter a Claimant Name (e.g., "Sarah Jenkins").
3. Select an Incident Type (e.g., "Theft").
4. Enter a Claimed Amount (e.g., "15000").
5. In the **Incident Description**, paste a messy, unstructured story. 
   *Example: "I parked my 2019 Honda Civic outside the mall. When I came back 2 hours later, the window was smashed and my laptop was gone. I didn't file a police report because I was in a rush. I need 15000 dollars for the laptop and window."*
6. Click **Submit Claim**.

### Step 5: Observe the Magic (Verification)
Look at the **Adjuster Dashboard** on the right side of your screen:
* **Real-Time Update**: The claim should instantly appear in the table without refreshing the page (proving the WebSocket works).
* **AI Summary**: The "AI Summary" column should cleanly display the extracted data (proving the Gemini API connection works). It will show:
  * That no police report was filed (❌ No).
  * A concise 1-2 sentence summary of the theft.
* **Fraud Risk**: The "Fraud Risk" column should display a high percentage (e.g., 80%+) highlighted in red, proving the Mock ML Inference Engine correctly flagged the suspicious combination of a high claim amount and no police report!
