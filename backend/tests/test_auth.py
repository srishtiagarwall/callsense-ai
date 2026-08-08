from fastapi.testclient import TestClient

from app.config import settings
from app.main import app


def test_no_key_configured_allows_unauthenticated_access(isolated_data_dir, monkeypatch):
    monkeypatch.setattr(settings, "api_key", None)
    client = TestClient(app)
    resp = client.get("/calls")
    assert resp.status_code == 200


def test_key_configured_rejects_missing_key(isolated_data_dir, monkeypatch):
    monkeypatch.setattr(settings, "api_key", "secret123")
    client = TestClient(app)
    resp = client.get("/calls")
    assert resp.status_code == 401


def test_key_configured_accepts_correct_header(isolated_data_dir, monkeypatch):
    monkeypatch.setattr(settings, "api_key", "secret123")
    client = TestClient(app)
    resp = client.get("/calls", headers={"X-API-Key": "secret123"})
    assert resp.status_code == 200


def test_key_configured_rejects_wrong_header(isolated_data_dir, monkeypatch):
    monkeypatch.setattr(settings, "api_key", "secret123")
    client = TestClient(app)
    resp = client.get("/calls", headers={"X-API-Key": "wrong"})
    assert resp.status_code == 401


def test_key_configured_accepts_query_param_fallback(isolated_data_dir, monkeypatch):
    monkeypatch.setattr(settings, "api_key", "secret123")
    client = TestClient(app)
    resp = client.get("/calls", params={"key": "secret123"})
    assert resp.status_code == 200


def test_health_endpoint_never_requires_key(isolated_data_dir, monkeypatch):
    monkeypatch.setattr(settings, "api_key", "secret123")
    client = TestClient(app)
    resp = client.get("/health")
    assert resp.status_code == 200
