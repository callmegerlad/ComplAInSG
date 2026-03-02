import re
from typing import Optional, Dict, Any
from agents import function_tool
from app.agents.schemas import Severity, TextTriageOutput, VisionOutput

SEVERITY_ORDER = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}

# ---------------------------------------------------------------------------
# Incident types the AI classifies as inherently high-risk
# ---------------------------------------------------------------------------
_HIGH_RISK_INCIDENT_TYPES = {"VIOLENCE_FIGHT", "FIRE_SMOKE", "MEDICAL"}

# ---------------------------------------------------------------------------
# Negation-aware emergency keyword scan for raw user-submitted description
# ---------------------------------------------------------------------------
# These are unambiguous emergency signals in user-written text.
_EMERGENCY_KEYWORDS = [
    "unconscious", "not breathing", "choking",
    "bleeding", "blood",
    "fire", "flames", "burning",
    "weapon", "knife", "gun", "shooting", "stabbing",
    "collapsed", "collapse",
    "explosion", "bomb",
    "assault", "attack",
    "drowning", "overdose",
]

# Common negation phrases that can precede a keyword (scanned within a
# 60-character window before each keyword match to suppress false positives).
_NEGATION_RE = re.compile(
    r"\b(?:no|not|none|without|absence\s+of|no\s+signs?\s+of|no\s+evidence\s+of|"
    r"no\s+visible|no\s+indication\s+of|did\s+not|didn'?t|is\s+not|isn'?t|"
    r"was\s+not|wasn'?t|has\s+not|hasn'?t|have\s+not|haven'?t|"
    r"could\s+not|couldn'?t|cannot|can'?t|"
    r"without\s+any|no\s+apparent|no\s+obvious|clear\s+of|free\s+of)\b",
    re.IGNORECASE,
)


def _has_unambiguous_emergency(text: str) -> bool:
    """Return True if *text* contains an emergency keyword that is NOT
    immediately preceded (within 60 chars on the same sentence) by a
    negation phrase.

    Operates sentence-by-sentence so that negations in one sentence cannot
    cancel keywords in a different sentence.
    """
    if not text:
        return False
    for sentence in re.split(r"[.!?;]", text.lower()):
        for kw in _EMERGENCY_KEYWORDS:
            for m in re.finditer(re.escape(kw), sentence):
                context_before = sentence[max(0, m.start() - 60) : m.start()]
                if not _NEGATION_RE.search(context_before):
                    return True
    return False


def max_sev(a: Severity, b: Severity) -> Severity:
    return a if SEVERITY_ORDER[a] >= SEVERITY_ORDER[b] else b


@function_tool(strict_mode=False)
def apply_safety_overrides(
    text_triage: TextTriageOutput,
    vision: Optional[VisionOutput] = None,
    description: Optional[str] = None,
) -> Dict[str, Any]:
    """Enforce minimum severity based on three independent evidence layers:

    1. Vision signal overrides – fire/blood/weapons detected in the image
       with sufficient confidence immediately floor severity.
    2. Structured incident-type floors – the text triage agent's own
       classification (VIOLENCE_FIGHT, FIRE_SMOKE, MEDICAL) is used as the
       primary text signal.  This avoids the false-positive problem of naive
       keyword matching on AI-generated rationale text, which routinely
       mentions emergency keywords in a *negation* context when explaining
       why severity is LOW.
    3. Negation-aware description scan – the raw user-submitted description
       is scanned for emergency keywords only when they are NOT preceded by a
       negation phrase.  This catches cases where the AI may under-classify
       due to incomplete information while still being resistant to phrasing
       like "no fire, no violence".

    Returns dict: { "severity": <Severity>, "overrides": [str, ...] }
    """
    overrides: list[str] = []
    sev: Severity = text_triage.severity

    # ── Layer 1: Vision-based floors ────────────────────────────────────────
    if vision is not None:
        s = vision.signals

        if s.fire_or_flames.present and s.fire_or_flames.confidence >= 0.6:
            sev = max_sev(sev, "CRITICAL")
            overrides.append("Vision: flames confirmed (conf≥0.6) → min CRITICAL")
        elif s.smoke.present and s.smoke.confidence >= 0.6:
            sev = max_sev(sev, "HIGH")
            overrides.append("Vision: smoke confirmed (conf≥0.6) → min HIGH")

        if s.injury_or_blood.present and s.injury_or_blood.confidence >= 0.6:
            sev = max_sev(sev, "CRITICAL")
            overrides.append("Vision: injury/blood confirmed (conf≥0.6) → min CRITICAL")

        if s.weapon_visible.present and s.weapon_visible.confidence >= 0.5:
            sev = max_sev(sev, "CRITICAL")
            overrides.append("Vision: weapon confirmed (conf≥0.5) → min CRITICAL")

        if s.physical_fight.present and s.physical_fight.confidence >= 0.6:
            sev = max_sev(sev, "HIGH")
            overrides.append("Vision: fight confirmed (conf≥0.6) → min HIGH")

        if s.vehicle_crash.present and s.vehicle_crash.confidence >= 0.6:
            sev = max_sev(sev, "HIGH")
            overrides.append("Vision: vehicle crash confirmed (conf≥0.6) → min HIGH")

        if s.road_obstruction.present and s.road_obstruction.confidence >= 0.6:
            sev = max_sev(sev, "MEDIUM")
            overrides.append("Vision: road obstruction confirmed (conf≥0.6) → min MEDIUM")

    # ── Layer 2: Structured incident-type based floors ───────────────────────
    # The text triage agent already understands context and negation, so its
    # incident_type classification is a much more reliable signal than
    # scanning its AI-generated rationale for keywords.
    incident_type_str = str(text_triage.incident_type).upper()
    text_confidence = text_triage.confidence

    if incident_type_str in _HIGH_RISK_INCIDENT_TYPES:
        if text_confidence >= 0.55:
            new_sev = max_sev(sev, "HIGH")
            if new_sev != sev:
                sev = new_sev
                overrides.append(
                    f"Text triage: high-risk type '{incident_type_str}' "
                    f"(conf={text_confidence:.2f}) → min HIGH"
                )
        elif text_confidence >= 0.35:
            # Lower confidence: escalate only to MEDIUM to avoid under-reporting
            new_sev = max_sev(sev, "MEDIUM")
            if new_sev != sev:
                sev = new_sev
                overrides.append(
                    f"Text triage: possible '{incident_type_str}' "
                    f"(conf={text_confidence:.2f}) → min MEDIUM"
                )

    # ── Layer 3: Negation-aware description keyword scan ────────────────────
    # Scans the raw user-submitted description (not the AI rationale).
    # Uses sentence-scoped negation detection to avoid false positives while
    # still catching "there is fire" / "someone is bleeding" patterns.
    if description and _has_unambiguous_emergency(description):
        new_sev = max_sev(sev, "HIGH")
        if new_sev != sev:
            sev = new_sev
            overrides.append(
                "Description contains unambiguous emergency keyword(s) "
                "without negation → min HIGH"
            )

    return {"severity": sev, "overrides": overrides}