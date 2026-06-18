"""Deterministic project-gap identification.

Given a target role's curated recommended projects and the user's current
projects, decide which recommended projects are NOT yet covered. This is the
deterministic seed; the AI later expands each gap into a full recommendation.

Pure functions only — covered by backend/tests/test_project_gaps.py.
"""
from __future__ import annotations

from app.domain.scoring import _matches, _norm

# Generic words that don't make a project distinctive on their own.
_GENERIC = {
    "system", "platform", "app", "application", "project", "tool", "website",
    "web", "service", "report", "reporting", "software", "site", "end", "to",
}
_STOPWORDS = {"a", "an", "the", "and", "or", "of", "for", "with", "to", "in", "on"}


def distinctive_keywords(name: str) -> list[str]:
    words = [w for w in _norm(name).split() if len(w) >= 3 and w not in _STOPWORDS]
    distinctive = [w for w in words if w not in _GENERIC]
    return distinctive or words  # fall back to all words if everything is generic


def _project_text(p: dict) -> str:
    parts = [str(p.get("name", "")), str(p.get("description", ""))]
    techs = p.get("technologies") or []
    if isinstance(techs, list):
        parts.extend(str(t) for t in techs)
    return " ".join(parts)


def identify_missing_projects(
    recommended: list[str] | tuple[str, ...], current_projects: list[dict]
) -> list[str]:
    """Return the recommended project names not yet covered by current work."""
    current_text = " ".join(_project_text(p) for p in current_projects)
    missing: list[str] = []
    for rec in recommended:
        keys = distinctive_keywords(rec)
        covered = any(_matches(current_text, k) for k in keys)
        if not covered:
            missing.append(rec)
    return missing
