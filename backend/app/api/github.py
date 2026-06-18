"""GitHub connect/analyze endpoints (public API by username)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.api.deps import get_current_user
from app.core.errors import NotFoundError
from app.core.rate_limit import limiter
from app.core.security import CurrentUser
from app.repositories.github_repo import GithubRepository
from app.schemas.career import GithubConnectRequest, GithubProfileResponse
from app.services import github_service

router = APIRouter(prefix="/api/github", tags=["github"])


@router.post("", response_model=GithubProfileResponse)
@limiter.limit("10/minute")
def connect_github(
    request: Request,
    payload: GithubConnectRequest,
    user: CurrentUser = Depends(get_current_user),
) -> GithubProfileResponse:
    analysis = github_service.analyze(payload.username)
    GithubRepository().upsert(user.id, analysis.to_record())
    return GithubProfileResponse(**analysis.to_response())


@router.get("", response_model=GithubProfileResponse)
def get_github(user: CurrentUser = Depends(get_current_user)) -> GithubProfileResponse:
    record = GithubRepository().get(user.id)
    if not record:
        raise NotFoundError("No GitHub profile connected yet.")
    return GithubProfileResponse(
        username=record.get("username", ""),
        repo_count=record.get("repo_count", 0),
        total_stars=record.get("total_stars", 0),
        total_forks=record.get("total_forks", 0),
        languages=record.get("languages") or {},
        github_strength_score=record.get("github_strength_score", 0),
        top_repos=(record.get("raw_json") or {}).get("top_repos", []),
        insights=record.get("insights") or [],
    )
