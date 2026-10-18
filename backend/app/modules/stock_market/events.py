from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, Field

EVENT_TYPES = (
    "company_viewed",
    "market_trend_viewed",
    "risk_explanation_viewed",
    "price_drop_observed",
    "buy_order_placed",
    "sell_order_placed",
    "order_modified",
    "order_cancelled",
    "portfolio_reviewed",
    "trade_reason_submitted",
    "coaching_shown",
    "coaching_response",
)

EventType = Literal[
    "company_viewed",
    "market_trend_viewed",
    "risk_explanation_viewed",
    "price_drop_observed",
    "buy_order_placed",
    "sell_order_placed",
    "order_modified",
    "order_cancelled",
    "portfolio_reviewed",
    "trade_reason_submitted",
    "coaching_shown",
    "coaching_response",
]


class HoldingSnap(BaseModel):
    ticker: str = Field(min_length=1, max_length=12)
    shares: float = 0
    value: float = 0
    sector: str | None = None


class MarketEventIn(BaseModel):
    child_id: str = Field(min_length=8, max_length=80)
    session_id: str = Field(min_length=8, max_length=80)
    type: EventType
    at: str | None = None
    ticker: str | None = Field(default=None, max_length=12)
    scenario_id: str | None = Field(default=None, max_length=80)
    price: float | None = None
    side: Literal["buy", "sell"] | None = None
    shares: int | None = Field(default=None, ge=0)
    cash: float | None = None
    concentration_pct: float | None = None
    sold_fraction: float | None = Field(default=None, ge=0, le=1)
    change_pct: float | None = None
    reason: str | None = Field(default=None, max_length=120)
    order_id: str | None = Field(default=None, max_length=80)
    modified: bool | None = None
    holdings: list[HoldingSnap] | None = None
    equity: float | None = None


class MarketEvent(MarketEventIn):
    at: str

    @classmethod
    def from_in(cls, body: MarketEventIn) -> "MarketEvent":
        payload = body.model_dump()
        payload["at"] = body.at or datetime.now(timezone.utc).isoformat()
        return cls.model_validate(payload)


def parse_at(value: str) -> datetime:
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return datetime.now(timezone.utc)


def as_ms(value: str) -> int:
    return int(parse_at(value).timestamp() * 1000)


def event_dict(event: MarketEvent) -> dict[str, Any]:
    return event.model_dump()
