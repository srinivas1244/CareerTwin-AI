"""Career Simulator service: deterministic what-if scoring + AI roadmap narrative.

All scores come ONLY from app.domain.simulator (which re-runs the deterministic
Hiring Score engine). The AI only narrates the roadmap.
"""
from __future__ import annotations

import logging

from app.core.errors import ValidationFailed
from app.domain.role_profiles import label_for
from app.domain.scoring import ScoringInput
from app.domain.simulator import candidate_actions, simulate, whatif
from app.repositories.career_profile_repo import CareerProfileRepository
from app.repositories.github_repo import GithubRepository
from app.repositories.resume_repo import ResumeRepository
from app.repositories.simulation_repo import SimulationRepository
from app.schemas.ai_models import ScoreExplanation
from app.services.ai.base import AIProvider
from app.services.ai.prompts import SIM_SYSTEM, sim_user_prompt
from app.services.scoring_service import build_scoring_input

logger = logging.getLogger(__name__)


def _step_dict(s) -> dict:
    return {
        "action_type": s.action_type,
        "label": s.label,
        "target": s.target,
        "projected_score": s.projected_score,
        "delta": s.delta,
    }


class SimulatorService:
    def __init__(
        self,
        ai: AIProvider | None = None,
        profile_repo: CareerProfileRepository | None = None,
        github_repo: GithubRepository | None = None,
        resume_repo: ResumeRepository | None = None,
        sim_repo: SimulationRepository | None = None,
    ) -> None:
        self.ai = ai
        self.profile_repo = profile_repo or CareerProfileRepository()
        self.github_repo = github_repo or GithubRepository()
        self.resume_repo = resume_repo or ResumeRepository()
        self.sim_repo = sim_repo or SimulationRepository()

    def simulate_and_store(self, user_id: str) -> dict:
        profile = self.profile_repo.get(user_id)
        if not profile:
            raise ValidationFailed(
                "Generate your Career Twin before running the simulator."
            )
        gh = self.github_repo.get(user_id)
        resume = self.resume_repo.get_latest(user_id)

        base_input = build_scoring_input(profile, gh, resume)
        result = simulate(base_input)

        scenarios = [_step_dict(s) for s in result.scenarios]
        roadmap = [_step_dict(s) for s in result.roadmap]
        role_label = label_for(base_input.role_key)
        explanation = self._explain(
            role_label, result.base_score, result.roadmap_final_score, roadmap
        )

        self.sim_repo.create(user_id, {
            "base_score": result.base_score,
            "scenarios": scenarios,
            "roadmap": {
                "steps": roadmap,
                "final_score": result.roadmap_final_score,
                "explanation": explanation.model_dump(),
            },
        })

        return {
            "base_score": result.base_score,
            "scenarios": scenarios,
            "roadmap": roadmap,
            "roadmap_final_score": result.roadmap_final_score,
            "explanation": explanation.model_dump(),
        }

    def _base_input(self, user_id: str) -> ScoringInput:
        profile = self.profile_repo.get(user_id)
        if not profile:
            raise ValidationFailed("Generate your Career Twin first.")
        gh = self.github_repo.get(user_id)
        resume = self.resume_repo.get_latest(user_id)
        return build_scoring_input(profile, gh, resume)

    def whatif_actions(self, user_id: str) -> dict:
        base_input = self._base_input(user_id)
        actions = candidate_actions(base_input)
        return {
            "base_score": whatif(base_input, [])["base_score"],
            "actions": [
                {
                    "id": a.id,
                    "action_type": a.action_type,
                    "label": a.label,
                    "delta": a.delta,
                }
                for a in actions
            ],
        }

    def what_if(self, user_id: str, action_ids: list[str]) -> dict:
        return whatif(self._base_input(user_id), action_ids)

    def get_latest(self, user_id: str) -> dict | None:
        row = self.sim_repo.get_latest(user_id)
        if not row:
            return None
        roadmap_blob = row.get("roadmap") or {}
        return {
            "base_score": row.get("base_score", 0),
            "scenarios": row.get("scenarios") or [],
            "roadmap": roadmap_blob.get("steps", []),
            "roadmap_final_score": roadmap_blob.get("final_score", row.get("base_score", 0)),
            "explanation": roadmap_blob.get("explanation")
            or {"summary": "", "strengths": [], "improvements": []},
        }

    def _explain(
        self, role_label: str, base_score: int, final_score: int, roadmap: list[dict]
    ) -> ScoreExplanation:
        try:
            return self.ai.complete_json(
                system=SIM_SYSTEM,
                user=sim_user_prompt(role_label, base_score, final_score, roadmap),
                schema=ScoreExplanation,
            )
        except Exception as exc:  # never let narrative failure block the simulation
            logger.warning("Simulator narrative failed: %s", exc)
            gain = final_score - base_score
            return ScoreExplanation(
                summary=(
                    f"Following this roadmap could raise your Hiring Score from "
                    f"{base_score} to {final_score}/100 (+{gain}) for {role_label}."
                ),
                strengths=[],
                improvements=[],
            )
