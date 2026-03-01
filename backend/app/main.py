import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, WebSocket
from app.services.realtime import router
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

@app.websocket("/ws/alerts")
async def ws_alerts(ws: WebSocket):
    await router.connect(ws)
    try:
        while True:
            msg = await ws.receive_json()

            if msg.get("type") == "LOCATION_UPDATE":
                router.update_location(
                    ws,
                    float(msg["lat"]),
                    float(msg["lng"]),
                    float(msg.get("accuracy_m", 9999))
                )
                # Optional: user moved -> check against active incidents (no DB reads)
                await router.on_location_update_check_nearby(ws)

                await ws.send_json({"type": "ACK"})
    except Exception:
        router.disconnect(ws)