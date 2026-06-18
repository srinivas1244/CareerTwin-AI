"""Application configuration loaded from environment / .env."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # Supabase
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_anon_key: str = ""
    supabase_storage_bucket: str = "resumes"

    # Groq
    groq_api_key: str = ""
    groq_primary_model: str = "llama-3.3-70b-versatile"
    groq_fallback_model: str = "llama-3.1-8b-instant"

    # GitHub (optional)
    github_token: str = ""

    # App
    frontend_origin: str = "http://localhost:3000"
    # Optional regex to allow dynamic origins (e.g. Vercel preview deploys):
    #   FRONTEND_ORIGIN_REGEX=https://.*\.vercel\.app
    frontend_origin_regex: str = ""
    max_resume_mb: int = 5

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.frontend_origin.split(",") if o.strip()]

    @property
    def max_resume_bytes(self) -> int:
        return self.max_resume_mb * 1024 * 1024

    @property
    def ai_configured(self) -> bool:
        return bool(self.groq_api_key)

    @property
    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_service_role_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
