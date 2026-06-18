"""Career Twin: AI extraction from resume + GitHub, persisted per user."""
from __future__ import annotations

from app.core.errors import ValidationFailed
from app.domain.role_profiles import get_profile, label_for, list_roles, match_role
from app.repositories.career_profile_repo import CareerProfileRepository
from app.repositories.github_repo import GithubRepository
from app.repositories.resume_repo import ResumeRepository
from app.services.ai.base import AIProvider
from app.services.ai.prompts import TWIN_SYSTEM, twin_user_prompt
from app.services.github_service import summary_from_record
from app.schemas.ai_models import TwinExtraction


class CareerTwinService:
    def __init__(
        self,
        ai: AIProvider | None = None,
        resume_repo: ResumeRepository | None = None,
        github_repo: GithubRepository | None = None,
        profile_repo: CareerProfileRepository | None = None,
    ) -> None:
        # `ai` is only required by generate(); get()/update_role() work without it.
        self.ai = ai
        self.resume_repo = resume_repo or ResumeRepository()
        self.github_repo = github_repo or GithubRepository()
        self.profile_repo = profile_repo or CareerProfileRepository()

    def generate(self, user_id: str) -> dict:
        resume = self.resume_repo.get_latest(user_id)
        if not resume or not (resume.get("raw_text") or "").strip():
            raise ValidationFailed("Upload a resume before generating your Career Twin.")

        gh = self.github_repo.get(user_id)
        github_summary = summary_from_record(gh) if gh else "No GitHub connected."

        if self.ai is None:
            raise ValidationFailed("AI provider is not configured.")
        extraction: TwinExtraction = self.ai.complete_json(
            system=TWIN_SYSTEM,
            user=twin_user_prompt(resume["raw_text"], github_summary),
            schema=TwinExtraction,
        )

        target_role = match_role(extraction.inferred_role)
        record = {
            "skills": extraction.skills,
            "technologies": extraction.technologies,
            "certifications": [c.model_dump() for c in extraction.certifications],
            "projects": [p.model_dump() for p in extraction.projects],
            "experience": [e.model_dump() for e in extraction.experience],
            "education": [e.model_dump() for e in extraction.education],
            "inferred_role": extraction.inferred_role,
            "target_role": target_role,
            "career_goal": extraction.career_goal,
            "summary": extraction.summary,
        }
        return self.profile_repo.upsert(user_id, record)

    def get(self, user_id: str) -> dict | None:
        return self.profile_repo.get(user_id)

    def update_role(self, user_id: str, target_role: str) -> dict:
        role_key = match_role(target_role)
        updated = self.profile_repo.update_role(user_id, role_key)
        if not updated:
            raise ValidationFailed("No Career Twin found to update.")
        return updated


def to_profile_response(record: dict) -> dict:
    """Shape a career_profiles row into the API response (adds role options/label)."""
    target_role = record.get("target_role") or match_role(record.get("inferred_role"))
    return {
        "skills": record.get("skills") or [],
        "technologies": record.get("technologies") or [],
        "certifications": record.get("certifications") or [],
        "projects": record.get("projects") or [],
        "experience": record.get("experience") or [],
        "education": record.get("education") or [],
        "inferred_role": record.get("inferred_role"),
        "target_role": target_role,
        "target_role_label": label_for(target_role),
        "career_goal": record.get("career_goal"),
        "summary": record.get("summary"),
        "role_options": list_roles(),
    }
