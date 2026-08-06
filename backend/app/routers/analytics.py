from collections import Counter
from datetime import date

from fastapi import APIRouter
from pydantic import BaseModel

from app.storage.stores import calls_store, evaluations_store

router = APIRouter(prefix="/analytics", tags=["analytics"])


class SummaryResponse(BaseModel):
    total_calls: int
    total_evaluated: int
    avg_score: float | None
    total_violations: int


class TrendPoint(BaseModel):
    date: str
    call_count: int
    avg_score: float | None


class ViolationCount(BaseModel):
    violation: str
    count: int


@router.get("/summary", response_model=SummaryResponse)
def summary() -> SummaryResponse:
    calls = calls_store.list_all()
    evals = evaluations_store.list_all()

    all_scores = [s for e in evals for s in e.scores.values()]
    avg_score = round(sum(all_scores) / len(all_scores), 3) if all_scores else None
    total_violations = sum(len(e.violations) for e in evals)

    return SummaryResponse(
        total_calls=len(calls),
        total_evaluated=len(evals),
        avg_score=avg_score,
        total_violations=total_violations,
    )


@router.get("/trends", response_model=list[TrendPoint])
def trends() -> list[TrendPoint]:
    calls = calls_store.list_all()
    evals_by_call = {e.call_id: e for e in evaluations_store.list_all()}

    by_day: dict[date, list[float]] = {}
    counts: dict[date, int] = {}
    for call in calls:
        day = call.uploaded_at.date()
        counts[day] = counts.get(day, 0) + 1
        ev = evals_by_call.get(call.id)
        if ev and ev.scores:
            by_day.setdefault(day, []).extend(ev.scores.values())

    points = []
    for day in sorted(counts.keys()):
        scores = by_day.get(day, [])
        points.append(
            TrendPoint(
                date=day.isoformat(),
                call_count=counts[day],
                avg_score=round(sum(scores) / len(scores), 3) if scores else None,
            )
        )
    return points


@router.get("/violations", response_model=list[ViolationCount])
def violations() -> list[ViolationCount]:
    evals = evaluations_store.list_all()
    counter = Counter(v for e in evals for v in e.violations)
    return [ViolationCount(violation=v, count=c) for v, c in counter.most_common()]
