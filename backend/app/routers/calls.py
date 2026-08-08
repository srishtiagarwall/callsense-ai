from fastapi import APIRouter, HTTPException, UploadFile
from pydantic import BaseModel

from app.audio.probe import get_duration_seconds
from app.models.schemas import Call
from app.storage.files import save_audio_file
from app.storage.stores import calls_store

router = APIRouter(prefix="/calls", tags=["calls"])


class PaginatedCalls(BaseModel):
    items: list[Call]
    total: int
    page: int
    page_size: int


_SORT_FIELDS = {"uploaded_at", "filename", "duration_seconds"}


@router.post("/upload", response_model=Call)
async def upload_call(file: UploadFile, language: str | None = None) -> Call:
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file upload")

    call_id, dest_path = save_audio_file(file.filename or "audio", content)
    call = Call(
        id=call_id,
        filename=file.filename or "audio",
        audio_path=str(dest_path),
        language=language,
        duration_seconds=get_duration_seconds(dest_path),
    )
    calls_store.upsert(call)
    return call


@router.get("", response_model=PaginatedCalls)
def list_calls(
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    sort: str = "-uploaded_at",
) -> PaginatedCalls:
    calls = calls_store.list_all()

    if search:
        needle = search.lower()
        calls = [c for c in calls if needle in c.filename.lower()]

    sort_field = sort.lstrip("-")
    descending = sort.startswith("-")
    if sort_field in _SORT_FIELDS:
        calls.sort(key=lambda c: (getattr(c, sort_field) is None, getattr(c, sort_field)), reverse=descending)

    total = len(calls)
    start = max(page - 1, 0) * page_size
    page_items = calls[start : start + page_size]

    return PaginatedCalls(items=page_items, total=total, page=page, page_size=page_size)


@router.get("/{call_id}", response_model=Call)
def get_call(call_id: str) -> Call:
    call = calls_store.get(call_id)
    if call is None:
        raise HTTPException(status_code=404, detail="Call not found")
    return call
