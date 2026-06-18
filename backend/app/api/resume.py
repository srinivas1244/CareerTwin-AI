"""Resume upload endpoint."""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, Request, UploadFile

from app.api.deps import get_current_user
from app.core.rate_limit import limiter
from app.core.security import CurrentUser
from app.repositories.resume_repo import ResumeRepository
from app.schemas.career import ResumeUploadResponse
from app.services import resume_service

router = APIRouter(prefix="/api/resume", tags=["resume"])


@router.post("", response_model=ResumeUploadResponse)
@limiter.limit("10/minute")
def upload_resume(
    request: Request,
    file: UploadFile = File(...),
    user: CurrentUser = Depends(get_current_user),
) -> ResumeUploadResponse:
    content = file.file.read()
    resume_service.validate_upload(file.filename or "", file.content_type or "", len(content))

    raw_text = resume_service.extract_text(content, file.filename or "")
    repo = ResumeRepository()
    storage_path = None
    try:
        storage_path = repo.upload_file(
            user.id, content, file.filename or "resume", file.content_type or "application/octet-stream"
        )
    except Exception:
        # Storage is best-effort; we still keep the parsed text for analysis.
        storage_path = None

    saved = repo.create(
        user_id=user.id,
        file_name=file.filename or "resume",
        storage_path=storage_path,
        mime_type=file.content_type or "",
        file_size=len(content),
        raw_text=raw_text,
    )
    return ResumeUploadResponse(
        resume_id=str(saved.get("id", "")),
        file_name=file.filename or "resume",
        has_text=bool(raw_text.strip()),
        char_count=len(raw_text),
    )
