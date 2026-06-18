"""Career Simulator — deterministic "what-if" scoring.

Instead of asking the AI to guess score impact, we re-run the real, deterministic
Hiring Score engine with hypothetical additions (learn a skill, build a project,
earn a certification, strengthen GitHub) and report the exact projected score and
delta. The AI only narrates the resulting roadmap.

Pure functions only — covered by backend/tests/test_simulator.py.
"""
from __future__ import annotations

import copy
from dataclasses import dataclass, field

from app.domain.project_gaps import identify_missing_projects
from app.domain.role_profiles import RoleProfile, get_profile
from app.domain.scoring import ScoringInput, _matches, compute_hiring_score

ACTION_LEARN = "learn_skill"
ACTION_PROJECT = "build_project"
ACTION_CERT = "earn_certification"
ACTION_GITHUB = "improve_github"

GITHUB_BOOST = 20

_ACRONYMS = {
    "sql", "aws", "gcp", "css", "html", "api", "apis", "ml", "ai", "nlp",
    "kpi", "mlops", "rest", "bi", "ci/cd", "cka", "ccp",
}


def _pretty(s: str) -> str:
    return " ".join(
        w.upper() if w.lower() in _ACRONYMS else w.capitalize() for w in s.split()
    )


@dataclass
class Scenario:
    action_type: str
    label: str
    target: str
    projected_score: int
    delta: int


@dataclass
class RoadmapStep:
    action_type: str
    label: str
    target: str
    projected_score: int
    delta: int


@dataclass
class SimulationResult:
    base_score: int
    scenarios: list[Scenario]
    roadmap: list[RoadmapStep] = field(default_factory=list)
    roadmap_final_score: int = 0


@dataclass
class Action:
    id: str
    action_type: str
    target: str
    label: str
    delta: int = 0


def _apply(inp: ScoringInput, action_type: str, target: str, role: RoleProfile) -> ScoringInput:
    new = copy.deepcopy(inp)
    if action_type == ACTION_LEARN:
        new.skills = list(new.skills) + [target]
    elif action_type == ACTION_PROJECT:
        new.projects = list(new.projects) + [{
            "name": target,
            "description": target,
            "technologies": list(role.core_skills[:3]),
        }]
    elif action_type == ACTION_CERT:
        new.certifications = list(new.certifications) + [{"name": target}]
    elif action_type == ACTION_GITHUB:
        new.github_strength_score = min(100, new.github_strength_score + GITHUB_BOOST)
    return new


def _candidate_actions(inp: ScoringInput, role: RoleProfile) -> list[tuple[str, str, str]]:
    """Deterministic (action_type, target, label) candidates."""
    actions: list[tuple[str, str, str]] = []
    user_skills = list(inp.skills) + list(inp.technologies)

    for core in role.core_skills:
        if not any(_matches(s, core) for s in user_skills):
            label_target = _pretty(core)
            actions.append((ACTION_LEARN, label_target, f"Learn {label_target}"))

    for proj in identify_missing_projects(role.recommended_projects, inp.projects):
        actions.append((ACTION_PROJECT, proj, f"Build {proj}"))

    cert_texts = [
        f"{c.get('name', '')} {c.get('issuer', '')}" for c in inp.certifications
    ]
    for cert in role.relevant_certs:
        if not any(_matches(t, cert) for t in cert_texts):
            label_target = _pretty(cert)
            actions.append(
                (ACTION_CERT, label_target, f"Earn a {label_target} certification")
            )

    if inp.github_strength_score < 70:
        actions.append(
            (ACTION_GITHUB, "", "Strengthen your GitHub (READMEs, activity, projects)")
        )
    return actions


def simulate(
    base_input: ScoringInput, *, max_scenarios: int = 6, roadmap_steps: int = 4
) -> SimulationResult:
    role = get_profile(base_input.role_key)
    base = compute_hiring_score(base_input).hiring_score
    candidates = _candidate_actions(base_input, role)

    # ---- individual what-if scenarios ----
    scenarios: list[Scenario] = []
    for atype, target, label in candidates:
        projected = compute_hiring_score(_apply(base_input, atype, target, role)).hiring_score
        scenarios.append(Scenario(atype, label, target, projected, projected - base))
    scenarios.sort(key=lambda s: (-s.delta, s.label))
    positive = [s for s in scenarios if s.delta > 0]
    top = (positive or scenarios)[:max_scenarios]

    # ---- greedy cumulative roadmap ----
    roadmap: list[RoadmapStep] = []
    current_input = base_input
    current_score = base
    remaining = list(candidates)
    for _ in range(roadmap_steps):
        best = None  # (delta, label, atype, target, projected)
        for atype, target, label in remaining:
            projected = compute_hiring_score(
                _apply(current_input, atype, target, role)
            ).hiring_score
            delta = projected - current_score
            if best is None or delta > best[0] or (delta == best[0] and label < best[1]):
                best = (delta, label, atype, target, projected)
        if best is None or best[0] <= 0:
            break
        delta, label, atype, target, projected = best
        current_input = _apply(current_input, atype, target, role)
        current_score = projected
        roadmap.append(RoadmapStep(atype, label, target, projected, delta))
        remaining = [(a, t, l) for (a, t, l) in remaining if l != label]

    return SimulationResult(
        base_score=base,
        scenarios=top,
        roadmap=roadmap,
        roadmap_final_score=current_score,
    )


# ---------------------------------------------------------------------------
# Interactive "What-If" — score arbitrary combinations of actions
# ---------------------------------------------------------------------------
def action_id(action_type: str, target: str) -> str:
    return f"{action_type}|{target}"


def candidate_actions(base_input: ScoringInput) -> list[Action]:
    """All available actions with their individual (one-at-a-time) score delta."""
    role = get_profile(base_input.role_key)
    base = compute_hiring_score(base_input).hiring_score
    actions: list[Action] = []
    for atype, target, label in _candidate_actions(base_input, role):
        projected = compute_hiring_score(_apply(base_input, atype, target, role)).hiring_score
        actions.append(
            Action(
                id=action_id(atype, target),
                action_type=atype,
                target=target,
                label=label,
                delta=projected - base,
            )
        )
    actions.sort(key=lambda a: (-a.delta, a.label))
    return actions


def apply_action_ids(base_input: ScoringInput, ids: list[str]) -> ScoringInput:
    role = get_profile(base_input.role_key)
    idset = set(ids)
    current = base_input
    for atype, target, label in _candidate_actions(base_input, role):
        if action_id(atype, target) in idset:
            current = _apply(current, atype, target, role)
    return current


def whatif(base_input: ScoringInput, ids: list[str]) -> dict:
    base = compute_hiring_score(base_input).hiring_score
    projected = compute_hiring_score(apply_action_ids(base_input, ids)).hiring_score
    return {
        "base_score": base,
        "projected_score": projected,
        "delta": projected - base,
    }
