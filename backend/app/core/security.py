"""Authentication helpers: verify a Supabase access token -> current user."""
from __future__ import annotations

import time
from dataclasses import dataclass

from app.core.errors import AuthError
from app.core.supabase_client import get_anon_client


@dataclass(frozen=True)
class CurrentUser:
    id: str
    email: str | None


# A short-lived cache of verified tokens. Verifying every request against
# Supabase GoTrue (auth.get_user) is a network round-trip and can be rate-limited
# under bursts (a dashboard load fires many requests, doubled by React
# StrictMode in dev), which surfaced as intermittent 401s. Caching the result for
# a few seconds collapses those bursts into a single verification per token.
_CACHE: dict[str, tuple[CurrentUser, float]] = {}
_CACHE_TTL = 30.0  # seconds
_CACHE_MAX = 512


def verify_token(access_token: str) -> CurrentUser:
    """Validate a Supabase JWT and return the authenticated user.

    Uses Supabase's GoTrue endpoint (auth.get_user) so we never have to manage
    the JWT signing secret ourselves, with a short TTL cache for resilience.
    """
    if not access_token:
        raise AuthError("Missing access token.")

    now = time.monotonic()
    cached = _CACHE.get(access_token)
    if cached and cached[1] > now:
        return cached[0]

    try:
        client = get_anon_client()
        response = client.auth.get_user(access_token)
    except Exception as exc:  # network / gotrue transient failure
        if cached:  # tolerate transient failures with a recently-valid identity
            return cached[0]
        raise AuthError("Could not verify access token.") from exc

    user = getattr(response, "user", None)
    if user is None or not getattr(user, "id", None):
        raise AuthError("Invalid or expired access token.")

    current = CurrentUser(id=str(user.id), email=getattr(user, "email", None))
    if len(_CACHE) > _CACHE_MAX:
        _CACHE.clear()
    _CACHE[access_token] = (current, now + _CACHE_TTL)
    return current
