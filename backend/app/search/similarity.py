import math

from app.models.schemas import CallEmbedding


def cosine_similarity(a: list[float], b: list[float]) -> float:
    if len(a) != len(b) or not a:
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def search_calls(query_embedding: list[float], embeddings: list[CallEmbedding], top_k: int = 10) -> list[tuple[str, float]]:
    scored = [(e.call_id, cosine_similarity(query_embedding, e.embedding)) for e in embeddings]
    scored.sort(key=lambda pair: pair[1], reverse=True)
    return scored[:top_k]
