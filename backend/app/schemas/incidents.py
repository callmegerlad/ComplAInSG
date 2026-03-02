from pydantic import BaseModel, ConfigDict
from typing import Optional


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
                "accuracy_m": 10.0
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
                    "routing_target": "PUBLIC_WORKS"
                },
                "metadata": {
                    "gps": {"lat": 1.234567, "lng": 103.765432, "alt_m": 15.0},
                    "width_px": 1024,
                    "height_px": 768,
                    "format": "JPEG"
                }
            }
        }
    )
