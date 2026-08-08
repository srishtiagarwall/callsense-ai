from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.schemas import CallEmbedding
from app.search.embeddings import EmbeddingError, EmbeddingNotConfigured, embed_text
from app.search.similarity import search_calls
from app.storage.stores import calls_store, embeddings_store, transcripts_store

router = APIRouter(tags=["search"])

_EMBEDDING_MODEL = "gemini-embedding-001"


class SearchResult(BaseModel):
    call_id: str
    filename: str
    score: float


@router.post("/calls/{call_id}/embed", response_model=CallEmbedding)
def embed_call(call_id: str) -> CallEmbedding:
    transcript = transcripts_store.get(call_id)
    if transcript is None:
        raise HTTPException(status_code=404, detail="Transcript not found — run transcription first")

    try:
        vector = embed_text(transcript.text)
    except EmbeddingNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except EmbeddingError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    result = CallEmbedding(id=call_id, call_id=call_id, embedding=vector, model=_EMBEDDING_MODEL)
    embeddings_store.upsert(result)
    return result


@router.get("/search", response_model=list[SearchResult])
def search(q: str, top_k: int = 10) -> list[SearchResult]:
    if not q.strip():
        raise HTTPException(status_code=400, detail="Query 'q' must not be empty")

    try:
        query_embedding = embed_text(q)
    except EmbeddingNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except EmbeddingError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    embeddings = embeddings_store.list_all()
    ranked = search_calls(query_embedding, embeddings, top_k=top_k)

    results = []
    for call_id, score in ranked:
        call = calls_store.get(call_id)
        if call is not None:
            results.append(SearchResult(call_id=call_id, filename=call.filename, score=round(score, 4)))
    return results
