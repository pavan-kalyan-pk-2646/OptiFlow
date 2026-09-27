from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


GenderType = Literal[
    "male",
    "female",
    "other",
    "prefer_not_to_say",
]


class RegisterRequest(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100,
    )

    age: int | None = Field(
        default=None,
        ge=1,
        le=120,
    )

    gender: GenderType | None = None

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
    )


class LoginRequest(BaseModel):
    email: EmailStr

    password: str = Field(
        min_length=1,
        max_length=128,
    )


class UserResponse(BaseModel):
    id: int

    name: str

    age: int | None

    gender: str | None

    email: EmailStr

    is_active: bool

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class AuthResponse(BaseModel):
    access_token: str

    token_type: str

    user: UserResponse