from uuid import uuid4
from pathlib import Path as FilePath

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import cast, func, String
from sqlalchemy.orm import Session, selectinload

from app.agents.pipeline import run_triage_pipeline
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.media import MediaAsset
from app.models.triage import FinalTriage, IncidentReport
from app.schemas.incidents import (
    IncidentDetailResponse,
    IncidentListResponse,
    IncidentRequest,
    IncidentResponse,
    NearbyIncidentsResponse,
)
from app.services.incident_nearby import fetch_nearby_incidents
from app.media.media import save_base64_image
from app.services.realtime import router


incidents_router = APIRouter(prefix="/incidents", tags=["incidents"])


UPLOAD_DIR = FilePath("uploads")


def severity_radius(sev):
    return {
        "CRITICAL": 800,
        "HIGH": 300,
        "MEDIUM": 150,
        "LOW": 0,
    }.get(sev, 0)


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


def to_incident_detail_response(incident: IncidentReport) -> IncidentDetailResponse:
    payload = IncidentDetailResponse.model_validate(incident).model_dump()
    payload["reporter_name"] = resolve_reporter_name(incident)
    return IncidentDetailResponse(**payload)


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
        reporter_id=current_user.id,
        location_text=req.location,
        description=req.description,
        latitude=req.lat,
        longitude=req.lng,)

    db.add(incident)
    db.commit()
    db.refresh(incident)
    if saved_path:
        media = MediaAsset(
            id=str(uuid4()),
            report_id=incident.id,
            media_type="IMAGE",
            url=saved_path,
            created_at=incident.created_at,
        )
        db.add(media)
        db.commit()
        db.refresh(media)

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
    db.refresh(triage_entry)
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
        )
        .order_by(IncidentReport.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return IncidentListResponse(
        total=total,
        incidents=[to_incident_detail_response(
            incident) for incident in incidents],
    )


@incidents_router.get("/search", response_model=IncidentListResponse)
def search_incidents(
    db: Session = Depends(get_db),
    query: str = Query(default="", min_length=0, max_length=200),
    incident_type: str = Query(default="", min_length=0),
    severity: str = Query(default="", min_length=0),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
):
    """Search incident reports by text query, type, and severity."""
    q = db.query(IncidentReport).options(
        selectinload(IncidentReport.final_triage),
        selectinload(IncidentReport.reporter),
    )

    # Text search across location and description
    if query.strip():
        search_term = f"%{query.strip()}%"
        q = q.filter(
            (IncidentReport.location_text.ilike(search_term)) |
            (IncidentReport.description.ilike(search_term))
        )

    # Filter by incident type (cast enum to string for comparison)
    if incident_type.strip():
        q = q.join(FinalTriage).filter(
            cast(FinalTriage.incident_type, String).ilike(
                f"%{incident_type.strip()}%")
        )

    # Filter by severity (cast enum to string for comparison)
    if severity.strip():
        q = q.join(FinalTriage).filter(
            cast(FinalTriage.final_severity, String).ilike(
                f"%{severity.strip()}%")
        )

    total = q.count()
    incidents = (
        q.order_by(IncidentReport.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return IncidentListResponse(
        total=total,
        incidents=[to_incident_detail_response(
            incident) for incident in incidents],
    )


@incidents_router.get("/{incident_id}", response_model=IncidentDetailResponse)
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    """Get a specific incident report by ID."""
    incident = (
        db.query(IncidentReport)
        .options(
            selectinload(IncidentReport.final_triage),
            selectinload(IncidentReport.reporter),
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
