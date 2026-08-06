import uuid
from pathlib import Path

from app.config import settings


def save_audio_file(filename: str, content: bytes) -> tuple[str, Path]:
    ext = Path(filename).suffix
    call_id = str(uuid.uuid4())
    dest = settings.storage_dir / f"{call_id}{ext}"
    dest.write_bytes(content)
    return call_id, dest


def audio_path_for(call_id: str) -> Path | None:
    matches = list(settings.storage_dir.glob(f"{call_id}.*"))
    return matches[0] if matches else None
