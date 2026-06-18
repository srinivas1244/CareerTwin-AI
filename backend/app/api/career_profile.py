"""Career Twin endpoints: generate, fetch, update target role."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.api.deps import ai_provider, get_current_user
from app.core.errors import NotFoundError
from app.core.rate_limit import limiter
from app.core.security import CurrentUser
from app.schemas.career import CareerProfileResponse, RoleUpdateRequest
from app.services.ai.base import AIProvider
from app.services.career_twin_service import CareerTwinService, to_profile_response

router = APIRouter(prefix="/api/career-profile", tags=["career-profile"])


@router.post("/generate", response_model=CareerProfileResponse)
@limiter.limit("6/minute")
def generate_twin(
    request: Request,
    user: CurrentUser = Depends(get_current_user),
    ai: AIProvider = Depends(ai_provider),
) -> CareerProfileResponse:
    record = CareerTwinService(ai).generate(user.id)
    return CareerProfileResponse(**to_profile_response(record))


@router.get("", response_model=CareerProfileResponse)
def get_twin(
    user: CurrentUser = Depends(get_current_user),
) -> CareerProfileResponse:
    record = CareerTwinService().get(user.id)
    if not record:
        raise NotFoundError("No Career Twin generated yet.")
    return CareerProfileResponse(**to_profile_response(record))


@router.patch("/role", response_model=CareerProfileResponse)
def update_role(
    payload: RoleUpdateRequest,
    user: CurrentUser = Depends(get_current_user),
) -> CareerProfileResponse:
    record = CareerTwinService().update_role(user.id, payload.target_role)
    return CareerProfileResponse(**to_profile_response(record))
