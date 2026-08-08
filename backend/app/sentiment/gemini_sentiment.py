import json

from google import genai
from google.genai import types
from pydantic import BaseModel

from app.config import settings
from app.models.schemas import SegmentSentiment, TranscriptSegment


class SentimentNotConfigured(Exception):
    pass


class SentimentError(Exception):
    pass


class _SegmentSentimentSchema(BaseModel):
    segment_index: int
    label: str
    score: float


class _SentimentResponseSchema(BaseModel):
    segments: list[_SegmentSentimentSchema]


_RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "segments": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "segment_index": {"type": "INTEGER"},
                    "label": {"type": "STRING", "enum": ["positive", "neutral", "negative"]},
                    "score": {"type": "NUMBER"},
                },
                "required": ["segment_index", "label", "score"],
            },
        },
    },
    "required": ["segments"],
}


def _build_prompt(segments: list[TranscriptSegment]) -> str:
    lines = "\n".join(f"{i}. [{s.speaker}] {s.text}" for i, s in enumerate(segments))
    return f"""You are analyzing sentiment in a call-center transcript, segment by segment.

For each numbered segment below, return its segment_index, a sentiment label
("positive", "neutral", or "negative"), and a score from -1 (very negative) to
1 (very positive) reflecting that speaker's emotional tone in that segment.

SEGMENTS:
{lines}

Return one result per segment index, covering every index from 0 to {len(segments) - 1}."""


async def analyze_sentiment(segments: list[TranscriptSegment]) -> list[SegmentSentiment]:
    if not settings.gemini_api_key:
        raise SentimentNotConfigured("GEMINI_API_KEY not set")
    if not segments:
        return []

    client = genai.Client(api_key=settings.gemini_api_key)
    prompt = _build_prompt(segments)

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=_RESPONSE_SCHEMA,
            ),
        )
        parsed = _SentimentResponseSchema.model_validate_json(response.text)
    except Exception as exc:
        raise SentimentError(f"gemini-2.5-flash: {exc}") from exc

    by_index = {s.segment_index: s for s in parsed.segments}
    results: list[SegmentSentiment] = []
    for i, segment in enumerate(segments):
        match = by_index.get(i)
        results.append(
            SegmentSentiment(
                segment_index=i,
                speaker=segment.speaker,
                label=match.label if match else "neutral",
                score=match.score if match else 0.0,
            )
        )
    return results
