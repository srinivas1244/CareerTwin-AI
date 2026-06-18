"""Persistence for Career Twin Chat (conversations + chat_messages)."""
from __future__ import annotations

from datetime import datetime, timezone

from app.repositories.base import SupabaseRepository


class ConversationRepository(SupabaseRepository):
    table_name = "conversations"

    def create(self, user_id: str, title: str = "New chat") -> dict:
        row = {"user_id": user_id, "title": title}
        return self._first(self.table.insert(row).execute()) or row

    def list_for_user(self, user_id: str) -> list[dict]:
        resp = (
            self.table.select("*")
            .eq("user_id", user_id)
            .order("updated_at", desc=True)
            .execute()
        )
        return getattr(resp, "data", None) or []

    def get(self, user_id: str, conversation_id: str) -> dict | None:
        return self._first(
            self.table.select("*")
            .eq("id", conversation_id)
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )

    def update_title(self, conversation_id: str, title: str) -> None:
        self.table.update({"title": title}).eq("id", conversation_id).execute()

    def touch(self, conversation_id: str) -> None:
        # bump updated_at so the conversation sorts to the top of the list
        # (the set_updated_at trigger also resets this to now())
        self.table.update(
            {"updated_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", conversation_id).execute()

    def delete(self, user_id: str, conversation_id: str) -> None:
        self.table.delete().eq("id", conversation_id).eq(
            "user_id", user_id
        ).execute()


class ChatMessageRepository(SupabaseRepository):
    table_name = "chat_messages"

    def add(self, user_id: str, conversation_id: str, role: str, content: str) -> dict:
        row = {
            "user_id": user_id,
            "conversation_id": conversation_id,
            "role": role,
            "content": content,
        }
        return self._first(self.table.insert(row).execute()) or row

    def list_for_conversation(self, conversation_id: str) -> list[dict]:
        resp = (
            self.table.select("*")
            .eq("conversation_id", conversation_id)
            .order("created_at", desc=False)
            .execute()
        )
        return getattr(resp, "data", None) or []
