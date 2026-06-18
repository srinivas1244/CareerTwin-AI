"""Persistence for typed recommendations (reused by the AI Career Roadmap)."""
from __future__ import annotations

from app.repositories.base import SupabaseRepository


class RecommendationRepository(SupabaseRepository):
    table_name = "recommendations"

    def create(self, user_id: str, rec_type: str, payload: dict) -> dict:
        row = {"user_id": user_id, "type": rec_type, "payload": payload}
        return self._first(self.table.insert(row).execute()) or row

    def get_latest(self, user_id: str, rec_type: str) -> dict | None:
        return self._first(
            self.table.select("*")
            .eq("user_id", user_id)
            .eq("type", rec_type)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
