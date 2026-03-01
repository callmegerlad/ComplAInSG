from typing import Optional, Tuple
from agents import Runner
from app.agents.schemas import VisionOutput, FinalTriageOutput, TextTriageOutput
from app.agents.vision_agent import vision_agent
from app.agents.text_triage_agent import text_triage_agent
from app.agents.final_agent import final_agent

async def run_triage_pipeline(
    location: str,
    description: str,
    image_url: Optional[str] = None
) -> Tuple[FinalTriageOutput, Optional[VisionOutput], TextTriageOutput]:

    vision_output: Optional[VisionOutput] = None
    if image_url:
        vision_input = [
            {"role": "user", "content": [
                {"type": "input_text", "text": f"Location: {location}\nDescription: {description}"},
                {"type": "input_image", "image_url": image_url},
            ]}
        ]
        vision_result = await Runner.run(vision_agent, vision_input)
        vision_output = vision_result.final_output

    text_input = (
        f"Location: {location}\n"
        f"Description: {description}\n"
        f"Vision signals (optional): {vision_output.model_dump() if vision_output else 'None'}"
    )
    text_result = await Runner.run(text_triage_agent, text_input)
    text_triage: TextTriageOutput = text_result.final_output

    final_input = {
        "location": location,
        "description": description,
        "text_triage": text_triage.model_dump(),
        "vision_output": vision_output.model_dump() if vision_output else None
    }
    final_result = await Runner.run(final_agent, str(final_input))
    final: FinalTriageOutput = final_result.final_output

    return final, vision_output, text_triage