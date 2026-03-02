import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, status

from app.core.settings import settings


def utcnow():
    """Helper function to get current UTC time."""
    return datetime.now(timezone.utc)


def normalise_email(email: str) -> str:
    """Normalise email to lowercase and strip whitespace."""
    return email.strip().lower()


# Password Utilities

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify a password against its bcrypt hash."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8"))
    except (ValueError, AttributeError):
        return False


# JWT Token Utilities

def create_jwt_token(user_id: str, token_type: str = "access") -> str:
    """Create a JWT token for a user."""
    expiration = utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    payload = {
        "sub": user_id,
        "exp": expiration,
        "iat": utcnow(),
        "type": token_type,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """Create a refresh token for a user (longer expiration)."""
    expiration = utcnow() + timedelta(days=30)  # 30 days for refresh tokens
    payload = {
        "sub": user_id,
        "exp": expiration,
        "iat": utcnow(),
        "type": "refresh",
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_jwt_token(token: str) -> dict:
    """Decode and verify a JWT token."""
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def validate_token(token: str, expected_type: str = "access") -> dict:
    """
    Validate a JWT token and verify its type.

    Args:
        token: The JWT token string
        expected_type: Expected token type ("access" or "refresh")

    Returns:
        The decoded token payload

    Raises:
        HTTPException: If token is invalid or type doesn't match
    """
    payload = decode_jwt_token(token)

    # Check token type
    token_type = payload.get("type")
    if token_type != expected_type:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token type. Expected {expected_type}, got {token_type}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload
