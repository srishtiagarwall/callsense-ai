import uuid

from fastapi import APIRouter, HTTPException

from app.models.schemas import TrackerMatch
from app.storage.stores import tracker_matches_store, transcripts_store
from app.trackers.config import Tracker, list_trackers
from app.trackers.matcher import match_trackers

router = APIRouter(tags=["trackers"])


@router.get("/trackers", response_model=list[Tracker])
def get_trackers() -> list[Tracker]:
    return list_trackers()


@router.post("/calls/{call_id}/trackers/run", response_model=list[TrackerMatch])
def run_trackers(call_id: str) -> list[TrackerMatch]:
    transcript = transcripts_store.get(call_id)
    if transcript is None:
        raise HTTPException(status_code=404, detail="Transcript not found — run transcription first")

    for existing in tracker_matches_store.find(call_id=call_id):
        tracker_matches_store.delete(existing.id)

    matches = match_trackers(call_id, transcript.segments, list_trackers())
    for match in matches:
        match.id = str(uuid.uuid4())
        tracker_matches_store.upsert(match)
    return matches


@router.get("/calls/{call_id}/trackers", response_model=list[TrackerMatch])
def get_tracker_matches(call_id: str) -> list[TrackerMatch]:
    return tracker_matches_store.find(call_id=call_id)
