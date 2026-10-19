"""
Gamified Learning API Router — WiseCub J26-IT-418
==================================================
All routes are authenticated via the existing wisecub_session cookie.
The student's child_id is always derived from the verified JWT — never
from browser-supplied parameters.

Route map:
  GET  /api/gamified/catalog                      — mission list
  GET  /api/gamified/missions/{mission_id}         — single mission definition
  GET  /api/gamified/progress/{mission_id}         — student's progress
  POST /api/gamified/missions/{mission_id}/start   — start or resume mission
  POST /api/gamified/levels/start                  — start / resume a level
  POST /api/gamified/decisions/submit              — submit a financial decision
  GET  /api/gamified/competency/{mission_id}       — competency history
  GET  /api/gamified/character/{mission_id}        — character state history
"""
from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException, Request

from app.database.mongo import get_db
from app.modules.accounts.router import current_account
from app.modules.gamified_learning.catalog import (
    MISSION_CATALOG,
    get_level_by_id,
    get_level,
    get_mission,
)
from app.modules.gamified_learning.engine import (
    CharacterState,
    run_cdemf_pipeline,
)
from app.modules.gamified_learning.models import (
    SCHEMA_VERSION,
    AdaptiveRecommendationOut,
    CharacterStateHistoryEntryOut,
    CharacterStateHistoryOut,
    CharacterStateOut,
    CharacterTransitionOut,
    CompetencyHistoryEntryOut,
    CompetencyHistoryOut,
    DecisionOutcomeOut,
    DimensionScoresOut,
    EvaluationResultOut,
    LevelStartOut,
    MissionCatalogOut,
    MissionProgressOut,
    MissionSummaryOut,
    SecondaryScoresOut,
    StartLevelIn,
    StartMissionIn,
    SubmitDecisionIn,
)

router = APIRouter()

_INITIAL_PUPPY_DIALOGUE = (
    "Whimper... My paw hurts when I put weight on it, "
    "but I am so glad I found you. Can you help me get proper care?"
)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def require_db():
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="MongoDB is not connected.")
    return db


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _char_state_to_doc(cs: CharacterState) -> dict[str, Any]:
    return {
        "character_id": cs.character_id,
        "name": cs.name,
        "physical_condition": cs.physical_condition,
        "emotional_state": cs.emotional_state,
        "condition_description": cs.condition_description,
        "vitality_score": cs.vitality_score,
        "happiness_score": cs.happiness_score,
        "active_dialogue": cs.active_dialogue,
    }


def _char_state_from_doc(doc: dict[str, Any]) -> CharacterState:
    return CharacterState(
        character_id=doc["character_id"],
        name=doc["name"],
        physical_condition=doc["physical_condition"],
        emotional_state=doc["emotional_state"],
        condition_description=doc["condition_description"],
        vitality_score=int(doc["vitality_score"]),
        happiness_score=int(doc["happiness_score"]),
        active_dialogue=doc.get("active_dialogue", ""),
    )


def _char_state_out(cs: CharacterState) -> CharacterStateOut:
    return CharacterStateOut(
        character_id=cs.character_id,
        name=cs.name,
        physical_condition=cs.physical_condition,
        emotional_state=cs.emotional_state,
        condition_description=cs.condition_description,
        vitality_score=cs.vitality_score,
        happiness_score=cs.happiness_score,
        active_dialogue=cs.active_dialogue,
    )


def _default_char_state(mission_id: str) -> CharacterState:
    mission = get_mission(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found.")
    return CharacterState(
        character_id=mission.character_id,
        name=mission.character_name,
        physical_condition="NEEDS_CARE",
        emotional_state="WORRIED",
        condition_description=f"{mission.character_name} is injured and needs your help.",
        vitality_score=mission.initial_vitality,
        happiness_score=mission.initial_happiness,
        active_dialogue=_INITIAL_PUPPY_DIALOGUE if mission_id == "mission_rescue_puppy" else "I need your help!",
    )


def _idempotency_key(child_id: str, mission_id: str, level_id: str, session_id: str) -> str:
    """Deterministic key to prevent duplicate decision submissions."""
    raw = f"{child_id}:{mission_id}:{level_id}:{session_id}"
    return hashlib.sha256(raw.encode()).hexdigest()


def _pseudo_id(child_id: str) -> str:
    """Stable pseudonymous research ID derived from child_id (non-reversible without key)."""
    return hashlib.sha256(f"research:{child_id}:wisecub-j26".encode()).hexdigest()[:24]


async def _get_or_create_progress(db, child_id: str, mission_id: str) -> dict[str, Any]:
    """Return the progress document, creating a default one if it does not exist."""
    mission = get_mission(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found.")

    doc = await db.gamified_progress.find_one(
        {"child_id": child_id, "mission_id": mission_id},
        {"_id": 0},
    )
    if doc:
        return doc

    default_char = _default_char_state(mission_id)
    now = _now_iso()
    new_doc = {
        "schema_version": SCHEMA_VERSION,
        "child_id": child_id,
        "mission_id": mission_id,
        "unlocked_level_number": 1,
        "completed_level_numbers": [],
        "highest_completed_level_number": 0,
        "character_state": _char_state_to_doc(default_char),
        "attempts_by_level": {},
        "last_attempt_at_iso": now,
        "is_mission_completed": False,
        "earned_coins": 0,
        "started_at": now,
        "updated_at": now,
    }
    await db.gamified_progress.update_one(
        {"child_id": child_id, "mission_id": mission_id},
        {"$setOnInsert": new_doc},
        upsert=True,
    )
    return new_doc


def _build_progress_out(doc: dict[str, Any]) -> MissionProgressOut:
    cs_doc = doc.get("character_state", {})
    attempts_by_level: dict[str, int] = {
        str(k): len(v) for k, v in doc.get("attempts_by_level", {}).items()
    }
    return MissionProgressOut(
        mission_id=doc["mission_id"],
        unlocked_level_number=int(doc.get("unlocked_level_number", 1)),
        completed_level_numbers=doc.get("completed_level_numbers", []),
        highest_completed_level_number=int(doc.get("highest_completed_level_number", 0)),
        character_state=CharacterStateOut(
            character_id=cs_doc.get("character_id", ""),
            name=cs_doc.get("name", ""),
            physical_condition=cs_doc.get("physical_condition", "NEEDS_CARE"),
            emotional_state=cs_doc.get("emotional_state", "WORRIED"),
            condition_description=cs_doc.get("condition_description", ""),
            vitality_score=int(cs_doc.get("vitality_score", 35)),
            happiness_score=int(cs_doc.get("happiness_score", 30)),
            active_dialogue=cs_doc.get("active_dialogue", ""),
        ),
        last_attempt_at_iso=doc.get("last_attempt_at_iso", doc.get("started_at", "")),
        is_mission_completed=bool(doc.get("is_mission_completed", False)),
        earned_coins=int(doc.get("earned_coins", 0)),
        attempt_counts_by_level=attempts_by_level,
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/gamified/catalog
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/api/gamified/catalog")
async def get_catalog() -> MissionCatalogOut:
    """Return the mission catalog summary list (no authentication required)."""
    missions = [
        MissionSummaryOut(
            id=m.id,
            title=m.title,
            character_name=m.character_name,
            primary_competency=m.primary_competency,
            total_levels=m.total_levels,
            theme_color=m.theme_color,
            description=m.description,
        )
        for m in MISSION_CATALOG.values()
    ]
    return MissionCatalogOut(missions=missions)


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/gamified/missions/{mission_id}
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/api/gamified/missions/{mission_id}")
async def get_mission_definition(mission_id: str) -> dict[str, Any]:
    """Return mission metadata (level count, competencies, character info)."""
    mission = get_mission(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found.")
    return {
        "id": mission.id,
        "title": mission.title,
        "character_name": mission.character_name,
        "character_id": mission.character_id,
        "primary_competency": mission.primary_competency,
        "total_levels": mission.total_levels,
        "theme_color": mission.theme_color,
        "description": mission.description,
        "has_levels": len(mission.levels) > 0,
        "level_ids": [lvl.id for lvl in mission.levels],
    }


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/gamified/progress/{mission_id}
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/api/gamified/progress/{mission_id}")
async def get_progress(request: Request, mission_id: str) -> MissionProgressOut:
    """Return the authenticated student's progress for a mission."""
    account = await current_account(request)
    child_id: str = account["child_id"]
    db = require_db()
    doc = await _get_or_create_progress(db, child_id, mission_id)
    return _build_progress_out(doc)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/gamified/missions/{mission_id}/start
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/api/gamified/missions/{mission_id}/start")
async def start_or_resume_mission(
    request: Request,
    mission_id: str,
) -> MissionProgressOut:
    """Start or resume a mission. Creates the progress record if absent."""
    account = await current_account(request)
    child_id: str = account["child_id"]

    mission = get_mission(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found.")
    if not mission.levels:
        raise HTTPException(
            status_code=400,
            detail="This mission is not yet available for play.",
        )

    db = require_db()
    doc = await _get_or_create_progress(db, child_id, mission_id)
    return _build_progress_out(doc)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/gamified/levels/start
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/api/gamified/levels/start")
async def start_level(request: Request, body: StartLevelIn) -> LevelStartOut:
    """
    Start (or resume) a specific level.

    Server enforces level locking — cannot start a level whose number
    exceeds the student's unlocked_level_number.
    """
    account = await current_account(request)
    child_id: str = account["child_id"]
    db = require_db()

    # Verify mission exists and has the requested level
    level = get_level(body.mission_id, body.level_number)
    if not level:
        raise HTTPException(
            status_code=404,
            detail=f"Level {body.level_number} not found in mission {body.mission_id}.",
        )

    progress = await _get_or_create_progress(db, child_id, body.mission_id)
    unlocked: int = int(progress.get("unlocked_level_number", 1))

    # ⛔ Server-side level lock enforcement
    if body.level_number > unlocked:
        raise HTTPException(
            status_code=403,
            detail=(
                f"Level {body.level_number} is locked. "
                f"You must pass level {body.level_number - 1} first."
            ),
        )

    attempts_for_level: list = (
        progress.get("attempts_by_level", {}).get(str(body.level_number), [])
    )
    is_retry = len(attempts_for_level) > 0
    attempt_number = len(attempts_for_level) + 1

    return LevelStartOut(
        ok=True,
        mission_id=body.mission_id,
        level_id=level.id,
        level_number=body.level_number,
        is_retry=is_retry,
        attempt_number=attempt_number,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/gamified/decisions/submit
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/api/gamified/decisions/submit")
async def submit_decision(
    request: Request, body: SubmitDecisionIn
) -> EvaluationResultOut:
    """
    Submit a financial decision and run the full CDEMF pipeline:

      Financial Simulation → Competency Evaluation
      → Emotional State Transition → Level Mastery
      → Adaptive Recommendation → MongoDB Persistence

    The server NEVER trusts option IDs, costs, or scores from the browser.
    Idempotency key prevents a repeated POST from applying the same decision twice.
    """
    account = await current_account(request)
    child_id: str = account["child_id"]
    db = require_db()

    # ── Validate mission and level ───────────────────────────────────────────
    mission = get_mission(body.mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found.")

    level = get_level_by_id(body.mission_id, body.level_id)
    if level is None or level.level_number != body.level_number:
        raise HTTPException(
            status_code=400,
            detail="level_id and level_number do not match a known level.",
        )

    # ── Level lock enforcement ───────────────────────────────────────────────
    progress = await _get_or_create_progress(db, child_id, body.mission_id)
    unlocked: int = int(progress.get("unlocked_level_number", 1))
    if body.level_number > unlocked:
        raise HTTPException(
            status_code=403,
            detail=(
                f"Level {body.level_number} is locked. "
                f"Pass level {body.level_number - 1} first."
            ),
        )

    # ── Idempotency: reject duplicate submissions ────────────────────────────
    idem_key = _idempotency_key(
        child_id, body.mission_id, body.level_id, body.session_id
    )
    existing = await db.financial_decisions.find_one(
        {"idempotency_key": idem_key}, {"_id": 0, "idempotency_key": 1}
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail=(
                "This decision has already been submitted for this session. "
                "Refresh the page to continue to the next level."
            ),
        )

    # ── Load current character state from progress ───────────────────────────
    cs_doc = progress.get("character_state") or {}
    if cs_doc:
        prev_char_state = _char_state_from_doc(cs_doc)
    else:
        prev_char_state = _default_char_state(body.mission_id)

    # ── Competency profile snapshot for adaptive engine ──────────────────────
    # Use module_state if available, otherwise use safe defaults
    module_state_doc = await db.module_state.find_one(
        {"child_id": child_id, "module": "missions"}, {"_id": 0}
    )
    comp_data: dict = (module_state_doc or {}).get("data", {}).get("competencyProfile", {})
    budgeting_profile = int(comp_data.get("budgetingSkill", 50))
    discipline_profile = int(comp_data.get("spendingDiscipline", 50))
    saving_profile = int(comp_data.get("savingBehavior", 50))
    mastery_level = comp_data.get("overallMasteryLevel", "Novice")

    # Count consecutive fails on this level
    attempts_for_level: list = progress.get("attempts_by_level", {}).get(
        str(body.level_number), []
    )
    consecutive_fails = sum(1 for a in attempts_for_level if not a.get("passed", False))
    attempt_number = len(attempts_for_level) + 1

    # ── Prepare weekly decisions ──────────────────────────────────────────────
    weekly_decisions_raw = [
        {
            "period": wd.period,
            "saved_amount_lkr": wd.saved_amount_lkr,
            "resisted_temptation": wd.resisted_temptation,
        }
        for wd in body.weekly_decisions
    ]

    decision_id = f"dec_{uuid.uuid4().hex[:12]}"

    # ── Run the CDEMF Pipeline ────────────────────────────────────────────────
    try:
        (
            fs, outcome, comp_eval,
            new_char_state, transition,
            mastery, recommendation,
        ) = run_cdemf_pipeline(
            level=level,
            interaction_type=body.interaction_type,
            selected_option_ids=body.selected_option_ids,
            allocations=body.allocations,
            selected_rationale_id=body.selected_rationale_id,
            weekly_decisions=weekly_decisions_raw,
            previous_char_state=prev_char_state,
            decision_id=decision_id,
            current_level_number=body.level_number,
            consecutive_fails=consecutive_fails,
            budgeting_profile=budgeting_profile,
            discipline_profile=discipline_profile,
            saving_profile=saving_profile,
            mastery_level=mastery_level,
            mission_id=body.mission_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    now = _now_iso()
    pseudo_id = _pseudo_id(child_id)

    # ── Persist: financial_decisions (research dataset) ───────────────────────
    decision_doc = {
        "idempotency_key": idem_key,
        "decision_id": decision_id,
        "child_id": child_id,
        "pseudo_id": pseudo_id,  # for research export
        "mission_id": body.mission_id,
        "level_id": body.level_id,
        "level_number": body.level_number,
        "attempt_number": attempt_number,
        "session_id": body.session_id,
        "interaction_type": body.interaction_type,
        "submitted_at": now,
        "schema_version": SCHEMA_VERSION,
        # Raw decision inputs (never derived — for ML training)
        "selected_option_ids": body.selected_option_ids,
        "allocations": body.allocations,
        "selected_rationale_id": body.selected_rationale_id,
        "weekly_decisions": weekly_decisions_raw,
        # Derived financial state
        "starting_budget_lkr": fs.starting_budget_lkr,
        "total_spent_lkr": fs.total_spent_lkr,
        "remaining_cash_lkr": fs.remaining_cash_lkr,
        "emergency_reserve_lkr": fs.emergency_reserve_lkr,
        "allocated_categories": fs.allocated_categories,
        "unmet_essentials": fs.unmet_essentials,
        "is_budget_feasible": fs.is_budget_feasible,
        "budget_deficit_lkr": fs.budget_deficit_lkr,
        # Outcome
        "essential_needs_covered": outcome.essential_needs_covered,
        "covered_essential_names": outcome.covered_essential_names,
        "missed_essential_names": outcome.missed_essential_names,
        "discretionary_spent_lkr": outcome.discretionary_spent_lkr,
        "reserve_preserved_lkr": outcome.reserve_preserved_lkr,
        "balance_remaining_lkr": outcome.balance_remaining_lkr,
        "is_feasible": outcome.is_feasible,
        "financial_impact_summary": outcome.financial_impact_summary,
        # Mastery
        "passed": mastery.passed,
        "overall_score": mastery.overall_score,
        "target_score": mastery.target_score,
        "failure_reasons": mastery.failure_reasons,
        # Competency dimension scores (raw observation — no label yet)
        "dim_budgeting_skill": comp_eval.dimension_scores.budgeting_skill,
        "dim_spending_discipline": comp_eval.dimension_scores.spending_discipline,
        "dim_saving_behavior": comp_eval.dimension_scores.saving_behavior,
        "dim_investment_awareness": comp_eval.dimension_scores.investment_awareness,
        "dim_goal_achievement": comp_eval.dimension_scores.goal_achievement,
        "sec_prioritization": comp_eval.secondary_scores.prioritization,
        "sec_emergency_preparedness": comp_eval.secondary_scores.emergency_preparedness,
        "sec_consistency": comp_eval.secondary_scores.consistency,
        "sec_risk_awareness": comp_eval.secondary_scores.risk_awareness,
        "sec_tradeoff_reasoning": comp_eval.secondary_scores.tradeoff_reasoning,
        "detailed_evidence": comp_eval.detailed_evidence,
        # Character
        "character_physical_condition": new_char_state.physical_condition,
        "character_emotional_state": new_char_state.emotional_state,
        "character_vitality_score": new_char_state.vitality_score,
        "character_happiness_score": new_char_state.happiness_score,
        "char_transition_direction": transition.direction,
        "char_transition_reason": transition.reason,
    }
    await db.financial_decisions.insert_one(decision_doc)

    # ── Persist: mission_attempts ─────────────────────────────────────────────
    attempt_doc = {
        "child_id": child_id,
        "mission_id": body.mission_id,
        "level_id": body.level_id,
        "level_number": body.level_number,
        "attempt_number": attempt_number,
        "decision_id": decision_id,
        "session_id": body.session_id,
        "recorded_at": now,
        "passed": mastery.passed,
        "overall_score": mastery.overall_score,
        "target_score": mastery.target_score,
        "failure_reasons": mastery.failure_reasons,
        "success_summary": mastery.success_summary,
        "remediation_guidance": mastery.remediation_guidance,
        "dimension_scores": {
            "budgeting_skill": comp_eval.dimension_scores.budgeting_skill,
            "spending_discipline": comp_eval.dimension_scores.spending_discipline,
            "saving_behavior": comp_eval.dimension_scores.saving_behavior,
            "investment_awareness": comp_eval.dimension_scores.investment_awareness,
            "goal_achievement": comp_eval.dimension_scores.goal_achievement,
        },
        "schema_version": SCHEMA_VERSION,
    }
    await db.mission_attempts.insert_one(attempt_doc)

    # ── Persist: competency_assessments ──────────────────────────────────────
    assessment_doc = {
        "child_id": child_id,
        "mission_id": body.mission_id,
        "level_id": body.level_id,
        "level_number": body.level_number,
        "attempt_number": attempt_number,
        "decision_id": decision_id,
        "assessed_at": now,
        "passed": mastery.passed,
        "budgeting_skill": comp_eval.dimension_scores.budgeting_skill,
        "spending_discipline": comp_eval.dimension_scores.spending_discipline,
        "saving_behavior": comp_eval.dimension_scores.saving_behavior,
        "investment_awareness": comp_eval.dimension_scores.investment_awareness,
        "goal_achievement": comp_eval.dimension_scores.goal_achievement,
        "overall_score": comp_eval.overall_score,
        "target_score": mastery.target_score,
        "secondary_scores": {
            "prioritization": comp_eval.secondary_scores.prioritization,
            "emergency_preparedness": comp_eval.secondary_scores.emergency_preparedness,
            "consistency": comp_eval.secondary_scores.consistency,
            "risk_awareness": comp_eval.secondary_scores.risk_awareness,
            "tradeoff_reasoning": comp_eval.secondary_scores.tradeoff_reasoning,
        },
        "schema_version": SCHEMA_VERSION,
    }
    await db.competency_assessments.insert_one(assessment_doc)

    # ── Persist: character_state_history ─────────────────────────────────────
    char_history_doc = {
        "child_id": child_id,
        "mission_id": body.mission_id,
        "level_number": body.level_number,
        "attempt_number": attempt_number,
        "decision_id": decision_id,
        "recorded_at": now,
        "physical_condition": new_char_state.physical_condition,
        "emotional_state": new_char_state.emotional_state,
        "vitality_score": new_char_state.vitality_score,
        "happiness_score": new_char_state.happiness_score,
        "active_dialogue": new_char_state.active_dialogue,
        "transition_direction": transition.direction,
        "transition_reason": transition.reason,
        "character_dialogue": transition.character_dialogue,
        "learning_explanation": transition.learning_explanation,
        "visual_cue": transition.visual_cue,
        "schema_version": SCHEMA_VERSION,
    }
    await db.character_state_history.insert_one(char_history_doc)

    # ── Atomically update gamified_progress ──────────────────────────────────
    attempt_record = {
        "attempt_number": attempt_number,
        "level_id": body.level_id,
        "passed": mastery.passed,
        "score": mastery.overall_score,
        "decision_id": decision_id,
        "timestamp": now,
    }
    level_key = str(body.level_number)

    update_ops: dict[str, Any] = {
        "$set": {
            "character_state": _char_state_to_doc(new_char_state),
            "last_attempt_at_iso": now,
            "updated_at": now,
        },
        "$push": {
            f"attempts_by_level.{level_key}": attempt_record,
        },
    }

    if mastery.passed:
        # Add to completed list (avoid duplicates) and unlock next level
        next_level = body.level_number + 1
        mission_obj = mission
        total_levels = mission_obj.total_levels

        update_ops["$addToSet"] = {
            "completed_level_numbers": body.level_number,
        }
        update_ops["$max"] = {
            "highest_completed_level_number": body.level_number,
            "unlocked_level_number": min(next_level, total_levels + 1),
            "earned_coins": (progress.get("earned_coins", 0) + 100),
        }
        if body.level_number >= total_levels:
            update_ops["$set"]["is_mission_completed"] = True  # type: ignore[index]

    await db.gamified_progress.update_one(
        {"child_id": child_id, "mission_id": body.mission_id},
        update_ops,
    )

    # ── Build response ────────────────────────────────────────────────────────
    return EvaluationResultOut(
        mission_id=body.mission_id,
        level_id=body.level_id,
        level_number=body.level_number,
        attempt_number=attempt_number,
        passed=mastery.passed,
        overall_score=mastery.overall_score,
        target_score=mastery.target_score,
        dimension_scores=DimensionScoresOut(
            budgeting_skill=comp_eval.dimension_scores.budgeting_skill,
            spending_discipline=comp_eval.dimension_scores.spending_discipline,
            saving_behavior=comp_eval.dimension_scores.saving_behavior,
            investment_awareness=comp_eval.dimension_scores.investment_awareness,
            goal_achievement=comp_eval.dimension_scores.goal_achievement,
        ),
        secondary_scores=SecondaryScoresOut(
            prioritization=comp_eval.secondary_scores.prioritization,
            emergency_preparedness=comp_eval.secondary_scores.emergency_preparedness,
            consistency=comp_eval.secondary_scores.consistency,
            risk_awareness=comp_eval.secondary_scores.risk_awareness,
            tradeoff_reasoning=comp_eval.secondary_scores.tradeoff_reasoning,
        ),
        decision_outcome=DecisionOutcomeOut(
            total_cost_lkr=outcome.total_cost_lkr,
            essential_needs_covered=outcome.essential_needs_covered,
            covered_essential_names=outcome.covered_essential_names,
            missed_essential_names=outcome.missed_essential_names,
            discretionary_spent_lkr=outcome.discretionary_spent_lkr,
            reserve_preserved_lkr=outcome.reserve_preserved_lkr,
            balance_remaining_lkr=outcome.balance_remaining_lkr,
            is_feasible=outcome.is_feasible,
            financial_impact_summary=outcome.financial_impact_summary,
        ),
        character_state=_char_state_out(new_char_state),
        character_transition=CharacterTransitionOut(
            previous_condition=transition.previous_condition,
            new_condition=transition.new_condition,
            previous_emotion=transition.previous_emotion,
            new_emotion=transition.new_emotion,
            direction=transition.direction,
            reason=transition.reason,
            character_dialogue=transition.character_dialogue,
            learning_explanation=transition.learning_explanation,
            visual_cue=transition.visual_cue,
        ),
        failure_reasons=mastery.failure_reasons,
        success_summary=mastery.success_summary,
        remediation_guidance=mastery.remediation_guidance,
        next_level_unlocked=mastery.next_level_unlocked,
        adaptive_recommendation=AdaptiveRecommendationOut(
            recommended_level_number=recommendation.recommended_level_number,
            learning_gap_identified=recommendation.learning_gap_identified,
            pedagogical_rationale=recommendation.pedagogical_rationale,
            suggested_practice_type=recommendation.suggested_practice_type,
            challenge_adjustment=recommendation.challenge_adjustment,
        ),
        is_rules_based_prototype=True,
        schema_version=SCHEMA_VERSION,
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/gamified/competency/{mission_id}
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/api/gamified/competency/{mission_id}")
async def get_competency_history(
    request: Request, mission_id: str
) -> CompetencyHistoryOut:
    """Return the student's full competency assessment history for a mission."""
    account = await current_account(request)
    child_id: str = account["child_id"]
    db = require_db()

    docs = (
        await db.competency_assessments.find(
            {"child_id": child_id, "mission_id": mission_id},
            {"_id": 0},
        )
        .sort("assessed_at", 1)
        .to_list(500)
    )

    entries = [
        CompetencyHistoryEntryOut(
            level_id=d.get("level_id", ""),
            level_number=int(d.get("level_number", 0)),
            attempt_number=int(d.get("attempt_number", 1)),
            timestamp=d.get("assessed_at", ""),
            passed=bool(d.get("passed", False)),
            dimension_scores=DimensionScoresOut(
                budgeting_skill=int(d.get("budgeting_skill", 50)),
                spending_discipline=int(d.get("spending_discipline", 50)),
                saving_behavior=int(d.get("saving_behavior", 50)),
                investment_awareness=int(d.get("investment_awareness", 50)),
                goal_achievement=int(d.get("goal_achievement", 50)),
            ),
            overall_score=int(d.get("overall_score", 50)),
        )
        for d in docs
    ]

    # Aggregate current profile from latest assessment per dimension
    current_profile: dict[str, Any] = {}
    if docs:
        latest = docs[-1]
        current_profile = {
            "budgetingSkill": latest.get("budgeting_skill", 50),
            "spendingDiscipline": latest.get("spending_discipline", 50),
            "savingBehavior": latest.get("saving_behavior", 50),
            "investmentAwareness": latest.get("investment_awareness", 50),
            "goalAchievement": latest.get("goal_achievement", 50),
            "overallScore": latest.get("overall_score", 50),
        }

    return CompetencyHistoryOut(
        mission_id=mission_id,
        entries=entries,
        current_profile=current_profile,
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/gamified/character/{mission_id}
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/api/gamified/character/{mission_id}")
async def get_character_history(
    request: Request, mission_id: str
) -> CharacterStateHistoryOut:
    """Return the student's character emotional/physical state history for a mission."""
    account = await current_account(request)
    child_id: str = account["child_id"]
    db = require_db()

    docs = (
        await db.character_state_history.find(
            {"child_id": child_id, "mission_id": mission_id},
            {"_id": 0},
        )
        .sort("recorded_at", 1)
        .to_list(500)
    )

    mission = get_mission(mission_id)
    char_name = mission.character_name if mission else "Character"

    history = [
        CharacterStateHistoryEntryOut(
            timestamp=d.get("recorded_at", ""),
            level_number=int(d.get("level_number", 0)),
            attempt_number=int(d.get("attempt_number", 1)),
            physical_condition=d.get("physical_condition", "NEEDS_CARE"),
            emotional_state=d.get("emotional_state", "WORRIED"),
            vitality_score=int(d.get("vitality_score", 35)),
            happiness_score=int(d.get("happiness_score", 30)),
            transition_direction=d.get("transition_direction", "STABLE"),
            transition_reason=d.get("transition_reason", ""),
        )
        for d in docs
    ]

    return CharacterStateHistoryOut(
        mission_id=mission_id,
        character_name=char_name,
        history=history,
    )
