import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings  # noqa: E402


@pytest.fixture(autouse=True)
def isolated_data_dir(tmp_path, monkeypatch):
    """Point settings AND already-constructed store singletons at a throwaway
    directory, so tests never touch real data/storage.

    JsonStore instances (app.storage.stores.calls_store etc.) resolve their
    file path once, at import time, from settings.data_dir — patching
    settings alone has no effect on code that already holds a reference to
    those singletons (e.g. anything routed through TestClient(app)). Every
    store's .path must be repointed directly.
    """
    data_dir = tmp_path / "data"
    storage_dir = tmp_path / "storage"
    data_dir.mkdir()
    storage_dir.mkdir()
    monkeypatch.setattr(settings, "data_dir", data_dir)
    monkeypatch.setattr(settings, "storage_dir", storage_dir)

    from app.storage import stores as stores_module

    for name in dir(stores_module):
        obj = getattr(stores_module, name)
        if hasattr(obj, "path") and hasattr(obj, "_read_all"):  # duck-type: a JsonStore instance
            new_path = data_dir / obj.path.name
            new_path.write_text("[]", encoding="utf-8")
            monkeypatch.setattr(obj, "path", new_path)

    # rubrics_store normally auto-seeds DEFAULT_SALES_RUBRIC at import time
    # (before this fixture repoints .path) — redo that seeding against the
    # now-empty tmp file so tests see the same zero-setup default a real run would.
    if stores_module.rubrics_store.get(stores_module.DEFAULT_SALES_RUBRIC.id) is None:
        stores_module.rubrics_store.upsert(stores_module.DEFAULT_SALES_RUBRIC)

    yield data_dir, storage_dir
