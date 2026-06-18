"""API request/response contracts (mirrored in frontend/lib/types.ts)."""
from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

from app.schemas.ai_models import (
    CertificationItem,
    EducationItem,
    ExperienceItem,
    ProjectItem,
    ScoreExplanation,
)


# ---- Resume ----------------------------------------------------------------
class ResumeUploadResponse(BaseModel):
    resume_id: str
    file_name: str
    has_text: bool
    char_count: int


# ---- GitHub ----------------------------------------------------------------
class GithubConnectRequest(BaseModel):
    username: str

    @field_validator("username")
    @classmethod
    def clean_username(cls, v: str) -> str:
        v = v.strip()
        # accept a full URL or @handle and reduce to the bare username
        v = v.removeprefix("https://github.com/").removeprefix("github.com/")
        v = v.lstrip("@").strip("/")
        if not v:
            raise ValueError("GitHub username is required.")
        return v


class RepoInsight(BaseModel):
    name: str
    description: str | None = None
    language: str | None = None
    stars: int = 0
    forks: int = 0
    has_readme: bool = False
    topics: list[str] = Field(default_factory=list)
    pushed_at: str | None = None


class GithubProfileResponse(BaseModel):
    username: str
    repo_count: int
    total_stars: int
    total_forks: int
    languages: dict[str, int] = Field(default_factory=dict)
    github_strength_score: int
    top_repos: list[RepoInsight] = Field(default_factory=list)
    insights: list[str] = Field(default_factory=list)


# ---- Career Twin -----------------------------------------------------------
class RoleOption(BaseModel):
    key: str
    label: str


class CareerProfileResponse(BaseModel):
    skills: list[str] = Field(default_factory=list)
    technologies: list[str] = Field(default_factory=list)
    certifications: list[CertificationItem] = Field(default_factory=list)
    projects: list[ProjectItem] = Field(default_factory=list)
    experience: list[ExperienceItem] = Field(default_factory=list)
    education: list[EducationItem] = Field(default_factory=list)
    inferred_role: str | None = None
    target_role: str | None = None  # curated role key
    target_role_label: str | None = None
    career_goal: str | None = None
    summary: str | None = None
    role_options: list[RoleOption] = Field(default_factory=list)


class RoleUpdateRequest(BaseModel):
    target_role: str


# ---- Hiring Score ----------------------------------------------------------
class CategoryScore(BaseModel):
    key: str
    label: str
    score: int  # 0-100
    weight: int  # percent
    weighted: float  # contribution to final
    details: list[str] = Field(default_factory=list)


class HiringScoreResponse(BaseModel):
    hiring_score: int  # 0-100
    role: str | None = None
    role_label: str | None = None
    breakdown: list[CategoryScore] = Field(default_factory=list)
    explanation: ScoreExplanation | None = None


# ---- Resume Reality Check (Milestone 2) ------------------------------------
class SkillEvidenceItem(BaseModel):
    skill: str
    level: str  # Strong | Medium | Weak | Missing
    evidence_score: int  # 0-100
    signals: list[str] = Field(default_factory=list)


class RealityCheckResponse(BaseModel):
    credibility_score: int  # 0-100
    counts: dict[str, int] = Field(default_factory=dict)
    evidence: list[SkillEvidenceItem] = Field(default_factory=list)
    explanation: ScoreExplanation | None = None


# ---- Project Gap Detector (Milestone 3) ------------------------------------
class ProjectRecommendationItem(BaseModel):
    name: str
    description: str = ""
    why_it_matters: str = ""
    difficulty: str = ""
    timeline: str = ""
    architecture: str = ""
    tech_stack: list[str] = Field(default_factory=list)
    key_skills: list[str] = Field(default_factory=list)


class ProjectGapResponse(BaseModel):
    target_role: str | None = None
    target_role_label: str | None = None
    missing_count: int = 0
    projects: list[ProjectRecommendationItem] = Field(default_factory=list)


# ---- Career Simulator (Milestone 4) ----------------------------------------
class ScenarioItem(BaseModel):
    action_type: str
    label: str
    target: str = ""
    projected_score: int
    delta: int


class RoadmapStepItem(BaseModel):
    action_type: str
    label: str
    target: str = ""
    projected_score: int
    delta: int


class SimulationResponse(BaseModel):
    base_score: int
    scenarios: list[ScenarioItem] = Field(default_factory=list)
    roadmap: list[RoadmapStepItem] = Field(default_factory=list)
    roadmap_final_score: int = 0
    explanation: ScoreExplanation | None = None


# ---- Interactive What-If (Phase B) -----------------------------------------
class WhatIfActionItem(BaseModel):
    id: str
    action_type: str
    label: str
    delta: int


class WhatIfActionsResponse(BaseModel):
    base_score: int
    actions: list[WhatIfActionItem] = Field(default_factory=list)


class WhatIfRequest(BaseModel):
    action_ids: list[str] = Field(default_factory=list)


class WhatIfResponse(BaseModel):
    base_score: int
    projected_score: int
    delta: int


# ---- Multi-role match (Phase B) --------------------------------------------
class RoleMatchItem(BaseModel):
    role: str
    label: str
    score: int


class RoleMatchesResponse(BaseModel):
    target_role: str | None = None
    target_role_label: str | None = None
    matches: list[RoleMatchItem] = Field(default_factory=list)


# ---- Roadmap progress (Phase B) --------------------------------------------
class RoadmapProgressResponse(BaseModel):
    completed: list[str] = Field(default_factory=list)


class RoadmapProgressUpdate(BaseModel):
    phase: str
    completed: bool


# ---- AI Career Roadmap (Phase 2) -------------------------------------------
class RoadmapPhaseItem(BaseModel):
    name: str
    focus: str = ""
    duration: str = ""
    skills: list[str] = Field(default_factory=list)
    why: str = ""
    project: str = ""


class CareerRoadmapResponse(BaseModel):
    target_role: str | None = None
    target_role_label: str | None = None
    career_goal: str | None = None
    missing_skills: list[str] = Field(default_factory=list)
    summary: str = ""
    phases: list[RoadmapPhaseItem] = Field(default_factory=list)
