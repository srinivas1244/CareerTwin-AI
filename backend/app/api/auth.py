"""Auth-adjacent endpoints. Sign up / sign in happen on the client via Supabase;
the backend only verifies tokens and exposes the current user + role options."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.core.security import CurrentUser
from app.domain.role_profiles import list_roles

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/me")
def me(user: CurrentUser = Depends(get_current_user)) -> dict:
    return {"id": user.id, "email": user.email}


@router.get("/roles")
def roles() -> dict:
    return {"roles": list_roles()}
