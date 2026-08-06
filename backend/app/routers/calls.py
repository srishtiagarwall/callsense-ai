from fastapi import APIRouter, HTTPException, UploadFile

from app.models.schemas import Call
from app.storage.files import save_audio_file
from app.storage.stores import calls_store

router = APIRouter(prefix="/calls", tags=["calls"])


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
    )
    calls_store.upsert(call)
    return call


@router.get("", response_model=list[Call])
def list_calls() -> list[Call]:
    return calls_store.list_all()


@router.get("/{call_id}", response_model=Call)
def get_call(call_id: str) -> Call:
    call = calls_store.get(call_id)
    if call is None:
        raise HTTPException(status_code=404, detail="Call not found")
    return call
