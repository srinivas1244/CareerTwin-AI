"""Hiring Score endpoints: deterministic compute (+ AI explanation) and fetch."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.api.deps import ai_provider, get_current_user
from app.core.errors import NotFoundError
from app.core.rate_limit import limiter
from app.core.security import CurrentUser
from app.schemas.career import HiringScoreResponse, RoleMatchesResponse
from app.services.ai.base import AIProvider
from app.services.scoring_service import ScoringService

router = APIRouter(prefix="/api/hiring-score", tags=["hiring-score"])


@router.post("", response_model=HiringScoreResponse)
@limiter.limit("12/minute")
def compute_hiring_score(
    request: Request,
    user: CurrentUser = Depends(get_current_user),
    ai: AIProvider = Depends(ai_provider),
) -> HiringScoreResponse:
    return HiringScoreResponse(**ScoringService(ai).compute_and_store(user.id))


@router.get("", response_model=HiringScoreResponse)
def get_hiring_score(
    user: CurrentUser = Depends(get_current_user),
) -> HiringScoreResponse:
    result = ScoringService().get_latest(user.id)
    if not result:
        raise NotFoundError("No Hiring Score computed yet.")
    return HiringScoreResponse(**result)


@router.get("/roles", response_model=RoleMatchesResponse)
def get_role_matches(
    user: CurrentUser = Depends(get_current_user),
) -> RoleMatchesResponse:
    return RoleMatchesResponse(**ScoringService().get_role_matches(user.id))