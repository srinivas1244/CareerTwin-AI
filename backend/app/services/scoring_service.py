"""Hiring Score service: deterministic compute + AI explanation + persistence.

The number is produced ONLY by app.domain.scoring. The AI is asked solely to
explain the already-final result.
"""
from __future__ import annotations

import logging

from dataclasses import replace

from app.domain.role_profiles import ROLE_PROFILES, label_for, match_role
from app.domain.scoring import ScoringInput, compute_hiring_score
from app.repositories.career_profile_repo import CareerProfileRepository
from app.repositories.career_score_repo import CareerScoreRepository
from app.repositories.github_repo import GithubRepository
from app.repositories.resume_repo import ResumeRepository
from app.schemas.ai_models import ScoreExplanation
from app.services.ai.base import AIProvider
from app.services.ai.prompts import SCORE_SYSTEM, score_user_prompt
from app.services.resume_service import compute_quality_signals
from app.core.errors import ValidationFailed

logger = logging.getLogger(__name__)


def build_scoring_input(
    profile: dict, gh: dict | None, resume: dict | None
) -> ScoringInput:
    """Assemble the deterministic scoring input from stored records.

    Shared by the Hiring Score and the Career Simulator so both score the exact
    same way.
    """
    role_key = profile.get("target_role") or match_role(profile.get("inferred_role"))
    quality = compute_quality_signals(resume["raw_text"] if resume else "")
    return ScoringInput(
        role_key=role_key,
        skills=list(profile.get("skills") or []),
        technologies=list(profile.get("technologies") or []),
        projects=list(profile.get("projects") or []),
        certifications=list(profile.get("certifications") or []),
        github_strength_score=(gh or {}).get("github_strength_score", 0),
        resume_quality=quality,
    )


class ScoringService:
    def __init__(
        self,
        ai: AIProvider | None = None,
        profile_repo: CareerProfileRepository | None = None,
        github_repo: GithubRepository | None = None,
        resume_repo: ResumeRepository | None = None,
        score_repo: CareerScoreRepository | None = None,
    ) -> None:
        self.ai = ai
        self.profile_repo = profile_repo or CareerProfileRepository()
        self.github_repo = github_repo or GithubRepository()
        self.resume_repo = resume_repo or ResumeRepository()
        self.score_repo = score_repo or CareerScoreRepository()

    def compute_and_store(self, user_id: str) -> dict:
        profile = self.profile_repo.get(user_id)
        if not profile:
            raise ValidationFailed(
                "Generate your Career Twin before computing the Hiring Score."
            )

        gh = self.github_repo.get(user_id)
        resume = self.resume_repo.get_latest(user_id)

        inp = build_scoring_input(profile, gh, resume)
        result = compute_hiring_score(inp)

        breakdown = [
            {
                "key": c.key,
                "label": c.label,
                "score": c.score,
                "weight": c.weight,
                "weighted": c.weighted,
                "details": c.details,
            }
            for c in result.breakdown
        ]
        role_label = label_for(result.role_key)
        explanation = self._explain(role_label, result.hiring_score, breakdown)

        self.score_repo.create(user_id, {
            "hiring_score": result.hiring_score,
            "breakdown": {"categories": breakdown},
            "explanation": explanation.summary,
            "role": result.role_key,
        })

        return {
            "hiring_score": result.hiring_score,
            "role": result.role_key,
            "role_label": role_label,
            "breakdown": breakdown,
            "explanation": explanation.model_dump(),
        }

    def get_role_matches(self, user_id: str, top_n: int = 5) -> dict:
        """Deterministically score the profile against every curated role."""
        profile = self.profile_repo.get(user_id)
        if not profile:
            raise ValidationFailed("Generate your Career Twin first.")
        gh = self.github_repo.get(user_id)
        resume = self.resume_repo.get_latest(user_id)
        base = build_scoring_input(profile, gh, resume)
        target = base.role_key

        results = [
            {
                "role": key,
                "label": label_for(key),
                "score": compute_hiring_score(replace(base, role_key=key)).hiring_score,
            }
            for key in ROLE_PROFILES
        ]
        results.sort(key=lambda r: -r["score"])
        top = results[:top_n]
        if not any(r["role"] == target for r in top):
            target_row = next((r for r in results if r["role"] == target), None)
            if target_row:
                top = top[: top_n - 1] + [target_row]
        return {
            "target_role": target,
            "target_role_label": label_for(target),
            "matches": top,
        }

    def get_latest(self, user_id: str) -> dict | None:
        row = self.score_repo.get_latest(user_id)
        if not row:
            return None
        return {
            "hiring_score": row.get("hiring_score", 0),
            "role": row.get("role"),
            "role_label": label_for(row.get("role")),
            "breakdown": (row.get("breakdown") or {}).get("categories", []),
            "explanation": {"summary": row.get("explanation") or "",
                            "strengths": [], "improvements": []},
        }

    def _explain(
        self, role_label: str, hiring_score: int, breakdown: list[dict]
    ) -> ScoreExplanation:
        try:
            return self.ai.complete_json(
                system=SCORE_SYSTEM,
                user=score_user_prompt(role_label, hiring_score, breakdown),
                schema=ScoreExplanation,
            )
        except Exception as exc:  # never let explanation failure block the score
            logger.warning("Score explanation failed: %s", exc)
            return ScoreExplanation(
                summary=(
                    f"Your Hiring Score for {role_label} is {hiring_score}/100, "
                    "based on your skills, projects, GitHub activity, certifications, "
                    "and resume quality."
                ),
                strengths=[],
                improvements=[],
            )
