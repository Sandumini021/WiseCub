"""
indexes.py

MongoDB index bootstrap for the Decision-Making (Choice Town) module.
Called during application startup inside the lifespan connect() hook.
"""

from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import PyMongoError


async def ensure_decision_making_indexes(db: AsyncIOMotorDatabase) -> None:
    """Create all required indexes for Choice Town collections.
    
    Safe and idempotent — existing indexes are ignored by MongoDB.
    """
    try:
        # Collection A: decision_making_scenarios
        await db.decision_making_scenarios.create_index(
            "level_id",
            unique=True,
            name="dm_scenarios_level_id_unique",
        )
        await db.decision_making_scenarios.create_index(
            "active",
            name="dm_scenarios_active",
        )

        # Collection B: decision_making_progress
        await db.decision_making_progress.create_index(
            "child_id",
            unique=True,
            name="dm_progress_child_id_unique",
        )
        await db.decision_making_progress.create_index(
            "updated_at",
            name="dm_progress_updated_at",
        )

        # Collection C: decision_making_attempts
        await db.decision_making_attempts.create_index(
            "attempt_id",
            unique=True,
            name="dm_attempts_attempt_id_unique",
        )
        await db.decision_making_attempts.create_index(
            [("child_id", 1), ("level_id", 1)],
            name="dm_attempts_child_level",
        )
        await db.decision_making_attempts.create_index(
            [("child_id", 1), ("created_at", -1)],
            name="dm_attempts_child_created_desc",
        )
        await db.decision_making_attempts.create_index(
            "completion_status",
            name="dm_attempts_completion_status",
        )
    except PyMongoError:
        pass
