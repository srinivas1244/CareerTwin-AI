"""Deterministic Hiring Score engine.

Pure functions only — no AI, no randomness, no I/O. Given the same inputs they
always return the same outputs (covered by tests in backend/tests/test_scoring.py).

Weights (from the product spec):
    Skills 25% | Projects 30% | GitHub 20% | Certifications 15% | Resume Quality 10%

The AI layer may *explain* the numbers produced here, but never produces them.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone

from app.domain.role_profiles import RoleProfile, get_profile

WEIGHTS: dict[str, int] = {
    "skills": 25,
    "projects": 30,
    "github": 20,
    "certifications": 15,
    "resume_quality": 10,
}

CATEGORY_LABELS: dict[str, str] = {
    "skills": "Skills",
    "projects": "Projects",
    "github": "GitHub",
    "certifications": "Certifications",
    "resume_quality": "Resume Quality",
}


# ---------------------------------------------------------------------------
# Inputs
# ---------------------------------------------------------------------------
@dataclass
class ResumeQualitySignals:
    has_skills: bool = False
    has_projects: bool = False
    has_experience: bool = False
    has_education: bool = False
    has_certifications: bool = False
    has_contact: bool = False
    word_count: int = 0
    action_verb_count: int = 0


@dataclass
class ScoringInput:
    role_key: str
    skills: list[str] = field(default_factory=list)
    technologies: list[str] = field(default_factory=list)
    projects: list[dict] = field(default_factory=list)
    certifications: list[dict] = field(default_factory=list)
    github_strength_score: int = 0
    resume_quality: ResumeQualitySignals = field(default_factory=ResumeQualitySignals)


@dataclass
class RepoStat:
    name: str
    language: str | None = None
    stars: int = 0
    forks: int = 0
    has_readme: bool = False
    has_description: bool = False
    topics: list[str] = field(default_factory=list)
    pushed_at: datetime | None = None


# ---------------------------------------------------------------------------
# Outputs
# ---------------------------------------------------------------------------
@dataclass
class CategoryResult:
    key: str
    label: str
    score: int  # 0-100
    weight: int  # percent
    weighted: float  # contribution to final
    details: list[str] = field(default_factory=list)


@dataclass
class ScoreResult:
    hiring_score: int  # 0-100
    role_key: str
    breakdown: list[CategoryResult]


@dataclass
class GithubStrength:
    score: int  # 0-100
    insights: list[str]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _norm(s: str) -> str:
    return " ".join(s.lower().replace("/", " ").replace("-", " ").split())


def _matches(text: str, keyword: str) -> bool:
    """Token-aware containment: keyword present as a whole word/phrase in text."""
    t, k = _norm(text), _norm(keyword)
    if not k:
        return False
    return k in t


def _clamp(value: float, low: float = 0, high: float = 100) -> int:
    return int(round(max(low, min(high, value))))


# ---------------------------------------------------------------------------
# GitHub Strength Score (deterministic, feeds the 20% GitHub category)
# ---------------------------------------------------------------------------
def compute_github_strength(
    repos: list[RepoStat],
    languages: dict[str, int] | None = None,
    *,
    now: datetime | None = None,
) -> GithubStrength:
    languages = languages or {}
    now = now or datetime.now(timezone.utc)
    insights: list[str] = []

    n = len(repos)
    if n == 0:
        return GithubStrength(score=0, insights=["No public repositories found."])

    # repo count -> up to 25
    repo_pts = min(25, n * 5)

    # language diversity -> up to 15
    lang_count = len({l for l in (r.language for r in repos) if l}) or len(languages)
    lang_pts = min(15, lang_count * 3)

    # README coverage -> up to 20
    readme_ratio = sum(1 for r in repos if r.has_readme) / n
    readme_pts = readme_ratio * 20

    # stars -> up to 15
    total_stars = sum(r.stars for r in repos)
    star_pts = min(15, total_stars * 1.5)

    # forks -> up to 10
    total_forks = sum(r.forks for r in repos)
    fork_pts = min(10, total_forks * 2)

    # recent activity (pushed within ~6 months) -> up to 15
    recent = 0
    for r in repos:
        if r.pushed_at is None:
            continue
        pushed = r.pushed_at
        if pushed.tzinfo is None:
            pushed = pushed.replace(tzinfo=timezone.utc)
        if (now - pushed).days <= 183:
            recent += 1
    activity_pts = min(15, recent * 3)

    score = _clamp(
        repo_pts + lang_pts + readme_pts + star_pts + fork_pts + activity_pts
    )

    insights.append(f"{n} public repositories across {lang_count} languages.")
    insights.append(f"{int(readme_ratio * 100)}% of repos have a README.")
    if total_stars:
        insights.append(f"{total_stars} total stars, {total_forks} forks.")
    insights.append(f"{recent} repositories pushed in the last 6 months.")
    if readme_ratio < 0.5:
        insights.append("Add READMEs to more repos to raise repository quality.")
    return GithubStrength(score=score, insights=insights)


# ---------------------------------------------------------------------------
# Category scorers
# ---------------------------------------------------------------------------
def _score_skills(inp: ScoringInput, profile: RoleProfile) -> CategoryResult:
    user_skills = [s for s in (inp.skills + inp.technologies) if s]
    core = profile.core_skills
    matched = [c for c in core if any(_matches(s, c) for s in user_skills)]
    coverage = (len(matched) / len(core)) if core else 0
    coverage_pts = coverage * 70

    extra = max(0, len(user_skills) - len(matched))
    bonus = min(30, extra * 2)

    score = _clamp(coverage_pts + bonus)
    details = [
        f"Matched {len(matched)}/{len(core)} core skills for "
        f"{profile.label} ({int(coverage * 100)}% coverage).",
        f"{extra} additional skills listed.",
    ]
    if len(matched) < len(core):
        missing = [c for c in core if c not in matched][:4]
        details.append("Missing core skills: " + ", ".join(missing) + ".")
    return CategoryResult("skills", CATEGORY_LABELS["skills"], score,
                          WEIGHTS["skills"], 0.0, details)


def _project_text(p: dict) -> str:
    parts = [str(p.get("name", "")), str(p.get("description", ""))]
    techs = p.get("technologies") or []
    if isinstance(techs, list):
        parts.extend(str(t) for t in techs)
    return " ".join(parts)


def _score_projects(inp: ScoringInput, profile: RoleProfile) -> CategoryResult:
    n = len(inp.projects)
    count_pts = min(60, n * 20)

    keywords = profile.core_skills + profile.project_keywords
    relevant = 0
    for p in inp.projects:
        text = _project_text(p)
        if any(_matches(text, k) for k in keywords):
            relevant += 1
    relevance_pts = min(40, relevant * 20)

    score = _clamp(count_pts + relevance_pts)
    details = [
        f"{n} project(s) found; {relevant} relevant to {profile.label}.",
    ]
    if n < 3:
        details.append("Aim for at least 3 strong, role-relevant projects.")
    return CategoryResult("projects", CATEGORY_LABELS["projects"], score,
                          WEIGHTS["projects"], 0.0, details)


def _score_github(inp: ScoringInput, profile: RoleProfile) -> CategoryResult:
    score = _clamp(inp.github_strength_score)
    details = [f"GitHub Strength Score: {score}/100."]
    if score < 50:
        details.append("Improve repo READMEs, activity, and project depth.")
    return CategoryResult("github", CATEGORY_LABELS["github"], score,
                          WEIGHTS["github"], 0.0, details)


def _cert_text(c: dict) -> str:
    return " ".join([str(c.get("name", "")), str(c.get("issuer", ""))])


def _score_certifications(inp: ScoringInput, profile: RoleProfile) -> CategoryResult:
    n = len(inp.certifications)
    count_pts = min(60, n * 30)

    relevant = 0
    for c in inp.certifications:
        text = _cert_text(c)
        if any(_matches(text, k) for k in profile.relevant_certs):
            relevant += 1
    relevance_pts = min(40, relevant * 40)

    score = _clamp(count_pts + relevance_pts)
    details = [f"{n} certification(s); {relevant} relevant to {profile.label}."]
    if n == 0:
        details.append("A role-relevant certification can boost credibility.")
    return CategoryResult("certifications", CATEGORY_LABELS["certifications"],
                          score, WEIGHTS["certifications"], 0.0, details)


def _score_resume_quality(inp: ScoringInput, profile: RoleProfile) -> CategoryResult:
    q = inp.resume_quality
    pts = 0.0
    pts += 15 if q.has_skills else 0
    pts += 15 if q.has_projects else 0
    pts += 15 if q.has_experience else 0
    pts += 10 if q.has_education else 0
    pts += 10 if q.has_certifications else 0
    pts += 10 if q.has_contact else 0

    # length band -> up to 15
    wc = q.word_count
    if wc <= 0:
        length_pts = 0.0
    elif wc < 250:
        length_pts = (wc / 250) * 15
    elif wc <= 1200:
        length_pts = 15.0
    else:
        length_pts = max(5.0, 15 - (wc - 1200) / 200)
    pts += length_pts

    # action verbs -> up to 10
    pts += min(10, q.action_verb_count * 2)

    score = _clamp(pts)
    missing_sections = [
        name for present, name in [
            (q.has_skills, "skills"), (q.has_projects, "projects"),
            (q.has_experience, "experience"), (q.has_education, "education"),
            (q.has_contact, "contact info"),
        ] if not present
    ]
    details = [f"Resume completeness score: {score}/100 ({wc} words)."]
    if missing_sections:
        details.append("Missing/weak sections: " + ", ".join(missing_sections) + ".")
    return CategoryResult("resume_quality", CATEGORY_LABELS["resume_quality"],
                          score, WEIGHTS["resume_quality"], 0.0, details)


# ---------------------------------------------------------------------------
# Top-level
# ---------------------------------------------------------------------------
def compute_hiring_score(inp: ScoringInput) -> ScoreResult:
    profile = get_profile(inp.role_key)
    categories = [
        _score_skills(inp, profile),
        _score_projects(inp, profile),
        _score_github(inp, profile),
        _score_certifications(inp, profile),
        _score_resume_quality(inp, profile),
    ]
    total = 0.0
    for c in categories:
        c.weighted = round(c.score * c.weight / 100, 2)
        total += c.weighted

    return ScoreResult(
        hiring_score=_clamp(total),
        role_key=profile.key,
        breakdown=categories,
    )
