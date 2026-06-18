"""FastAPI dependencies: current user + AI provider."""
from __future__ import annotations

from fastapi import Header

from app.core.security import CurrentUser, verify_token
from app.services.ai.base import AIProvider
from app.services.ai.factory import get_ai_provider


def get_current_user(authorization: str = Header(default="")) -> CurrentUser:
    token = ""
    if authorization:
        token = authorization[7:].strip() if authorization.lower().startswith(
            "bearer "
        ) else authorization.strip()
    return verify_token(token)


def ai_provider() -> AIProvider:
    return get_ai_provider()
