"""Project Gap Detector endpoints: deterministic gaps + AI recommendations."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.api.deps import ai_provider, get_current_user
from app.core.errors import NotFoundError
from app.core.rate_limit import limiter
from app.core.security import CurrentUser
from app.schemas.career import ProjectGapResponse
from app.services.ai.base import AIProvider
from app.services.project_gap_service import ProjectGapService

router = APIRouter(prefix="/api/project-gaps", tags=["project-gaps"])


@router.post("", response_model=ProjectGapResponse)
@limiter.limit("6/minute")
def detect_project_gaps(
    request: Request,
    user: CurrentUser = Depends(get_current_user),
    ai: AIProvider = Depends(ai_provider),
) -> ProjectGapResponse:
    return ProjectGapResponse(**ProjectGapService(ai).detect_and_store(user.id))


@router.get("", response_model=ProjectGapResponse)
def get_project_gaps(
    user: CurrentUser = Depends(get_current_user),
) -> ProjectGapResponse:
    result = ProjectGapService().get_latest(user.id)
    if not result:
        raise NotFoundError("No project gaps detected yet.")
    return ProjectGapResponse(**result)