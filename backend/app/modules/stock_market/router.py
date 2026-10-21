from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.database.mongo import get_db
from app.modules.stock_market.allocation import portfolio_allocation
from app.modules.stock_market.coaching import coaching_for
from app.modules.stock_market.engine import analyse_events
from app.modules.stock_market.events import MarketEvent, MarketEventIn
from app.modules.stock_market.store import events_collection, insert_event, upsert_habit_snapshot
from app.modules.stock_market.sectors import COMPANY_SECTORS

router = APIRouter()


def require_db():
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="MongoDB is not connected.")
    return db


def snapshot_from_book(data: dict[str, Any] | None) -> dict[str, Any] | None:
    if not data or not isinstance(data, dict):
        return None
    holdings = []
    for row in data.get("holdings") or []:
        ticker = str(row.get("ticker") or "")
        holdings.append(
            {
                "ticker": ticker,
                "shares": row.get("shares") or 0,
                "avgPrice": row.get("avgPrice") or 0,
                "sector": COMPANY_SECTORS.get(ticker, "Unknown"),
            }
        )
    return portfolio_allocation(float(data.get("cash") or 0), holdings)


@router.post("/api/market/events")
async def save_market_event(body: MarketEventIn) -> dict[str, Any]:
    db = require_db()
    event = MarketEvent.from_in(body)
    stored = await insert_event(db, event)
    return {"ok": True, "at": event.at, "type": event.type, "folder": stored["folder"]}


@router.get("/api/market/behaviour/{child_id}")
async def read_market_behaviour(
    child_id: str,
    session_id: str | None = Query(default=None),
) -> dict[str, Any]:
    db = require_db()
    query: dict[str, Any] = {"child_id": child_id}
    if session_id:
        query["session_id"] = session_id
    events = await events_collection(db).find(query, {"_id": 0}).sort("at", 1).to_list(5000)
    state = await db.module_state.find_one(
        {"child_id": child_id, "module": "market"},
        {"_id": 0},
    )
    snapshot = snapshot_from_book((state or {}).get("data"))
    result = analyse_events(events, snapshot)
    result["child_id"] = child_id
    result["session_id"] = session_id
    result["coaching"] = coaching_for(result["indicators"])
    result["allocation"] = snapshot
    await upsert_habit_snapshot(db, child_id, session_id, result)
    return result
