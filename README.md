
<h1 align="center" style="font-size: 2em; font-weight: bold; letter-spacing: -0.5px;">
🚨 Compl<span style="color: #507DBC;">AI</span>n<span style="color: #EE2536;">SG</span>
</h1>
<div align="center">
This project is developed as part of Deep Learning Week 2026.
</div>
<div align="center">
AI-powered incident reporting platform for smarter, faster, and trust-aware community safety.
</div>

<br/>

<div align="center">
Built with Next.js · FastAPI · PostgreSQL · Docker
</div>

---

## 🧠 About

ComplAInSG is an AI-powered incident reporting system that enables the public to quickly submit safety-related reports — with optional image uploads — and receive structured AI-assisted triage.

It is designed to balance:

⚡ Speed of reporting  
🔒 Trust & credibility  
🤖 Intelligent interpretation  

Unlike traditional reporting systems that are either slow or fully anonymous without verification, ComplAInSG introduces a flexible reporting approach that supports both accessibility and reliability.

---

## 🚀 Features

Users can:

- Submit incident reports via web interface  
- Upload supporting images  
- Report as a verified user 
- Receive AI-generated triage output including:
  - Incident category  
  - Suggested severity  
  - Confidence score  
  - Recommended next actions  

All reports are stored and retrievable through API endpoints.

---

## 🏗️ Tech Stack

| Layer        | Technology        |
|--------------|-------------------|
| Frontend     | Next.js           |
| Backend      | FastAPI           |
| Database     | PostgreSQL        |
| Infra        | Docker            |

---

## 🐳 Running ComplAInSG

Ensure Docker is installed.

Clone the repository:

```bash
git clone https://github.com/callmegerlad/ComplAInSG.git
cd ComplAInSG
```

Create your `.env` file:

```bash
cp .env.example .env
```

Example minimal configuration:

```env

DATABASE_URL=postgresql://complainsg:complainsg@localhost:5432/complainsg
MODEL_NAME=gpt-5.1
OPENAI_API_KEY=your_key_here

```

Run the system:

```bash
docker compose up --build
```

---

## 🌐 Access

Frontend  
→ http://localhost:5173  

Backend API  
→ http://localhost:8000  

API Docs  
→ http://localhost:8000/docs  

---

## 📡 API Usage

Create Report:

```
POST /api/reports
```

Example payload:

```json
{
  "title": "Suspicious package",
  "description": "Unattended bag near MRT platform",
  "location": "Jurong East MRT",
  "severity": "medium",
  "reporter_mode": "anonymous"
}
```

Fetch Report:

```
GET /api/reports/{report_id}
```

---

## 🖼️ Image Upload Example

```bash
curl -X POST "http://localhost:8000/api/reports/with-image" \
  -F "title=Smoke seen" \
  -F "description=Possible electrical fire" \
  -F "location=NTU" \
  -F "severity=high" \
  -F "image=@testbench/sample_images/sample_smoke.jpg"
```

---

## 🤖 Example AI Output

```json
{
  "category": "Fire/Smoke",
  "severity_suggested": "high",
  "confidence": 0.82,
  "recommended_actions": [
    "Move away from smoke",
    "Notify building management",
    "Call emergency services if risk escalates"
  ]
}
```

---

## 🧪 Testing

Judges can validate the system using:

```
testbench/SETUP_AND_RUN.md
```

This includes:

- Sample API requests  
- Image test inputs  
- Expected AI output structure  

---

## 🧰 Local Development (Without Docker)

Backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

---


<div align="center">
Built for Deep Learning Week 2026 🚀
</div>