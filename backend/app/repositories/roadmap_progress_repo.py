"""Persistence for roadmap completion progress (one row per user)."""
from __future__ import annotations

from app.repositories.base import SupabaseRepository


class RoadmapProgressRepository(SupabaseRepository):
    table_name = "roadmap_progress"

    def get(self, user_id: str) -> dict | None:
        return self._first(
            self.table.select("*").eq("user_id", user_id).limit(1).execute()
        )

    def upsert(self, user_id: str, completed: list[str]) -> dict:
        row = {"user_id": user_id, "completed": completed}
        return self._first(
            self.table.upsert(row, on_conflict="user_id").execute()
        ) or row
