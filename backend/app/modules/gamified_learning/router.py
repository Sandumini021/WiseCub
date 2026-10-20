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
    AchievementBadgeOut,
    AdaptiveRecommendationOut,
    CharacterStateHistoryEntryOut,
    CharacterStateHistoryOut,
    CharacterStateOut,
    CharacterTransitionOut,
    CompetencyHistoryEntryOut,
    CompetencyHistoryOut,
    DecisionOutcomeOut,
    DimensionScoresOut,
    EmotionalImpactRecordOut,
    EvaluationResultOut,
    JourneyLevelDetailOut,
    JourneyMissionDetailOut,
    JourneyMissionSummaryOut,
    JourneyOverviewOut,
    JourneyOverviewStatsOut,
    LearningTipOut,
    LevelStartOut,
    MissionCatalogOut,
    MissionProgressOut,
    MissionSummaryOut,
    SecondaryScoresOut,
    SkillMetricOut,
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
        "food_supply": getattr(cs, "food_supply", 40),
        "savings_reserve": getattr(cs, "savings_reserve", 35),
        "shelter_readiness": getattr(cs, "shelter_readiness", 35),
        "winter_preparedness": getattr(cs, "winter_preparedness", 35),
        "emotional_wellbeing": getattr(cs, "emotional_wellbeing", 40),
        "budget_health": getattr(cs, "budget_health", 50),
        "fair_readiness": getattr(cs, "fair_readiness", 30),
        "charity_goal_progress": getattr(cs, "charity_goal_progress", 0),
        "vendor_relationships": getattr(cs, "vendor_relationships", 50),
        "customer_satisfaction": getattr(cs, "customer_satisfaction", 50),
        "financial_risk_exposure": getattr(cs, "financial_risk_exposure", 40),
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
        food_supply=int(doc.get("food_supply", 40)),
        savings_reserve=int(doc.get("savings_reserve", 35)),
        shelter_readiness=int(doc.get("shelter_readiness", 35)),
        winter_preparedness=int(doc.get("winter_preparedness", 35)),
        emotional_wellbeing=int(doc.get("emotional_wellbeing", 40)),
        budget_health=int(doc.get("budget_health", 50)),
        fair_readiness=int(doc.get("fair_readiness", 30)),
        charity_goal_progress=int(doc.get("charity_goal_progress", 0)),
        vendor_relationships=int(doc.get("vendor_relationships", 50)),
        customer_satisfaction=int(doc.get("customer_satisfaction", 50)),
        financial_risk_exposure=int(doc.get("financial_risk_exposure", 40)),
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
        food_supply=getattr(cs, "food_supply", 40),
        savings_reserve=getattr(cs, "savings_reserve", 35),
        shelter_readiness=getattr(cs, "shelter_readiness", 35),
        winter_preparedness=getattr(cs, "winter_preparedness", 35),
        emotional_wellbeing=getattr(cs, "emotional_wellbeing", 40),
        budget_health=getattr(cs, "budget_health", 50),
        fair_readiness=getattr(cs, "fair_readiness", 30),
        charity_goal_progress=getattr(cs, "charity_goal_progress", 0),
        vendor_relationships=getattr(cs, "vendor_relationships", 50),
        customer_satisfaction=getattr(cs, "customer_satisfaction", 50),
        financial_risk_exposure=getattr(cs, "financial_risk_exposure", 40),
    )


def _default_char_state(mission_id: str) -> CharacterState:
    mission = get_mission(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found.")
    if mission_id == "mission_panda_fair":
        return CharacterState(
            character_id="char_panda_baobao",
            name="Bao Bao",
            physical_condition="WEAK_STABILIZED",
            emotional_state="EXCITED",
            condition_description="Bao Bao is eagerly preparing for the School Charity Fair, ready to balance the budget for the community library.",
            vitality_score=mission.initial_vitality,
            happiness_score=mission.initial_happiness,
            active_dialogue="Welcome to the School Fair planning committee! Together, let's budget carefully, partner with honest vendors, and build our dream library!",
            budget_health=60,
            fair_readiness=30,
            charity_goal_progress=0,
            vendor_relationships=50,
            customer_satisfaction=50,
            financial_risk_exposure=35,
            emotional_wellbeing=60,
        )
    if mission_id == "mission_squirrel_savings":
        return CharacterState(
            character_id="char_squirrel_nutty",
            name="Nutty",
            physical_condition="NEEDS_CARE",
            emotional_state="WORRIED",
            condition_description="Nutty’s winter pantry is nearly empty while cold autumn winds blow through the forest.",
            vitality_score=mission.initial_vitality,
            happiness_score=mission.initial_happiness,
            active_dialogue="Chirp! Winter frost is coming early this year. If I do not save enough acorns in time, my family will be hungry!",
            food_supply=35,
            savings_reserve=25,
            shelter_readiness=30,
            winter_preparedness=30,
            emotional_wellbeing=40,
        )
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
            food_supply=cs_doc.get("food_supply"),
            savings_reserve=cs_doc.get("savings_reserve"),
            shelter_readiness=cs_doc.get("shelter_readiness"),
            winter_preparedness=cs_doc.get("winter_preparedness"),
            emotional_wellbeing=cs_doc.get("emotional_wellbeing"),
            budget_health=cs_doc.get("budget_health"),
            fair_readiness=cs_doc.get("fair_readiness"),
            charity_goal_progress=cs_doc.get("charity_goal_progress"),
            vendor_relationships=cs_doc.get("vendor_relationships"),
            customer_satisfaction=cs_doc.get("customer_satisfaction"),
            financial_risk_exposure=cs_doc.get("financial_risk_exposure"),
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
# POST /api/gamified/missions/{mission_id}/reset
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/api/gamified/missions/{mission_id}/reset")
async def reset_mission_progress(
    request: Request,
    mission_id: str,
) -> MissionProgressOut:
    """Reset the authenticated student's progress for a mission back to level 1."""
    account = await current_account(request)
    child_id: str = account["child_id"]
    db = require_db()

    mission = get_mission(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found.")

    default_char = _default_char_state(mission_id)
    now = _now_iso()
    reset_doc = {
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
    await db.gamified_progress.replace_one(
        {"child_id": child_id, "mission_id": mission_id},
        reset_doc,
        upsert=True,
    )
    return _build_progress_out(reset_doc)



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
    if body.interaction_type != level.interaction_type:
        raise HTTPException(
            status_code=400,
            detail="interaction_type does not match the requested level.",
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


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/gamified/journey/overview
# ─────────────────────────────────────────────────────────────────────────────

ACTIVE_MISSION_IDS = [
    "mission_rescue_puppy",
    "mission_squirrel_savings",
    "mission_panda_fair",
]


@router.get("/api/gamified/journey/overview")
async def get_journey_overview(request: Request) -> JourneyOverviewOut:
    """Aggregated journey overview across all three CDEMF story missions.

    Combines progress, competency assessments, achievements, character states,
    and rule-based personalized remediation recommendations.
    """
    account = await current_account(request)
    child_id: str = account["child_id"]
    student_name: str = account.get("name") or account.get("username") or "Young Explorer"
    db = require_db()

    # 1. Fetch progress records for all 3 missions
    progress_docs = (
        await db.gamified_progress.find(
            {"child_id": child_id},
            {"_id": 0},
        ).to_list(10)
    )
    progress_by_mission = {d["mission_id"]: d for d in progress_docs if d.get("mission_id") in ACTIVE_MISSION_IDS}

    # 2. Build mission summaries
    mission_summaries: list[JourneyMissionSummaryOut] = []
    total_completed_levels = 0
    total_missions_completed = 0
    total_coins = 0
    first_incomplete_mission_id: str | None = None
    first_incomplete_level = 1

    for mid in ACTIVE_MISSION_IDS:
        mission = get_mission(mid)
        if not mission:
            continue

        p_doc = progress_by_mission.get(mid)
        if p_doc:
            completed_levels: list[int] = [int(x) for x in p_doc.get("completed_level_numbers", [])]
            unlocked_level: int = int(p_doc.get("unlocked_level_number", 1))
            is_completed: bool = bool(p_doc.get("is_mission_completed", False))
            coins: int = int(p_doc.get("earned_coins", 0))
            raw_cs = p_doc.get("character_state")
            cs = _char_state_from_doc(raw_cs) if raw_cs else _default_char_state(mid)
        else:
            completed_levels = []
            unlocked_level = 1
            is_completed = False
            coins = 0
            cs = _default_char_state(mid)

        tot = mission.total_levels
        comp_count = len(completed_levels)
        total_completed_levels += comp_count
        if is_completed:
            total_missions_completed += 1
        total_coins += coins

        if not is_completed and first_incomplete_mission_id is None:
            first_incomplete_mission_id = mid
            first_incomplete_level = unlocked_level

        pct = int(round((comp_count / tot) * 100)) if tot > 0 else 0

        if is_completed:
            comp_status = "Mastered"
        elif comp_count >= (tot // 2):
            comp_status = "Proficient"
        elif comp_count > 0:
            comp_status = "In Progress"
        else:
            comp_status = "Not Started"

        mission_summaries.append(
            JourneyMissionSummaryOut(
                mission_id=mid,
                title=mission.title,
                character_name=mission.character_name,
                character_role=getattr(mission, "character_role", "Story Companion"),
                focus_skill=getattr(mission, "primary_competency", "Financial Literacy"),
                theme_color=mission.theme_color,
                total_levels=tot,
                completed_levels_count=comp_count,
                completed_level_numbers=completed_levels,
                unlocked_level_number=unlocked_level,
                progress_percent=pct,
                is_completed=is_completed,
                earned_coins=coins,
                competency_status=comp_status,
                character_state=_char_state_out(cs),
            )
        )

    active_mid = first_incomplete_mission_id or "mission_rescue_puppy"
    rec_level = first_incomplete_level

    # 3. Fetch all competency assessments
    assessments = (
        await db.competency_assessments.find(
            {"child_id": child_id},
            {"_id": 0},
        )
        .sort("assessed_at", 1)
        .to_list(1000)
    )

    # 4. Compute 7 financial skill metrics with strict evidence counts
    def extract_scores(key_fn) -> list[int]:
        res = []
        for a in assessments:
            val = key_fn(a)
            if val is not None and isinstance(val, (int, float)):
                res.append(int(val))
        return res

    skills_config = [
        (
            "budgeting",
            "Budgeting",
            "Core Financial Skill",
            lambda a: a.get("budgeting_skill"),
            "Allocating scarce funds across competing needs and sticking to realistic spending limits.",
        ),
        (
            "saving",
            "Saving Behavior",
            "Core Financial Skill",
            lambda a: a.get("saving_behavior"),
            "Setting money aside consistently across multiple periods to build long-term security.",
        ),
        (
            "spending",
            "Spending Discipline",
            "Core Financial Skill",
            lambda a: a.get("spending_discipline"),
            "Controlling impulse urges and choosing certified value over vanity splurges.",
        ),
        (
            "needs_wants",
            "Needs vs. Wants",
            "Prioritization",
            lambda a: (a.get("secondary_scores") or {}).get("prioritization"),
            "Distinguishing non-negotiable survival essentials from optional lifestyle desires.",
        ),
        (
            "financial_planning",
            "Financial Planning",
            "Goal Setting",
            lambda a: a.get("goal_achievement"),
            "Formulating multi-step strategies to achieve major milestones on schedule.",
        ),
        (
            "price_comparison",
            "Price Comparison & Value",
            "Market Awareness",
            lambda a: a.get("investment_awareness"),
            "Analyzing unit costs, quality ratings, and vendor terms before committing funds.",
        ),
        (
            "emergency_preparedness",
            "Emergency Preparedness",
            "Risk Management",
            lambda a: (a.get("secondary_scores") or {}).get("emergency_preparedness"),
            "Maintaining cash reserves for midnight vet fees, sudden blizzards, and surprise costs.",
        ),
    ]

    skills_profile: list[SkillMetricOut] = []
    lowest_skill_key: str | None = None
    lowest_skill_score = 999

    for s_key, s_name, s_cat, fn, s_desc in skills_config:
        scores = extract_scores(fn)
        evidence_count = len(scores)
        if evidence_count > 0:
            avg_score = int(round(sum(scores) / evidence_count))
            has_evidence = True
            if avg_score >= 85:
                status = "mastered"
            elif avg_score >= 65:
                status = "proficient"
            else:
                status = "developing"
            is_strength = avg_score >= 80
            needs_practice = avg_score < 65

            if avg_score < lowest_skill_score:
                lowest_skill_score = avg_score
                lowest_skill_key = s_key
        else:
            avg_score = None
            has_evidence = False
            status = "insufficient_evidence"
            is_strength = False
            needs_practice = False

        skills_profile.append(
            SkillMetricOut(
                skill_key=s_key,
                name=s_name,
                category=s_cat,
                score=avg_score,
                evidence_count=evidence_count,
                has_sufficient_evidence=has_evidence,
                status=status,
                is_strength=is_strength,
                needs_practice=needs_practice,
                description=s_desc,
            )
        )

    # Overall competency score
    overall_scores = [a.get("overall_score") for a in assessments if a.get("overall_score") is not None]
    overall_competency = (
        int(round(sum(overall_scores) / len(overall_scores))) if overall_scores else None
    )

    # 5. Mastery tier
    if total_completed_levels >= 18:
        mastery_tier = "Financial Champion"
    elif total_completed_levels >= 10:
        mastery_tier = "Money Smart"
    elif total_completed_levels >= 4:
        mastery_tier = "Apprentice"
    else:
        mastery_tier = "Explorer"

    # 6. Fetch attempts for verified badge checking
    attempts = (
        await db.mission_attempts.find({"child_id": child_id}, {"_id": 0}).to_list(1000)
    )

    puppy_sum = next((m for m in mission_summaries if m.mission_id == "mission_rescue_puppy"), None)
    squirrel_sum = next((m for m in mission_summaries if m.mission_id == "mission_squirrel_savings"), None)
    panda_sum = next((m for m in mission_summaries if m.mission_id == "mission_panda_fair"), None)

    puppy_comp = puppy_sum.completed_levels_count if puppy_sum else 0
    squirrel_comp = squirrel_sum.completed_levels_count if squirrel_sum else 0
    panda_comp = panda_sum.completed_levels_count if panda_sum else 0

    has_retry_pass = any(
        a.get("attempt_number", 1) >= 2 and a.get("passed") is True for a in attempts
    )

    attempted_mids = set(a.get("mission_id") for a in attempts if a.get("mission_id"))
    for ms in mission_summaries:
        if ms.completed_levels_count > 0:
            attempted_mids.add(ms.mission_id)
    distinct_active_count = len(attempted_mids.intersection(set(ACTIVE_MISSION_IDS)))

    badges: list[AchievementBadgeOut] = [
        AchievementBadgeOut(
            id="badge_caring_budgeter",
            title="Caring Budgeter",
            description="Rescued Barnaby and navigated medical budgets with zero deficit.",
            icon="🐶",
            unlocked=((puppy_sum.is_completed if puppy_sum else False) or puppy_comp >= 4),
            unlocked_at=None,
            progress_current=min(puppy_comp, 4),
            progress_target=4,
            unlock_condition="Complete at least 4 budgeting levels in Puppy Rescue",
        ),
        AchievementBadgeOut(
            id="badge_winter_savings_hero",
            title="Winter Savings Hero",
            description="Protected Nutty with emergency acorn reserves to survive the harsh blizzard.",
            icon="🐿️",
            unlocked=((squirrel_sum.is_completed if squirrel_sum else False) or squirrel_comp >= 3),
            unlocked_at=None,
            progress_current=min(squirrel_comp, 3),
            progress_target=3,
            unlock_condition="Complete at least 3 multi-period saving levels in Squirrel's Winter Savings",
        ),
        AchievementBadgeOut(
            id="badge_smart_fair_planner",
            title="Smart Fair Planner",
            description="Balanced stall pricing, negotiation, and budget health for the charity fair.",
            icon="🐼",
            unlocked=((panda_sum.is_completed if panda_sum else False) or panda_comp >= 3),
            unlocked_at=None,
            progress_current=min(panda_comp, 3),
            progress_target=3,
            unlock_condition="Complete at least 3 spending discipline levels in Panda's School Fair",
        ),
        AchievementBadgeOut(
            id="badge_money_skills_explorer",
            title="Money Skills Explorer",
            description="Explored all three financial pillars: budgeting, multi-period saving, and smart spending.",
            icon="🧭",
            unlocked=distinct_active_count >= 3,
            unlocked_at=None,
            progress_current=min(distinct_active_count, 3),
            progress_target=3,
            unlock_condition="Play at least 1 level across all three story missions",
        ),
        AchievementBadgeOut(
            id="badge_resilient_learner",
            title="Resilient Learner",
            description="Overcame a financial setback by reviewing remediation feedback and passing on retry.",
            icon="🌱",
            unlocked=has_retry_pass,
            unlocked_at=None,
            progress_current=1 if has_retry_pass else 0,
            progress_target=1,
            unlock_condition="Turn a failed attempt into mastery by retrying with remediation guidance",
        ),
    ]

    # 7. Character Emotional Impact Showcase
    char_history_docs = (
        await db.character_state_history.find(
            {"child_id": child_id},
            {"_id": 0},
        )
        .sort("recorded_at", -1)
        .to_list(8)
    )

    impact_showcase: list[EmotionalImpactRecordOut] = []
    for cd in char_history_docs:
        c_mid = cd.get("mission_id", "")
        m_def = get_mission(c_mid)
        m_title = m_def.title if m_def else "Story Mission"
        c_name = m_def.character_name if m_def else "Companion"
        att_num = int(cd.get("attempt_number", 1))
        direction = cd.get("transition_direction", "STABLE")

        impact_showcase.append(
            EmotionalImpactRecordOut(
                mission_id=c_mid,
                mission_title=m_title,
                character_name=c_name,
                level_number=int(cd.get("level_number", 1)),
                attempt_number=att_num,
                previous_condition=cd.get("physical_condition", "NEEDS_CARE"),
                new_condition=cd.get("physical_condition", "RECOVERING"),
                previous_emotion=cd.get("emotional_state", "WORRIED"),
                new_emotion=cd.get("emotional_state", "HOPEFUL"),
                direction=direction,
                reason=cd.get("transition_reason", ""),
                character_dialogue=cd.get("character_dialogue", cd.get("active_dialogue", "")),
                learning_explanation=cd.get("learning_explanation", ""),
                visual_cue=cd.get("visual_cue", ""),
                recorded_at=cd.get("recorded_at", ""),
                improved_after_retry=(att_num > 1 and direction == "POSITIVE"),
            )
        )

    # 8. Pedagogical Rule-Based Learning Tips
    learning_tips: list[LearningTipOut] = []

    if lowest_skill_key == "emergency_preparedness" or (lowest_skill_key is None and puppy_comp < 7):
        learning_tips.append(
            LearningTipOut(
                title="Build an Emergency Cushion",
                description="Unforeseen shocks like midnight fever or winter freezes can wipe out budgets. Stash at least 15% in reserve funds before spending on extras.",
                category="Risk Management",
                action_mission_id="mission_rescue_puppy",
                action_level_number=7,
                action_label="Practice Emergency Care (Puppy L7)",
            )
        )
    elif lowest_skill_key == "spending" or lowest_skill_key == "needs_wants":
        learning_tips.append(
            LearningTipOut(
                title="Separate Needs from Tempting Wants",
                description="Before making any purchase, ask yourself: 'Is this essential for survival or success, or is it a luxury extra?' Prioritize essentials first.",
                category="Spending Discipline",
                action_mission_id="mission_panda_fair",
                action_level_number=2,
                action_label="Practice Budget Splitting (Panda L2)",
            )
        )
    elif lowest_skill_key == "price_comparison":
        learning_tips.append(
            LearningTipOut(
                title="Compare Vendor Value, Not Just Price",
                description="The lowest price is not always the best deal if quality fails. Always calculate unit costs and check certified guarantees.",
                category="Market Awareness",
                action_mission_id="mission_panda_fair",
                action_level_number=3,
                action_label="Compare Suppliers (Panda L3)",
            )
        )
    elif lowest_skill_key == "saving":
        learning_tips.append(
            LearningTipOut(
                title="Consistency Beats Big Splurges",
                description="Setting aside acorns or coins each week compounds into security. Resist mid-week impulse temptations to keep your companion safe.",
                category="Saving Habit",
                action_mission_id="mission_squirrel_savings",
                action_level_number=2,
                action_label="Build Nutty's Reserves (Squirrel L2)",
            )
        )

    if first_incomplete_mission_id:
        target_m = get_mission(first_incomplete_mission_id)
        if target_m:
            learning_tips.append(
                LearningTipOut(
                    title=f"Continue: {target_m.title}",
                    description=f"Level {first_incomplete_level} is ready for you! Help {target_m.character_name} make smart financial choices to progress the story.",
                    category="Mission Progress",
                    action_mission_id=first_incomplete_mission_id,
                    action_level_number=first_incomplete_level,
                    action_label=f"Play Level {first_incomplete_level}",
                )
            )

    learning_tips.append(
        LearningTipOut(
            title="The 50/30/20 Story Rule",
            description="Aim to spend 50% on essential needs, up to 30% on discretionary wants, and always save at least 20% for future emergencies and goals.",
            category="Fintech Rule of Thumb",
            action_mission_id=None,
            action_level_number=None,
            action_label="Explore Strategy",
        )
    )

    overview_stats = JourneyOverviewStatsOut(
        total_missions_completed=total_missions_completed,
        total_missions_count=3,
        total_levels_completed=total_completed_levels,
        total_levels_count=20,
        overall_competency_score=overall_competency,
        earned_coins=total_coins,
        mastery_tier=mastery_tier,
        active_mission_id=active_mid,
        next_recommended_level=rec_level,
    )

    return JourneyOverviewOut(
        student_name=student_name,
        child_id=child_id,
        overview=overview_stats,
        missions=mission_summaries,
        financial_skills_profile=skills_profile,
        achievements=badges,
        emotional_impact_showcase=impact_showcase,
        learning_tips=learning_tips,
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/gamified/journey/mission-details/{mission_id}
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/api/gamified/journey/mission-details/{mission_id}")
async def get_journey_mission_detail(
    request: Request, mission_id: str
) -> JourneyMissionDetailOut:
    """Detailed level-by-level inspection for any of the 3 CDEMF missions."""
    account = await current_account(request)
    child_id: str = account["child_id"]
    db = require_db()

    mission = get_mission(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found.")

    p_doc = await db.gamified_progress.find_one(
        {"child_id": child_id, "mission_id": mission_id},
        {"_id": 0},
    )

    completed_levels = p_doc.get("completed_level_numbers", []) if p_doc else []
    unlocked_lvl = p_doc.get("unlocked_level_number", 1) if p_doc else 1
    is_completed = p_doc.get("is_mission_completed", False) if p_doc else False
    attempts_by_level = p_doc.get("attempts_by_level", {}) if p_doc else {}

    raw_cs = p_doc.get("character_state") if p_doc else None
    cs = _char_state_from_doc(raw_cs) if raw_cs else _default_char_state(mission_id)

    level_details: list[JourneyLevelDetailOut] = []
    for lvl in mission.levels:
        lnum = lvl.level_number
        if lnum in completed_levels:
            status = "COMPLETED"
        elif lnum == unlocked_lvl:
            status = "CURRENT"
        else:
            status = "LOCKED"

        lvl_attempts = attempts_by_level.get(str(lnum), [])
        scores = [int(a.get("score", 0)) for a in lvl_attempts if a.get("score") is not None]
        best_score = max(scores) if scores else None

        level_details.append(
            JourneyLevelDetailOut(
                level_number=lnum,
                level_id=lvl.id,
                title=lvl.title,
                focus_dimension=getattr(lvl, "target_competency", "budgeting_skill"),
                interaction_type=lvl.interaction_type,
                status=status,
                best_score=best_score,
                attempts_count=len(lvl_attempts),
            )
        )

    recent_attempts = (
        await db.mission_attempts.find(
            {"child_id": child_id, "mission_id": mission_id},
            {"_id": 0},
        )
        .sort("recorded_at", -1)
        .to_list(15)
    )

    char_history_docs = (
        await db.character_state_history.find(
            {"child_id": child_id, "mission_id": mission_id},
            {"_id": 0},
        )
        .sort("recorded_at", 1)
        .to_list(50)
    )
    char_history = [
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
        for d in char_history_docs
    ]

    comp_count = len(completed_levels)
    pct = int(round((comp_count / mission.total_levels) * 100)) if mission.total_levels > 0 else 0

    return JourneyMissionDetailOut(
        mission_id=mission_id,
        title=mission.title,
        character_name=mission.character_name,
        character_role=getattr(mission, "character_role", "Story Companion"),
        focus_skill=getattr(mission, "primary_competency", "Financial Literacy"),
        theme_color=mission.theme_color,
        total_levels=mission.total_levels,
        completed_levels_count=comp_count,
        progress_percent=pct,
        is_completed=is_completed,
        levels=level_details,
        recent_attempts=recent_attempts,
        character_state=_char_state_out(cs),
        character_history=char_history,
    )
