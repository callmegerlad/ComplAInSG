from typing import Optional, Dict, Any
from agents import function_tool
from app.agents.schemas import Severity, TextTriageOutput, VisionOutput

SEVERITY_ORDER = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}

def max_sev(a: Severity, b: Severity) -> Severity:
    return a if SEVERITY_ORDER[a] >= SEVERITY_ORDER[b] else b

@function_tool(strict_mode=False)
def apply_safety_overrides(
    text_triage: TextTriageOutput,
    vision: Optional[VisionOutput] = None
) -> Dict[str, Any]:
    """
    Enforce minimum severity based on high-risk cues.
    Returns dict: { "severity": <Severity>, "overrides": [..] }
    """
    overrides = []
    sev: Severity = text_triage.severity

    # Vision-based floors (conservative)
    if vision is not None:
        s = vision.signals

        if s.fire_or_flames.present and s.fire_or_flames.confidence >= 0.6:
            sev = max_sev(sev, "CRITICAL"); overrides.append("Vision: flames → min CRITICAL")
        elif s.smoke.present and s.smoke.confidence >= 0.6:
            sev = max_sev(sev, "HIGH"); overrides.append("Vision: smoke → min HIGH")

        if s.injury_or_blood.present and s.injury_or_blood.confidence >= 0.6:
            sev = max_sev(sev, "CRITICAL"); overrides.append("Vision: injury/blood → min CRITICAL")

        if s.weapon_visible.present and s.weapon_visible.confidence >= 0.5:
            sev = max_sev(sev, "CRITICAL"); overrides.append("Vision: weapon → min CRITICAL")

        if s.physical_fight.present and s.physical_fight.confidence >= 0.6:
            sev = max_sev(sev, "HIGH"); overrides.append("Vision: fight → min HIGH")

        if s.vehicle_crash.present and s.vehicle_crash.confidence >= 0.6:
            sev = max_sev(sev, "HIGH"); overrides.append("Vision: crash → min HIGH")

        if s.road_obstruction.present and s.road_obstruction.confidence >= 0.6:
            sev = max_sev(sev, "MEDIUM"); overrides.append("Vision: road obstruction → min MEDIUM")

    # Text-based emergency keywords floor (optional simple baseline)
    emergency_keywords = ["unconscious", "bleeding", "fire", "flames", "weapon", "knife", "collapsed"]
    if any(k in text_triage.rationale.lower() for k in emergency_keywords):
        sev = max_sev(sev, "HIGH")
        overrides.append("Text rationale contains emergency cues → min HIGH")

    return {"severity": sev, "overrides": overrides}