import json

import pytest

from app.evaluation import gemini_evaluator
from app.evaluation.rubric import DEFAULT_SALES_RUBRIC


def test_build_prompt_includes_transcript_and_rubric_criteria():
    prompt = gemini_evaluator._build_prompt("Hello, how can I help?", DEFAULT_SALES_RUBRIC)
    assert "Hello, how can I help?" in prompt
    assert "step_1" in prompt
    assert "disclosure" in prompt
    assert "tone" in prompt


class _FakeResponse:
    def __init__(self, text: str):
        self.text = text


class _FakeModels:
    def __init__(self, response_text: str):
        self._response_text = response_text
        self.last_call_kwargs = None

    def generate_content(self, **kwargs):
        self.last_call_kwargs = kwargs
        return _FakeResponse(self._response_text)


class _FakeClient:
    def __init__(self, response_text: str):
        self.models = _FakeModels(response_text)


@pytest.mark.asyncio
async def test_evaluate_call_flattens_scores_from_gemini_response(monkeypatch):
    fake_payload = {
        "script_adherence": [{"id": "step_1", "score": 0.8, "note": "greeted well"}],
        "compliance": [{"id": "disclosure", "score": 1.0, "note": "disclosed terms"}],
        "qa": [{"id": "tone", "score": 0.9, "note": "polite"}],
        "violations": [],
        "summary": "Solid call overall.",
        "agent_present": True,
    }
    fake_client = _FakeClient(json.dumps(fake_payload))
    monkeypatch.setattr(gemini_evaluator.settings, "gemini_api_key", "fake-key")
    monkeypatch.setattr(gemini_evaluator.genai, "Client", lambda api_key: fake_client)

    result = await gemini_evaluator.evaluate_call("call-1", "some transcript", DEFAULT_SALES_RUBRIC)

    assert result.call_id == "call-1"
    assert result.rubric_id == DEFAULT_SALES_RUBRIC.id
    assert result.scores == {"step_1": 0.8, "disclosure": 1.0, "tone": 0.9}
    assert result.violations == []
    assert result.summary == "Solid call overall."
    assert result.agent_present is True


@pytest.mark.asyncio
async def test_evaluate_call_raises_not_configured_without_api_key(monkeypatch):
    monkeypatch.setattr(gemini_evaluator.settings, "gemini_api_key", None)
    with pytest.raises(gemini_evaluator.EvaluatorNotConfigured):
        await gemini_evaluator.evaluate_call("call-1", "transcript", DEFAULT_SALES_RUBRIC)


@pytest.mark.asyncio
async def test_evaluate_call_wraps_sdk_exceptions(monkeypatch):
    class _BrokenModels:
        def generate_content(self, **kwargs):
            raise RuntimeError("network blew up")

    class _BrokenClient:
        def __init__(self):
            self.models = _BrokenModels()

    monkeypatch.setattr(gemini_evaluator.settings, "gemini_api_key", "fake-key")
    monkeypatch.setattr(gemini_evaluator.genai, "Client", lambda api_key: _BrokenClient())

    with pytest.raises(gemini_evaluator.EvaluatorError):
        await gemini_evaluator.evaluate_call("call-1", "transcript", DEFAULT_SALES_RUBRIC)
