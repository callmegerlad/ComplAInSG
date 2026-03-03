from pathlib import Path
import re
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.agents.pipeline import run_triage_pipeline
from app.core.database import get_db
from app.dependencies import get_current_user
from app.media.media import save_base64_image
from app.media.media import save_base64_image
from app.models.media import MediaAsset
from app.models.triage import FinalTriage, IncidentReport
from app.models.users import User
from app.schemas.incidents import (
    IncidentDetailResponse,
    IncidentListResponse,
    IncidentRequest,
    IncidentResponse,
    NearbyIncidentsResponse,
)
from app.services.incident_nearby import fetch_nearby_incidents
from app.services.realtime import router


incidents_router = APIRouter(prefix="/incidents", tags=["incidents"])

UPLOAD_DIR = Path("uploads")
UPLOAD_PATH_RE = re.compile(r"/uploads/([A-Za-z0-9._-]+\.(?:jpg|jpeg|png|webp))", re.IGNORECASE)


def severity_radius(sev: str | None) -> int:
    return {
        "CRITICAL": 800,
        "HIGH": 300,
        "MEDIUM": 150,
        "LOW": 0,
    }.get((sev or "").upper(), 0)


def resolve_reporter_name(incident: IncidentReport) -> str:
    reporter = getattr(incident, "reporter", None)
    if reporter is None:
        return "Anonymous"

    display_name = (getattr(reporter, "display_name", None) or "").strip()
    if display_name:
        return display_name

    email = (getattr(reporter, "email", None) or "").strip()
    if email:
        return email

    return "Anonymous"


def normalize_media_url(raw_url: str | None) -> str | None:
    """
    Return a backend-public URL for media.
    Handles old absolute/container paths by rewriting to /uploads/<filename>.
    """
    if not raw_url:
        return None

    value = raw_url.strip()
    if not value:
        return None

    if value.startswith("http://") or value.startswith("https://"):
        return value

    if value.startswith("/uploads/"):
        match = UPLOAD_PATH_RE.search(value)
        if match:
            return f"/uploads/{match.group(1)}"
        return value

    normalized = value.replace("\\", "/")
    match = UPLOAD_PATH_RE.search(normalized)
    if match:
        return f"/uploads/{match.group(1)}"

    filename = Path(normalized).name
    if filename:
        return f"/uploads/{filename}"

    return None


def resolve_primary_image_url(incident: IncidentReport) -> str | None:
    media_assets = getattr(incident, "media_assets", None) or []
    if not media_assets:
        return None

    sorted_assets = sorted(
        media_assets,
        key=lambda asset: getattr(asset, "created_at", None) or getattr(asset, "id", ""),
    )
    for asset in sorted_assets:
        media_type = str(getattr(asset, "media_type", "")).upper()
        if media_type != "MEDIATYPE.IMAGE" and media_type != "IMAGE":
            continue
        media_url = normalize_media_url(getattr(asset, "url", None))
        if media_url:
            return media_url

    return None


def to_incident_detail_response(incident: IncidentReport) -> IncidentDetailResponse:
    payload = IncidentDetailResponse.model_validate(incident).model_dump()
    payload["reporter_name"] = resolve_reporter_name(incident)
    payload["image_url"] = resolve_primary_image_url(incident)
    return IncidentDetailResponse(**payload)


@incidents_router.post("/triage")
async def triage(
    req: IncidentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incident_id = str(uuid4())
    saved_public_path: str | None = None
    media_sha256: str | None = None

    if req.image_url:
        try:
            saved_public_path, media_sha256 = save_base64_image(req.image_url, UPLOAD_DIR)
        except ValueError as error:
            raise HTTPException(status_code=400, detail=str(error)) from error

    final, _vision, _text_triage, metadata = await run_triage_pipeline(
        req.location,
        req.description,
        req.image_url,
    )

    radius = severity_radius(getattr(final, "final_severity", None))

    incident = IncidentReport(
        id=incident_id,
        reporter_id=current_user.id,
        location_text=req.location,
        description=req.description,
        latitude=req.lat,
        longitude=req.lng,
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    if saved_public_path:
        media = MediaAsset(
            id=str(uuid4()),
            report_id=incident.id,
            media_type="IMAGE",
            url=saved_public_path,
            sha256=media_sha256,
            created_at=incident.created_at,
        )
        db.add(media)
        db.commit()

    triage_entry = FinalTriage(
        report_id=incident.id,
        final_severity=final.final_severity,
        confidence=final.confidence,
        incident_type=final.incident_type,
        routing_target=final.routing_target,
        user_next_steps=final.user_next_steps,
        followup_questions=final.followup_questions,
        responder_summary=final.responder_summary,
        applied_overrides=final.applied_overrides,
    )
    db.add(triage_entry)
    db.commit()

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
            "routing": final.routing_target,
        }

        await router.broadcast_alert(
            incident_id,
            req.lat,
            req.lng,
            radius,
            payload,
        )

    return IncidentResponse(
        incident_id=incident_id,
        final=final.model_dump(),
        metadata=metadata.model_dump() if metadata else None,
    )


@incidents_router.get("/nearby", response_model=NearbyIncidentsResponse)
def get_nearby_incidents(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius_m: int = Query(1000, ge=50, le=50000),
    limit: int = Query(30, ge=1, le=200),
    db: Session = Depends(get_db),
):
    nearby = fetch_nearby_incidents(db, lat, lng, radius_m, limit)
    return {"nearby_incidents": nearby}


@incidents_router.get("", response_model=IncidentListResponse)
def list_incidents(
    db: Session = Depends(get_db),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
):
    """List all incident reports with pagination."""
    total = db.query(func.count(IncidentReport.id)).scalar() or 0
    incidents = (
        db.query(IncidentReport)
        .options(
            selectinload(IncidentReport.final_triage),
            selectinload(IncidentReport.reporter),
            selectinload(IncidentReport.media_assets),
        )
        .order_by(IncidentReport.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return IncidentListResponse(
        total=total,
        incidents=[to_incident_detail_response(incident) for incident in incidents],
    )


@incidents_router.get("/{incident_id}", response_model=IncidentDetailResponse)
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    """Get a specific incident report by ID."""
    incident = (
        db.query(IncidentReport)
        .options(
            selectinload(IncidentReport.final_triage),
            selectinload(IncidentReport.reporter),
            selectinload(IncidentReport.media_assets),
        )
        .filter(IncidentReport.id == incident_id)
        .first()
    )

    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )

    return to_incident_detail_response(incident)
