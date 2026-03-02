import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.settings import settings
from app.routes.incidents import incidents_router
from app.routes.ws_alerts import ws_router
from app.routes.users import users_router
from pathlib import Path


if settings.OPENAI_API_KEY:
    os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY


description = """
ComplAInSG API 🚨

*Created by Cortex for Deep Learning Week 2026.*
"""

tags_metadata = [
    {
        "name": "users",
        "description": "Endpoints for user registration, login, and profile management.",
    },
    {
        "name": "incidents",
        "description": "Endpoints for reporting incidents and retrieving incident data.",
    },
    {
        "name": "ws_alerts",
        "description": "WebSocket endpoint for real-time incident alerts.",
    },
]

app = FastAPI(
    title="ComplAInSG API",
    description=description,
    version="1.0.0",
    openapi_tags=tags_metadata,
)
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Public URL prefix: /uploads/...
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "healthy": True
    }


app.include_router(incidents_router)
app.include_router(ws_router)
app.include_router(users_router)
