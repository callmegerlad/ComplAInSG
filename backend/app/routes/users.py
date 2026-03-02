from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import (
    get_admin_user,
    get_current_user,
)
from app.models.users import User, UserRole
from backend.app.schemas.users import (
    AuthResponse,
    UserCreateRequest,
    UserLoginRequest,
    UserResponse,
    UsersListResponse,
    UserUpdateRequest,
)
from app.utils import (
    create_jwt_token,
    hash_password,
    normalise_email,
    verify_password,
)


users_router = APIRouter(prefix="/users", tags=["users"])


@users_router.post(
    "/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED
)
def register_user(payload: UserCreateRequest, db: Session = Depends(get_db)):
    """Register a new user account."""
    normalized_email = normalise_email(payload.email)

    # Check if email already exists
    existing = (
        db.query(User).filter(func.lower(User.email)
                              == normalized_email).first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )

    # Create new user
    user = User(
        display_name=payload.display_name.strip(),
        email=normalized_email,
        password_hash=hash_password(payload.password),
        role=UserRole.REGULAR,
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate JWT token
    user_id = str(getattr(user, "id", ""))
    access_token = create_jwt_token(user_id)

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@users_router.post("/login", response_model=AuthResponse)
def login_user(payload: UserLoginRequest, db: Session = Depends(get_db)):
    """Login with email and password."""
    normalized_email = normalise_email(payload.email)

    user = db.query(User).filter(func.lower(
        User.email) == normalized_email).first()

    # Verify password
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    password_hash = getattr(user, "password_hash", "")
    if not verify_password(payload.password, password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Check if account is active
    is_active = bool(getattr(user, "is_active", False))
    if not is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive"
        )

    # Generate JWT token
    user_id = str(getattr(user, "id", ""))
    access_token = create_jwt_token(user_id)

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@users_router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return UserResponse.model_validate(current_user)


@users_router.get("", response_model=UsersListResponse)
def list_users(
    db: Session = Depends(get_db),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
):
    """List all users with pagination."""
    total = db.query(func.count(User.id)).scalar() or 0
    users = db.query(User).order_by(User.created_at.desc()
                                    ).offset(skip).limit(limit).all()

    return UsersListResponse(
        total=total, users=[
            UserResponse.model_validate(user) for user in users]
    )


@users_router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: str, db: Session = Depends(get_db)):
    """Get a specific user by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return UserResponse.model_validate(user)


@users_router.patch("/me", response_model=UserResponse)
def update_current_user(
    payload: UserUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Update the current user's profile."""
    if payload.display_name is not None:
        setattr(current_user, "display_name", payload.display_name.strip())

    if payload.email is not None:
        normalized_email = normalise_email(payload.email)

        # Check if email is already in use by another user
        existing = (
            db.query(User)
            .filter(func.lower(User.email) == normalized_email, User.id != current_user.id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already in use",
            )

        setattr(current_user, "email", normalized_email)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return UserResponse.model_validate(current_user)


@users_router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_current_user(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Delete the current user's account."""
    db.delete(current_user)
    db.commit()
    return None
