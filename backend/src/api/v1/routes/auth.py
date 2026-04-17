from typing import Annotated

from fastapi import APIRouter, Depends, Form, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.core.security import TokenService, get_password_hash
from src.models import User
from src.schemas import (
    LoginRequestModel,
    RefreshRequest,
    RegistrationRequestModel,
    TokensModel,
    UserResponseModel,
)

auth_router = APIRouter()
auth_scheme = HTTPBearer()


@auth_router.post(
    "/register/",
    description="Registration for new users.",
    response_model=UserResponseModel,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    user_data: Annotated[RegistrationRequestModel, Form()],
    password_hash: Annotated[PasswordHash, Depends(get_password_hash)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with email {user_data.email} already exists.",
        )

    hashed_password = password_hash.hash(user_data.password)
    new_user = User(
        email=user_data.email,
        password=hashed_password,
        name=user_data.name,
        surname=user_data.surname,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return UserResponseModel.model_validate(new_user)


@auth_router.post(
    "/login/",
    description="Login with password and username",
    response_model=TokensModel,
    status_code=status.HTTP_200_OK,
)
async def login(
    user_data: Annotated[LoginRequestModel, Form()],
    password_hash: Annotated[PasswordHash, Depends(get_password_hash)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(User).where(User.email == user_data.email))
    user = result.scalar_one_or_none()

    success_login = True

    if user is None:
        fake_hash = password_hash.hash("dummypassword")
        password_hash.verify(user_data.password, fake_hash)
        success_login = False
    elif not password_hash.verify(user_data.password, user.password):
        success_login = False

    if not success_login:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_pair = TokenService.get_token_pair(user.email)
    token_pair["token_type"] = "bearer"
    return TokensModel(**token_pair)


@auth_router.get(
    "/me/",
    description="Get current user.",
    response_model=UserResponseModel,
    status_code=status.HTTP_200_OK,
)
async def get_user(
    authorization_data: Annotated[HTTPAuthorizationCredentials, Depends(auth_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    token = authorization_data.credentials
    email = TokenService.decode_token(token, "access")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return UserResponseModel.model_validate(user)


@auth_router.post(
    "/refresh/",
    description="Refresh token.",
    response_model=TokensModel,
    status_code=status.HTTP_200_OK,
)
async def refresh_token(data: RefreshRequest):
    token_pair = TokenService.refresh_token(data.refresh_token)
    token_pair["token_type"] = "bearer"
    return TokensModel(**token_pair)
