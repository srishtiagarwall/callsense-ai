import json
import threading
from pathlib import Path
from typing import Generic, TypeVar

from pydantic import BaseModel

from app.config import settings

T = TypeVar("T", bound=BaseModel)

_lock = threading.Lock()


class JsonStore(Generic[T]):
    def __init__(self, filename: str, model: type[T]):
        self.path: Path = settings.data_dir / filename
        self.model = model
        if not self.path.exists():
            self.path.write_text("[]", encoding="utf-8")

    def _read_all(self) -> list[dict]:
        with _lock:
            raw = self.path.read_text(encoding="utf-8") or "[]"
            return json.loads(raw)

    def _write_all(self, records: list[dict]) -> None:
        with _lock:
            self.path.write_text(json.dumps(records, indent=2, default=str), encoding="utf-8")

    def list_all(self) -> list[T]:
        return [self.model.model_validate(r) for r in self._read_all()]

    def get(self, id: str) -> T | None:
        for r in self._read_all():
            if r.get("id") == id:
                return self.model.model_validate(r)
        return None

    def upsert(self, item: T) -> T:
        records = self._read_all()
        item_dict = json.loads(item.model_dump_json())
        for i, r in enumerate(records):
            if r.get("id") == item_dict.get("id"):
                records[i] = item_dict
                break
        else:
            records.append(item_dict)
        self._write_all(records)
        return item

    def delete(self, id: str) -> None:
        records = [r for r in self._read_all() if r.get("id") != id]
        self._write_all(records)

    def find(self, **filters) -> list[T]:
        results = []
        for r in self._read_all():
            if all(r.get(k) == v for k, v in filters.items()):
                results.append(self.model.model_validate(r))
        return results
