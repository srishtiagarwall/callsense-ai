from fastapi import APIRouter, HTTPException

from app.evaluation.gemini_evaluator import EvaluatorError, EvaluatorNotConfigured, evaluate_call
from app.evaluation.rubric import DEFAULT_SALES_RUBRIC, get_rubric
from app.models.schemas import EvaluationResult
from app.storage.stores import evaluations_store, transcripts_store

router = APIRouter(prefix="/calls", tags=["evaluation"])


@router.post("/{call_id}/evaluate", response_model=EvaluationResult)
async def evaluate(call_id: str, rubric_id: str = DEFAULT_SALES_RUBRIC.id) -> EvaluationResult:
    transcript = transcripts_store.get(call_id)
    if transcript is None:
        raise HTTPException(status_code=404, detail="Transcript not found — run transcription first")

    rubric = get_rubric(rubric_id)
    if rubric is None:
        raise HTTPException(status_code=404, detail=f"Rubric '{rubric_id}' not found")

    try:
        result = await evaluate_call(call_id, transcript.text, rubric)
    except EvaluatorNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except EvaluatorError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    result.id = call_id
    evaluations_store.upsert(result)
    return result


@router.get("/{call_id}/evaluation", response_model=EvaluationResult)
def get_evaluation(call_id: str) -> EvaluationResult:
    result = evaluations_store.get(call_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return result
