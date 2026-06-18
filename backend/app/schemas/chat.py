"""Career Twin Chat API contracts."""
from __future__ import annotations

from pydantic import BaseModel, field_validator


class ConversationItem(BaseModel):
    id: str
    title: str
    created_at: str | None = None
    updated_at: str | None = None


class MessageItem(BaseModel):
    id: str
    role: str
    content: str
    created_at: str | None = None


class ChatStreamRequest(BaseModel):
    message: str

    @field_validator("message")
    @classmethod
    def non_empty(cls, v: str) -> str:
        v = (v or "").strip()
        if not v:
            raise ValueError("Message cannot be empty.")
        return v[:4000]
