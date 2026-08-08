from app.models.schemas import CallEmbedding
from app.search.similarity import cosine_similarity, search_calls


def test_cosine_similarity_identical_vectors_is_one():
    assert abs(cosine_similarity([1.0, 0.0], [1.0, 0.0]) - 1.0) < 1e-9


def test_cosine_similarity_orthogonal_vectors_is_zero():
    assert abs(cosine_similarity([1.0, 0.0], [0.0, 1.0])) < 1e-9


def test_cosine_similarity_opposite_vectors_is_negative_one():
    assert abs(cosine_similarity([1.0, 0.0], [-1.0, 0.0]) - (-1.0)) < 1e-9


def test_cosine_similarity_mismatched_lengths_returns_zero():
    assert cosine_similarity([1.0, 0.0], [1.0, 0.0, 0.0]) == 0.0


def test_cosine_similarity_zero_vector_returns_zero():
    assert cosine_similarity([0.0, 0.0], [1.0, 1.0]) == 0.0


def test_search_calls_ranks_by_similarity_descending():
    query = [1.0, 0.0]
    embeddings = [
        CallEmbedding(call_id="far", embedding=[0.0, 1.0], model="m"),
        CallEmbedding(call_id="close", embedding=[0.99, 0.1], model="m"),
        CallEmbedding(call_id="exact", embedding=[1.0, 0.0], model="m"),
    ]
    ranked = search_calls(query, embeddings, top_k=10)
    assert [call_id for call_id, _ in ranked] == ["exact", "close", "far"]


def test_search_calls_respects_top_k():
    query = [1.0, 0.0]
    embeddings = [CallEmbedding(call_id=f"c{i}", embedding=[1.0, 0.0], model="m") for i in range(5)]
    ranked = search_calls(query, embeddings, top_k=2)
    assert len(ranked) == 2
