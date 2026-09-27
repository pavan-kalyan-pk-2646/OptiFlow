from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.repositories.user_repository import (
    create_user,
    get_user_by_email,
)
from app.schemas.auth import LoginRequest, RegisterRequest


def register_user(
    db: Session,
    request: RegisterRequest,
):
    existing_user = get_user_by_email(
        db,
        request.email,
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    password_hash = hash_password(
        request.password
    )

    return create_user(
        db=db,
        name=request.name,
        age=request.age,
        gender=request.gender,
        email=request.email,
        password_hash=password_hash,
    )


def authenticate_user(
    db: Session,
    request: LoginRequest,
):
    user = get_user_by_email(
        db,
        request.email,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not verify_password(
        request.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is inactive.",
        )

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
        },
        expires_delta=timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    )

    return user, access_token