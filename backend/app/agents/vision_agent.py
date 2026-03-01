from agents import Agent, AgentOutputSchema
from app.core.settings import settings
from app.agents.schemas import VisionOutput

VISION_MODEL = settings.MODEL_NAME

vision_agent = Agent(
    name="Vision Signal Extractor",
    model=VISION_MODEL,
    instructions=(
        "You are a Vision Triage Classifier for a public incident reporting app in Singapore.\n"
        "Task: detect safety-relevant visual signals and return strict JSON matching the VisionOutput schema.\n"
        "Rules:\n"
        "- Be conservative: if unsure, set present=false and record uncertainty.\n"
        "- Multi-label allowed.\n"
        "- Do not identify people or guess intent.\n"
        "- Keep scene summary high-level.\n"
        "- Add at most 3 follow-up questions only if needed.\n"
        "- Output must match the structured schema.\n"
    ),
    output_type=AgentOutputSchema(VisionOutput, strict_json_schema=False),
)