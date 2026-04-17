# backend/src/schemas/auth.py
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)
    surname: str = Field(..., min_length=1, max_length=100)


class UserResponseModel(UserBase):
    id: int
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class RegistrationRequestModel(UserBase):
    password: str = Field(..., min_length=8, max_length=100)


class LoginRequestModel(BaseModel):
    email: EmailStr
    password: str


class TokensModel(BaseModel):
    access_token: str
    refresh_token: str


class RefreshRequest(BaseModel):
    refresh_token: str
