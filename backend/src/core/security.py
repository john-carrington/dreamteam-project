# backend/src/core/security.py
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from pwdlib import PasswordHash
from pydantic import BaseModel


class TokenPayload(BaseModel):
    sub: str
    exp: datetime


class TokenService:
    SECRET_KEY = "your-secret-key-change-in-production"
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    REFRESH_TOKEN_EXPIRE_DAYS = 7

    @classmethod
    def create_token(cls, email: str, expire_minutes: int) -> str:
        expire = datetime.utcnow() + timedelta(minutes=expire_minutes)
        payload = TokenPayload(sub=email, exp=expire)
        return jwt.encode(payload.model_dump(), cls.SECRET_KEY, algorithm=cls.ALGORITHM)

    @classmethod
    def get_token_pair(cls, email: str) -> dict[str, str]:
        return {
            "access_token": cls.create_token(email, cls.ACCESS_TOKEN_EXPIRE_MINUTES),
            "refresh_token": cls.create_token(
                email, cls.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60
            ),
        }

    @classmethod
    def decode_token(cls, token: str, token_type: str = "access") -> str:
        try:
            payload = jwt.decode(token, cls.SECRET_KEY, algorithms=[cls.ALGORITHM])
            return TokenPayload(**payload).sub
        except JWTError:
            raise ValueError("Invalid token")

    @classmethod
    def refresh_token(cls, refresh_token: str) -> dict[str, str]:
        email = cls.decode_token(refresh_token, "refresh")
        return cls.get_token_pair(email)


def get_password_hash() -> PasswordHash:
    return PasswordHash.recommended()
