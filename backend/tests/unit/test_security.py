# backend/tests/unit/test_security.py
import pytest
from datetime import datetime, timedelta

from src.core.security import TokenService


def test_create_token():
    token = TokenService.create_token("test@example.com", 30)
    assert isinstance(token, str)
    assert len(token) > 0


def test_decode_valid_token():
    token = TokenService.create_token("test@example.com", 30)
    email = TokenService.decode_token(token)
    assert email == "test@example.com"


def test_decode_invalid_token():
    with pytest.raises(ValueError, match="Invalid token"):
        TokenService.decode_token("invalid.token.here")


def test_get_token_pair():
    tokens = TokenService.get_token_pair("test@example.com")
    assert "access_token" in tokens
    assert "refresh_token" in tokens
    assert tokens["access_token"] != tokens["refresh_token"]


def test_refresh_token():
    tokens = TokenService.get_token_pair("test@example.com")
    refresh_token = tokens["refresh_token"]

    new_tokens = TokenService.refresh_token(refresh_token)
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens


def test_token_expiration():
    token = TokenService.create_token("test@example.com", 0)
    with pytest.raises(ValueError):
        TokenService.decode_token(token)
