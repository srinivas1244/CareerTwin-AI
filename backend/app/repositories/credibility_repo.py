"""Persistence for Resume Reality Check results (credibility_scores)."""
from __future__ import annotations

from app.repositories.base import SupabaseRepository


class CredibilityRepository(SupabaseRepository):
    table_name = "credibility_scores"

    def create(self, user_id: str, data: dict) -> dict:
        row = {"user_id": user_id, **data}
        return self._first(self.table.insert(row).execute()) or row

    def get_latest(self, user_id: str) -> dict | None:
        return self._first(
            self.table.select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
