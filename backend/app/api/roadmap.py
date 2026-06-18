"""AI Career Roadmap endpoints: hybrid missing skills + phased plan."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.api.deps import ai_provider, get_current_user
from app.core.errors import NotFoundError
from app.core.rate_limit import limiter
from app.core.security import CurrentUser
from app.schemas.career import (
    CareerRoadmapResponse,
    RoadmapProgressResponse,
    RoadmapProgressUpdate,
)
from app.services.ai.base import AIProvider
from app.services.roadmap_service import RoadmapService

router = APIRouter(prefix="/api/roadmap", tags=["roadmap"])


@router.post("", response_model=CareerRoadmapResponse)
@limiter.limit("6/minute")
def generate_roadmap(
    request: Request,
    user: CurrentUser = Depends(get_current_user),
    ai: AIProvider = Depends(ai_provider),
) -> CareerRoadmapResponse:
    return CareerRoadmapResponse(**RoadmapService(ai).generate_and_store(user.id))


@router.get("", response_model=CareerRoadmapResponse)
def get_roadmap(
    user: CurrentUser = Depends(get_current_user),
) -> CareerRoadmapResponse:
    result = RoadmapService().get_latest(user.id)
    if not result:
        raise NotFoundError("No career roadmap generated yet.")
    return CareerRoadmapResponse(**result)


@router.get("/progress", response_model=RoadmapProgressResponse)
def get_progress(
    user: CurrentUser = Depends(get_current_user),
) -> RoadmapProgressResponse:
    return RoadmapProgressResponse(**RoadmapService().get_progress(user.id))


@router.post("/progress", response_model=RoadmapProgressResponse)
def set_progress(
    payload: RoadmapProgressUpdate,
    user: CurrentUser = Depends(get_current_user),
) -> RoadmapProgressResponse:
    return RoadmapProgressResponse(
        **RoadmapService().set_progress(user.id, payload.phase, payload.completed)
    )