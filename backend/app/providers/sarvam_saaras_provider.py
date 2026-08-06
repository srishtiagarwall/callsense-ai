from pathlib import Path

import httpx

from app.config import settings
from app.models.schemas import TranscriptResult
from app.providers.base import ProviderError, ProviderNotConfigured, TranscriptionProvider

SAARAS_URL = "https://api.sarvam.ai/speech-to-text"


class SarvamSaarasProvider(TranscriptionProvider):
    name = "sarvam-saaras-v3"

    def is_configured(self) -> bool:
        return bool(settings.sarvam_api_key)

    async def transcribe(self, call_id: str, audio_path: Path, language: str | None) -> TranscriptResult:
        if not self.is_configured():
            raise ProviderNotConfigured(f"{self.name}: SARVAM_API_KEY not set")

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                with audio_path.open("rb") as f:
                    resp = await client.post(
                        SAARAS_URL,
                        headers={"api-subscription-key": settings.sarvam_api_key},
                        data={"model": "saaras:v3", "mode": "transcribe"},
                        files={"file": (audio_path.name, f, "audio/wav")},
                    )
                resp.raise_for_status()
                data = resp.json()
        except Exception as exc:
            raise ProviderError(f"{self.name}: {exc}") from exc

        return TranscriptResult(
            call_id=call_id,
            provider=self.name,
            language=language,
            text=data.get("transcript", ""),
        )
