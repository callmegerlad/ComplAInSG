"""
test_agents.py  –  End-to-end smoke test for every agent in the triage pipeline.

Usage (run from the backend/ directory with the venv activated):

    python -m app.tests.test_agents

Or with a custom image URL:

    python -m app.tests.test_agents --image-url "https://example.com/photo.jpg"

The script exercises:
    1. Vision Agent        (only when an image URL is supplied)
    2. Metadata Agent      (only when an image URL is supplied)
    3. Text Triage Agent
    4. Final Triage Agent  (calls the apply_safety_overrides tool internally)
"""

import argparse
import asyncio
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

# ── Pretty-printing helper ───────────────────────────────────────────

SEPARATOR = "=" * 72


def pretty(label: str, obj) -> None:
    """Print a labelled Pydantic model (or None) as indented JSON."""
    print(f"\n{SEPARATOR}")
    print(f"  {label}")
    print(SEPARATOR)
    if obj is None:
        print("  (not available – no image was supplied)")
    else:
        print(json.dumps(obj.model_dump(), indent=2, default=str))


# ── Main test routine ────────────────────────────────────────────────

async def run_test(
    location: str,
    description: str,
    image_url: str | None,
) -> None:

    print(f"\n{'─' * 72}")
    print("  TRIAGE PIPELINE TEST")
    print(f"{'─' * 72}")
    print(f"  Location:    {location}")
    print(f"  Description: {description}")
    print(f"  Image URL:   {image_url or '(none)'}")
    print(f"{'─' * 72}\n")

    # ── Run the full pipeline and time it ─────────────────────────────
    start_time = time.perf_counter()

    final, vision, text_triage, metadata = await run_triage_pipeline(
        location=location,
        description=description,
        image_url=image_url,
    )

    end_time = time.perf_counter()
    elapsed = end_time - start_time

    # ── Display results ───────────────────────────────────────────────
    pretty("1 ▸ VISION AGENT  (VisionOutput)", vision)
    pretty("2 ▸ METADATA AGENT  (MetadataOutput)", metadata)
    pretty("3 ▸ TEXT TRIAGE AGENT  (TextTriageOutput)", text_triage)
    pretty("4 ▸ FINAL TRIAGE AGENT  (FinalTriageOutput)", final)

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
        default="Clementi MRT Station Exit A",
        help="Reported incident location (default: Clementi MRT Station Exit A)",
    )
    parser.add_argument(
        "--description",
        default="Two guys fighting near the entrance, pushing and shouting. Crowd gathering.",
        help="Free-text incident description",
    )
    parser.add_argument(
        "--image-url",
        default=None,
        help="Public URL of an incident image (optional – enables vision + metadata agents)",
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
        )
    )


if __name__ == "__main__":
    main()
