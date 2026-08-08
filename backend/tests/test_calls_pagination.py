from fastapi.testclient import TestClient

from app.main import app


def _upload(client: TestClient, filename: str, content: bytes = b"fake-audio-bytes"):
    return client.post("/calls/upload", files={"file": (filename, content, "audio/wav")})


def test_list_calls_returns_paginated_envelope(isolated_data_dir):
    client = TestClient(app)
    _upload(client, "alpha.wav")
    _upload(client, "beta.wav")

    resp = client.get("/calls")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 2
    assert body["page"] == 1
    assert len(body["items"]) == 2


def test_list_calls_search_filters_by_filename(isolated_data_dir):
    client = TestClient(app)
    _upload(client, "acme_support.wav")
    _upload(client, "other_call.wav")

    resp = client.get("/calls", params={"search": "acme"})
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["filename"] == "acme_support.wav"


def test_list_calls_pagination_respects_page_size(isolated_data_dir):
    client = TestClient(app)
    for i in range(5):
        _upload(client, f"call_{i}.wav")

    resp = client.get("/calls", params={"page": 1, "page_size": 2})
    body = resp.json()
    assert len(body["items"]) == 2
    assert body["total"] == 5

    resp2 = client.get("/calls", params={"page": 3, "page_size": 2})
    body2 = resp2.json()
    assert len(body2["items"]) == 1


def test_list_calls_sort_by_filename_ascending(isolated_data_dir):
    client = TestClient(app)
    _upload(client, "zeta.wav")
    _upload(client, "alpha.wav")

    resp = client.get("/calls", params={"sort": "filename"})
    filenames = [c["filename"] for c in resp.json()["items"]]
    assert filenames == ["alpha.wav", "zeta.wav"]
