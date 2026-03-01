from datetime import datetime, timezone


def utcnow():
    """Helper function to get current UTC time."""
    return datetime.now(timezone.utc)
