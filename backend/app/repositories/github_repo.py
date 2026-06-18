"""Persistence for the per-user GitHub snapshot."""
from __future__ import annotations

from app.repositories.base import SupabaseRepository


class GithubRepository(SupabaseRepository):
    table_name = "github_profiles"

    def upsert(self, user_id: str, data: dict) -> dict:
        row = {"user_id": user_id, **data}
        return self._first(
            self.table.upsert(row, on_conflict="user_id").execute()
        ) or row

    def get(self, user_id: str) -> dict | None:
        return self._first(
            self.table.select("*").eq("user_id", user_id).limit(1).execute()
        )
