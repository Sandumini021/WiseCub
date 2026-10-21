"""
seed.py

Idempotent scenario seeder for Choice Town.
Loads all 10 verified Choice Town scenarios from data/scenarios.json
and seeds them into MongoDB collection `decision_making_scenarios`.
Can be executed as a standalone module:
    python -m app.modules.decision_making.seed
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.database.folders import choice_scenarios
from app.database.mongo import connect, disconnect, get_db
from app.modules.decision_making.models import ScenarioDocument, now_utc_iso

DATA_PATH = Path(__file__).resolve().parent / "data" / "scenarios.json"


def load_raw_scenarios() -> list[dict[str, Any]]:
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Scenarios data file not found at {DATA_PATH}")
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))


async def seed_scenarios(db: AsyncIOMotorDatabase, force_update: bool = False) -> int:
    """
    Seeds all 10 Choice Town scenarios into MongoDB idempotently.
    Returns the number of scenarios inserted or updated.
    """
    raw_list = load_raw_scenarios()
    seeded_count = 0

    for item in raw_list:
        level_id = int(item["levelId"])
        existing = await choice_scenarios(db).find_one({"level_id": level_id})

        now = now_utc_iso()
        doc_data = {
            "level_id": level_id,
            "title": item["title"],
            "description": item.get("description") or item["situation"][:120],
            "preview": item.get("preview") or item["situation"][:150],
            "cub_hint": item.get("cubHint") or "Think about trade-offs before deciding.",
            "icon": item.get("icon") or "complex",
            "playable": item.get("playable", True),
            "situation": item["situation"],
            "facts": [
                {"label": f["label"], "value": f["value"]}
                for f in item.get("facts", [])
            ],
            "options": [
                {
                    "id": opt["id"],
                    "title": opt["title"],
                    "short_label": opt.get("shortLabel") or opt["title"][:20],
                    "summary": opt["summary"],
                    "bullets": opt.get("bullets", []),
                    "immediate": opt["immediate"],
                    "future": opt["future"],
                    "snapshot": {
                        "label": opt.get("snapshot", {}).get("label") or opt["title"],
                        "savings": int(opt.get("snapshot", {}).get("savings", 0)),
                        "debt": int(opt.get("snapshot", {}).get("debt", 0)),
                        "state_label": opt.get("snapshot", {}).get("stateLabel") or "State",
                        "state": opt.get("snapshot", {}).get("state") or "",
                        "note": opt.get("snapshot", {}).get("note") or "",
                    },
                }
                for opt in item.get("options", [])
            ],
            "money_scale": int(item.get("moneyScale", 0)),
            "six_month_assumptions": item.get("sixMonthAssumptions", []),
            "wait_assumption": item.get("waitAssumption"),
            "active": True,
            "schema_version": 1,
            "updated_at": now,
        }

        if existing and not force_update:
            continue

        if not existing:
            doc_data["created_at"] = now

        validated = ScenarioDocument.model_validate(doc_data)
        await choice_scenarios(db).update_one(
            {"level_id": level_id},
            {"$set": validated.model_dump()},
            upsert=True,
        )
        seeded_count += 1

    return seeded_count


async def main() -> None:
    print(f"Connecting to MongoDB at {settings.mongodb_uri} (db: {settings.mongodb_db})...")
    await connect()
    db = get_db()
    if db is None:
        print("Error: Could not connect to MongoDB.")
        return

    try:
        from app.modules.decision_making.indexes import ensure_decision_making_indexes
        await ensure_decision_making_indexes(db)
        print("Decision-making indexes ensured.")

        count = await seed_scenarios(db, force_update=True)
        print(f"Successfully seeded {count} Choice Town scenarios into MongoDB.")

        total = await choice_scenarios(db).count_documents({})
        print(f"Total scenarios in collection: {total}")
    finally:
        await disconnect()
        print("Disconnected.")


if __name__ == "__main__":
    asyncio.run(main())
