from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.users import UserRole


class UserCreateRequest(BaseModel):
    """Request schema for creating a new user."""
    display_name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr = Field(..., max_length=320)
    password: str = Field(..., min_length=8, max_length=128)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "display_name": "John Doe",
                "email": "john@example.com",
                "password": "securepassword123"
            }
        }
    )


class UserLoginRequest(BaseModel):
    """Request schema for user login."""
    email: EmailStr
    password: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "john@example.com",
                "password": "securepassword123"
            }
        }
    )


class UserUpdateRequest(BaseModel):
    """Request schema for updating user profile."""
    display_name: Optional[str] = Field(None, min_length=1, max_length=120)
    email: Optional[EmailStr] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "display_name": "Jane Doe",
                "email": "jane@example.com"
            }
        }
    )


class UserResponse(BaseModel):
    """Response schema for user data."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    display_name: Optional[str]
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime
    report_count: int = 0
    alert_response_count: int = 0
    trust_score: int = 50
    badges: list[str] = []


class AuthResponse(BaseModel):
    """Response schema for authentication endpoints."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJhbGc...",
                "token_type": "bearer",
                "user": {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "display_name": "John Doe",
                    "email": "john@example.com",
                    "role": "REGULAR",
                    "is_active": True,
                    "created_at": "2026-03-02T10:00:00Z",
                    "updated_at": "2026-03-02T10:00:00Z"
                }
            }
        }
    )


class UsersListResponse(BaseModel):
    """Response schema for listing users."""
    total: int
    users: list[UserResponse]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "total": 2,
                "users": []
            }
        }
    )
