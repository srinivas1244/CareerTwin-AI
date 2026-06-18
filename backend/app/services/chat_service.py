"""Career Twin Chat: streaming, twin-grounded career advisor."""
from __future__ import annotations

import logging
from collections.abc import Iterator

from app.core.errors import NotFoundError
from app.domain.role_profiles import label_for
from app.repositories.career_profile_repo import CareerProfileRepository
from app.repositories.career_score_repo import CareerScoreRepository
from app.repositories.chat_repo import ChatMessageRepository, ConversationRepository
from app.repositories.credibility_repo import CredibilityRepository
from app.repositories.github_repo import GithubRepository
from app.repositories.project_gap_repo import ProjectGapRepository
from app.repositories.simulation_repo import SimulationRepository
from app.services.ai.base import AIProvider

logger = logging.getLogger(__name__)

CHAT_SYSTEM_BASE = (
    "You are CareerTwin, a sharp, encouraging career advisor for students and early-"
    "career engineers. You have the user's Career Twin below. Use it to give specific, "
    "personalized, actionable advice about their employability, skills, projects, "
    "certifications, and target role. The scores were computed by a deterministic "
    "engine — you may reference and explain them, but never invent or change numbers. "
    "Keep replies concise, warm, and practical (use short paragraphs or bullets). If "
    "asked something unrelated to careers, skills, or job prep, gently steer back."
)

HISTORY_LIMIT = 12


class ChatService:
    def __init__(
        self,
        ai: AIProvider | None = None,
        conversation_repo: ConversationRepository | None = None,
        message_repo: ChatMessageRepository | None = None,
    ) -> None:
        self.ai = ai
        self.conversation_repo = conversation_repo or ConversationRepository()
        self.message_repo = message_repo or ChatMessageRepository()
        self.profile_repo = CareerProfileRepository()
        self.score_repo = CareerScoreRepository()
        self.credibility_repo = CredibilityRepository()
        self.gap_repo = ProjectGapRepository()
        self.sim_repo = SimulationRepository()
        self.github_repo = GithubRepository()

    # -- conversations -----------------------------------------------------
    def list_conversations(self, user_id: str) -> list[dict]:
        return self.conversation_repo.list_for_user(user_id)

    def create_conversation(self, user_id: str) -> dict:
        return self.conversation_repo.create(user_id)

    def get_messages(self, user_id: str, conversation_id: str) -> list[dict]:
        conv = self.conversation_repo.get(user_id, conversation_id)
        if not conv:
            raise NotFoundError("Conversation not found.")
        return self.message_repo.list_for_conversation(conversation_id)

    def delete_conversation(self, user_id: str, conversation_id: str) -> None:
        self.conversation_repo.delete(user_id, conversation_id)

    # -- streaming reply ---------------------------------------------------
    def stream_reply(
        self, user_id: str, conversation_id: str, user_message: str
    ) -> Iterator[str]:
        conv = self.conversation_repo.get(user_id, conversation_id)
        if not conv:
            raise NotFoundError("Conversation not found.")

        self.message_repo.add(user_id, conversation_id, "user", user_message)
        if (conv.get("title") or "New chat") == "New chat":
            self.conversation_repo.update_title(
                conversation_id, _derive_title(user_message)
            )
        else:
            self.conversation_repo.touch(conversation_id)

        history = self.message_repo.list_for_conversation(conversation_id)
        system = CHAT_SYSTEM_BASE + "\n\n" + self.build_context(user_id)
        messages = [{"role": "system", "content": system}]
        for m in history[-HISTORY_LIMIT:]:
            messages.append({"role": m["role"], "content": m["content"]})

        return self._generate(user_id, conversation_id, messages)

    def _generate(
        self, user_id: str, conversation_id: str, messages: list[dict]
    ) -> Iterator[str]:
        chunks: list[str] = []
        try:
            for delta in self.ai.stream_chat(messages=messages):
                chunks.append(delta)
                yield delta
        except Exception as exc:
            logger.warning("Chat stream error: %s", exc)
            fallback = "\n\n_(Sorry — I hit an error generating a reply. Please try again.)_"
            chunks.append(fallback)
            yield fallback
        finally:
            full = "".join(chunks).strip()
            if full:
                self.message_repo.add(user_id, conversation_id, "assistant", full)

    # -- grounding context -------------------------------------------------
    def build_context(self, user_id: str) -> str:
        profile = self.profile_repo.get(user_id)
        if not profile:
            return (
                "=== CAREER TWIN ===\n(Not generated yet — encourage the user to "
                "upload a resume and connect GitHub in onboarding.)"
            )

        lines = ["=== USER'S CAREER TWIN ==="]
        lines.append(f"Target role: {label_for(profile.get('target_role'))}")
        if profile.get("career_goal"):
            lines.append(f"Career goal: {profile['career_goal']}")

        skills = list(profile.get("skills") or []) + list(
            profile.get("technologies") or []
        )
        if skills:
            unique = list(dict.fromkeys(skills))
            lines.append("Skills: " + ", ".join(unique)[:1500])

        projects = [p.get("name") for p in (profile.get("projects") or []) if p.get("name")]
        if projects:
            lines.append("Projects: " + ", ".join(projects[:15]))
        certs = [
            c.get("name") for c in (profile.get("certifications") or []) if c.get("name")
        ]
        if certs:
            lines.append("Certifications: " + ", ".join(certs))

        score = self.score_repo.get_latest(user_id)
        if score:
            lines.append(f"Hiring Score: {score.get('hiring_score')}/100")
        cred = self.credibility_repo.get_latest(user_id)
        if cred:
            lines.append(f"Resume Credibility: {cred.get('credibility_score')}/100")
        gh = self.github_repo.get(user_id)
        if gh:
            lines.append(
                f"GitHub: @{gh.get('username')} · {gh.get('repo_count')} repos · "
                f"strength {gh.get('github_strength_score')}/100"
            )
        gaps = self.gap_repo.get_latest(user_id)
        if gaps:
            names = [
                p.get("name")
                for p in ((gaps.get("gaps") or {}).get("projects") or [])
                if p.get("name")
            ]
            if names:
                lines.append("Recommended project gaps: " + ", ".join(names[:5]))
        sim = self.sim_repo.get_latest(user_id)
        if sim:
            final = (sim.get("roadmap") or {}).get("final_score")
            lines.append(
                f"Simulator: base {sim.get('base_score')} -> potential {final}"
            )
        return "\n".join(lines)


def _derive_title(message: str) -> str:
    words = message.strip().split()
    title = " ".join(words[:7])
    if len(title) > 60:
        title = title[:57] + "…"
    return title or "New chat"
