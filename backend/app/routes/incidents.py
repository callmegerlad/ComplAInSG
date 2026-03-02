from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from backend.app.schemas.incidents import IncidentRequest, IncidentResponse
from app.agents.pipeline import run_triage_pipeline
from app.services.realtime import router
from app.models.triage import IncidentReport
from app.models.media import MediaAsset
from app.core.database import get_db
from sqlalchemy.orm import Session
from app.utills.media import save_base64_image
from pathlib import Path as FilePath


incidents_router = APIRouter(prefix="/incidents")


UPLOAD_DIR = FilePath("uploads")


def severity_radius(sev):
    return {
        "CRITICAL": 800,
        "HIGH": 300,
        "MEDIUM": 150,
        "LOW": 0
    }.get(sev, 0)


@incidents_router.post("/triage")
async def triage(req: IncidentRequest, db: Session = Depends(get_db)):

    incident_id = str(uuid4())
    saved_path = None

    if req.image_url:
        try:
            saved_path = save_base64_image(req.image_url, UPLOAD_DIR)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    final, vision, text_triage, metadata = await run_triage_pipeline(
        req.location,
        req.description,
        req.image_url
    )

    radius = severity_radius(final.final_severity)
    incident = IncidentReport(
        id=incident_id,
        location_text=req.location,
        description=req.description,
        latitude=req.lat,
        longitude=req.lng,
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    if saved_path:

        media = MediaAsset(
            id=str(uuid4()),
            report_id=incident.id,
            media_type="IMAGE",
            url=saved_path,
            created_at=incident.created_at
        )
        db.add(media)
        db.commit()
        db.refresh(media)

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

    return IncidentResponse(
        incident_id=incident_id,
        final=final.model_dump(),
        metadata=metadata.model_dump() if metadata else None
    )
