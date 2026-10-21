"""
store.py

MongoDB-backed persistence layer for the Decision-Making (Choice Town) module.
Replaces the prototype file-based storage with async Motor operations for:
- Authoritative scenario catalog
- Child-isolated learner progress
- Longitudinal historical scenario attempts
"""

from __future__ import annotations

from typing import Any
from uuid import uuid4

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database.folders import choice_attempts, choice_progress, choice_scenarios

from app.modules.decision_making.models import (
    AttemptDocument,
    MoneySnapshotModel,
    OptionId,
    ProgressDocument,
    ScenarioDocument,
    now_utc_iso,
)
from app.modules.decision_making.schemas import (
    AdaptiveRecommendation,
    AnalysisResult,
    AnalyticsOut,
    AttemptSummaryOut,
    ChoiceTownProgress,
    DecisionOptionOut,
    LevelSession,
    MoneySnapshotOut,
    ScenarioFactOut,
    ScenarioOut,
)

TOTAL_LEVELS = 10


# ─────────────────────────────────────────────────────────────────────────────
# SCENARIO CATALOG
# ─────────────────────────────────────────────────────────────────────────────

def _map_scenario_doc(doc: dict[str, Any]) -> ScenarioOut:
    facts = [ScenarioFactOut(label=f["label"], value=f["value"]) for f in doc.get("facts", [])]
    options = [
        DecisionOptionOut(
            id=opt["id"],
            title=opt["title"],
            short_label=opt.get("short_label") or opt.get("shortLabel") or opt["title"],
            summary=opt["summary"],
            bullets=opt.get("bullets", []),
            immediate=opt["immediate"],
            future=opt["future"],
            snapshot=MoneySnapshotOut(
                label=opt["snapshot"]["label"],
                savings=int(opt["snapshot"]["savings"]),
                debt=int(opt["snapshot"]["debt"]),
                state_label=opt["snapshot"].get("state_label") or opt["snapshot"].get("stateLabel") or "State",
                state=opt["snapshot"]["state"],
                note=opt["snapshot"].get("note", ""),
            ),
        )
        for opt in doc.get("options", [])
    ]
    return ScenarioOut(
        level_id=int(doc["level_id"]),
        title=doc["title"],
        description=doc.get("description", ""),
        preview=doc.get("preview", ""),
        cub_hint=doc.get("cub_hint") or doc.get("cubHint", ""),
        icon=doc.get("icon", "complex"),
        playable=doc.get("playable", True),
        situation=doc["situation"],
        facts=facts,
        options=options,
        money_scale=int(doc.get("money_scale", 0)),
        six_month_assumptions=doc.get("six_month_assumptions", []),
        wait_assumption=doc.get("wait_assumption"),
        active=doc.get("active", True),
    )


async def get_active_scenarios(db: AsyncIOMotorDatabase) -> list[ScenarioOut]:
    """Retrieve all active Choice Town scenarios sorted by level_id (1-10)."""
    cursor = choice_scenarios(db).find({"active": True}, {"_id": 0}).sort("level_id", 1)
    docs = await cursor.to_list(length=20)
    return [_map_scenario_doc(doc) for doc in docs]


async def get_scenario_by_level(db: AsyncIOMotorDatabase, level_id: int) -> ScenarioOut | None:
    """Retrieve a single active scenario by level_id."""
    doc = await choice_scenarios(db).find_one({"level_id": level_id, "active": True}, {"_id": 0})
    if not doc:
        return None
    return _map_scenario_doc(doc)


# ─────────────────────────────────────────────────────────────────────────────
# LEARNER PROGRESS (PER-CHILD ISOLATION)
# ─────────────────────────────────────────────────────────────────────────────

def _map_progress_doc(doc: dict[str, Any], child_id: str) -> ChoiceTownProgress:
    sessions: dict[str, LevelSession] = {}
    for key, sess_dict in (doc.get("active_sessions") or doc.get("sessions") or {}).items():
        sessions[str(key)] = LevelSession.model_validate(sess_dict)

    return ChoiceTownProgress(
        child_id=child_id,
        completed_level_ids=doc.get("completed_level_ids", []),
        current_level_id=doc.get("current_level_id", 1),
        sessions=sessions,
        updated_at=doc.get("updated_at") or now_utc_iso(),
        storage="mongodb",
    )


async def get_child_progress(db: AsyncIOMotorDatabase, child_id: str) -> ChoiceTownProgress:
    """
    Fetch the authenticated child's progress document from MongoDB.
    Initializes a clean progress record (Level 1, 0 completed) if none exists.
    """
    doc = await choice_progress(db).find_one({"child_id": child_id}, {"_id": 0})
    if not doc:
        now = now_utc_iso()
        init_doc = {
            "child_id": child_id,
            "completed_level_ids": [],
            "current_level_id": 1,
            "active_sessions": {},
            "updated_at": now,
            "schema_version": 1,
        }
        await choice_progress(db).update_one(
            {"child_id": child_id},
            {"$set": init_doc},
            upsert=True,
        )
        return _map_progress_doc(init_doc, child_id)

    return _map_progress_doc(doc, child_id)


async def save_child_decision(
    db: AsyncIOMotorDatabase,
    child_id: str,
    level_id: int,
    option_id: OptionId,
) -> ChoiceTownProgress:
    """
    Records a chosen option for a scenario step 1.
    Creates or updates an active attempt in decision_making_attempts and
    updates active_sessions in decision_making_progress.
    """
    progress = await get_child_progress(db, child_id)
    key = str(level_id)
    current_session = progress.sessions.get(key, LevelSession())
    updated_session = current_session.model_copy(update={"option_id": option_id})

    now = now_utc_iso()
    sessions = dict(progress.sessions)
    sessions[key] = updated_session

    # Update or insert active in-progress attempt record
    active_attempt = await choice_attempts(db).find_one(
        {"child_id": child_id, "level_id": level_id, "completion_status": "in_progress"}
    )
    if active_attempt:
        await choice_attempts(db).update_one(
            {"attempt_id": active_attempt["attempt_id"]},
            {"$set": {"selected_option_id": option_id, "updated_at": now}},
        )
    else:
        new_attempt = AttemptDocument(
            child_id=child_id,
            level_id=level_id,
            selected_option_id=option_id,
            completion_status="in_progress",
            started_at=now,
            created_at=now,
            updated_at=now,
        )
        await choice_attempts(db).insert_one(new_attempt.model_dump())

    # Persist updated progress
    await choice_progress(db).update_one(
        {"child_id": child_id},
        {
            "$set": {
                f"active_sessions.{key}": updated_session.model_dump(by_alias=True),
                "updated_at": now,
            }
        },
        upsert=True,
    )
    return await get_child_progress(db, child_id)


async def save_child_reasoning(
    db: AsyncIOMotorDatabase,
    child_id: str,
    level_id: int,
    option_id: OptionId,
    reasoning: str,
    analysis: AnalysisResult,
    recommendations: list[AdaptiveRecommendation],
) -> ChoiceTownProgress:
    """
    Saves the analyzed reasoning and generated recommendations for an active level.
    Updates the active attempt in decision_making_attempts and active_sessions in progress.
    """
    progress = await get_child_progress(db, child_id)
    key = str(level_id)
    now = now_utc_iso()

    updated_session = LevelSession(
        option_id=option_id,
        reasoning=reasoning,
        analysis=analysis,
        recommendations=recommendations,
        completed=False,
    )

    # Update active attempt
    await choice_attempts(db).update_one(
        {"child_id": child_id, "level_id": level_id, "completion_status": "in_progress"},
        {
            "$set": {
                "selected_option_id": option_id,
                "reasoning_text": reasoning,
                "analysis": analysis.model_dump(by_alias=True),
                "recommendations": [r.model_dump(by_alias=True) for r in recommendations],
                "reasoning_submitted_at": now,
                "updated_at": now,
            }
        },
        upsert=True,
    )

    # Persist in progress
    await choice_progress(db).update_one(
        {"child_id": child_id},
        {
            "$set": {
                f"active_sessions.{key}": updated_session.model_dump(by_alias=True),
                "updated_at": now,
            }
        },
        upsert=True,
    )
    return await get_child_progress(db, child_id)


async def complete_child_level(
    db: AsyncIOMotorDatabase,
    child_id: str,
    level_id: int,
) -> ChoiceTownProgress:
    """
    Marks the active attempt for this level as completed.
    Updates completed_level_ids, computes the next unlocked level, and marks the session completed.
    """
    progress = await get_child_progress(db, child_id)
    now = now_utc_iso()

    completed_set = set(progress.completed_level_ids)
    completed_set.add(level_id)
    completed_ids = sorted(completed_set)

    # Next unlocked level is the first level from 1..10 not yet completed
    remaining = [lvl for lvl in range(1, TOTAL_LEVELS + 1) if lvl not in completed_set]
    current_level = remaining[0] if remaining else TOTAL_LEVELS

    # Mark active attempt as completed
    await choice_attempts(db).update_one(
        {"child_id": child_id, "level_id": level_id, "completion_status": "in_progress"},
        {
            "$set": {
                "completion_status": "completed",
                "completed_at": now,
                "updated_at": now,
            }
        },
    )

    key = str(level_id)
    session = progress.sessions.get(key, LevelSession())
    session_dict = session.model_copy(update={"completed": True}).model_dump(by_alias=True)

    await choice_progress(db).update_one(
        {"child_id": child_id},
        {
            "$set": {
                "completed_level_ids": completed_ids,
                "current_level_id": current_level,
                f"active_sessions.{key}": session_dict,
                "updated_at": now,
            }
        },
    )
    return await get_child_progress(db, child_id)


async def reset_child_progress(
    db: AsyncIOMotorDatabase,
    child_id: str,
) -> ChoiceTownProgress:
    """
    Resets the child's active progress to Level 1 and clears completed levels.
    Marks any in-progress attempts as abandoned.
    Existing completed attempts are preserved in historical records for research/analytics.
    """
    now = now_utc_iso()

    # Mark active in-progress attempts as abandoned
    await choice_attempts(db).update_many(
        {"child_id": child_id, "completion_status": "in_progress"},
        {"$set": {"completion_status": "abandoned", "updated_at": now}},
    )

    reset_doc = {
        "child_id": child_id,
        "completed_level_ids": [],
        "current_level_id": 1,
        "active_sessions": {},
        "updated_at": now,
        "schema_version": 1,
    }

    await choice_progress(db).update_one(
        {"child_id": child_id},
        {"$set": reset_doc},
        upsert=True,
    )
    return _map_progress_doc(reset_doc, child_id)


# ─────────────────────────────────────────────────────────────────────────────
# HISTORICAL ATTEMPTS & ANALYTICS
# ─────────────────────────────────────────────────────────────────────────────

async def get_child_completed_attempts(
    db: AsyncIOMotorDatabase,
    child_id: str,
    limit: int = 50,
) -> list[dict[str, Any]]:
    """Retrieve historical completed attempts for a child."""
    cursor = choice_attempts(db).find(
        {"child_id": child_id, "completion_status": "completed"},
        {"_id": 0},
    ).sort("created_at", -1)
    return await cursor.to_list(length=limit)


async def get_child_analytics(
    db: AsyncIOMotorDatabase,
    child_id: str,
    child_name: str | None = None,
) -> AnalyticsOut:
    """
    Generates privacy-preserving analytics for guardians and teachers.
    Aggregates competency dimension scores and learning gaps without exposing
    raw free-text reasoning.
    """
    progress = await get_child_progress(db, child_id)
    completed_attempts = await get_child_completed_attempts(db, child_id, limit=50)

    dim_totals: dict[str, float] = {
        "immediateNeeds": 0.0,
        "savingsAwareness": 0.0,
        "borrowingObligations": 0.0,
        "futureConsequences": 0.0,
        "comparingAlternatives": 0.0,
        "explainingClearly": 0.0,
    }
    dim_counts: dict[str, int] = {k: 0 for k in dim_totals}

    for att in completed_attempts:
        analysis = att.get("analysis") or {}
        for d in analysis.get("dimensions", []):
            d_id = d.get("id")
            if d_id in dim_totals:
                dim_totals[d_id] += float(d.get("score", 0))
                dim_counts[d_id] += 1

    averages: dict[str, float] = {}
    for k in dim_totals:
        averages[k] = round(dim_totals[k] / dim_counts[k], 1) if dim_counts[k] > 0 else 0.0

    persistent_strengths = [k for k, avg in averages.items() if avg >= 65 and dim_counts[k] >= 2]
    persistent_gaps = [k for k, avg in averages.items() if avg < 50 and dim_counts[k] >= 2]

    # Summaries of recent attempts (metadata & scores only, omit raw reasoning text)
    summaries: list[AttemptSummaryOut] = []
    for att in completed_attempts[:10]:
        analysis = att.get("analysis") or {}
        scores_map = {d.get("id"): int(d.get("score", 0)) for d in analysis.get("dimensions", []) if d.get("id")}
        summaries.append(
            AttemptSummaryOut(
                attempt_id=att["attempt_id"],
                level_id=att["level_id"],
                selected_option_id=att.get("selected_option_id"),
                started_at=att.get("started_at") or att.get("created_at") or now_utc_iso(),
                completed_at=att.get("completed_at"),
                completion_status=att.get("completion_status", "completed"),
                scores=scores_map,
                highlights=analysis.get("highlights", [])[:2],
            )
        )

    disclaimer = (
        "Based on verified Choice Town scenario completions."
        if len(completed_attempts) >= 2
        else "Preliminary data: Fewer than 2 scenarios have been completed. Patterns become clearer with more practice."
    )

    return AnalyticsOut(
        child_id=child_id,
        child_name=child_name,
        completed_levels_count=len(progress.completed_level_ids),
        completed_level_ids=progress.completed_level_ids,
        current_level_id=progress.current_level_id,
        total_attempts=len(completed_attempts),
        average_dimension_scores=averages,
        persistent_strengths=persistent_strengths,
        persistent_learning_gaps=persistent_gaps,
        recent_attempts_summary=summaries,
        disclaimer=disclaimer,
    )
