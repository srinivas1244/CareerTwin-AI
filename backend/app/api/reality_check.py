"""Resume Reality Check endpoints: deterministic compute (+ AI explanation)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.api.deps import ai_provider, get_current_user
from app.core.errors import NotFoundError
from app.core.rate_limit import limiter
from app.core.security import CurrentUser
from app.schemas.career import RealityCheckResponse
from app.services.ai.base import AIProvider
from app.services.reality_check_service import RealityCheckService

router = APIRouter(prefix="/api/reality-check", tags=["reality-check"])


@router.post("", response_model=RealityCheckResponse)
@limiter.limit("12/minute")
def run_reality_check(
    request: Request,
    user: CurrentUser = Depends(get_current_user),
    ai: AIProvider = Depends(ai_provider),
) -> RealityCheckResponse:
    return RealityCheckResponse(**RealityCheckService(ai).compute_and_store(user.id))


@router.get("", response_model=RealityCheckResponse)
def get_reality_check(
    user: CurrentUser = Depends(get_current_user),
) -> RealityCheckResponse:
    result = RealityCheckService().get_latest(user.id)
    if not result:
        raise NotFoundError("No Reality Check has been run yet.")
    return RealityCheckResponse(**result)