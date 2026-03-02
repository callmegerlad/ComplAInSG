import base64
import hashlib
import re
from pathlib import Path
from typing import Tuple, Optional

DATA_URL_RE = re.compile(r"^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$")

MIME_TO_EXT = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}

MAX_IMAGE_BYTES = 6 * 1024 * 1024  # 6MB MVP limit (tweak as needed)

def _b64decode_strict(b64: str) -> bytes:
    # validate=True rejects non-base64 chars
    return base64.b64decode(b64, validate=True)

def save_base64_image(image_str: str, upload_dir: Path) -> Tuple[str, str]:
    """
    Accepts either:
      - data:image/jpeg;base64,<...>
      - raw base64 (<...>)
    Saves to disk using sha256 as filename.
    Returns: (public_path, sha256_hex)
      public_path example: /uploads/<sha>.jpg
    """
    image_str = (image_str or "").strip()
    if not image_str:
        raise ValueError("Empty image string")

    mime: Optional[str] = None
    b64_payload: str = image_str

    m = DATA_URL_RE.match(image_str)
    if m:
        mime = m.group(1).lower()
        b64_payload = m.group(2)

    # If raw base64 without data URL, guess JPEG if it starts with /9j/
    if not mime:
        if b64_payload.startswith("/9j/"):
            mime = "image/jpeg"
        elif b64_payload.startswith("iVBORw0KGgo"):
            mime = "image/png"
        elif b64_payload.startswith("UklGR"):  # common WebP header in base64
            mime = "image/webp"
        else:
            # safest fallback
            mime = "image/jpeg"

    ext = MIME_TO_EXT.get(mime)
    if not ext:
        raise ValueError(f"Unsupported image mime type: {mime}")

    # Decode
    try:
        raw = _b64decode_strict(b64_payload)
    except Exception as e:
        raise ValueError("Invalid base64 image payload") from e

    if len(raw) == 0:
        raise ValueError("Decoded image is empty")
    if len(raw) > MAX_IMAGE_BYTES:
        raise ValueError(f"Image too large (> {MAX_IMAGE_BYTES} bytes)")

    # Hash for filename/dedupe
    sha256_hex = hashlib.sha256(raw).hexdigest()
    filename = f"{sha256_hex}.{ext}"
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / filename

    # Write once (idempotent)
    if not file_path.exists():
        file_path.write_bytes(raw)

    public_path = f"/uploads/{filename}"
    return public_path, sha256_hex