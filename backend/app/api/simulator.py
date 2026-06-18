"""Career Simulator endpoints: deterministic what-if scoring + AI roadmap."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.api.deps import ai_provider, get_current_user
from app.core.errors import NotFoundError
from app.core.rate_limit import limiter
from app.core.security import CurrentUser
from app.schemas.career import (
    SimulationResponse,
    WhatIfActionsResponse,
    WhatIfRequest,
    WhatIfResponse,
)
from app.services.ai.base import AIProvider
from app.services.simulator_service import SimulatorService

router = APIRouter(prefix="/api/simulator", tags=["simulator"])


@router.post("", response_model=SimulationResponse)
@limiter.limit("12/minute")
def run_simulator(
    request: Request,
    user: CurrentUser = Depends(get_current_user),
    ai: AIProvider = Depends(ai_provider),
) -> SimulationResponse:
    return SimulationResponse(**SimulatorService(ai).simulate_and_store(user.id))


@router.get("", response_model=SimulationResponse)
def get_simulator(
    user: CurrentUser = Depends(get_current_user),
) -> SimulationResponse:
    result = SimulatorService().get_latest(user.id)
    if not result:
        raise NotFoundError("No simulation has been run yet.")
    return SimulationResponse(**result)


@router.get("/what-if", response_model=WhatIfActionsResponse)
def what_if_actions(
    user: CurrentUser = Depends(get_current_user),
) -> WhatIfActionsResponse:
    return WhatIfActionsResponse(**SimulatorService().whatif_actions(user.id))


@router.post("/what-if", response_model=WhatIfResponse)
@limiter.limit("60/minute")
def what_if(
    request: Request,
    payload: WhatIfRequest,
    user: CurrentUser = Depends(get_current_user),
) -> WhatIfResponse:
    return WhatIfResponse(**SimulatorService().what_if(user.id, payload.action_ids))