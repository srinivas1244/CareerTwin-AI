"""Shared repository helpers over the Supabase service client."""
from __future__ import annotations

from typing import Any

from supabase import Client

from app.core.supabase_client import get_service_client


class SupabaseRepository:
    table_name: str = ""

    def __init__(self, client: Client | None = None) -> None:
        self.client = client or get_service_client()

    @property
    def table(self):
        return self.client.table(self.table_name)

    @staticmethod
    def _first(response: Any) -> dict | None:
        data = getattr(response, "data", None)
        if isinstance(data, list):
            return data[0] if data else None
        return data
