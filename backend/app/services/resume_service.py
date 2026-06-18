"""Resume handling: validation, text extraction (PDF/DOCX), and the
deterministic 'resume quality' signals that feed the Hiring Score."""
from __future__ import annotations

import io
import re

from app.core.config import settings
from app.core.errors import ValidationFailed
from app.domain.scoring import ResumeQualitySignals

PDF_MIME = "application/pdf"
DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
ALLOWED_EXT = {".pdf", ".docx"}

EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
PHONE_RE = re.compile(r"(\+?\d[\d\s().-]{7,}\d)")

ACTION_VERBS = {
    "built", "designed", "developed", "implemented", "created", "led", "managed",
    "analyzed", "optimized", "automated", "deployed", "engineered", "improved",
    "launched", "delivered", "architected", "reduced", "increased", "migrated",
    "integrated", "tested", "shipped", "collaborated", "researched",
}


def validate_upload(filename: str, content_type: str, size: int) -> None:
    name = (filename or "").lower()
    ext = name[name.rfind(".") :] if "." in name else ""
    if ext not in ALLOWED_EXT:
        raise ValidationFailed("Only PDF and DOCX resumes are supported.")
    if size <= 0:
        raise ValidationFailed("Uploaded file is empty.")
    if size > settings.max_resume_bytes:
        raise ValidationFailed(
            f"Resume exceeds the {settings.max_resume_mb} MB limit."
        )


def extract_text(file_bytes: bytes, filename: str) -> str:
    name = (filename or "").lower()
    if name.endswith(".pdf"):
        return _extract_pdf(file_bytes)
    if name.endswith(".docx"):
        return _extract_docx(file_bytes)
    raise ValidationFailed("Unsupported resume format.")


def _extract_pdf(file_bytes: bytes) -> str:
    from pypdf import PdfReader

    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        return "\n".join((page.extract_text() or "") for page in reader.pages).strip()
    except Exception as exc:
        raise ValidationFailed(f"Could not read PDF: {exc}") from exc


def _extract_docx(file_bytes: bytes) -> str:
    from docx import Document

    try:
        doc = Document(io.BytesIO(file_bytes))
        parts = [p.text for p in doc.paragraphs]
        for table in doc.tables:
            for row in table.rows:
                parts.extend(cell.text for cell in row.cells)
        return "\n".join(parts).strip()
    except Exception as exc:
        raise ValidationFailed(f"Could not read DOCX: {exc}") from exc


def compute_quality_signals(raw_text: str) -> ResumeQualitySignals:
    """Deterministic resume completeness heuristics (no AI)."""
    text = raw_text or ""
    low = text.lower()
    words = re.findall(r"[A-Za-z][A-Za-z'+-]*", text)
    verb_hits = sum(1 for w in words if w.lower() in ACTION_VERBS)

    def has_any(*keys: str) -> bool:
        return any(k in low for k in keys)

    return ResumeQualitySignals(
        has_skills=has_any("skill", "technical proficienc", "technolog"),
        has_projects=has_any("project"),
        has_experience=has_any("experience", "employment", "work history"),
        has_education=has_any("education", "b.tech", "bachelor", "degree", "university"),
        has_certifications=has_any("certification", "certificate", "certified"),
        has_contact=bool(EMAIL_RE.search(text) or PHONE_RE.search(text)),
        word_count=len(words),
        action_verb_count=verb_hits,
    )
