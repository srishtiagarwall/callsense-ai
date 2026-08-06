"""Seed the app with the Kaggle 'Call Center Transcripts Dataset' (MIT licensed).

Copies each sample audio file into local storage, creates a Call record,
stores the dataset's ground-truth transcript (skipping paid transcription
APIs), runs the diarization heuristic, and evaluates each call against the
default rubric via Gemini (if GEMINI_API_KEY is configured — otherwise
evaluation is skipped and only calls + transcripts are seeded).
"""

import asyncio
import csv
import shutil
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings
from app.diarization.diarize import diarize_transcript
from app.evaluation.gemini_evaluator import EvaluatorError, EvaluatorNotConfigured, evaluate_call
from app.evaluation.rubric import DEFAULT_SALES_RUBRIC
from app.models.schemas import Call, TranscriptResult
from app.storage.stores import calls_store, evaluations_store, transcripts_store

RAW_DIR = settings.base_dir.parent / "data_raw"
CSV_PATH = RAW_DIR / "call_recordings.csv"


async def main() -> None:
    if not CSV_PATH.exists():
        print(f"Dataset not found at {CSV_PATH}. Download it first.")
        return

    with CSV_PATH.open(encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    seeded = 0
    for row in rows:
        audio_src = RAW_DIR / f"{row['id']}.wav"
        if not audio_src.exists():
            continue

        call_id = str(uuid.uuid4())
        audio_dest = settings.storage_dir / f"{call_id}.wav"
        shutil.copy(audio_src, audio_dest)

        call = Call(id=call_id, filename=audio_src.name, audio_path=str(audio_dest), language="en")
        calls_store.upsert(call)

        text = row["Transcript"]
        segments = diarize_transcript(text)
        transcript = TranscriptResult(
            id=call_id,
            call_id=call_id,
            provider="dataset-ground-truth",
            language="en",
            text=text,
            segments=segments,
        )
        transcripts_store.upsert(transcript)

        try:
            evaluation = await evaluate_call(call_id, text, DEFAULT_SALES_RUBRIC)
            evaluation.id = call_id
            evaluations_store.upsert(evaluation)
        except EvaluatorNotConfigured:
            pass
        except EvaluatorError as exc:
            print(f"  evaluation failed for {row['id']}: {exc}")

        seeded += 1
        print(f"Seeded {row['id']} -> call_id={call_id} ({row['Type']}, {row['Sentiment']})")

    print(f"\nDone. Seeded {seeded} calls.")


if __name__ == "__main__":
    asyncio.run(main())
