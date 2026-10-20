"""
WiseCub CDEMF — Real Gameplay Feature Extraction & Adaptive Service (Checkpoint D)
==================================================================================
Extracts authoritative, strictly lagged historical features from MongoDB scoped
to the authenticated child_id. Feeds features into the ML inference engine and
CDEMF recommendation service.
"""
from __future__ import annotations

import logging
from typing import Any

from app.modules.gamified_learning.catalog import (
    MISSION_CATALOG,
    get_level,
    get_mission,
)
from app.modules.gamified_learning.ml.features import (
    ALL_ALLOWED_FEATURES,
    VALID_TARGET_LABELS,
)
from app.modules.gamified_learning.ml.inference import (
    CDEMFSupportPredictor,
    default_predictor,
    CONFIDENCE_SAFETY_THRESHOLD,
    MODEL_VERSION,
)
from app.modules.gamified_learning.ml.recommend import (
    CDEMFAdaptiveRecommendationEngine,
    StudentProgressContext,
    AdaptiveRecommendationResponse,
    default_recommendation_engine,
)

logger = logging.getLogger("wisecub.cdemf.ml_service")


async def extract_student_progress_context(
    db: Any,
    child_id: str,
) -> StudentProgressContext:
    """
    Extracts authentic gameplay telemetry from MongoDB strictly scoped to child_id.
    Derives all 21 historical features identically to the training schema.
    """
    # 1. Load progress across missions
    progress_cursor = db.gamified_progress.find({"child_id": child_id}, {"_id": 0})
    progress_docs = await progress_cursor.to_list(100) if hasattr(progress_cursor, "to_list") else []

    unlocked_levels_by_mission: dict[str, int] = {}
    completed_levels_by_mission: dict[str, list[int]] = {}
    active_mid = "mission_rescue_puppy"
    completed_mission_count = 0

    for doc in progress_docs:
        mid = doc.get("mission_id")
        if not mid:
            continue
        unlocked = doc.get("unlocked_level_number") or doc.get("unlocked_level", 1)
        completed = doc.get("completed_level_numbers") or doc.get("completed_levels", [])
        unlocked_levels_by_mission[mid] = int(unlocked)
        completed_levels_by_mission[mid] = [int(x) for x in completed]
        if doc.get("status") == "completed" or doc.get("is_mission_completed", False):
            completed_mission_count += 1
        elif (doc.get("status") == "in_progress" or unlocked > 1) and active_mid == "mission_rescue_puppy":
            active_mid = mid

    # If first mission completed, progress active mission to next available
    if unlocked_levels_by_mission.get("mission_rescue_puppy", 1) > 8 and "mission_squirrel_savings" in MISSION_CATALOG:
        if unlocked_levels_by_mission.get("mission_squirrel_savings", 1) > 6 and "mission_panda_fair" in MISSION_CATALOG:
            active_mid = "mission_panda_fair"
        else:
            active_mid = "mission_squirrel_savings"

    curr_lvl_num = unlocked_levels_by_mission.get(active_mid, 1)

    # 2. Load mission attempts chronologically
    attempts_cursor = db.mission_attempts.find(
        {"child_id": child_id}, {"_id": 0}
    ).sort("started_at", 1) if hasattr(db.mission_attempts, "find") else []
    attempts = await attempts_cursor.to_list(1000) if hasattr(attempts_cursor, "to_list") else []

    hist_prior_attempts_count = len(attempts)
    retries_count = sum(1 for a in attempts if a.get("attempt_number", 1) > 1)
    hist_retry_rate = round(retries_count / hist_prior_attempts_count, 4) if hist_prior_attempts_count > 0 else 0.0
    hist_remediation_count = sum(1 for a in attempts if a.get("remediation_triggered", False))

    # Calculate consecutive passes/fails at the tail of chronological attempts
    consecutive_fails = 0
    consecutive_passes = 0
    if attempts:
        for a in reversed(attempts):
            if a.get("passed", False):
                if consecutive_fails > 0:
                    break
                consecutive_passes += 1
            else:
                if consecutive_passes > 0:
                    break
                consecutive_fails += 1

    # Total distinct completed levels across all missions
    total_completed_levels = sum(len(lvl_list) for lvl_list in completed_levels_by_mission.values())

    # 3. Load competency assessments chronologically
    assessments_cursor = db.competency_assessments.find(
        {"child_id": child_id}, {"_id": 0}
    ).sort("assessed_at", 1) if hasattr(db.competency_assessments, "find") else []
    assessments = await assessments_cursor.to_list(1000) if hasattr(assessments_cursor, "to_list") else []

    if assessments:
        avg_budgeting = sum(a.get("budgeting_skill", 50) for a in assessments) / len(assessments)
        avg_spending = sum(a.get("spending_discipline", 50) for a in assessments) / len(assessments)
        avg_saving = sum(a.get("saving_behavior", 50) for a in assessments) / len(assessments)
        avg_investment = sum(a.get("investment_awareness", 50) for a in assessments) / len(assessments)
        avg_planning = sum(a.get("goal_achievement", 50) for a in assessments) / len(assessments)
        avg_overall = sum(a.get("overall_score", 50) for a in assessments) / len(assessments)
        avg_emergency = sum(
            a.get("secondary_scores", {}).get("emergency_preparedness", 50)
            if isinstance(a.get("secondary_scores"), dict) else 50
            for a in assessments
        ) / len(assessments)
    else:
        # Exact cold-start priors used in training dataset
        avg_budgeting = 50.0
        avg_spending = 50.0
        avg_saving = 50.0
        avg_investment = 50.0
        avg_planning = 50.0
        avg_emergency = 50.0
        avg_overall = 50.0

    return StudentProgressContext(
        child_id=child_id,
        active_mission_id=active_mid,
        current_level_number=curr_lvl_num,
        unlocked_levels_by_mission=unlocked_levels_by_mission,
        completed_levels_by_mission=completed_levels_by_mission,
        hist_completed_levels_count=total_completed_levels,
        hist_prior_attempts_count=hist_prior_attempts_count,
        hist_retry_rate=hist_retry_rate,
        hist_remediation_count=hist_remediation_count,
        hist_avg_budgeting_score=round(float(avg_budgeting), 2),
        hist_avg_spending_score=round(float(avg_spending), 2),
        hist_avg_saving_score=round(float(avg_saving), 2),
        hist_avg_investment_score=round(float(avg_investment), 2),
        hist_avg_planning_score=round(float(avg_planning), 2),
        hist_avg_emergency_prep_score=round(float(avg_emergency), 2),
        hist_overall_score_avg=round(float(avg_overall), 2),
        hist_consecutive_fails=consecutive_fails,
        hist_consecutive_passes=consecutive_passes,
    )


async def get_student_ml_prediction(
    db: Any,
    child_id: str,
    predictor: CDEMFSupportPredictor | None = None,
) -> dict[str, Any]:
    """
    Computes real-time ML support prediction for the authenticated student.
    """
    pred_service = predictor or default_predictor
    context = await extract_student_progress_context(db, child_id)

    m_id = context.active_mission_id
    lvl_num = context.current_level_number
    lvl_def = get_level(m_id, lvl_num)

    features = {
        "mission_id": m_id,
        "level_id": lvl_def.id if lvl_def else f"{m_id}_{lvl_num}",
        "interaction_type": lvl_def.interaction_type if lvl_def else "needs_wants",
        "level_number": lvl_num,
        "starting_budget_lkr": lvl_def.starting_budget_lkr if lvl_def else 5000,
        "attempt_number": 1,
        "is_retry": False,
        "step_index": context.hist_prior_attempts_count,
        "hist_completed_levels_count": context.hist_completed_levels_count,
        "hist_prior_attempts_count": context.hist_prior_attempts_count,
        "hist_retry_rate": context.hist_retry_rate,
        "hist_remediation_count": context.hist_remediation_count,
        "hist_avg_budgeting_score": context.hist_avg_budgeting_score,
        "hist_avg_spending_score": context.hist_avg_spending_score,
        "hist_avg_saving_score": context.hist_avg_saving_score,
        "hist_avg_investment_score": context.hist_avg_investment_score,
        "hist_avg_planning_score": context.hist_avg_planning_score,
        "hist_avg_emergency_prep_score": context.hist_avg_emergency_prep_score,
        "hist_overall_score_avg": context.hist_overall_score_avg,
        "hist_consecutive_fails": context.hist_consecutive_fails,
        "hist_consecutive_passes": context.hist_consecutive_passes,
    }

    result = pred_service.predict_support(features)

    return {
        "child_id": child_id,
        "predicted_support_need": result.predicted_support_need,
        "confidence": result.confidence,
        "model_version": result.model_version,
        "prediction_source": result.fallback_reason or "CDEMF_HYBRID_ML",
        "fallback_used": result.fallback_used,
        "fallback_reason": result.fallback_reason,
        "class_probabilities": result.probabilities,
    }


async def get_student_adaptive_recommendation(
    db: Any,
    child_id: str,
    engine: CDEMFAdaptiveRecommendationEngine | None = None,
) -> AdaptiveRecommendationResponse:
    """
    Generates a student-tailored adaptive practice recommendation based on
    real MongoDB telemetry and CDEMF safety gates.
    """
    rec_engine = engine or default_recommendation_engine
    context = await extract_student_progress_context(db, child_id)
    return rec_engine.recommend(context)
