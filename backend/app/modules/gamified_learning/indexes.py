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


async def ensure_gamified_indexes(db: AsyncIOMotorDatabase) -> None:
    """Create all indexes for the gamified-learning collections.

    Safe to call on every startup — MongoDB is idempotent on existing indexes.
    """
    try:
        # gamified_progress: one record per student × mission
        await db.gamified_progress.create_index(
            [("child_id", 1), ("mission_id", 1)],
            unique=True,
            name="progress_child_mission_unique",
        )
        await db.gamified_progress.create_index(
            "child_id",
            name="progress_child_id",
        )
        await db.gamified_progress.create_index(
            "updated_at",
            name="progress_updated_at",
        )

        # financial_decisions: research dataset — idempotency key prevents duplicates
        await db.financial_decisions.create_index(
            "idempotency_key",
            unique=True,
            name="decisions_idempotency_key",
        )
        await db.financial_decisions.create_index(
            [("child_id", 1), ("mission_id", 1), ("level_number", 1)],
            name="decisions_child_mission_level",
        )
        await db.financial_decisions.create_index(
            [("pseudo_id", 1), ("submitted_at", 1)],
            name="decisions_research_export",
        )

        # mission_attempts: per-level attempt log
        await db.mission_attempts.create_index(
            [("child_id", 1), ("mission_id", 1), ("level_number", 1)],
            name="attempts_child_mission_level",
        )
        await db.mission_attempts.create_index(
            [("child_id", 1), ("mission_id", 1)],
            name="attempts_child_mission",
        )

        # competency_assessments: learning analytics
        await db.competency_assessments.create_index(
            [("child_id", 1), ("mission_id", 1)],
            name="competency_child_mission",
        )
        await db.competency_assessments.create_index(
            [("child_id", 1), ("assessed_at", -1)],
            name="competency_child_recent",
        )

        # character_state_history
        await db.character_state_history.create_index(
            [("child_id", 1), ("mission_id", 1)],
            name="char_state_child_mission",
        )
        await db.character_state_history.create_index(
            [("child_id", 1), ("recorded_at", -1)],
            name="char_state_child_recent",
        )

    except PyMongoError:
        # Non-fatal: indexes will be created when connection is restored
        pass
