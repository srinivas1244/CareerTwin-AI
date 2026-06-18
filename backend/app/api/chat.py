"""Career Twin Chat endpoints: conversations, messages, streaming reply."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse

from app.api.deps import ai_provider, get_current_user
from app.core.rate_limit import limiter
from app.core.security import CurrentUser
from app.schemas.chat import ChatStreamRequest, ConversationItem, MessageItem
from app.services.ai.base import AIProvider
from app.services.chat_service import ChatService

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.get("/conversations", response_model=list[ConversationItem])
def list_conversations(user: CurrentUser = Depends(get_current_user)):
    return ChatService().list_conversations(user.id)


@router.post("/conversations", response_model=ConversationItem)
def create_conversation(user: CurrentUser = Depends(get_current_user)):
    return ChatService().create_conversation(user.id)


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[MessageItem],
)
def get_messages(
    conversation_id: str, user: CurrentUser = Depends(get_current_user)
):
    return ChatService().get_messages(user.id, conversation_id)


@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str, user: CurrentUser = Depends(get_current_user)
) -> dict:
    ChatService().delete_conversation(user.id, conversation_id)
    return {"ok": True}


@router.post("/conversations/{conversation_id}/stream")
@limiter.limit("20/minute")
def stream_reply(
    request: Request,
    conversation_id: str,
    payload: ChatStreamRequest,
    user: CurrentUser = Depends(get_current_user),
    ai: AIProvider = Depends(ai_provider),
) -> StreamingResponse:
    # stream_reply() validates ownership + persists the user message eagerly
    # (raising before streaming starts), then returns the streaming generator.
    generator = ChatService(ai).stream_reply(user.id, conversation_id, payload.message)
    return StreamingResponse(generator, media_type="text/plain; charset=utf-8")
