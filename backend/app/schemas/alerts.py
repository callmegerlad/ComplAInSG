from pydantic import BaseModel, ConfigDict, Field

from app.models.alert_events import AlertEventType
from datetime import datetime
from typing import Optional


class AlertEventRequest(BaseModel):
    incident_id: str = Field(..., min_length=1)
    event_type: AlertEventType

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "incident_id": "ec42c4a1-4608-48df-849c-0b058ac30668",
                "event_type": "responding",
            }
        }
    )


class AlertEventResponse(BaseModel):
    success: bool = True
    deduplicated: bool = False


class AlertFeedItem(BaseModel):
    incident_id: str
    location: str
    incident_type: str
    severity: str
    routing: str
    distance_m: float
    created_at: Optional[datetime] = None
    read: bool = False


class AlertsFeedResponse(BaseModel):
    alerts: list[AlertFeedItem]
