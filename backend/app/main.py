"""CareerTwin AI — FastAPI application entrypoint."""
from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.api import (
    auth,
    career_profile,
    chat,
    github,
    hiring_score,
    project_gaps,
    reality_check,
    resume,
    roadmap,
    simulator,
)
from app.core.config import settings
from app.core.errors import AppError
from app.core.rate_limit import limiter

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="CareerTwin AI",
    version="1.0.0",
    description="Career Twin intelligence profile + deterministic Hiring Score.",
)

app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.frontend_origin_regex or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
def handle_app_error(_: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.exception_handler(RateLimitExceeded)
def handle_rate_limit(_: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please slow down and try again."},
    )


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {
        "status": "ok",
        "supabase_configured": settings.supabase_configured,
        "ai_configured": settings.ai_configured,
    }


for r in (auth.router, resume.router, github.router, career_profile.router,
          hiring_score.router, reality_check.router, project_gaps.router,
          simulator.router, chat.router, roadmap.router):
    app.include_router(r)
