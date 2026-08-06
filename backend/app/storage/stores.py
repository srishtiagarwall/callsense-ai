from app.models.schemas import Call, EvaluationResult, Job, TranscriptResult
from app.storage.json_store import JsonStore

calls_store = JsonStore("calls.json", Call)
jobs_store = JsonStore("jobs.json", Job)
evaluations_store = JsonStore("evaluations.json", EvaluationResult)
transcripts_store = JsonStore("transcripts.json", TranscriptResult)
