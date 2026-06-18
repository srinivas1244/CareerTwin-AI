"""Persistence for resumes: Storage upload + DB row."""
from __future__ import annotations

from app.core.config import settings
from app.core.errors import UpstreamError
from app.repositories.base import SupabaseRepository


class ResumeRepository(SupabaseRepository):
    table_name = "resumes"

    def upload_file(
        self, user_id: str, file_bytes: bytes, filename: str, content_type: str
    ) -> str:
        """Upload to Supabase Storage; returns the stored object path."""
        path = f"{user_id}/{filename}"
        try:
            self.client.storage.from_(settings.supabase_storage_bucket).upload(
                path,
                file_bytes,
                {"content-type": content_type, "upsert": "true"},
            )
        except Exception as exc:
            raise UpstreamError(f"Resume upload failed: {exc}") from exc
        return path

    def create(
        self,
        *,
        user_id: str,
        file_name: str,
        storage_path: str | None,
        mime_type: str,
        file_size: int,
        raw_text: str,
        parsed_json: dict | None = None,
    ) -> dict:
        row = {
            "user_id": user_id,
            "file_name": file_name,
            "storage_path": storage_path,
            "mime_type": mime_type,
            "file_size": file_size,
            "raw_text": raw_text,
            "parsed_json": parsed_json or {},
        }
        return self._first(self.table.insert(row).execute()) or row

    def get_latest(self, user_id: str) -> dict | None:
        return self._first(
            self.table.select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
