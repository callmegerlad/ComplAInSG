from typing import Optional, Tuple, Dict, Any
import base64
import io
import requests as http_requests
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from agents import Runner
from app.agents.schemas import VisionOutput, FinalTriageOutput, TextTriageOutput, MetadataOutput
from app.agents.vision_agent import vision_agent
from app.agents.text_triage_agent import text_triage_agent
from app.agents.final_agent import final_agent
from app.agents.metadata_agent import metadata_agent


# ---------------------------------------------------------------------------
# EXIF helpers
# ---------------------------------------------------------------------------

def _dms_to_decimal(dms, ref: str) -> float:
    """Convert EXIF GPS degrees/minutes/seconds to decimal degrees."""
    d, m, s = dms
    decimal = float(d) + float(m) / 60 + float(s) / 3600
    if ref in ("S", "W"):
        decimal = -decimal
    return round(decimal, 6)


def _open_image(image_url: str) -> Image.Image:
    """Open a PIL Image from either an HTTP(S) URL or a data URL."""
    if image_url.startswith("data:"):
        # data:<mime>;base64,<data>
        header, encoded = image_url.split(",", 1)
        image_bytes = base64.b64decode(encoded)
        return Image.open(io.BytesIO(image_bytes))
    else:
        response = http_requests.get(image_url, timeout=10)
        response.raise_for_status()
        return Image.open(io.BytesIO(response.content))


def extract_image_metadata(image_url: str) -> Dict[str, Any]:
    """
    Download the image from image_url (HTTP URL or data URL), read its EXIF
    data via Pillow, and return a plain dict with the most incident-relevant
    fields.  Returns a minimal dict if the image cannot be fetched or parsed.
    NOTE: data URLs are NOT stored in the returned dict to avoid flooding LLM
    prompts with megabytes of base64.
    """
    # Use a short placeholder so we never embed the full data URL in prompts
    source_label = "data-url" if image_url.startswith("data:") else image_url
    meta: Dict[str, Any] = {"source_url": source_label}
    try:
        img = _open_image(image_url)

        raw_exif = img._getexif()  # type: ignore[attr-defined]
        if not raw_exif:
            meta["exif_available"] = False
            return meta

        meta["exif_available"] = True
        decoded: Dict[str, Any] = {TAGS.get(k, k): v for k, v in raw_exif.items()}

        # Timestamp
        for ts_tag in ("DateTimeOriginal", "DateTime", "DateTimeDigitized"):
            if ts_tag in decoded:
                meta["datetime"] = str(decoded[ts_tag])
                break

        # Device
        if "Make" in decoded:
            meta["make"] = str(decoded["Make"]).strip("\x00")
        if "Model" in decoded:
            meta["model"] = str(decoded["Model"]).strip("\x00")

        # Software (editing clue)
        if "Software" in decoded:
            meta["software"] = str(decoded["Software"]).strip("\x00")

        # GPS
        gps_info = decoded.get("GPSInfo")
        if gps_info:
            gps: Dict[str, Any] = {GPSTAGS.get(k, k): v for k, v in gps_info.items()}
            try:
                lat = _dms_to_decimal(gps["GPSLatitude"], gps["GPSLatitudeRef"])
                lng = _dms_to_decimal(gps["GPSLongitude"], gps["GPSLongitudeRef"])
                meta["gps"] = {"lat": lat, "lng": lng}
                if "GPSAltitude" in gps:
                    meta["gps"]["alt_m"] = round(float(gps["GPSAltitude"]), 1)
            except (KeyError, TypeError, ZeroDivisionError):
                meta["gps_parse_error"] = True

        # Image dimensions
        meta["width_px"], meta["height_px"] = img.size
        meta["format"] = img.format

    except Exception as exc:
        meta["fetch_error"] = str(exc)

    return meta


# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------

async def run_triage_pipeline(
    location: str,
    description: str,
    image_url: Optional[str] = None
) -> Tuple[FinalTriageOutput, Optional[VisionOutput], TextTriageOutput, Optional[MetadataOutput]]:

    vision_output: Optional[VisionOutput] = None
    metadata_output: Optional[MetadataOutput] = None

    if image_url:
        # --- Vision agent ---
        vision_input = [
            {"role": "user", "content": [
                {"type": "input_text", "text": f"Location: {location}\nDescription: {description}"},
                {"type": "input_image", "image_url": image_url},
            ]}
        ]
        vision_result = await Runner.run(vision_agent, vision_input)
        vision_output = vision_result.final_output

        # --- Metadata agent ---
        raw_meta = extract_image_metadata(image_url)
        meta_input = (
            f"Reported location: {location}\n"
            f"Incident description: {description}\n"
            f"Extracted image metadata: {raw_meta}"
        )
        meta_result = await Runner.run(metadata_agent, meta_input)
        metadata_output = meta_result.final_output

    # --- Text triage agent ---
    text_input = (
        f"Location: {location}\n"
        f"Description: {description}\n"
        f"Vision signals (optional): {vision_output.model_dump() if vision_output else 'None'}\n"
        f"Metadata analysis (optional): {metadata_output.model_dump() if metadata_output else 'None'}"
    )
    text_result = await Runner.run(text_triage_agent, text_input)
    text_triage: TextTriageOutput = text_result.final_output

    # --- Final agent ---
    final_input = {
        "location": location,
        "description": description,
        "text_triage": text_triage.model_dump(),
        "vision_output": vision_output.model_dump() if vision_output else None,
        "metadata_output": metadata_output.model_dump() if metadata_output else None,
    }
    final_result = await Runner.run(final_agent, str(final_input))
    final: FinalTriageOutput = final_result.final_output

    return final, vision_output, text_triage, metadata_output
