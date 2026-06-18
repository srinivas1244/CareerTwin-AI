"""Resolve the configured AIProvider. Swap providers here, nowhere else."""
from __future__ import annotations

from functools import lru_cache

from app.services.ai.base import AIProvider
from app.services.ai.groq_provider import GroqProvider


@lru_cache
def get_ai_provider() -> AIProvider:
    # Future: select GroqProvider / GeminiProvider / OpenAIProvider via settings.
    return GroqProvider()
