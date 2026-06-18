"""AI Career Roadmap: hybrid missing skills (deterministic + goal-aware AI) +
phased learning plan."""
from __future__ import annotations

from app.core.errors import ValidationFailed
from app.domain.role_profiles import get_profile, label_for, match_role
from app.domain.scoring import _matches
from app.domain.simulator import _pretty
from app.repositories.career_profile_repo import CareerProfileRepository
from app.repositories.recommendation_repo import RecommendationRepository
from app.repositories.roadmap_progress_repo import RoadmapProgressRepository
from app.schemas.ai_models import CareerRoadmap
from app.services.ai.base import AIProvider
from app.services.ai.prompts import ROADMAP_SYSTEM, roadmap_user_prompt

ROADMAP_TYPE = "career_roadmap"


def _dedupe(items: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for s in items:
        key = (s or "").strip().lower()
        if key and key not in seen:
            seen.add(key)
            out.append(s.strip())
    return out


def deterministic_missing_skills(role_key: str, user_skills: list[str]) -> list[str]:
    """Role core skills the user does not yet have (deterministic)."""
    role = get_profile(role_key)
    return [
        _pretty(core)
        for core in role.core_skills
        if not any(_matches(s, core) for s in user_skills)
    ]


class RoadmapService:
    def __init__(
        self,
        ai: AIProvider | None = None,
        profile_repo: CareerProfileRepository | None = None,
        rec_repo: RecommendationRepository | None = None,
        progress_repo: RoadmapProgressRepository | None = None,
    ) -> None:
        self.ai = ai
        self.profile_repo = profile_repo or CareerProfileRepository()
        self.rec_repo = rec_repo or RecommendationRepository()
        self.progress_repo = progress_repo or RoadmapProgressRepository()

    def generate_and_store(self, user_id: str) -> dict:
        profile = self.profile_repo.get(user_id)
        if not profile:
            raise ValidationFailed(
                "Generate your Career Twin before building a roadmap."
            )
        if self.ai is None:
            raise ValidationFailed("AI provider is not configured.")

        role_key = profile.get("target_role") or match_role(profile.get("inferred_role"))
        role = get_profile(role_key)
        career_goal = profile.get("career_goal")
        user_skills = list(profile.get("skills") or []) + list(
            profile.get("technologies") or []
        )

        missing = deterministic_missing_skills(role_key, user_skills)

        roadmap: CareerRoadmap = self.ai.complete_json(
            system=ROADMAP_SYSTEM,
            user=roadmap_user_prompt(role.label, career_goal, user_skills, missing),
            schema=CareerRoadmap,
        )

        merged_missing = _dedupe(missing + roadmap.missing_skills)
        phases = [p.model_dump() for p in roadmap.phases]
        payload = {
            "target_role": role_key,
            "career_goal": career_goal,
            "missing_skills": merged_missing,
            "summary": roadmap.summary,
            "phases": phases,
        }
        self.rec_repo.create(user_id, ROADMAP_TYPE, payload)

        return {
            "target_role": role_key,
            "target_role_label": role.label,
            "career_goal": career_goal,
            "missing_skills": merged_missing,
            "summary": roadmap.summary,
            "phases": phases,
        }

    def get_progress(self, user_id: str) -> dict:
        row = self.progress_repo.get(user_id)
        return {"completed": (row or {}).get("completed", [])}

    def set_progress(self, user_id: str, phase: str, completed: bool) -> dict:
        row = self.progress_repo.get(user_id)
        current = list((row or {}).get("completed", []))
        if completed and phase not in current:
            current.append(phase)
        elif not completed:
            current = [c for c in current if c != phase]
        self.progress_repo.upsert(user_id, current)
        return {"completed": current}

    def get_latest(self, user_id: str) -> dict | None:
        row = self.rec_repo.get_latest(user_id, ROADMAP_TYPE)
        if not row:
            return None
        p = row.get("payload") or {}
        return {
            "target_role": p.get("target_role"),
            "target_role_label": label_for(p.get("target_role")),
            "career_goal": p.get("career_goal"),
            "missing_skills": p.get("missing_skills", []),
            "summary": p.get("summary", ""),
            "phases": p.get("phases", []),
        }
