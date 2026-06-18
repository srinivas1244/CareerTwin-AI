"""Deterministic scoring tests: fixed inputs -> fixed, hand-computed outputs.

These prove the Hiring Score engine is deterministic and AI-free.
"""
from datetime import datetime, timezone

from app.domain.scoring import (
    RepoStat,
    ResumeQualitySignals,
    ScoringInput,
    compute_github_strength,
    compute_hiring_score,
)


def _categories(result):
    return {c.key: c.score for c in result.breakdown}


def test_empty_profile_scores_zero():
    result = compute_hiring_score(ScoringInput(role_key="data_analyst"))
    assert result.hiring_score == 0
    assert _categories(result) == {
        "skills": 0,
        "projects": 0,
        "github": 0,
        "certifications": 0,
        "resume_quality": 0,
    }


def test_realistic_data_analyst():
    inp = ScoringInput(
        role_key="data_analyst",
        skills=["Python", "SQL", "Power BI", "Excel"],
        technologies=["Pandas"],
        projects=[
            {
                "name": "Sales Dashboard",
                "description": "Power BI sales report",
                "technologies": ["Power BI", "SQL"],
            },
            {
                "name": "Student Gap Analyzer",
                "description": "data analysis",
                "technologies": ["Python", "Pandas"],
            },
        ],
        certifications=[{"name": "AWS Certified Cloud Practitioner", "issuer": "AWS"}],
        github_strength_score=70,
        resume_quality=ResumeQualitySignals(
            has_skills=True,
            has_projects=True,
            has_experience=True,
            has_education=True,
            has_certifications=True,
            has_contact=True,
            word_count=400,
            action_verb_count=6,
        ),
    )
    result = compute_hiring_score(inp)
    cats = _categories(result)
    assert cats["skills"] == 44          # 5/8 core coverage * 70
    assert cats["projects"] == 80        # 2 projects, both relevant
    assert cats["github"] == 70          # passthrough strength
    assert cats["certifications"] == 70  # 1 cert, relevant
    assert cats["resume_quality"] == 100
    # weighted: 11 + 24 + 14 + 10.5 + 10 = 69.5 -> 70
    assert result.hiring_score == 70
    assert result.role_key == "data_analyst"


def test_github_strength_fixed():
    repos = [
        RepoStat("a", language="Python", stars=2, forks=1, has_readme=True,
                 pushed_at=datetime(2026, 5, 1, tzinfo=timezone.utc)),
        RepoStat("b", language="JavaScript", stars=0, forks=0, has_readme=False,
                 pushed_at=datetime(2026, 1, 1, tzinfo=timezone.utc)),
        RepoStat("c", language="Python", stars=1, forks=0, has_readme=True,
                 pushed_at=datetime(2025, 1, 1, tzinfo=timezone.utc)),
    ]
    strength = compute_github_strength(
        repos, now=datetime(2026, 6, 15, tzinfo=timezone.utc)
    )
    # 15 + 6 + 13.33 + 4.5 + 2 + 6 = 46.83 -> 47
    assert strength.score == 47
    assert strength.insights


def test_github_strength_empty():
    strength = compute_github_strength([])
    assert strength.score == 0


def test_determinism():
    inp = ScoringInput(
        role_key="frontend_developer",
        skills=["React", "TypeScript", "CSS"],
        projects=[{"name": "Portfolio", "description": "react site"}],
        github_strength_score=55,
        resume_quality=ResumeQualitySignals(has_skills=True, word_count=300),
    )
    a = compute_hiring_score(inp)
    b = compute_hiring_score(inp)
    assert a.hiring_score == b.hiring_score
    assert _categories(a) == _categories(b)
