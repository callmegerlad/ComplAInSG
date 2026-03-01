import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models.schemas import IncidentRequest


load_dotenv()

app = FastAPI(title="Incident Backend", version="0.1.0")

# CORS for your frontend
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/incidents/process")
async def process_incident(req: IncidentRequest):
    image_url=req.image_url
    description=req.description
    location=req.location

    data = description

    return data 