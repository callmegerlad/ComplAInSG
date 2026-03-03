import enum
import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.utils import utcnow


class AlertEventType(str, enum.Enum):
    RECEIVED = "received"
    OPEN = "open"
    VIEW_INCIDENT = "view_incident"
    ACKNOWLEDGED = "acknowledged"
    RESPONDING = "responding"


class UserAlertEvent(Base):
    __tablename__ = "user_alert_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    incident_id = Column(ForeignKey("incident_reports.id", ondelete="CASCADE"), index=True, nullable=False)
    event_type = Column(Enum(AlertEventType), index=True, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False, index=True)

    user = relationship("User")
    incident = relationship("IncidentReport")

    __table_args__ = (
        UniqueConstraint("user_id", "incident_id", "event_type", name="uq_user_alert_event"),
    )
