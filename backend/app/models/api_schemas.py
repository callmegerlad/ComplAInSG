from pydantic import BaseModel
from typing import Optional

class IncidentRequest(BaseModel):
    location: str
    description: str

    # image is optional in the notebook pipeline
    image_url: Optional[str] = None

    # optional if you want proximity alerts later
    lat: Optional[float] = None
    lng: Optional[float] = None
    accuracy_m: Optional[float] = None