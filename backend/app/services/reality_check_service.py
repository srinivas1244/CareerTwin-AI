"""Resume Reality Check service: deterministic credibility + AI explanation.

The credibility score and per-skill evidence levels come ONLY from
app.domain.credibility. The AI is asked solely to explain the final result.
"""
from __future__ import annotations

import logging

from app.core.errors import ValidationFailed
from app.domain.credibility import RepoEvidence, compute_credibility
from app.repositories.career_profile_repo import CareerProfileRepository
from app.repositories.credibility_repo import CredibilityRepository
from app.repositories.github_repo import GithubRepository
from app.schemas.ai_models import ScoreExplanation
from app.services.ai.base import AIProvider
from app.services.ai.prompts import REALITY_SYSTEM, reality_user_prompt

logger = logging.getLogger(__name__)


class RealityCheckService:
    def __init__(
        self,
        ai: AIProvider | None = None,
        profile_repo: CareerProfileRepository | None = None,
        github_repo: GithubRepository | None = None,
        credibility_repo: CredibilityRepository | None = None,
    ) -> None:
        self.ai = ai
        self.profile_repo = profile_repo or CareerProfileRepository()
        self.github_repo = github_repo or GithubRepository()
        self.credibility_repo = credibility_repo or CredibilityRepository()

    def compute_and_store(self, user_id: str) -> dict:
        profile = self.profile_repo.get(user_id)
        if not profile:
            raise ValidationFailed(
                "Generate your Career Twin before running the Reality Check."
            )
        gh = self.github_repo.get(user_id)
        if not gh:
            raise ValidationFailed(
                "Connect GitHub to run the Resume Reality Check — it needs evidence "
                "of your actual work."
            )

        claimed = list(profile.get("skills") or []) + list(
            profile.get("technologies") or []
        )
        repos = [
            RepoEvidence(
                name=r.get("name", ""),
                description=r.get("description") or "",
                language=r.get("language"),
                topics=r.get("topics") or [],
            )
            for r in (gh.get("raw_json") or {}).get("top_repos", [])
        ]
        languages = gh.get("languages") or {}

        result = compute_credibility(claimed, repos, languages)
        evidence = [
            {
                "skill": e.skill,
                "level": e.level,
                "evidence_score": e.evidence_score,
                "signals": e.signals,
            }
            for e in result.evidence
        ]
        explanation = self._explain(result.credibility_score, result.counts, evidence)

        self.credibility_repo.create(user_id, {
            "credibility_score": result.credibility_score,
            "evidence": {"items": evidence, "counts": result.counts},
            "explanation": explanation.summary,
        })

        return {
            "credibility_score": result.credibility_score,
            "counts": result.counts,
            "evidence": evidence,
            "explanation": explanation.model_dump(),
        }

    def get_latest(self, user_id: str) -> dict | None:
        row = self.credibility_repo.get_latest(user_id)
        if not row:
            return None
        ev = row.get("evidence") or {}
        return {
            "credibility_score": row.get("credibility_score", 0),
            "counts": ev.get("counts", {}),
            "evidence": ev.get("items", []),
            "explanation": {
                "summary": row.get("explanation") or "",
                "strengths": [],
                "improvements": [],
            },
        }

    def _explain(
        self, credibility_score: int, counts: dict, evidence: list[dict]
    ) -> ScoreExplanation:
        try:
            return self.ai.complete_json(
                system=REALITY_SYSTEM,
                user=reality_user_prompt(credibility_score, counts, evidence),
                schema=ScoreExplanation,
            )
        except Exception as exc:  # never let explanation failure block the result
            logger.warning("Reality check explanation failed: %s", exc)
            strong = counts.get("Strong", 0) + counts.get("Medium", 0)
            total = sum(counts.values()) or 1
            return ScoreExplanation(
                summary=(
                    f"Your resume credibility is {credibility_score}/100. "
                    f"{strong} of {total} claimed skills show real GitHub evidence."
                ),
                strengths=[],
                improvements=[],
            )
