"""
indexes.py

MongoDB index bootstrap for the Decision-Making (Choice Town) module.
Called during application startup inside the lifespan connect() hook.
"""

from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import PyMongoError

from app.database.folders import CT_ATTEMPTS, CT_PROGRESS, CT_SCENARIOS


async def ensure_decision_making_indexes(db: AsyncIOMotorDatabase) -> None:
    """Create all required indexes for Choice Town collections.
    
    Safe and idempotent — existing indexes are ignored by MongoDB.
    """
    try:
        # Collection A: decision_making_scenarios
        await db[CT_SCENARIOS].create_index(
            "level_id",
            unique=True,
            name="dm_scenarios_level_id_unique",
        )
        await db[CT_SCENARIOS].create_index(
            "active",
            name="dm_scenarios_active",
        )

        await db[CT_PROGRESS].create_index(
            "child_id",
            unique=True,
            name="dm_progress_child_id_unique",
        )
        await db[CT_PROGRESS].create_index(
            "updated_at",
            name="dm_progress_updated_at",
        )

        await db[CT_ATTEMPTS].create_index(
            "attempt_id",
            unique=True,
            name="dm_attempts_attempt_id_unique",
        )
        await db[CT_ATTEMPTS].create_index(
            [("child_id", 1), ("level_id", 1)],
            name="dm_attempts_child_level",
        )
        await db[CT_ATTEMPTS].create_index(
            [("child_id", 1), ("created_at", -1)],
            name="dm_attempts_child_created_desc",
        )
        await db[CT_ATTEMPTS].create_index(
            "completion_status",
            name="dm_attempts_completion_status",
        )
    except PyMongoError:
        pass
