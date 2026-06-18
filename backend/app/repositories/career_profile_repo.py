"""Persistence for the Career Twin (career_profiles, one per user)."""
from __future__ import annotations

from app.repositories.base import SupabaseRepository


class CareerProfileRepository(SupabaseRepository):
    table_name = "career_profiles"

    def upsert(self, user_id: str, data: dict) -> dict:
        row = {"user_id": user_id, **data}
        return self._first(
            self.table.upsert(row, on_conflict="user_id").execute()
        ) or row

    def get(self, user_id: str) -> dict | None:
        return self._first(
            self.table.select("*").eq("user_id", user_id).limit(1).execute()
        )

    def update_role(self, user_id: str, target_role: str) -> dict | None:
        return self._first(
            self.table.update({"target_role": target_role})
            .eq("user_id", user_id)
            .execute()
        )
