"""Mongo folders for Virtual Stock Market logs.

Compass groups dotted names. All VSM collections live under:

  Virtual_Stock_Market.market_events   — full tap stream (engine)
  Virtual_Stock_Market.market_views    — company / crowd / drop / bag looks
  Virtual_Stock_Market.market_orders   — buy, sell, modify, cancel
  Virtual_Stock_Market.market_habits   — Cub coaching, popup, snapshots
  Virtual_Stock_Market.market_lessons  — lesson finishes

Practice bag stays in module_state (module=market) with the other WiseCub modules.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.modules.stock_market.events import MarketEvent

NS = "Virtual_Stock_Market"


def packed(short: str) -> str:
    return f"{NS}.{short}"


EVENTS = packed("market_events")
FOLDER_VIEWS = packed("market_views")
FOLDER_ORDERS = packed("market_orders")
FOLDER_HABITS = packed("market_habits")
FOLDER_LESSONS = packed("market_lessons")

EVENT_FOLDER: dict[str, str] = {
    "company_viewed": FOLDER_VIEWS,
    "market_trend_viewed": FOLDER_VIEWS,
    "risk_explanation_viewed": FOLDER_VIEWS,
    "price_drop_observed": FOLDER_VIEWS,
    "portfolio_reviewed": FOLDER_VIEWS,
    "buy_order_placed": FOLDER_ORDERS,
    "sell_order_placed": FOLDER_ORDERS,
    "order_modified": FOLDER_ORDERS,
    "order_cancelled": FOLDER_ORDERS,
    "trade_reason_submitted": FOLDER_HABITS,
    "coaching_shown": FOLDER_HABITS,
    "coaching_response": FOLDER_HABITS,
    "habit_popup_opened": FOLDER_HABITS,
    "habit_card_tapped": FOLDER_HABITS,
    "lesson_completed": FOLDER_LESSONS,
}

ALL_FOLDERS = (EVENTS, FOLDER_VIEWS, FOLDER_ORDERS, FOLDER_HABITS, FOLDER_LESSONS)
LEGACY_FOLDERS = (
    "market_events",
    "market_views",
    "market_orders",
    "market_habits",
    "market_lessons",
)


def collection(db: Any, name: str) -> Any:
    if hasattr(db, "__getitem__"):
        try:
            return db[name]
        except Exception:
            pass
    return getattr(db, name, None)


def events_collection(db: Any) -> Any:
    found = collection(db, EVENTS)
    if found is not None:
        return found
    return getattr(db, "market_events", None)


def folder_for(event_type: str) -> str:
    return EVENT_FOLDER.get(event_type, EVENTS)


async def insert_event(db: Any, event: MarketEvent) -> dict[str, Any]:
    doc = event.model_dump()
    doc["folder"] = folder_for(event.type)
    primary = events_collection(db)
    await primary.insert_one(dict(doc))
    extra = collection(db, doc["folder"])
    if extra is not None and doc["folder"] != EVENTS:
        await extra.insert_one(dict(doc))
    return doc


async def upsert_habit_snapshot(
    db: Any,
    child_id: str,
    session_id: str | None,
    result: dict[str, Any],
) -> None:
    extra = collection(db, FOLDER_HABITS)
    if extra is None:
        return
    review = [
        item
        for item in (result.get("indicators") or [])
        if item.get("level") == "worth_reviewing"
    ]
    doc = {
        "folder": FOLDER_HABITS,
        "kind": "snapshot",
        "child_id": child_id,
        "session_id": session_id,
        "at": datetime.now(timezone.utc).isoformat(),
        "event_count": result.get("event_count"),
        "review": review,
        "indicators": result.get("indicators"),
        "coaching": result.get("coaching"),
        "disclaimer": "Session taps only. Not a diagnosis or a grade.",
    }
    if hasattr(extra, "update_one"):
        await extra.update_one(
            {"kind": "snapshot", "child_id": child_id, "session_id": session_id},
            {"$set": doc},
            upsert=True,
        )
        return
    await extra.insert_one(doc)
