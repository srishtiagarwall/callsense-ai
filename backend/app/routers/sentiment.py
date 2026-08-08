from fastapi import APIRouter, HTTPException

from app.models.schemas import SentimentResult
from app.sentiment.gemini_sentiment import SentimentError, SentimentNotConfigured, analyze_sentiment
from app.storage.stores import sentiment_store, transcripts_store

router = APIRouter(prefix="/calls", tags=["sentiment"])


@router.post("/{call_id}/sentiment", response_model=SentimentResult)
async def run_sentiment(call_id: str) -> SentimentResult:
    transcript = transcripts_store.get(call_id)
    if transcript is None:
        raise HTTPException(status_code=404, detail="Transcript not found — run transcription first")

    try:
        segments = await analyze_sentiment(transcript.segments)
    except SentimentNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except SentimentError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    result = SentimentResult(id=call_id, call_id=call_id, segments=segments)
    sentiment_store.upsert(result)
    return result


@router.get("/{call_id}/sentiment", response_model=SentimentResult)
def get_sentiment(call_id: str) -> SentimentResult:
    result = sentiment_store.get(call_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Sentiment analysis not found — run it first")
    return result
