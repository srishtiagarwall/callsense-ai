from pathlib import Path

import pytest

from app.models.schemas import TranscriptResult
from app.providers import router as router_module
from app.providers.base import ProviderError, ProviderNotConfigured, TranscriptionProvider
from app.providers.router import AllProvidersFailedError, transcribe_with_fallback


class FakeProvider(TranscriptionProvider):
    def __init__(self, name: str, configured: bool = True, outcome: str = "success"):
        self.name = name
        self._configured = configured
        self._outcome = outcome  # "success" | "error"

    def is_configured(self) -> bool:
        return self._configured

    async def transcribe(self, call_id: str, audio_path: Path, language: str | None) -> TranscriptResult:
        if self._outcome == "error":
            raise ProviderError(f"{self.name} blew up")
        return TranscriptResult(call_id=call_id, provider=self.name, text=f"transcript from {self.name}")


@pytest.mark.asyncio
async def test_uses_first_configured_provider(monkeypatch):
    monkeypatch.setattr(
        router_module,
        "FALLBACK_CHAIN",
        [FakeProvider("skipped", configured=False), FakeProvider("winner"), FakeProvider("never-reached")],
    )
    result, attempts = await transcribe_with_fallback("call-1", Path("audio.wav"), None)
    assert result.provider == "winner"
    assert attempts == [
        {"provider": "skipped", "status": "skipped", "reason": "not configured"},
        {"provider": "winner", "status": "success"},
    ]


@pytest.mark.asyncio
async def test_falls_back_after_provider_error(monkeypatch):
    monkeypatch.setattr(
        router_module,
        "FALLBACK_CHAIN",
        [FakeProvider("flaky", outcome="error"), FakeProvider("backup")],
    )
    result, attempts = await transcribe_with_fallback("call-1", Path("audio.wav"), None)
    assert result.provider == "backup"
    assert attempts[0]["status"] == "failed"
    assert attempts[1]["status"] == "success"


@pytest.mark.asyncio
async def test_all_providers_failed_raises_with_attempts(monkeypatch):
    monkeypatch.setattr(
        router_module,
        "FALLBACK_CHAIN",
        [FakeProvider("a", configured=False), FakeProvider("b", outcome="error")],
    )
    with pytest.raises(AllProvidersFailedError) as exc_info:
        await transcribe_with_fallback("call-1", Path("audio.wav"), None)
    assert exc_info.value.attempts == [
        {"provider": "a", "status": "skipped", "reason": "not configured"},
        {"provider": "b", "status": "failed", "reason": "b blew up"},
    ]


@pytest.mark.asyncio
async def test_provider_not_configured_raised_at_call_time(monkeypatch):
    class RaisesNotConfigured(TranscriptionProvider):
        name = "sneaky"

        def is_configured(self) -> bool:
            return True  # lies — raises on transcribe() instead

        async def transcribe(self, call_id, audio_path, language):
            raise ProviderNotConfigured("actually not configured")

    monkeypatch.setattr(router_module, "FALLBACK_CHAIN", [RaisesNotConfigured(), FakeProvider("backup")])
    result, attempts = await transcribe_with_fallback("call-1", Path("audio.wav"), None)
    assert result.provider == "backup"
    assert attempts[0]["status"] == "skipped"
