"""GitHub analysis via the public REST API (by username, no OAuth).

Produces the GitHub Strength Score (deterministic) plus repo insights and a
short text summary used by the Career Twin extraction.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone

import httpx

from app.core.config import settings
from app.core.errors import NotFoundError, UpstreamError
from app.domain.scoring import RepoStat, compute_github_strength

API = "https://api.github.com"
# Bound the number of repos we deep-inspect (README check) to limit API calls.
MAX_REPOS = 30


@dataclass
class GithubAnalysis:
    username: str
    repo_count: int
    total_stars: int
    total_forks: int
    languages: dict[str, int]
    github_strength_score: int
    top_repos: list[dict] = field(default_factory=list)
    insights: list[str] = field(default_factory=list)
    summary: str = ""

    def to_response(self) -> dict:
        return {
            "username": self.username,
            "repo_count": self.repo_count,
            "total_stars": self.total_stars,
            "total_forks": self.total_forks,
            "languages": self.languages,
            "github_strength_score": self.github_strength_score,
            "top_repos": self.top_repos,
            "insights": self.insights,
        }

    def to_record(self) -> dict:
        return {
            "username": self.username,
            "repo_count": self.repo_count,
            "total_stars": self.total_stars,
            "total_forks": self.total_forks,
            "languages": self.languages,
            "github_strength_score": self.github_strength_score,
            "raw_json": {"top_repos": self.top_repos},
            "insights": self.insights,
        }


def _headers() -> dict:
    h = {"Accept": "application/vnd.github+json", "User-Agent": "CareerTwinAI"}
    if settings.github_token:
        h["Authorization"] = f"Bearer {settings.github_token}"
    return h


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def analyze(username: str) -> GithubAnalysis:
    with httpx.Client(timeout=20, headers=_headers()) as client:
        resp = client.get(
            f"{API}/users/{username}/repos",
            params={"per_page": 100, "sort": "pushed", "type": "owner"},
        )
        if resp.status_code == 404:
            raise NotFoundError(f"GitHub user '{username}' was not found.")
        if resp.status_code == 403:
            raise UpstreamError(
                "GitHub API rate limit reached. Add a GITHUB_TOKEN or try later."
            )
        if resp.status_code >= 400:
            raise UpstreamError(f"GitHub API error ({resp.status_code}).")

        repos = [r for r in resp.json() if not r.get("fork")]
        repos.sort(key=lambda r: (r.get("stargazers_count", 0)), reverse=True)
        considered = repos[:MAX_REPOS]

        languages: dict[str, int] = {}
        total_stars = total_forks = 0
        stats: list[RepoStat] = []
        top_repos: list[dict] = []
        rate_limited = False

        for r in considered:
            lang = r.get("language")
            if lang:
                languages[lang] = languages.get(lang, 0) + 1
            stars = r.get("stargazers_count", 0) or 0
            forks = r.get("forks_count", 0) or 0
            total_stars += stars
            total_forks += forks

            has_readme = False
            if not rate_limited:
                has_readme, rate_limited = _check_readme(client, r.get("full_name"))

            stats.append(RepoStat(
                name=r.get("name", ""),
                language=lang,
                stars=stars,
                forks=forks,
                has_readme=has_readme,
                has_description=bool(r.get("description")),
                topics=r.get("topics") or [],
                pushed_at=_parse_dt(r.get("pushed_at")),
            ))
            top_repos.append({
                "name": r.get("name", ""),
                "description": r.get("description"),
                "language": lang,
                "stars": stars,
                "forks": forks,
                "has_readme": has_readme,
                "topics": r.get("topics") or [],
                "pushed_at": r.get("pushed_at"),
            })

    strength = compute_github_strength(stats, languages)
    insights = list(strength.insights)
    if rate_limited:
        insights.append("Some README checks were skipped due to GitHub rate limits.")

    return GithubAnalysis(
        username=username,
        repo_count=len(repos),
        total_stars=total_stars,
        total_forks=total_forks,
        languages=languages,
        github_strength_score=strength.score,
        top_repos=top_repos[:25],
        insights=insights,
        summary=_build_summary(username, len(repos), languages, top_repos),
    )


def _check_readme(client: httpx.Client, full_name: str | None) -> tuple[bool, bool]:
    """Return (has_readme, rate_limited)."""
    if not full_name:
        return False, False
    try:
        r = client.get(f"{API}/repos/{full_name}/readme")
    except httpx.HTTPError:
        return False, False
    if r.status_code == 403:
        return False, True
    return r.status_code == 200, False


def summary_from_record(record: dict) -> str:
    """Rebuild the AI summary text from a stored github_profiles row."""
    top_repos = (record.get("raw_json") or {}).get("top_repos") or []
    return _build_summary(
        record.get("username", "unknown"),
        record.get("repo_count", 0),
        record.get("languages") or {},
        top_repos,
    )


def _build_summary(
    username: str, repo_count: int, languages: dict[str, int], top_repos: list[dict]
) -> str:
    top_langs = ", ".join(
        k for k, _ in sorted(languages.items(), key=lambda x: x[1], reverse=True)[:5]
    ) or "none detected"
    lines = [f"GitHub @{username}: {repo_count} public repos. Top languages: {top_langs}."]
    for r in top_repos[:8]:
        desc = (r.get("description") or "").strip()
        lines.append(
            f"- {r['name']} [{r.get('language') or 'n/a'}, {r.get('stars', 0)}*]"
            + (f": {desc}" if desc else "")
        )
    return "\n".join(lines)
