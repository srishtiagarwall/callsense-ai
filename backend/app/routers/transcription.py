import asyncio
import json
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse

from app.analytics.talk_metrics import TalkMetrics, compute_talk_metrics
from app.diarization.audio_diarize import DiarizationError, diarize_audio
from app.diarization.diarize import diarize_transcript
from app.models.schemas import Job, JobStatus, TranscriptResult
from app.providers.router import AllProvidersFailedError, transcribe_with_fallback
from app.storage.stores import calls_store, jobs_store, transcripts_store

router = APIRouter(prefix="/calls", tags=["transcription"])


async def _run_transcription_job(job_id: str, call_id: str, audio_path: str, language: str | None) -> None:
    job = jobs_store.get(job_id)
    if job is None:
        return

    job.status = JobStatus.PROCESSING
    job.updated_at = datetime.utcnow()
    jobs_store.upsert(job)

    try:
        result, attempts = await transcribe_with_fallback(call_id, Path(audio_path), language)
        if not result.segments:
            try:
                # CPU-bound (VAD + torch embedding + clustering) — run off the event loop.
                result.segments = await asyncio.to_thread(diarize_audio, Path(audio_path), result.text)
            except DiarizationError:
                result.segments = diarize_transcript(result.text)
        job.status = JobStatus.DONE
        job.attempts = attempts
        job.updated_at = datetime.utcnow()
        jobs_store.upsert(job)
        result.id = call_id
        transcripts_store.upsert(result)
    except AllProvidersFailedError as exc:
        job.status = JobStatus.FAILED
        job.attempts = exc.attempts
        job.error = "All transcription providers failed or unconfigured"
        job.updated_at = datetime.utcnow()
        jobs_store.upsert(job)


@router.post("/{call_id}/transcribe", response_model=Job)
async def start_transcription(call_id: str, background_tasks: BackgroundTasks) -> Job:
    call = calls_store.get(call_id)
    if call is None:
        raise HTTPException(status_code=404, detail="Call not found")

    job = Job(id=str(uuid.uuid4()), call_id=call_id, kind="transcription")
    jobs_store.upsert(job)

    background_tasks.add_task(_run_transcription_job, job.id, call_id, call.audio_path, call.language)
    return job


@router.get("/{call_id}/transcription/jobs/{job_id}", response_model=Job)
def get_transcription_job(call_id: str, job_id: str) -> Job:
    job = jobs_store.get(job_id)
    if job is None or job.call_id != call_id:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


async def _job_event_stream(call_id: str, job_id: str):
    last_sent: str | None = None
    while True:
        job = jobs_store.get(job_id)
        if job is None or job.call_id != call_id:
            yield f"data: {json.dumps({'error': 'Job not found'})}\n\n"
            return

        payload = json.loads(job.model_dump_json())
        serialized = json.dumps(payload)
        if serialized != last_sent:
            yield f"data: {serialized}\n\n"
            last_sent = serialized

        if job.status in (JobStatus.DONE, JobStatus.FAILED):
            return

        await asyncio.sleep(1)


@router.get("/{call_id}/transcription/jobs/{job_id}/stream")
async def stream_transcription_job(call_id: str, job_id: str) -> StreamingResponse:
    job = jobs_store.get(job_id)
    if job is None or job.call_id != call_id:
        raise HTTPException(status_code=404, detail="Job not found")

    return StreamingResponse(
        _job_event_stream(call_id, job_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/{call_id}/transcript", response_model=TranscriptResult)
def get_transcript(call_id: str) -> TranscriptResult:
    result = transcripts_store.get(call_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Transcript not found")
    return result


@router.get("/{call_id}/talk-metrics", response_model=TalkMetrics)
def get_talk_metrics(call_id: str) -> TalkMetrics:
    result = transcripts_store.get(call_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Transcript not found")
    return compute_talk_metrics(result.segments)
