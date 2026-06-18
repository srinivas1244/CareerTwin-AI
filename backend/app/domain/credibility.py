"""Deterministic Resume Reality Check.

Compares each claimed skill (from the Career Twin) against actual GitHub
evidence and assigns an evidence level — Strong / Medium / Weak / Missing — plus
an overall Credibility Score. Pure functions only: no AI, no randomness. The AI
layer only *explains* these results.

Evidence signals per skill (deterministic):
  - GitHub language match (strongest)   -> repo count weighted
  - repo name match
  - repo topic match
  - repo description match

Covered by backend/tests/test_credibility.py.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from app.domain.scoring import _matches  # normalized, token-aware containment

LEVEL_STRONG = "Strong"
LEVEL_MEDIUM = "Medium"
LEVEL_WEAK = "Weak"
LEVEL_MISSING = "Missing"

# evidence_score thresholds -> level
_STRONG_AT = 70
_MEDIUM_AT = 40
_WEAK_AT = 15


@dataclass
class RepoEvidence:
    name: str = ""
    description: str = ""
    language: str | None = None
    topics: list[str] = field(default_factory=list)


@dataclass
class SkillEvidence:
    skill: str
    level: str
    evidence_score: int  # 0-100
    signals: list[str] = field(default_factory=list)


@dataclass
class CredibilityResult:
    credibility_score: int  # 0-100
    evidence: list[SkillEvidence]
    counts: dict[str, int]


def _level(score: float) -> str:
    if score >= _STRONG_AT:
        return LEVEL_STRONG
    if score >= _MEDIUM_AT:
        return LEVEL_MEDIUM
    if score >= _WEAK_AT:
        return LEVEL_WEAK
    return LEVEL_MISSING


_FRAMEWORK_SUFFIXES = (".js", ".ts", ".jsx", ".tsx")


def skill_variants(skill: str) -> list[str]:
    """Aliases to match a skill against GitHub text.

    e.g. "Node.js" -> {"Node.js", "Node", "Nodejs"} so it matches repos/topics
    written as "node" or "nodejs". Avoids false 'Missing' results for frameworks.
    """
    s = (skill or "").strip()
    variants = {s}
    low = s.lower()
    for suf in _FRAMEWORK_SUFFIXES:
        if low.endswith(suf):
            variants.add(s[: -len(suf)])  # Node.js -> Node
    if "." in s:
        variants.add(s.replace(".", ""))  # Node.js -> Nodejs
    return [v for v in variants if len(v.strip()) >= 2]


def _hits(text: str, variants: list[str]) -> bool:
    return bool(text) and any(_matches(text, v) for v in variants)


def evaluate_skill(
    skill: str, repos: list[RepoEvidence], languages: dict[str, int]
) -> SkillEvidence:
    signals: list[str] = []
    variants = skill_variants(skill)

    # language match (repo-count weighted) -> up to 85
    lang_count = 0
    for lang, count in languages.items():
        if lang and (_hits(lang, variants) or any(_matches(v, lang) for v in variants)):
            lang_count += count
    points_lang = min(85, 55 + lang_count * 12) if lang_count else 0
    if lang_count:
        signals.append(f"Primary language in {lang_count} repo(s)")

    # name / topic / description matches across repos
    name_hits = sum(1 for r in repos if _hits(r.name, variants))
    topic_hits = sum(
        1 for r in repos if any(_hits(t, variants) for t in r.topics)
    )
    desc_hits = sum(1 for r in repos if _hits(r.description, variants))

    points_name = min(35, name_hits * 18)
    points_topic = min(45, topic_hits * 25)
    points_desc = min(30, desc_hits * 15)

    if name_hits:
        signals.append(f"Used in {name_hits} repo name(s)")
    if topic_hits:
        signals.append(f"Tagged as a topic in {topic_hits} repo(s)")
    if desc_hits:
        signals.append(f"Mentioned in {desc_hits} repo description(s)")

    score = int(min(100, points_lang + points_name + points_topic + points_desc))
    level = _level(score)
    if not signals:
        signals.append("No matching GitHub evidence found")
    return SkillEvidence(skill=skill, level=level, evidence_score=score, signals=signals)


def compute_credibility(
    skills: list[str], repos: list[RepoEvidence], languages: dict[str, int]
) -> CredibilityResult:
    # de-duplicate claimed skills (case-insensitive), preserve order
    seen: set[str] = set()
    unique: list[str] = []
    for s in skills:
        key = (s or "").strip().lower()
        if key and key not in seen:
            seen.add(key)
            unique.append(s.strip())

    evidence = [evaluate_skill(s, repos, languages) for s in unique]
    counts = {LEVEL_STRONG: 0, LEVEL_MEDIUM: 0, LEVEL_WEAK: 0, LEVEL_MISSING: 0}
    for e in evidence:
        counts[e.level] += 1

    credibility = (
        round(sum(e.evidence_score for e in evidence) / len(evidence))
        if evidence
        else 0
    )
    # strongest evidence first, then weakest, for readable output
    order = {LEVEL_STRONG: 0, LEVEL_MEDIUM: 1, LEVEL_WEAK: 2, LEVEL_MISSING: 3}
    evidence.sort(key=lambda e: (order[e.level], -e.evidence_score))
    return CredibilityResult(
        credibility_score=credibility, evidence=evidence, counts=counts
    )
