from app.config import Settings


def test_data_dir_and_storage_dir_overridable_via_env(monkeypatch, tmp_path):
    custom_data = tmp_path / "custom_data"
    custom_storage = tmp_path / "custom_storage"
    monkeypatch.setenv("DATA_DIR", str(custom_data))
    monkeypatch.setenv("STORAGE_DIR", str(custom_storage))

    settings = Settings()

    assert settings.data_dir == custom_data
    assert settings.storage_dir == custom_storage


def test_data_dir_defaults_to_base_dir_relative_path(monkeypatch):
    monkeypatch.delenv("DATA_DIR", raising=False)
    monkeypatch.delenv("STORAGE_DIR", raising=False)

    settings = Settings()

    assert settings.data_dir == settings.base_dir / "data"
    assert settings.storage_dir == settings.base_dir / "storage"
