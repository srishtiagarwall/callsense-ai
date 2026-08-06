from abc import ABC, abstractmethod
from pathlib import Path

from app.models.schemas import TranscriptResult


class ProviderNotConfigured(Exception):
    pass


class ProviderError(Exception):
    pass


class TranscriptionProvider(ABC):
    name: str

    @abstractmethod
    def is_configured(self) -> bool:
        ...

    @abstractmethod
    async def transcribe(self, call_id: str, audio_path: Path, language: str | None) -> TranscriptResult:
        ...
