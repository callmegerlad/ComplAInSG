from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.alert_events import AlertEventType, UserAlertEvent
from app.models.triage import IncidentReport
from app.models.users import User
from app.schemas.alerts import AlertEventRequest, AlertEventResponse, AlertFeedItem, AlertsFeedResponse
from app.services.incident_nearby import fetch_nearby_incidents


alerts_router = APIRouter(prefix="/alerts", tags=["alerts"])


def _severity_rank(value: str | None) -> int:
    normalized = str(value or "").upper()
    if "CRITICAL" in normalized:
        return 4
    if "HIGH" in normalized:
        return 3
    if "MEDIUM" in normalized:
        return 2
    return 1


def _normalize_severity(value: str | None) -> str:
    normalized = str(value or "").upper()
    if "CRITICAL" in normalized:
        return "CRITICAL"
    if "HIGH" in normalized:
        return "HIGH"
    if "MEDIUM" in normalized:
        return "MEDIUM"
    return "LOW"


def _safe_datetime(value: object) -> datetime | None:
    return value if isinstance(value, datetime) else None


@alerts_router.post("/events", response_model=AlertEventResponse)
def log_alert_event(
    payload: AlertEventRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incident = db.query(IncidentReport).filter(IncidentReport.id == payload.incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )

    try:
        existing = (
            db.query(UserAlertEvent)
            .filter(
                UserAlertEvent.user_id == current_user.id,
                UserAlertEvent.incident_id == payload.incident_id,
                UserAlertEvent.event_type == payload.event_type,
            )
            .first()
        )
        if existing:
            return AlertEventResponse(success=True, deduplicated=True)

        event = UserAlertEvent(
            user_id=current_user.id,
            incident_id=payload.incident_id,
            event_type=payload.event_type,
        )
        db.add(event)
        db.commit()
    except SQLAlchemyError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Alerts tracking is temporarily unavailable. Apply latest database migration.",
        ) from error

    return AlertEventResponse(success=True, deduplicated=False)


@alerts_router.get("/feed", response_model=AlertsFeedResponse)
def get_alerts_feed(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius_m: int = Query(5000, ge=100, le=50000),
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    nearby = fetch_nearby_incidents(db, lat, lng, radius_m, limit)
    if not nearby:
        return AlertsFeedResponse(alerts=[])

    incident_ids = [str(item.get("incident_id", "")).strip() for item in nearby if item.get("incident_id")]

    try:
        read_rows = (
            db.query(UserAlertEvent.incident_id)
            .filter(
                UserAlertEvent.user_id == current_user.id,
                UserAlertEvent.event_type == AlertEventType.OPEN,
                UserAlertEvent.incident_id.in_(incident_ids),
            )
            .all()
        )
        read_incident_ids = {row[0] for row in read_rows}
    except SQLAlchemyError:
        db.rollback()
        read_incident_ids = set()

    alerts = [
        AlertFeedItem(
            incident_id=str(item["incident_id"]),
            location=str(item.get("location") or "Unknown location"),
            incident_type=str(item.get("incident_type") or "Incident"),
            severity=_normalize_severity(item.get("final_severity")),
            routing=str(item.get("routing_target") or ""),
            distance_m=float(item.get("distance_m") or 0),
            created_at=_safe_datetime(item.get("created_at")),
            read=str(item["incident_id"]) in read_incident_ids,
        )
        for item in nearby
    ]

    alerts.sort(
        key=lambda alert: (
            -_severity_rank(alert.severity),
            alert.distance_m,
            -(alert.created_at.timestamp() if alert.created_at else 0),
        )
    )

    return AlertsFeedResponse(alerts=alerts[:limit])
