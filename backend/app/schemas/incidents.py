from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict


class IncidentRequest(BaseModel):
    location: str
    description: str
    image_url: str

    # optional if you want proximity alerts later
    lat: Optional[float] = None
    lng: Optional[float] = None
    accuracy_m: Optional[float] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "location": "123 Main St",
                "description": "A broken street light",
                "image_url": "base64-encoded-image-data",
                "lat": 1.234567,
                "lng": 103.765432,
                "accuracy_m": 10.0,
            }
        }
    )


class IncidentResponse(BaseModel):
    incident_id: str
    final: dict
    metadata: Optional[dict] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "incident_id": "abc123",
                "final": {
                    "incident_type": "ROAD_HAZARD",
                    "final_severity": 3,
                    "routing_target": "PUBLIC_WORKS",
                },
                "metadata": {
                    "gps": {"lat": 1.234567, "lng": 103.765432, "alt_m": 15.0},
                    "width_px": 1024,
                    "height_px": 768,
                    "format": "JPEG",
                },
            }
        }
    )


class NearbyIncidentItem(BaseModel):
    incident_id: str
    location: Optional[str] = None
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: Optional[datetime] = None
    incident_type: Optional[str] = None
    final_severity: Optional[str] = None
    responder_summary: Optional[str] = None
    image_url: Optional[str] = None
    distance_m: float


class NearbyIncidentsResponse(BaseModel):
    nearby_incidents: List[NearbyIncidentItem]


class FinalTriageResponse(BaseModel):
    """Structured final triage payload attached to an incident."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    report_id: str
    incident_type: Optional[str] = None
    final_severity: Optional[str] = None
    confidence: Optional[float] = None
    routing_target: Optional[str] = None
    user_next_steps: List[Any] = []
    followup_questions: List[Any] = []
    responder_summary: Optional[str] = None
    applied_overrides: List[Any] = []
    created_at: datetime


class IncidentDetailResponse(BaseModel):
    """Detailed response for a single incident report."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    location_text: str
    description: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: str
    reporter_name: str = "Anonymous"
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Triage info (optional if not triaged yet)
    final_triage: Optional[FinalTriageResponse] = None


class IncidentListResponse(BaseModel):
    """Response for listing multiple incidents."""

    total: int
    incidents: List[IncidentDetailResponse]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "total": 2,
                "incidents": [],
            }
        }
    )




