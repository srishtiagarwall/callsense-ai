from google import genai

from app.config import settings

_EMBEDDING_MODEL = "gemini-embedding-001"


class EmbeddingNotConfigured(Exception):
    pass


class EmbeddingError(Exception):
    pass


def embed_text(text: str) -> list[float]:
    if not settings.gemini_api_key:
        raise EmbeddingNotConfigured("GEMINI_API_KEY not set")
    if not text.strip():
        raise EmbeddingError("Cannot embed empty text")

    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        response = client.models.embed_content(model=_EMBEDDING_MODEL, contents=text)
        if not response.embeddings:
            raise EmbeddingError(f"{_EMBEDDING_MODEL}: no embedding returned")
        return list(response.embeddings[0].values)
    except EmbeddingError:
        raise
    except Exception as exc:
        raise EmbeddingError(f"{_EMBEDDING_MODEL}: {exc}") from exc
