"""
MongoDB index bootstrap for the gamified-learning module.
Called once during app startup (inside the existing lifespan connect()).

Collections created:
  gamified_missions        — seeded catalog metadata (read-only reference)
  gamified_progress        — one authoritative record per (child_id, mission_id)
  financial_decisions      — every submitted decision with full raw payload
  mission_attempts         — per-level attempt records (full mastery results)
  competency_assessments   — per-attempt competency dimension scores
  character_state_history  — per-attempt character state snapshots
"""
from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import PyMongoError

from app.database.folders import (
    GL_ATTEMPTS,
    GL_CHARACTER,
    GL_COMPETENCY,
    GL_DECISIONS,
    GL_PROGRESS,
)


async def ensure_gamified_indexes(db: AsyncIOMotorDatabase) -> None:
    """Create all indexes for the gamified-learning collections.

    Safe to call on every startup — MongoDB is idempotent on existing indexes.
    """
    try:
        # gamified_progress: one record per student × mission
        await db[GL_PROGRESS].create_index(
            [("child_id", 1), ("mission_id", 1)],
            unique=True,
            name="progress_child_mission_unique",
        )
        await db[GL_PROGRESS].create_index(
            "child_id",
            name="progress_child_id",
        )
        await db[GL_PROGRESS].create_index(
            "updated_at",
            name="progress_updated_at",
        )

        await db[GL_DECISIONS].create_index(
            "idempotency_key",
            unique=True,
            name="decisions_idempotency_key",
        )
        await db[GL_DECISIONS].create_index(
            [("child_id", 1), ("mission_id", 1), ("level_number", 1)],
            name="decisions_child_mission_level",
        )
        await db[GL_DECISIONS].create_index(
            [("pseudo_id", 1), ("submitted_at", 1)],
            name="decisions_research_export",
        )

        await db[GL_ATTEMPTS].create_index(
            [("child_id", 1), ("mission_id", 1), ("level_number", 1)],
            name="attempts_child_mission_level",
        )
        await db[GL_ATTEMPTS].create_index(
            [("child_id", 1), ("mission_id", 1)],
            name="attempts_child_mission",
        )

        await db[GL_COMPETENCY].create_index(
            [("child_id", 1), ("mission_id", 1)],
            name="competency_child_mission",
        )
        await db[GL_COMPETENCY].create_index(
            [("child_id", 1), ("assessed_at", -1)],
            name="competency_child_recent",
        )

        await db[GL_CHARACTER].create_index(
            [("child_id", 1), ("mission_id", 1)],
            name="char_state_child_mission",
        )
        await db[GL_CHARACTER].create_index(
            [("child_id", 1), ("recorded_at", -1)],
            name="char_state_child_recent",
        )

    except PyMongoError:
        # Non-fatal: indexes will be created when connection is restored
        pass
