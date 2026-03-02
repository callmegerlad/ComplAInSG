from uuid import uuid4
from fastapi import APIRouter
from app.schemas.api_schemas import IncidentRequest
from app.agents.pipeline import run_triage_pipeline
from app.services.realtime import router

incidents_router = APIRouter(prefix="/incidents")


def severity_radius(sev):
    return {
        "CRITICAL": 800,
        "HIGH": 300,
        "MEDIUM": 150,
        "LOW": 0
    }.get(sev, 0)


@incidents_router.post("/triage")
async def triage(req: IncidentRequest):

    incident_id = str(uuid4())

    final, vision, text_triage, metadata = await run_triage_pipeline(
        req.location,
        req.description,
        req.image_url
    )

    radius = severity_radius(final.final_severity)

    if radius > 0:
        payload = {
            "type": "ALERT",
            "incident_id": incident_id,
            "location": req.location,
            "incident_lat": req.lat,
            "incident_lng": req.lng,
            "radius_m": radius,
            "incident_type": final.incident_type,
            "severity": final.final_severity,
            "routing": final.routing_target
        }

        await router.broadcast_alert(
            incident_id,
            req.lat,
            req.lng,
            radius,
            payload
        )

    return {
        "incident_id": incident_id,
        "final": final.model_dump(),
        "metadata": metadata.model_dump() if metadata else None,
    }
