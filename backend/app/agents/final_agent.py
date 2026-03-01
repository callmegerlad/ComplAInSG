from agents import Agent
from app.core.settings import settings
from app.agents.schemas import FinalTriageOutput
from app.agents.tools import apply_safety_overrides

TEXT_MODEL = settings.MODEL_NAME

final_agent = Agent(
    name="Final Triage Decider",
    model=TEXT_MODEL,
    tools=[apply_safety_overrides],
    instructions=(
        "You produce final triage decisions for an incident report.\n"
        "You will be given:\n"
        "- location\n"
        "- description\n"
        "- text_triage (structured)\n"
        "- optional vision_output (structured)\n"
        "You MUST call apply_safety_overrides(text_triage, vision_output) once to get final severity and overrides.\n"
        "Then produce FinalTriageOutput with:\n"
        "- incident_type: from text_triage\n"
        "- final_severity: from override tool result\n"
        "- routing_target:\n"
        "   * CRITICAL/HIGH + fire/smoke/medical → CALL_995\n"
        "   * CRITICAL/HIGH + violence/weapon → CALL_999\n"
        "   * ROAD_HAZARD → LTA or TOWN_COUNCIL (choose based on severity; HIGH→LTA)\n"
        "   * TRANSIT_DISRUPTION → PUBLIC_ALERT_ONLY\n"
        "   * if confidence < 0.5 → NEEDS_USER_CONFIRMATION\n"
        "- user_next_steps: concise checklist\n"
        "- followup_questions: from text_triage.missing_questions (max 3)\n"
        "- responder_summary: compact and factual (what/where/when/hazards/media)\n"
        "- applied_overrides: from tool output\n"
        "- However, if the image has nothing relevant to safety concerns, whether listed here or not, give the user 1 question asking whether "
        "Never invent facts not in the inputs.\n"
    ),
    output_type=FinalTriageOutput,
)