from pydantic import BaseModel, Field


class Tracker(BaseModel):
    id: str
    name: str
    keywords: list[str] = Field(default_factory=list)


TRACKERS: dict[str, Tracker] = {
    t.id: t
    for t in [
        Tracker(
            id="competitor_mention",
            name="Competitor mention",
            keywords=["competitor", "another provider", "switch to", "other company", "elsewhere"],
        ),
        Tracker(
            id="pricing_discount",
            name="Pricing / discount",
            keywords=["price", "pricing", "discount", "cost", "how much", "cheaper", "expensive"],
        ),
        Tracker(
            id="cancellation_churn",
            name="Cancellation / churn risk",
            keywords=["cancel", "cancellation", "terminate", "unsubscribe", "close my account", "no longer need"],
        ),
        Tracker(
            id="escalation",
            name="Escalation request",
            keywords=["manager", "supervisor", "escalate", "higher level", "someone else"],
        ),
        Tracker(
            id="refund",
            name="Refund request",
            keywords=["refund", "money back", "reimburse", "chargeback"],
        ),
    ]
}


def list_trackers() -> list[Tracker]:
    return list(TRACKERS.values())
