from pydantic import BaseModel, Field


class RubricCriterion(BaseModel):
    id: str
    description: str
    weight: float = 1.0


class Rubric(BaseModel):
    id: str
    name: str
    script_steps: list[str] = Field(default_factory=list)
    compliance_rules: list[RubricCriterion] = Field(default_factory=list)
    qa_criteria: list[RubricCriterion] = Field(default_factory=list)


DEFAULT_SALES_RUBRIC = Rubric(
    id="default-sales-qa",
    name="Default Sales Call QA",
    script_steps=[
        "Greet the customer and introduce yourself and the company",
        "Confirm the customer's needs or reason for the call",
        "Present the relevant product/offer clearly",
        "Address any objections raised by the customer",
        "Summarize next steps and close the call politely",
    ],
    compliance_rules=[
        RubricCriterion(id="disclosure", description="Agent disclosed pricing/terms clearly before close"),
        RubricCriterion(id="no_misleading_claims", description="Agent did not make false or misleading claims"),
        RubricCriterion(id="consent", description="Agent obtained clear consent before proceeding with any commitment"),
    ],
    qa_criteria=[
        RubricCriterion(id="tone", description="Agent maintained a professional and courteous tone"),
        RubricCriterion(id="active_listening", description="Agent listened to and acknowledged customer concerns"),
        RubricCriterion(id="resolution", description="Customer's issue or request was resolved or clearly next-stepped"),
    ],
)

RUBRICS: dict[str, Rubric] = {DEFAULT_SALES_RUBRIC.id: DEFAULT_SALES_RUBRIC}


def get_rubric(rubric_id: str) -> Rubric | None:
    return RUBRICS.get(rubric_id)
