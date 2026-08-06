"""Run evaluation against all calls that have a transcript but no evaluation yet."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.evaluation.gemini_evaluator import EvaluatorError, EvaluatorNotConfigured, evaluate_call
from app.evaluation.rubric import DEFAULT_SALES_RUBRIC
from app.storage.stores import evaluations_store, transcripts_store


async def main() -> None:
    transcripts = transcripts_store.list_all()
    already_evaluated = {e.call_id for e in evaluations_store.list_all()}

    pending = [t for t in transcripts if t.call_id not in already_evaluated]
    print(f"{len(pending)} calls to evaluate (of {len(transcripts)} total transcripts)")

    for t in pending:
        try:
            result = await evaluate_call(t.call_id, t.text, DEFAULT_SALES_RUBRIC)
            result.id = t.call_id
            evaluations_store.upsert(result)
            avg = sum(result.scores.values()) / len(result.scores) if result.scores else 0
            print(f"  {t.call_id}: avg={avg:.2f} violations={result.violations}")
        except EvaluatorNotConfigured as exc:
            print(f"  skipped, evaluator not configured: {exc}")
            return
        except EvaluatorError as exc:
            print(f"  {t.call_id}: FAILED — {exc}")

    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
