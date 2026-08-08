from pydantic import BaseModel

from app.storage.json_store import JsonStore


class Widget(BaseModel):
    id: str
    name: str
    count: int = 0


def test_new_store_creates_empty_file(isolated_data_dir):
    data_dir, _ = isolated_data_dir
    store = JsonStore("widgets.json", Widget)
    assert store.path == data_dir / "widgets.json"
    assert store.list_all() == []


def test_upsert_then_get(isolated_data_dir):
    store = JsonStore("widgets.json", Widget)
    store.upsert(Widget(id="1", name="a"))
    fetched = store.get("1")
    assert fetched is not None
    assert fetched.name == "a"


def test_upsert_overwrites_existing_id(isolated_data_dir):
    store = JsonStore("widgets.json", Widget)
    store.upsert(Widget(id="1", name="a", count=1))
    store.upsert(Widget(id="1", name="b", count=2))
    all_items = store.list_all()
    assert len(all_items) == 1
    assert all_items[0].name == "b"
    assert all_items[0].count == 2


def test_get_missing_returns_none(isolated_data_dir):
    store = JsonStore("widgets.json", Widget)
    assert store.get("does-not-exist") is None


def test_list_all_returns_all_records(isolated_data_dir):
    store = JsonStore("widgets.json", Widget)
    store.upsert(Widget(id="1", name="a"))
    store.upsert(Widget(id="2", name="b"))
    ids = {w.id for w in store.list_all()}
    assert ids == {"1", "2"}


def test_delete_removes_record(isolated_data_dir):
    store = JsonStore("widgets.json", Widget)
    store.upsert(Widget(id="1", name="a"))
    store.upsert(Widget(id="2", name="b"))
    store.delete("1")
    remaining_ids = {w.id for w in store.list_all()}
    assert remaining_ids == {"2"}


def test_find_filters_by_field(isolated_data_dir):
    store = JsonStore("widgets.json", Widget)
    store.upsert(Widget(id="1", name="a", count=5))
    store.upsert(Widget(id="2", name="b", count=5))
    store.upsert(Widget(id="3", name="c", count=9))
    matches = store.find(count=5)
    assert {w.id for w in matches} == {"1", "2"}


def test_store_persists_across_instances(isolated_data_dir):
    JsonStore("widgets.json", Widget).upsert(Widget(id="1", name="a"))
    reopened = JsonStore("widgets.json", Widget)
    assert reopened.get("1") is not None
