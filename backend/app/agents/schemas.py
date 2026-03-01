from pydantic import BaseModel, Field
from typing import Optional, Literal, List, Dict, Any

class Signal(BaseModel):
    present: bool = False
    confidence: float = Field(0.0, ge=0.0, le=1.0)

class VisionSignals(BaseModel):
    fire_or_flames: Signal = Signal()
    smoke: Signal = Signal()
    injury_or_blood: Signal = Signal()
    weapon_visible: Signal = Signal()
    physical_fight: Signal = Signal()
    large_crowd: Signal = Signal()
    vehicle_crash: Signal = Signal()
    road_obstruction: Signal = Signal()
    infrastructure_damage: Signal = Signal()

class VisionOutput(BaseModel):
    signals: VisionSignals
    vision_severity_hint: Dict[str, Any] = Field(
        default_factory=lambda: {"level": "LOW", "confidence": 0.0, "reason": ""}
    )
    scene_summary: Dict[str, Any] = Field(
        default_factory=lambda: {"one_sentence": "", "key_objects": [], "environment": "UNKNOWN"}
    )
    uncertainties: List[Dict[str, str]] = Field(default_factory=list)
    recommended_followups: List[str] = Field(default_factory=list, max_length=3)
    privacy_flags: Dict[str, Any] = Field(
        default_factory=lambda: {"faces_visible": False, "license_plates_visible": False, "sensitive_injury_visible": False}
    )

IncidentType = Literal[
    "VIOLENCE_FIGHT",
    "FIRE_SMOKE",
    "MEDICAL",
    "ROAD_HAZARD",
    "TRANSIT_DISRUPTION",
    "SUSPICIOUS_ACTIVITY",
    "OTHER"
]

Severity = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]

class TextTriageOutput(BaseModel):
    incident_type: IncidentType
    severity: Severity
    confidence: float = Field(..., ge=0.0, le=1.0)
    rationale: str
    missing_questions: List[str] = Field(default_factory=list, max_length=3)
    suggested_actions: List[str] = Field(default_factory=list, max_length=5)

class FinalTriageOutput(BaseModel):
    incident_type: IncidentType
    final_severity: Severity
    confidence: float = Field(..., ge=0.0, le=1.0)

    routing_target: Literal[
        "CALL_999",
        "CALL_995",
        "LTA",
        "TOWN_COUNCIL",
        "PUBLIC_ALERT_ONLY",
        "NEEDS_USER_CONFIRMATION"
    ]

    user_next_steps: List[str] = Field(default_factory=list, max_length=6)
    followup_questions: List[str] = Field(default_factory=list, max_length=3)
    responder_summary: str

    applied_overrides: List[str] = Field(default_factory=list)