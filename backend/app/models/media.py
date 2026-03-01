import enum
import uuid
from sqlalchemy import Column, Enum, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.utils import utcnow
from app.core.database import Base


class MediaType(str, enum.Enum):
    IMAGE = "IMAGE"
    VIDEO = "VIDEO"


class MediaAsset(Base):
    __tablename__ = "media_assets"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    report_id = Column(ForeignKey(
        "incident_reports.id", ondelete="CASCADE"), index=True)

    media_type = Column(Enum(MediaType), default=MediaType.IMAGE, index=True)

    # Store object storage URL or path (S3, GCS, local)
    url = Column(String(1024))

    # Optional: store hash to help dedup media
    sha256 = Column(String(64), index=True)

    created_at = Column(
        DateTime, default=utcnow, nullable=False)

    # Relationships
    report = relationship("IncidentReport", back_populates="media_assets")
