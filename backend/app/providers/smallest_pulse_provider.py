from pathlib import Path

import httpx

from app.config import settings
from app.models.schemas import TranscriptResult
from app.providers.base import ProviderError, ProviderNotConfigured, TranscriptionProvider

PULSE_URL = "https://api.smallest.ai/waves/v1/pulse/get_text"


class SmallestPulseProvider(TranscriptionProvider):
    name = "smallest-pulse"

    def is_configured(self) -> bool:
        return bool(settings.smallest_api_key)

    async def transcribe(self, call_id: str, audio_path: Path, language: str | None) -> TranscriptResult:
        if not self.is_configured():
            raise ProviderNotConfigured(f"{self.name}: SMALLEST_API_KEY not set")

        params = {}
        if language:
            params["language"] = language

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    PULSE_URL,
                    params=params,
                    headers={
                        "Authorization": f"Bearer {settings.smallest_api_key}",
                        "Content-Type": "audio/wav",
                    },
                    content=audio_path.read_bytes(),
                )
                resp.raise_for_status()
                data = resp.json()
        except Exception as exc:
            raise ProviderError(f"{self.name}: {exc}") from exc

        return TranscriptResult(
            call_id=call_id,
            provider=self.name,
            language=language,
            text=data.get("text", ""),
        )
