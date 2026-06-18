"""Domain-level exceptions surfaced as clean HTTP errors."""
from __future__ import annotations


class AppError(Exception):
    """Base class for expected, user-facing errors."""

    status_code: int = 400

    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code


class NotConfiguredError(AppError):
    """A required external service (Supabase / Groq) is not configured."""

    status_code = 503


class AuthError(AppError):
    status_code = 401


class NotFoundError(AppError):
    status_code = 404


class ValidationFailed(AppError):
    status_code = 422


class UpstreamError(AppError):
    """An upstream provider (GitHub, Groq, Supabase) failed."""

    status_code = 502


class AIResponseError(UpstreamError):
    """The AI provider returned output we could not validate after retries."""
