"""Lazily-constructed Supabase clients.

- The *service* client uses the service-role key for DB + Storage writes. It
  bypasses RLS, so repositories MUST always scope queries by user_id.
- The *anon* client is used only to verify a user's access token.
"""
from __future__ import annotations

from functools import lru_cache

from supabase import Client, create_client

from app.core.config import settings
from app.core.errors import NotConfiguredError


@lru_cache
def get_service_client() -> Client:
    if not settings.supabase_configured:
        raise NotConfiguredError(
            "Supabase is not configured. Set SUPABASE_URL and "
            "SUPABASE_SERVICE_ROLE_KEY in backend/.env."
        )
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


@lru_cache
def get_anon_client() -> Client:
    if not (settings.supabase_url and settings.supabase_anon_key):
        raise NotConfiguredError(
            "Supabase auth is not configured. Set SUPABASE_URL and "
            "SUPABASE_ANON_KEY in backend/.env."
        )
    return create_client(settings.supabase_url, settings.supabase_anon_key)
