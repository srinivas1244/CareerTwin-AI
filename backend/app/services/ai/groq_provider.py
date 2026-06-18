"""Groq implementation of AIProvider.

- Forces JSON output (`response_format={"type": "json_object"}`).
- Validates every response against the caller's Pydantic schema.
- On malformed / invalid JSON, retries with a repair instruction, then falls
  back from the primary model to the smaller/faster fallback model.
"""
from __future__ import annotations

import json
import logging
from collections.abc import Iterator

from groq import Groq
from pydantic import BaseModel, ValidationError

from app.core.config import settings
from app.core.errors import AIResponseError, NotConfiguredError, UpstreamError
from app.services.ai.base import AIProvider, TModel

logger = logging.getLogger(__name__)


def _extract_json(text: str) -> str:
    """Best-effort isolation of a JSON object from a model response."""
    t = text.strip()
    if t.startswith("```"):
        t = t.strip("`")
        if t[:4].lower() == "json":
            t = t[4:]
        t = t.strip()
    start, end = t.find("{"), t.rfind("}")
    if start != -1 and end != -1 and end > start:
        return t[start : end + 1]
    return t


class GroqProvider(AIProvider):
    def __init__(self) -> None:
        if not settings.ai_configured:
            raise NotConfiguredError(
                "Groq is not configured. Set GROQ_API_KEY in backend/.env."
            )
        self._client = Groq(api_key=settings.groq_api_key)
        self._primary = settings.groq_primary_model
        self._fallback = settings.groq_fallback_model

    # -- public ------------------------------------------------------------
    def complete_json(
        self,
        *,
        system: str,
        user: str,
        schema: type[TModel],
        max_retries: int = 2,
    ) -> TModel:
        models = [self._primary, self._fallback]
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ]
        last_error: Exception | None = None

        for model in models:
            for attempt in range(max_retries + 1):
                try:
                    raw = self._raw_completion(model, messages, json_mode=True)
                    payload = json.loads(_extract_json(raw))
                    return schema.model_validate(payload)
                except (json.JSONDecodeError, ValidationError) as exc:
                    last_error = exc
                    logger.warning(
                        "AI JSON validation failed (model=%s attempt=%s): %s",
                        model, attempt, exc,
                    )
                    messages.append({
                        "role": "user",
                        "content": (
                            "Your previous response was not valid JSON matching the "
                            "required schema. Respond again with ONLY a single valid "
                            "JSON object, no prose, no code fences. Error: "
                            f"{str(exc)[:300]}"
                        ),
                    })
                except Exception as exc:  # network / API error -> try fallback model
                    last_error = exc
                    logger.warning("AI call failed (model=%s): %s", model, exc)
                    break  # move to next model

        raise AIResponseError(
            "The AI provider did not return valid structured output."
        ) from last_error

    def complete_text(self, *, system: str, user: str) -> str:
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ]
        try:
            return self._raw_completion(self._primary, messages, json_mode=False)
        except Exception:
            return self._raw_completion(self._fallback, messages, json_mode=False)

    def stream_chat(self, *, messages: list[dict]) -> Iterator[str]:
        last_error: Exception | None = None
        for model in (self._primary, self._fallback):
            produced = False
            try:
                stream = self._client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.4,
                    stream=True,
                )
                for chunk in stream:
                    delta = chunk.choices[0].delta.content
                    if delta:
                        produced = True
                        yield delta
                return
            except Exception as exc:
                last_error = exc
                logger.warning("AI stream failed (model=%s): %s", model, exc)
                if produced:
                    return  # don't restart a partially-streamed reply
                continue
        raise UpstreamError("The AI provider could not stream a reply.") from last_error

    # -- internal ----------------------------------------------------------
    def _raw_completion(
        self, model: str, messages: list[dict], *, json_mode: bool
    ) -> str:
        kwargs: dict = {
            "model": model,
            "messages": messages,
            "temperature": 0.2,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        completion = self._client.chat.completions.create(**kwargs)
        return completion.choices[0].message.content or ""
