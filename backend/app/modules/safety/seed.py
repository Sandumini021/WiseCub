"""
seed.py

Idempotent educational database seeder for WiseCub Member 4 — Scam Safety.
Loads synthetic educational demo data from data/synthetic_demo_data.json
and safely upserts records into MongoDB collections:
  - `children`           (ensures demo child record exists)
  - `guardian_consent`   (verified demo parent/guardian consent)
  - `safety_simulations` (6 educational simulations across levels 1-6)
  - `module_state`       (baseline progress for the safety module)

Can be executed as a standalone module:
    python -m app.modules.safety.seed

Safety Guarantees:
- Idempotent: safe to run multiple times without creating duplicates.
- Non-destructive: uses $set with upsert; never drops, deletes, or alters unrelated records.
- 100% Synthetic: uses clearly labeled demo IDs and dummy local addresses.
"""

from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path
import sys
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.database.mongo import connect, disconnect, get_client, get_db

DATA_PATH = Path(__file__).resolve().parent / "data" / "synthetic_demo_data.json"


def load_synthetic_demo_data() -> dict[str, Any]:
    """Loads and validates the synthetic demo fixtures JSON file."""
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Synthetic demo fixtures not found at {DATA_PATH}")
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))


async def ensure_safety_indexes(db: AsyncIOMotorDatabase) -> None:
    """Ensures all required indexes exist on safety collections."""
    await db.children.create_index("child_id", unique=True)
    await db.guardian_consent.create_index("child_id", unique=True)
    await db.safety_simulations.create_index(
        [("child_id", 1), ("category_id", 1), ("attempt_id", 1)],
        unique=True,
    )
    await db.safety_simulations.create_index("simulation_id", unique=True)
    await db.module_state.create_index(
        [("child_id", 1), ("module", 1)],
        unique=True,
    )


async def seed_scam_safety(
    db: AsyncIOMotorDatabase,
    force_update: bool = True,
) -> dict[str, int]:
    """
    Seeds synthetic Scam Safety data into MongoDB idempotently.
    Returns a dictionary of counts for each seeded collection.
    """
    data = load_synthetic_demo_data()
    counts = {
        "children": 0,
        "guardian_consent": 0,
        "module_state": 0,
        "safety_simulations": 0,
    }

    await ensure_safety_indexes(db)

    # 1. Seed demo child if specified
    demo_child = data.get("demo_child")
    if demo_child:
        child_id = demo_child["child_id"]
        existing = await db.children.find_one({"child_id": child_id})
        if not existing or force_update:
            await db.children.update_one(
                {"child_id": child_id},
                {"$set": demo_child},
                upsert=True,
            )
            counts["children"] += 1

    # 2. Seed verified demo guardian consent
    guardian = data.get("guardian_consent")
    if guardian:
        child_id = guardian["child_id"]
        existing = await db.guardian_consent.find_one({"child_id": child_id})
        if not existing or force_update:
            await db.guardian_consent.update_one(
                {"child_id": child_id},
                {"$set": guardian},
                upsert=True,
            )
            counts["guardian_consent"] += 1

    # 3. Seed safety module state
    mod_state = data.get("module_state")
    if mod_state:
        child_id = mod_state["child_id"]
        module = mod_state["module"]
        existing = await db.module_state.find_one({"child_id": child_id, "module": module})
        if not existing or force_update:
            await db.module_state.update_one(
                {"child_id": child_id, "module": module},
                {"$set": mod_state},
                upsert=True,
            )
            counts["module_state"] += 1

    # 4. Seed educational simulation history (Levels 1 to 6)
    simulations = data.get("safety_simulations", [])
    for sim in simulations:
        sim_id = sim["simulation_id"]
        existing = await db.safety_simulations.find_one({"simulation_id": sim_id})
        if not existing or force_update:
            await db.safety_simulations.update_one(
                {"simulation_id": sim_id},
                {"$set": sim},
                upsert=True,
            )
            counts["safety_simulations"] += 1

    return counts


async def run_seeder(target_db_name: str | None = None, force_update: bool = True) -> dict[str, int]:
    """
    Connects to the database and executes the idempotent seeding operation.
    """
    db_name = target_db_name or settings.mongodb_db
    print(f"[WiseCub Seeder] Connecting to MongoDB URI: {settings.mongodb_uri}")
    print(f"[WiseCub Seeder] Target database name: {db_name}")

    await connect()
    client = get_client()
    if client is None:
        raise RuntimeError("Could not establish connection to MongoDB. Verify mongod is running.")

    db = client[db_name]

    try:
        print("[WiseCub Seeder] Ensuring collections and indexes...")
        counts = await seed_scam_safety(db, force_update=force_update)
        print(f"[WiseCub Seeder] Success! Seeded counts into '{db_name}':")
        for coll, count in counts.items():
            print(f"  - {coll}: {count} record(s)")
        return counts
    finally:
        await disconnect()
        print("[WiseCub Seeder] Connection closed cleanly.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Idempotent MongoDB seeder for WiseCub Scam Safety demo data."
    )
    parser.add_argument(
        "--target-db",
        type=str,
        default=None,
        help="Optional database name override (defaults to MONGODB_DB from settings).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate JSON fixtures and exit without connecting to MongoDB.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if args.dry_run:
        print("[WiseCub Seeder] Dry run mode enabled.")
        data = load_synthetic_demo_data()
        sim_count = len(data.get("safety_simulations", []))
        print(f"[WiseCub Seeder] Fixtures verified valid: {sim_count} simulation(s) ready.")
        sys.exit(0)

    asyncio.run(run_seeder(target_db_name=args.target_db))


if __name__ == "__main__":
    main()
