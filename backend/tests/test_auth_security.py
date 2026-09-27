from datetime import timedelta

from fastapi.testclient import TestClient
from jose import jwt

from app.core.config import settings
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.main import app


client = TestClient(app)


# =========================================================
# PASSWORD SECURITY
# =========================================================

def test_password_is_hashed():
    password = "StrongPassword123!"

    hashed = hash_password(password)

    assert hashed != password
    assert len(hashed) > 20


def test_correct_password_verifies():
    password = "StrongPassword123!"

    hashed = hash_password(password)

    assert verify_password(password, hashed) is True


def test_wrong_password_does_not_verify():
    password = "StrongPassword123!"
    wrong_password = "WrongPassword123!"

    hashed = hash_password(password)

    assert verify_password(wrong_password, hashed) is False


def test_same_password_generates_different_hashes():
    password = "StrongPassword123!"

    first_hash = hash_password(password)
    second_hash = hash_password(password)

    assert first_hash != second_hash

    assert verify_password(password, first_hash) is True
    assert verify_password(password, second_hash) is True


# =========================================================
# JWT SECURITY
# =========================================================

def test_access_token_contains_subject_and_expiration():
    token = create_access_token(
        {
            "sub": "123",
            "email": "security@test.com",
        }
    )

    payload = jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )

    assert payload["sub"] == "123"
    assert payload["email"] == "security@test.com"
    assert "exp" in payload


def test_access_token_can_have_custom_expiration():
    token = create_access_token(
        {
            "sub": "123",
        },
        expires_delta=timedelta(minutes=5),
    )

    payload = jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )

    assert payload["sub"] == "123"
    assert "exp" in payload


# =========================================================
# API AUTHENTICATION
# =========================================================

def test_auth_me_requires_authorization():
    response = client.get("/auth/me")

    assert response.status_code in {401, 403}


def test_auth_me_rejects_invalid_token():
    response = client.get(
        "/auth/me",
        headers={
            "Authorization": "Bearer completely-invalid-token"
        },
    )

    assert response.status_code == 401


def test_auth_me_rejects_malformed_authorization_header():
    response = client.get(
        "/auth/me",
        headers={
            "Authorization": "NotBearerToken"
        },
    )

    assert response.status_code in {401, 403}


def test_auth_me_rejects_token_signed_with_wrong_secret():
    fake_token = jwt.encode(
        {
            "sub": "1",
            "email": "security@test.com",
        },
        "wrong-secret",
        algorithm=settings.JWT_ALGORITHM,
    )

    response = client.get(
        "/auth/me",
        headers={
            "Authorization": f"Bearer {fake_token}"
        },
    )

    assert response.status_code == 401


# =========================================================
# REQUEST VALIDATION
# =========================================================

def test_register_rejects_short_password():
    response = client.post(
        "/auth/register",
        json={
            "name": "Security Test",
            "email": "short-password-security@test.com",
            "password": "123",
        },
    )

    assert response.status_code == 422


def test_register_rejects_invalid_email():
    response = client.post(
        "/auth/register",
        json={
            "name": "Security Test",
            "email": "not-an-email",
            "password": "StrongPassword123!",
        },
    )

    assert response.status_code == 422


def test_register_rejects_too_long_password():
    response = client.post(
        "/auth/register",
        json={
            "name": "Security Test",
            "email": "long-password-security@test.com",
            "password": "A" * 129,
        },
    )

    assert response.status_code == 422


def test_register_rejects_too_short_name():
    response = client.post(
        "/auth/register",
        json={
            "name": "A",
            "email": "short-name-security@test.com",
            "password": "StrongPassword123!",
        },
    )

    assert response.status_code == 422


def test_login_rejects_invalid_email_format():
    response = client.post(
        "/auth/login",
        json={
            "email": "invalid-email",
            "password": "StrongPassword123!",
        },
    )

    assert response.status_code == 422


def test_login_rejects_empty_password():
    response = client.post(
        "/auth/login",
        json={
            "email": "security@test.com",
            "password": "",
        },
    )

    assert response.status_code == 422