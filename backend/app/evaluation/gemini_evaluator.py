import json

from google import genai
from google.genai import types
from pydantic import BaseModel

from app.config import settings
from app.evaluation.rubric import Rubric
from app.models.schemas import EvaluationResult


class EvaluatorNotConfigured(Exception):
    pass


class EvaluatorError(Exception):
    pass


class _CriterionScore(BaseModel):
    id: str
    score: float
    note: str


class _EvaluationSchema(BaseModel):
    script_adherence: list[_CriterionScore]
    compliance: list[_CriterionScore]
    qa: list[_CriterionScore]
    violations: list[str]
    summary: str
    agent_present: bool


def _criterion_list_schema() -> dict:
    return {
        "type": "ARRAY",
        "items": {
            "type": "OBJECT",
            "properties": {
                "id": {"type": "STRING"},
                "score": {"type": "NUMBER"},
                "note": {"type": "STRING"},
            },
            "required": ["id", "score", "note"],
        },
    }


# Gemini's schema format has no $ref/$defs, so this is built as a flat dict
# rather than derived from _EvaluationSchema.model_json_schema() (which uses $ref
# for the repeated _CriterionScore sub-model and gets rejected by the SDK).
_RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "script_adherence": _criterion_list_schema(),
        "compliance": _criterion_list_schema(),
        "qa": _criterion_list_schema(),
        "violations": {"type": "ARRAY", "items": {"type": "STRING"}},
        "summary": {"type": "STRING"},
        "agent_present": {"type": "BOOLEAN"},
    },
    "required": ["script_adherence", "compliance", "qa", "violations", "summary", "agent_present"],
}


def _build_prompt(transcript_text: str, rubric: Rubric) -> str:
    return f"""You are a call-center QA evaluator. Score the following call transcript against the rubric below.

RUBRIC: {rubric.name}

Script steps (score adherence to each, 0-1; use "step_<n>" as the id, 1-indexed):
{chr(10).join(f"- step_{i + 1}: {s}" for i, s in enumerate(rubric.script_steps))}

Compliance rules (score adherence to each, 0-1; list any violated as a violation):
{chr(10).join(f"- {c.id}: {c.description}" for c in rubric.compliance_rules)}

QA criteria (score adherence to each, 0-1):
{chr(10).join(f"- {c.id}: {c.description}" for c in rubric.qa_criteria)}

TRANSCRIPT:
{transcript_text}

Return a score (0-1) and short note for every script step, compliance rule, and QA criterion listed above,
a list of violated compliance rule ids (empty if none), a one-paragraph summary of call quality, and
agent_present: true only if an agent/representative is actually speaking in the transcript (false if the
transcript contains only one party, e.g. a customer leaving feedback with no agent responses)."""


async def evaluate_call(call_id: str, transcript_text: str, rubric: Rubric) -> EvaluationResult:
    if not settings.gemini_api_key:
        raise EvaluatorNotConfigured("GEMINI_API_KEY not set")

    client = genai.Client(api_key=settings.gemini_api_key)
    prompt = _build_prompt(transcript_text, rubric)

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=_RESPONSE_SCHEMA,
            ),
        )
        parsed = _EvaluationSchema.model_validate_json(response.text)
    except Exception as exc:
        raise EvaluatorError(f"gemini-2.5-flash: {exc}") from exc

    all_scores = parsed.script_adherence + parsed.compliance + parsed.qa
    scores = {s.id: s.score for s in all_scores}

    return EvaluationResult(
        call_id=call_id,
        rubric_id=rubric.id,
        scores=scores,
        violations=parsed.violations,
        summary=parsed.summary,
        agent_present=parsed.agent_present,
        raw=json.loads(parsed.model_dump_json()),
    )
