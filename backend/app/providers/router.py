from pathlib import Path

from app.models.schemas import TranscriptResult
from app.providers.base import ProviderError, ProviderNotConfigured, TranscriptionProvider
from app.providers.gpt4o_transcribe_provider import GPT4oTranscribeProvider
from app.providers.sarvam_saaras_provider import SarvamSaarasProvider
from app.providers.smallest_pulse_provider import SmallestPulseProvider
from app.providers.whisper_provider import WhisperProvider

# Fallback order: cheapest/most reliable first
FALLBACK_CHAIN: list[TranscriptionProvider] = [
    WhisperProvider(),
    GPT4oTranscribeProvider(),
    SmallestPulseProvider(),
    SarvamSaarasProvider(),
]


class AllProvidersFailedError(Exception):
    def __init__(self, attempts: list[dict]):
        self.attempts = attempts
        super().__init__(f"All providers failed: {attempts}")


async def transcribe_with_fallback(
    call_id: str, audio_path: Path, language: str | None
) -> tuple[TranscriptResult, list[dict]]:
    attempts: list[dict] = []

    for provider in FALLBACK_CHAIN:
        if not provider.is_configured():
            attempts.append({"provider": provider.name, "status": "skipped", "reason": "not configured"})
            continue

        try:
            result = await provider.transcribe(call_id, audio_path, language)
            attempts.append({"provider": provider.name, "status": "success"})
            return result, attempts
        except ProviderNotConfigured as exc:
            attempts.append({"provider": provider.name, "status": "skipped", "reason": str(exc)})
        except ProviderError as exc:
            attempts.append({"provider": provider.name, "status": "failed", "reason": str(exc)})

    raise AllProvidersFailedError(attempts)
