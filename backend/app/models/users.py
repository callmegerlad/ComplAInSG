import enum
import uuid
from sqlalchemy import Column, Enum, String, Boolean, DateTime
from sqlalchemy.orm import relationship

from app.utils import utcnow
from app.core.database import Base


class UserRole(str, enum.Enum):
    REGULAR = "REGULAR"
    RESPONDER = "RESPONDER"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "users"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    display_name = Column(String(120))
    email = Column(String(320), unique=True, index=True)
    password_hash = Column(String(255))

    role = Column(Enum(UserRole), index=True, default=UserRole.REGULAR)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    reports = relationship(
        "IncidentReport",
        back_populates="reporter",
        cascade="all, delete-orphan"
    )
    assigned_reports = relationship(
        "IncidentReport",
        back_populates="assigned_responder",
        foreign_keys="IncidentReport.assigned_responder_id",
    )
