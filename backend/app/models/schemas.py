from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


def _now() -> datetime:
    return datetime.utcnow()


class JobStatus(StrEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    DONE = "done"
    FAILED = "failed"


class Call(BaseModel):
    id: str
    filename: str
    audio_path: str
    language: str | None = None
    uploaded_at: datetime = Field(default_factory=_now)
    duration_seconds: float | None = None


class TranscriptSegment(BaseModel):
    speaker: str
    start: float
    end: float
    text: str


class TranscriptResult(BaseModel):
    id: str | None = None  # set to call_id when persisted — one transcript per call
    call_id: str
    provider: str
    language: str | None = None
    text: str
    segments: list[TranscriptSegment] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=_now)


class Job(BaseModel):
    id: str
    call_id: str
    kind: str  # "transcription" | "evaluation"
    status: JobStatus = JobStatus.PENDING
    attempts: list[dict[str, Any]] = Field(default_factory=list)
    error: str | None = None
    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime = Field(default_factory=_now)


class EvaluationResult(BaseModel):
    id: str | None = None  # set to call_id when persisted — latest evaluation per call
    call_id: str
    rubric_id: str
    scores: dict[str, float]
    violations: list[str] = Field(default_factory=list)
    summary: str
    raw: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=_now)
