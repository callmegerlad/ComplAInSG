from pydantic import BaseModel

class IncidentRequest(BaseModel):
    description: str
    image_url: str
    location: str

