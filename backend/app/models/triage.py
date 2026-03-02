import enum
import uuid
from sqlalchemy import Column, Enum, Text, String, Boolean, DateTime, ForeignKey, Float, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.utils import utcnow
from app.core.database import Base


class IncidentType(str, enum.Enum):
    VIOLENCE_FIGHT = "VIOLENCE_FIGHT"
    FIRE_SMOKE = "FIRE_SMOKE"
    MEDICAL = "MEDICAL"
    ROAD_HAZARD = "ROAD_HAZARD"
    TRANSIT_DISRUPTION = "TRANSIT_DISRUPTION"
    SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY"
    OTHER = "OTHER"


class Severity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RoutingTarget(str, enum.Enum):
    CALL_999 = "CALL_999"
    CALL_995 = "CALL_995"
    LTA = "LTA"
    TOWN_COUNCIL = "TOWN_COUNCIL"
    PUBLIC_ALERT_ONLY = "PUBLIC_ALERT_ONLY"
    NEEDS_USER_CONFIRMATION = "NEEDS_USER_CONFIRMATION"


class ReportStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    TRIAGED = "TRIAGED"
    NEEDS_MORE_INFO = "NEEDS_MORE_INFO"
    DISPATCHED = "DISPATCHED"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class VisionTriage(Base):
    __tablename__ = "vision_triage"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    report_id = Column(
        ForeignKey("incident_reports.id", ondelete="CASCADE"),
        unique=True
    )

    # Store the full structured output (signals, privacy flags, uncertainties, etc.)
    # This maps cleanly to your VisionOutput schema in the POC.
    output_json = Column(JSONB, default=dict)

    # Convenience fields for querying without JSON ops
    hint_severity = Column(Enum(Severity), index=True)
    hint_confidence = Column(Float)

    faces_visible = Column(Boolean, default=False)
    license_plates_visible = Column(Boolean, default=False)
    sensitive_injury_visible = Column(Boolean, default=False)

    created_at = Column(
        DateTime, default=utcnow, nullable=False)

    report = relationship("IncidentReport", back_populates="vision_triage")

    __table_args__ = (
        Index("ix_vision_triage_hint_sev_conf",
              "hint_severity", "hint_confidence"),
    )


class TextTriage(Base):
    __tablename__ = "text_triage"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    report_id = Column(
        ForeignKey("incident_reports.id", ondelete="CASCADE"),
        unique=True
    )

    incident_type = Column(Enum(IncidentType), index=True)
    severity = Column(Enum(Severity), index=True)
    confidence = Column(Float)

    rationale = Column(Text)

    # Store follow-up questions + suggested actions
    missing_questions = Column(JSONB, default=list)
    suggested_actions = Column(JSONB, default=list)

    created_at = Column(
        DateTime, default=utcnow, nullable=False)

    report = relationship("IncidentReport", back_populates="text_triage")

    __table_args__ = (
        Index("ix_text_triage_type_sev", "incident_type", "severity"),
    )


class FinalTriage(Base):
    __tablename__ = "final_triage"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    report_id = Column(
        ForeignKey("incident_reports.id", ondelete="CASCADE"),
        unique=True
    )

    incident_type = Column(Enum(IncidentType), index=True)
    final_severity = Column(Enum(Severity), index=True)
    confidence = Column(Float)

    routing_target = Column(Enum(RoutingTarget), index=True)

    # What the app shows to user + dispatcher summary
    user_next_steps = Column(JSONB, default=list)
    followup_questions = Column(JSONB, default=list)
    responder_summary = Column(Text)

    # For explainability/audit: store applied override reasons
    applied_overrides = Column(JSONB, default=list)

    created_at = Column(
        DateTime, default=utcnow, nullable=False)

    report = relationship("IncidentReport", back_populates="final_triage")

    __table_args__ = (
        Index("ix_final_triage_route_sev", "routing_target", "final_severity"),
    )


class IncidentReport(Base):
    __tablename__ = "incident_reports"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    reporter_id = Column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True
    )

    # Minimal location representation for MVP (string).
    # Later: store lat/lng + reverse geocode fields
    location_text = Column(String(255), index=True)
    description = Column(Text)

    # Optional lat/lng for geofencing / clustering
    latitude = Column(Float)
    longitude = Column(Float)

    status = Column(Enum(ReportStatus),
                    default=ReportStatus.SUBMITTED, index=True)

    created_at = Column(
        DateTime, default=utcnow, nullable=False, index=True)
    updated_at = Column(
        DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    reporter = relationship(
        "User", back_populates="reports", foreign_keys=[reporter_id])
    media_assets = relationship(
        "MediaAsset",
        back_populates="report",
        cascade="all, delete-orphan",
    )

    # Triage outputs (1:1 optional)
    vision_triage = relationship(
        "VisionTriage",
        back_populates="report",
        cascade="all, delete-orphan",
        uselist=False
    )
    text_triage = relationship(
        "TextTriage",
        back_populates="report",
        cascade="all, delete-orphan",
        uselist=False
    )
    final_triage = relationship(
        "FinalTriage",
        back_populates="report",
        cascade="all, delete-orphan",
        uselist=False
    )

    __table_args__ = (
        Index("ix_incident_reports_lat_lng", "latitude", "longitude"),
    )
