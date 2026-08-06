from pathlib import Path

from openai import AsyncOpenAI

from app.config import settings
from app.models.schemas import TranscriptResult
from app.providers.base import ProviderError, ProviderNotConfigured, TranscriptionProvider


class GPT4oTranscribeProvider(TranscriptionProvider):
    name = "openai-gpt4o-transcribe"

    def is_configured(self) -> bool:
        return bool(settings.openai_api_key)

    async def transcribe(self, call_id: str, audio_path: Path, language: str | None) -> TranscriptResult:
        if not self.is_configured():
            raise ProviderNotConfigured(f"{self.name}: OPENAI_API_KEY not set")

        client = AsyncOpenAI(api_key=settings.openai_api_key)
        try:
            with audio_path.open("rb") as f:
                resp = await client.audio.transcriptions.create(
                    model="gpt-4o-transcribe",
                    file=f,
                    language=language,
                )
        except Exception as exc:
            raise ProviderError(f"{self.name}: {exc}") from exc

        return TranscriptResult(
            call_id=call_id,
            provider=self.name,
            language=language,
            text=resp.text,
        )
