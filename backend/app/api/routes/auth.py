from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, decode_access_token
from app.repositories.user_repository import get_user_by_id
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UserResponse,
)
from app.services.auth_service import (
    authenticate_user,
    register_user,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

security = HTTPBearer()


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):
    user = register_user(db, request)

    access_token = create_access_token(
        {
            "sub": str(user.id),
            "email": user.email,
        }
    )

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=user,
    )


@router.post(
    "/login",
    response_model=AuthResponse,
)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):
    user, access_token = authenticate_user(
        db,
        request,
    )

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=user,
    )


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    try:
        payload = decode_access_token(
            credentials.credentials
        )

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token.",
            )

        user = get_user_by_id(
            db,
            int(user_id),
        )

    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
        )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )

    return user