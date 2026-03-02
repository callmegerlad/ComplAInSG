"""Authentication and authorization dependencies for FastAPI."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.users import User, UserRole
from app.utils import validate_token


# Token Bearer Classes

class AccessTokenBearer(HTTPBearer):
    """
    Custom HTTP Bearer class for access token authentication.
    Extracts the Bearer token from the Authorization header.

    Usage:
        credentials: HTTPAuthorizationCredentials = Depends(AccessTokenBearer())
        token = credentials.credentials
    """

    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)


class RefreshTokenBearer(HTTPBearer):
    """
    Custom HTTP Bearer class for refresh token authentication.
    Extracts the Bearer token from the Authorization header.

    Usage:
        credentials: HTTPAuthorizationCredentials = Depends(RefreshTokenBearer())
        token = credentials.credentials
    """

    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)


# Authentication Dependencies

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(AccessTokenBearer()),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency to get the current authenticated user.
    Validates the access token and returns the user.

    Args:
        credentials: Bearer token credentials from AccessTokenBearer
        db: Database session

    Returns:
        The authenticated User object

    Raises:
        HTTPException: If token is invalid or user is not found/inactive
    """
    token = credentials.credentials

    # Validate token and check type
    token_data = validate_token(token, expected_type="access")
    user_id = token_data.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fetch user from database
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is active
    is_active = bool(getattr(user, "is_active", False))
    if not is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user


def get_current_user_from_refresh_token(
    credentials: HTTPAuthorizationCredentials = Depends(RefreshTokenBearer()),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency to get the current user from a refresh token.
    Used for token refresh endpoints.

    Args:
        credentials: Bearer token credentials from RefreshTokenBearer
        db: Database session

    Returns:
        The authenticated User object

    Raises:
        HTTPException: If refresh token is invalid or user is not found/inactive
    """
    token = credentials.credentials

    # Validate token and check it's a refresh token
    token_data = validate_token(token, expected_type="refresh")
    user_id = token_data.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fetch user from database
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is active
    is_active = bool(getattr(user, "is_active", False))
    if not is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user


# Role-Based Access Control (RBAC) Dependencies

def require_role(required_role: UserRole):
    """
    Factory function to create a dependency that requires a specific role.

    Usage:
        @app.get("/admin-only")
        def admin_endpoint(current_user: User = Depends(require_role(UserRole.ADMIN))):
            ...
    """
    async def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        user_role = getattr(current_user, "role", None)
        if user_role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This resource requires {required_role.value} role",
            )
        return current_user

    return role_checker


def require_roles(required_roles: list[UserRole]):
    """
    Factory function to create a dependency that requires one of multiple roles.

    Usage:
        @app.get("/responder-or-admin")
        def responder_endpoint(
            current_user: User = Depends(require_roles([UserRole.RESPONDER, UserRole.ADMIN]))
        ):
            ...
    """
    async def roles_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        user_role = getattr(current_user, "role", None)
        if user_role not in required_roles:
            role_names = ", ".join([r.value for r in required_roles])
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This resource requires one of the following roles: {role_names}",
            )
        return current_user

    return roles_checker


# Convenience dependencies for common roles

def get_admin_user(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
) -> User:
    """Dependency that ensures the current user is an admin."""
    return current_user


def get_responder_user(
    current_user: User = Depends(require_role(UserRole.RESPONDER)),
) -> User:
    """Dependency that ensures the current user is a responder."""
    return current_user


def get_responder_or_admin_user(
    current_user: User = Depends(require_roles(
        [UserRole.RESPONDER, UserRole.ADMIN])),
) -> User:
    """Dependency that ensures the current user is a responder or admin."""
    return current_user
