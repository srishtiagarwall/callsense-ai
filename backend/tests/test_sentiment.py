import json

import pytest

from app.models.schemas import TranscriptSegment
from app.sentiment import gemini_sentiment


def seg(speaker: str, text: str) -> TranscriptSegment:
    return TranscriptSegment(speaker=speaker, start=0.0, end=1.0, text=text)


class _FakeResponse:
    def __init__(self, text: str):
        self.text = text


class _FakeModels:
    def __init__(self, response_text: str):
        self._response_text = response_text

    def generate_content(self, **kwargs):
        return _FakeResponse(self._response_text)


class _FakeClient:
    def __init__(self, response_text: str):
        self.models = _FakeModels(response_text)


@pytest.mark.asyncio
async def test_analyze_sentiment_maps_results_by_segment_index(monkeypatch):
    segments = [seg("agent", "Hello!"), seg("customer", "This is terrible.")]
    fake_payload = {
        "segments": [
            {"segment_index": 0, "label": "positive", "score": 0.6},
            {"segment_index": 1, "label": "negative", "score": -0.8},
        ]
    }
    fake_client = _FakeClient(json.dumps(fake_payload))
    monkeypatch.setattr(gemini_sentiment.settings, "gemini_api_key", "fake-key")
    monkeypatch.setattr(gemini_sentiment.genai, "Client", lambda api_key: fake_client)

    results = await gemini_sentiment.analyze_sentiment(segments)

    assert len(results) == 2
    assert results[0].label == "positive"
    assert results[0].speaker == "agent"
    assert results[1].label == "negative"
    assert results[1].score == -0.8


@pytest.mark.asyncio
async def test_analyze_sentiment_defaults_missing_indices_to_neutral(monkeypatch):
    segments = [seg("agent", "Hello!"), seg("customer", "Fine I guess.")]
    fake_payload = {"segments": [{"segment_index": 0, "label": "positive", "score": 0.5}]}
    fake_client = _FakeClient(json.dumps(fake_payload))
    monkeypatch.setattr(gemini_sentiment.settings, "gemini_api_key", "fake-key")
    monkeypatch.setattr(gemini_sentiment.genai, "Client", lambda api_key: fake_client)

    results = await gemini_sentiment.analyze_sentiment(segments)

    assert results[1].label == "neutral"
    assert results[1].score == 0.0


@pytest.mark.asyncio
async def test_analyze_sentiment_empty_segments_returns_empty(monkeypatch):
    monkeypatch.setattr(gemini_sentiment.settings, "gemini_api_key", "fake-key")
    assert await gemini_sentiment.analyze_sentiment([]) == []


@pytest.mark.asyncio
async def test_analyze_sentiment_raises_not_configured_without_key(monkeypatch):
    monkeypatch.setattr(gemini_sentiment.settings, "gemini_api_key", None)
    with pytest.raises(gemini_sentiment.SentimentNotConfigured):
        await gemini_sentiment.analyze_sentiment([seg("agent", "hi")])
