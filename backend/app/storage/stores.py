from app.evaluation.rubric import DEFAULT_SALES_RUBRIC, Rubric
from app.models.schemas import (
    Call,
    CallEmbedding,
    EvaluationResult,
    Job,
    SentimentResult,
    TrackerMatch,
    TranscriptResult,
)
from app.storage.json_store import JsonStore

calls_store = JsonStore("calls.json", Call)
jobs_store = JsonStore("jobs.json", Job)
evaluations_store = JsonStore("evaluations.json", EvaluationResult)
transcripts_store = JsonStore("transcripts.json", TranscriptResult)
sentiment_store = JsonStore("sentiment.json", SentimentResult)
tracker_matches_store = JsonStore("tracker_matches.json", TrackerMatch)
rubrics_store = JsonStore("rubrics.json", Rubric)
embeddings_store = JsonStore("embeddings.json", CallEmbedding)

if rubrics_store.get(DEFAULT_SALES_RUBRIC.id) is None:
    rubrics_store.upsert(DEFAULT_SALES_RUBRIC)
