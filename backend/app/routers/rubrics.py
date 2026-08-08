from fastapi import APIRouter, HTTPException

from app.evaluation.rubric import Rubric
from app.storage.stores import rubrics_store

router = APIRouter(prefix="/rubrics", tags=["rubrics"])


@router.get("", response_model=list[Rubric])
def list_rubrics() -> list[Rubric]:
    return rubrics_store.list_all()


@router.get("/{rubric_id}", response_model=Rubric)
def get_rubric(rubric_id: str) -> Rubric:
    rubric = rubrics_store.get(rubric_id)
    if rubric is None:
        raise HTTPException(status_code=404, detail="Rubric not found")
    return rubric


@router.post("", response_model=Rubric)
def create_rubric(rubric: Rubric) -> Rubric:
    if rubrics_store.get(rubric.id) is not None:
        raise HTTPException(status_code=409, detail=f"Rubric '{rubric.id}' already exists")
    return rubrics_store.upsert(rubric)


@router.put("/{rubric_id}", response_model=Rubric)
def update_rubric(rubric_id: str, rubric: Rubric) -> Rubric:
    if rubrics_store.get(rubric_id) is None:
        raise HTTPException(status_code=404, detail="Rubric not found")
    rubric.id = rubric_id
    return rubrics_store.upsert(rubric)


@router.delete("/{rubric_id}", status_code=204)
def delete_rubric(rubric_id: str) -> None:
    if rubrics_store.get(rubric_id) is None:
        raise HTTPException(status_code=404, detail="Rubric not found")
    rubrics_store.delete(rubric_id)
