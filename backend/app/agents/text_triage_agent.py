from agents import Agent
from app.core.settings import settings
from app.agents.schemas import TextTriageOutput

TEXT_MODEL = settings.MODEL_NAME

text_triage_agent = Agent(
    name="Text Triage Agent",
    model=TEXT_MODEL,
    instructions=(
        "You are a triage agent for public safety incident reports in Singapore.\n"
        "Input: location string + free-text description + optional vision signals summary.\n"
        "Return ONLY structured output matching TextTriageOutput.\n"
        "Goals:\n"
        "- Classify incident_type (choose the closest)\n"
        "- Choose severity (LOW/MEDIUM/HIGH/CRITICAL)\n"
        "- Provide confidence 0-1\n"
        "- Provide rationale (1-2 sentences)\n"
        "- Ask up to 3 missing questions if it materially affects routing/severity\n"
        "- Suggest up to 5 safe actions. Always include 'If immediate danger, call 999/995' when severity HIGH/CRITICAL.\n"
        "Do not provide harmful instructions.\n"
    ),
    output_type=TextTriageOutput,
)