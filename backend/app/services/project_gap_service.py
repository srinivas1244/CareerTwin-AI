"""Project Gap Detector: deterministic gap identification + AI recommendations.

Which of the target role's recommended projects are missing is decided
deterministically (app.domain.project_gaps). The AI only expands each gap into a
rich, role-grounded recommendation.
"""
from __future__ import annotations

import logging

from app.core.errors import ValidationFailed
from app.domain.project_gaps import identify_missing_projects
from app.domain.role_profiles import get_profile, label_for, match_role
from app.repositories.career_profile_repo import CareerProfileRepository
from app.repositories.project_gap_repo import ProjectGapRepository
from app.schemas.ai_models import ProjectGapList
from app.services.ai.base import AIProvider
from app.services.ai.prompts import GAP_SYSTEM, gap_user_prompt

logger = logging.getLogger(__name__)


class ProjectGapService:
    def __init__(
        self,
        ai: AIProvider | None = None,
        profile_repo: CareerProfileRepository | None = None,
        gap_repo: ProjectGapRepository | None = None,
    ) -> None:
        self.ai = ai
        self.profile_repo = profile_repo or CareerProfileRepository()
        self.gap_repo = gap_repo or ProjectGapRepository()

    def detect_and_store(self, user_id: str) -> dict:
        profile = self.profile_repo.get(user_id)
        if not profile:
            raise ValidationFailed(
                "Generate your Career Twin before detecting project gaps."
            )

        role_key = profile.get("target_role") or match_role(profile.get("inferred_role"))
        role = get_profile(role_key)
        current_projects = profile.get("projects") or []
        skills = list(profile.get("skills") or []) + list(
            profile.get("technologies") or []
        )

        missing_seeds = identify_missing_projects(
            role.recommended_projects, current_projects
        )
        current_names = [str(p.get("name", "")) for p in current_projects if p.get("name")]

        if self.ai is None:
            raise ValidationFailed("AI provider is not configured.")
        result: ProjectGapList = self.ai.complete_json(
            system=GAP_SYSTEM,
            user=gap_user_prompt(role.label, current_names, skills, missing_seeds),
            schema=ProjectGapList,
        )
        projects = [p.model_dump() for p in result.projects]

        self.gap_repo.create(user_id, {
            "target_role": role_key,
            "gaps": {"projects": projects, "missing_seeds": missing_seeds},
        })

        return {
            "target_role": role_key,
            "target_role_label": role.label,
            "missing_count": len(missing_seeds),
            "projects": projects,
        }

    def get_latest(self, user_id: str) -> dict | None:
        row = self.gap_repo.get_latest(user_id)
        if not row:
            return None
        gaps = row.get("gaps") or {}
        role_key = row.get("target_role")
        return {
            "target_role": role_key,
            "target_role_label": label_for(role_key),
            "missing_count": len(gaps.get("missing_seeds", [])),
            "projects": gaps.get("projects", []),
        }
