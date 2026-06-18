"""Provider-agnostic AI interface.

Routes and feature services depend on `AIProvider`, never on a concrete vendor
SDK. Adding Gemini / OpenAI / Claude later means implementing this interface — no
changes to callers.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Iterator
from typing import TypeVar

from pydantic import BaseModel

TModel = TypeVar("TModel", bound=BaseModel)


class AIProvider(ABC):
    @abstractmethod
    def complete_json(
        self,
        *,
        system: str,
        user: str,
        schema: type[TModel],
        max_retries: int = 2,
    ) -> TModel:
        """Return a validated instance of `schema`, retrying malformed output."""

    @abstractmethod
    def complete_text(self, *, system: str, user: str) -> str:
        """Return a plain-text completion."""

    @abstractmethod
    def stream_chat(self, *, messages: list[dict]) -> Iterator[str]:
        """Stream a multi-turn chat completion as text chunks."""
