"""Structured-output models the AI provider must return and validate against.

Every AI JSON task is validated against one of these. Fields are permissive
(defaults everywhere) so a slightly-incomplete-but-valid model response still
parses; the provider retries only on genuinely malformed/invalid output.
"""
from __future__ import annotations

from pydantic import BaseModel, Field


class CertificationItem(BaseModel):
    name: str
    issuer: str | None = None


class ProjectItem(BaseModel):
    name: str
    description: str | None = None
    technologies: list[str] = Field(default_factory=list)
    source: str | None = None  # "resume" | "github"


class ExperienceItem(BaseModel):
    title: str | None = None
    company: str | None = None
    duration: str | None = None
    description: str | None = None


class EducationItem(BaseModel):
    degree: str | None = None
    institution: str | None = None
    year: str | None = None


class ContactInfo(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None


class LinksInfo(BaseModel):
    linkedin: str | None = None
    github: str | None = None
    portfolio: str | None = None
    other: list[str] = Field(default_factory=list)


class TwinExtraction(BaseModel):
    """Career Twin extracted from resume text + GitHub summary."""

    contact: ContactInfo = Field(default_factory=ContactInfo)
    links: LinksInfo = Field(default_factory=LinksInfo)
    skills: list[str] = Field(default_factory=list)
    technologies: list[str] = Field(default_factory=list)
    certifications: list[CertificationItem] = Field(default_factory=list)
    projects: list[ProjectItem] = Field(default_factory=list)
    experience: list[ExperienceItem] = Field(default_factory=list)
    education: list[EducationItem] = Field(default_factory=list)
    achievements: list[str] = Field(default_factory=list)
    inferred_role: str = ""
    career_goal: str | None = None
    summary: str | None = None


class ScoreExplanation(BaseModel):
    """AI explanation of an already-computed deterministic score."""

    summary: str = ""
    strengths: list[str] = Field(default_factory=list)
    improvements: list[str] = Field(default_factory=list)


class ProjectRecommendation(BaseModel):
    """A recommended portfolio project (Project Gap Detector)."""

    name: str
    description: str = ""
    why_it_matters: str = ""
    difficulty: str = ""  # Beginner | Intermediate | Advanced
    timeline: str = ""  # e.g. "2-3 weeks"
    architecture: str = ""
    tech_stack: list[str] = Field(default_factory=list)
    key_skills: list[str] = Field(default_factory=list)


class ProjectGapList(BaseModel):
    projects: list[ProjectRecommendation] = Field(default_factory=list)


class RoadmapPhase(BaseModel):
    """One phase of the AI Career Roadmap."""

    name: str
    focus: str = ""
    duration: str = ""
    skills: list[str] = Field(default_factory=list)
    why: str = ""
    project: str = ""


class CareerRoadmap(BaseModel):
    summary: str = ""
    missing_skills: list[str] = Field(default_factory=list)
    phases: list[RoadmapPhase] = Field(default_factory=list)
