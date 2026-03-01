"""
test_agents.py  –  End-to-end smoke test for every agent in the triage pipeline.

Usage (run from the backend/ directory with the venv activated):

    python -m app.tests.test_agents

Or with an image from the internet:

    python -m app.tests.test_agents --image-url "https://example.com/photo.jpg"

Or with a local image file:

    python -m app.tests.test_agents --image-path "test.jpg"

The script exercises:
    1. Vision Agent        (only when an image URL or path is supplied)
    2. Metadata Agent      (only when an image URL or path is supplied)
    3. Text Triage Agent
    4. Final Triage Agent  (calls the apply_safety_overrides tool internally)
"""

import argparse
import asyncio
import base64
import mimetypes
import os
import sys
import time
import json
from pathlib import Path

# ── Ensure the .env file is loaded before anything else ──────────────
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parents[2] / ".env"   # backend/.env
load_dotenv(dotenv_path=env_path)

# ── Now we can safely import the app modules ─────────────────────────
from app.agents.pipeline import run_triage_pipeline
from app.agents.schemas import (
    FinalTriageOutput,
    MetadataOutput,
    TextTriageOutput,
    VisionOutput,
)

# ── Image handling helpers ───────────────────────────────────────────

def local_image_to_data_url(file_path: str) -> str:
    """
    Convert a local image file to a data URL for use with the vision agent.
    
    Args:
        file_path: Path to the local image file
        
    Returns:
        Data URL string like "data:image/jpeg;base64,/9j/4AAQ..."
        
    Raises:
        FileNotFoundError: If the file doesn't exist
        ValueError: If the file type isn't supported
    """
    path = Path(file_path)
    
    if not path.exists():
        raise FileNotFoundError(f"Image file not found: {file_path}")
    
    # Detect MIME type
    mime_type, _ = mimetypes.guess_type(str(path))
    if not mime_type or not mime_type.startswith('image/'):
        raise ValueError(f"File doesn't appear to be an image: {file_path}")
    
    # Read and encode the file
    with open(path, 'rb') as f:
        image_data = f.read()
    
    encoded = base64.b64encode(image_data).decode('ascii')
    return f"data:{mime_type};base64,{encoded}"


# ── Pretty-printing helper ───────────────────────────────────────────

SEPARATOR = "=" * 72


def pretty(label: str, obj) -> None:
    """Print a labelled Pydantic model (or None) as indented JSON."""
    print(f"\n{SEPARATOR}")
    print(f"  {label}")
    print(SEPARATOR)
    if obj is None:
        print("  (not available - no image was supplied)")
    else:
        print(json.dumps(obj.model_dump(), indent=2, default=str))


# ── Main test routine ────────────────────────────────────────────────

async def run_test(
    location: str,
    description: str,
    image_url: str | None,
    image_path: str | None,
) -> None:

    # ── Resolve the image source ──────────────────────────────────────
    final_image_url: str | None = None
    
    if image_url and image_path:
        print("WARNING: Both --image-url and --image-path provided. Using --image-url.")
        final_image_url = image_url
    elif image_url:
        final_image_url = image_url
    elif image_path:
        try:
            final_image_url = local_image_to_data_url(image_path)
            print(f"Converted local file to data URL: {image_path}")
        except (FileNotFoundError, ValueError) as e:
            sys.exit(f"ERROR: {e}")
    
    print(f"\n{'-' * 72}")
    print("  TRIAGE PIPELINE TEST")
    print(f"{'-' * 72}")
    print(f"  Location:    {location}")
    print(f"  Description: {description}")
    
    if image_url:
        print(f"  Image URL:   {image_url}")
    elif image_path:
        print(f"  Image Path:  {image_path} -> data URL")
    else:
        print(f"  Image:       (none)")
    print(f"{'-' * 72}\n")

    # ── Run the full pipeline and time it ─────────────────────────────
    start_time = time.perf_counter()

    final, vision, text_triage, metadata = await run_triage_pipeline(
        location=location,
        description=description,
        image_url=final_image_url,
    )

    end_time = time.perf_counter()
    elapsed = end_time - start_time

    # ── Display results ───────────────────────────────────────────────
    pretty("1 > VISION AGENT  (VisionOutput)", vision)
    pretty("2 > METADATA AGENT  (MetadataOutput)", metadata)
    pretty("3 > TEXT TRIAGE AGENT  (TextTriageOutput)", text_triage)
    pretty("4 > FINAL TRIAGE AGENT  (FinalTriageOutput)", final)

    # ── Timing summary ────────────────────────────────────────────────
    print(f"\n{SEPARATOR}")
    print(f"  Pipeline executed in {elapsed:.4f} seconds")
    print(f"{SEPARATOR}\n")

    # ── Raw repr (matches the sample output the user expects) ─────────
    print("final =", repr(final))
    print()
    if metadata:
        print("metadata =", repr(metadata))
        print()


# ── CLI entry-point ──────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Smoke-test all triage agents end-to-end.",
    )
    parser.add_argument(
        "--location",
        default="Singapore",
        help="Reported incident location (default: Singapore)",
    )
    parser.add_argument(
        "--description",
        default="Description",
        help="Free-text incident description",
    )
    parser.add_argument(
        "--image-url",
        default=None,
        help="Public URL of an incident image (enables vision + metadata agents)",
    )
    parser.add_argument(
        "--image-path",
        default=None,
        help="Local path to an incident image file (enables vision + metadata agents)",
    )
    args = parser.parse_args()

    # Sanity check: API key must be set
    if not os.environ.get("OPENAI_API_KEY"):
        sys.exit(
            "ERROR: OPENAI_API_KEY is not set.\n"
            "       Make sure backend/.env contains the key or export it in your shell."
        )

    asyncio.run(
        run_test(
            location=args.location,
            description=args.description,
            image_url=args.image_url,
            image_path=args.image_path,
        )
    )


if __name__ == "__main__":
    main()
