# backend/tests/integration/test_auth.py
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from httpx import AsyncClient

from src.models import User


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient, db_session: AsyncSession):
    response = await client.post(
        "/api/v1/register/",
        data={
            "email": "test@example.com",
            "password": "testpassword123",
            "name": "Test",
            "surname": "User",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, db_session: AsyncSession):
    await client.post(
        "/api/v1/register/",
        data={
            "email": "test@example.com",
            "password": "testpassword123",
            "name": "Test",
            "surname": "User",
        },
    )

    response = await client.post(
        "/api/v1/register/",
        data={
            "email": "test@example.com",
            "password": "anotherpass123",
            "name": "Another",
            "surname": "User",
        },
    )

    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, db_session: AsyncSession):
    await client.post(
        "/api/v1/register/",
        data={
            "email": "test@example.com",
            "password": "testpassword123",
            "name": "Test",
            "surname": "User",
        },
    )

    response = await client.post(
        "/api/v1/login/",
        data={
            "email": "test@example.com",
            "password": "testpassword123",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, db_session: AsyncSession):
    await client.post(
        "/api/v1/register/",
        data={
            "email": "test@example.com",
            "password": "testpassword123",
            "name": "Test",
            "surname": "User",
        },
    )

    response = await client.post(
        "/api/v1/login/",
        data={
            "email": "test@example.com",
            "password": "wrongpassword",
        },
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, db_session: AsyncSession):
    await client.post(
        "/api/v1/register/",
        data={
            "email": "test@example.com",
            "password": "testpassword123",
            "name": "Test",
            "surname": "User",
        },
    )

    login_response = await client.post(
        "/api/v1/login/",
        data={
            "email": "test@example.com",
            "password": "testpassword123",
        },
    )

    token = login_response.json()["access_token"]

    response = await client.get(
        "/api/v1/me/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test"


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, db_session: AsyncSession):
    await client.post(
        "/api/v1/register/",
        data={
            "email": "test@example.com",
            "password": "testpassword123",
            "name": "Test",
            "surname": "User",
        },
    )

    login_response = await client.post(
        "/api/v1/login/",
        data={
            "email": "test@example.com",
            "password": "testpassword123",
        },
    )

    refresh_token = login_response.json()["refresh_token"]

    response = await client.post(
        "/api/v1/refresh/",
        json={"refresh_token": refresh_token},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
