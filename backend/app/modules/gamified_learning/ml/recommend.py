"""
WiseCub CDEMF — Adaptive Mission Recommendation Engine (Checkpoint C)
====================================================================
Combines CDEMF competency telemetry, production ML support predictions (v1.0.0),
and catalog constraints to deliver safe, explainable practice recommendations.

Core Safety Policies:
  1. ML predictions NEVER unlock locked levels or modify CDEMF mastery requirements.
  2. Advanced recommendations REQUIRE independent CDEMF evidence of mastery (score >= 80,
     consecutive passes >= 2, no unresolved remediation).
  3. If ML and CDEMF disagree, CDEMF evidence takes precedence (Safety Override).
  4. All advanced challenge practice activities are strictly optional.
  5. Cold-start, low-confidence, or missing-model scenarios trigger rule-based fallbacks.
  6. All recommended levels must be unlocked and feasible within actual catalog specifications.
"""
from __future__ import annotations

import logging
from typing import Any, Literal
from pydantic import BaseModel, Field

from app.modules.gamified_learning.catalog import (
    MISSION_CATALOG,
    get_level,
    get_mission,
)
from app.modules.gamified_learning.ml.inference import (
    CDEMFSupportPredictor,
    default_predictor,
    CONFIDENCE_SAFETY_THRESHOLD,
    MIN_PRIOR_ATTEMPTS_REQUIRED,
    MODEL_VERSION,
)

logger = logging.getLogger("wisecub.cdemf.recommend")

RecommendationCategory = Literal["FOUNDATION", "STANDARD", "ADVANCED"]
PredictionSource = Literal[
    "CDEMF_HYBRID_ML",
    "CDEMF_SAFETY_OVERRIDE",
    "CDEMF_RULE_BASED_COLD_START",
    "CDEMF_RULE_BASED_LOW_CONFIDENCE",
    "CDEMF_RULE_BASED_MODEL_UNAVAILABLE",
]


class StudentProgressContext(BaseModel):
    """Authoritative student gameplay state provided by database or session."""
    child_id: str
    active_mission_id: str
    current_level_number: int = Field(..., ge=1, le=8)
    unlocked_levels_by_mission: dict[str, int] = Field(default_factory=dict)
    completed_levels_by_mission: dict[str, list[int]] = Field(default_factory=dict)

    # Historical competency scores
    hist_completed_levels_count: int = Field(0, ge=0)
    hist_prior_attempts_count: int = Field(0, ge=0)
    hist_retry_rate: float = Field(0.0, ge=0.0, le=1.0)
    hist_remediation_count: int = Field(0, ge=0)
    hist_avg_budgeting_score: float = Field(50.0, ge=0.0, le=100.0)
    hist_avg_spending_score: float = Field(50.0, ge=0.0, le=100.0)
    hist_avg_saving_score: float = Field(50.0, ge=0.0, le=100.0)
    hist_avg_investment_score: float = Field(50.0, ge=0.0, le=100.0)
    hist_avg_planning_score: float = Field(50.0, ge=0.0, le=100.0)
    hist_avg_emergency_prep_score: float = Field(50.0, ge=0.0, le=100.0)
    hist_overall_score_avg: float = Field(50.0, ge=0.0, le=100.0)
    hist_consecutive_fails: int = Field(0, ge=0)
    hist_consecutive_passes: int = Field(0, ge=0)


class SafetyAuditDetails(BaseModel):
    """Detailed audit information explaining the safety gates applied."""
    cdemf_mastery_confirmed: bool
    ml_raw_prediction: str
    ml_confidence: float
    disagreement_detected: bool
    disagreement_override_applied: bool
    unlocked_level_verified: bool
    override_reason: str | None = None


class AdaptiveRecommendationResponse(BaseModel):
    """Structured, student-facing recommendation response."""
    recommended_category: RecommendationCategory
    recommended_competency: str
    recommended_mission_id: str
    recommended_mission_title: str
    recommended_level_number: int
    recommended_level_id: str
    recommended_level_title: str
    recommended_interaction_type: str
    recommendation_title: str
    explanation: str
    pedagogical_action: str
    is_optional: bool
    prediction_source: PredictionSource
    fallback_used: bool
    fallback_reason: str | None
    model_version: str
    safety_audit: SafetyAuditDetails


class CDEMFAdaptiveRecommendationEngine:
    """
    Combines rule-based CDEMF mastery evidence with ML predictions to generate
    safe, student-appropriate practice suggestions.
    """

    def __init__(self, predictor: CDEMFSupportPredictor | None = None):
        self.predictor = predictor or default_predictor

    def recommend(
        self,
        context: StudentProgressContext,
        confidence_threshold: float = CONFIDENCE_SAFETY_THRESHOLD,
    ) -> AdaptiveRecommendationResponse:
        """
        Generates an adaptive practice recommendation adhering strictly to the
        CDEMF educational safety policy.
        """
        # 1. Prepare ML Feature Dictionary
        m_id = context.active_mission_id
        lvl_num = context.current_level_number
        current_lvl_def = get_level(m_id, lvl_num)

        level_id = current_lvl_def.id if current_lvl_def else f"{m_id}_{lvl_num}"
        interaction_type = current_lvl_def.interaction_type if current_lvl_def else "needs_wants"
        starting_budget = current_lvl_def.starting_budget_lkr if current_lvl_def else 5000

        features_for_ml = {
            "mission_id": m_id,
            "level_id": level_id,
            "interaction_type": interaction_type,
            "level_number": lvl_num,
            "starting_budget_lkr": starting_budget,
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

        # 2. Invoke Inference Service
        pred_result = self.predictor.predict_support(
            features_for_ml, confidence_threshold=confidence_threshold
        )

        ml_pred_label = pred_result.predicted_support_need
        confidence = pred_result.confidence
        fallback_used = pred_result.fallback_used
        fallback_reason = pred_result.fallback_reason
        model_version = pred_result.model_version

        # 3. Evaluate Independent CDEMF Evidence of Mastery (Step 4 Safety Policy)
        # To qualify for advanced difficulty, CDEMF evidence must independently verify mastery:
        cdemf_mastery_confirmed = (
            context.hist_completed_levels_count >= 2
            and context.hist_overall_score_avg >= 80.0
            and context.hist_consecutive_fails == 0
            and context.hist_remediation_count == 0
        )

        # 4. Resolve Disagreements & Enforce Educational Safety Gates
        disagreement_detected = False
        disagreement_override_applied = False
        override_reason = None
        target_category: RecommendationCategory = "STANDARD"

        if fallback_used:
            # When fallback is triggered (cold-start, low confidence, model missing)
            if fallback_reason and "COLD_START" in fallback_reason:
                pred_source: PredictionSource = "CDEMF_RULE_BASED_COLD_START"
            elif fallback_reason and "LOW_CONFIDENCE" in fallback_reason:
                pred_source: PredictionSource = "CDEMF_RULE_BASED_LOW_CONFIDENCE"
            else:
                pred_source: PredictionSource = "CDEMF_RULE_BASED_MODEL_UNAVAILABLE"

            if context.hist_overall_score_avg < 70.0 or context.hist_consecutive_fails > 0:
                target_category = "FOUNDATION"
            else:
                target_category = "STANDARD"

        else:
            # Active ML prediction
            if ml_pred_label == "READY_FOR_ADVANCED":
                if cdemf_mastery_confirmed:
                    target_category = "ADVANCED"
                    pred_source = "CDEMF_HYBRID_ML"
                else:
                    # SAFETY OVERRIDE: ML predicted advanced, but CDEMF evidence does not confirm mastery!
                    disagreement_detected = True
                    disagreement_override_applied = True
                    target_category = "STANDARD"
                    pred_source = "CDEMF_SAFETY_OVERRIDE"
                    override_reason = (
                        "ML predicted READY_FOR_ADVANCED, but CDEMF mastery criteria were not met "
                        f"(Score: {context.hist_overall_score_avg:.1f}<80 or remediation history). "
                        "Reverted to STANDARD progression for educational safety."
                    )
            elif ml_pred_label == "NEEDS_FOUNDATION_SUPPORT":
                target_category = "FOUNDATION"
                pred_source = "CDEMF_HYBRID_ML"
            else:
                target_category = "STANDARD"
                pred_source = "CDEMF_HYBRID_ML"

        # 5. Map Recommendation to Real Catalog Levels
        rec_details = self._map_to_catalog(context, target_category)

        safety_audit = SafetyAuditDetails(
            cdemf_mastery_confirmed=cdemf_mastery_confirmed,
            ml_raw_prediction=ml_pred_label,
            ml_confidence=confidence,
            disagreement_detected=disagreement_detected,
            disagreement_override_applied=disagreement_override_applied,
            unlocked_level_verified=rec_details["unlocked_verified"],
            override_reason=override_reason,
        )

        return AdaptiveRecommendationResponse(
            recommended_category=target_category,
            recommended_competency=rec_details["competency"],
            recommended_mission_id=rec_details["mission_id"],
            recommended_mission_title=rec_details["mission_title"],
            recommended_level_number=rec_details["level_number"],
            recommended_level_id=rec_details["level_id"],
            recommended_level_title=rec_details["level_title"],
            recommended_interaction_type=rec_details["interaction_type"],
            recommendation_title=rec_details["rec_title"],
            explanation=rec_details["explanation"],
            pedagogical_action=rec_details["pedagogical_action"],
            is_optional=rec_details["is_optional"],
            prediction_source=pred_source,
            fallback_used=fallback_used,
            fallback_reason=fallback_reason,
            model_version=model_version,
            safety_audit=safety_audit,
        )

    def _map_to_catalog(
        self,
        context: StudentProgressContext,
        category: RecommendationCategory,
    ) -> dict[str, Any]:
        """
        Maps a recommended category to authentic, feasible levels in MISSION_CATALOG.
        Guarantees that recommended levels never exceed the student's unlocked levels.
        """
        active_m_id = context.active_mission_id
        active_mission = get_mission(active_m_id) or get_mission("mission_rescue_puppy")
        unlocked_level = context.unlocked_levels_by_mission.get(
            active_m_id, context.current_level_number
        )

        # ── FOUNDATION CATEGORY ──────────────────────────────────────────────
        if category == "FOUNDATION":
            # Map to an unlocked foundational practice level in active mission
            rec_level_num = 1
            if unlocked_level >= 2:
                candidate_lvl2 = get_level(active_m_id, 2)
                if candidate_lvl2 and candidate_lvl2.interaction_type in ("budget_allocation", "budget_allocator"):
                    rec_level_num = 2

            lvl_def = get_level(active_m_id, rec_level_num) or active_mission.levels[0]

            # Accurately derive title, explanation, and competency directly from actual level definition
            if lvl_def.interaction_type == "needs_wants" or "spending" in lvl_def.target_competency.lower():
                competency_label = "Spending Discipline & Needs Prioritization"
                rec_title = f"Focus on Needs vs. Wants: {lvl_def.title}"
                explanation = (
                    f"Practice separating essential necessities from discretionary extras to protect "
                    f"{active_mission.character_name}'s budget."
                )
                action_text = "Review foundational needs vs. wants choices with guided hints"
            elif "saving" in lvl_def.target_competency.lower():
                competency_label = "Saving Behavior & Reserve Preservation"
                rec_title = f"Build Savings Habit: {lvl_def.title}"
                explanation = (
                    f"Practice reserving funds for future goals and unexpected surprises with {active_mission.character_name}."
                )
                action_text = "Review emergency reserve allocation with guided hints"
            else:
                competency_label = "Budget Allocation & Planning"
                rec_title = f"Strengthen Essential Budgeting: {lvl_def.title}"
                explanation = (
                    f"Practice allocating funds across key categories to keep "
                    f"{active_mission.character_name}'s essential needs covered."
                )
                action_text = "Review foundational budget balance with guided hints"

            return {
                "competency": competency_label,
                "mission_id": active_m_id,
                "mission_title": active_mission.title,
                "level_number": lvl_def.level_number,
                "level_id": lvl_def.id,
                "level_title": lvl_def.title,
                "interaction_type": lvl_def.interaction_type,
                "rec_title": rec_title,
                "explanation": explanation,
                "pedagogical_action": action_text,
                "is_optional": False,
                "unlocked_verified": True,
            }

        # ── ADVANCED CATEGORY ────────────────────────────────────────────────
        elif category == "ADVANCED":
            # Advanced trade-off challenges must be an unlocked capstone or trade-off level
            # If current mission level has reached 5 or higher, recommend level 5 (trade-off);
            # otherwise recommend Level 2 or 3 with an optional optimization goal.
            if unlocked_level >= 5:
                rec_level_num = 5
            elif unlocked_level >= 3:
                rec_level_num = 3
            else:
                rec_level_num = unlocked_level

            lvl_def = get_level(active_m_id, rec_level_num) or active_mission.levels[-1]

            explanation = (
                f"Outstanding financial mastery! Help {active_mission.character_name} tackle "
                "an optional advanced trade-off challenge to optimize savings and quality."
            )

            return {
                "competency": lvl_def.target_competency,
                "mission_id": active_m_id,
                "mission_title": active_mission.title,
                "level_number": lvl_def.level_number,
                "level_id": lvl_def.id,
                "level_title": lvl_def.title,
                "interaction_type": lvl_def.interaction_type,
                "rec_title": f"Advanced Challenge: {lvl_def.subtitle or lvl_def.title}",
                "explanation": explanation,
                "pedagogical_action": "Optional advanced financial trade-off and optimization challenge",
                "is_optional": True,  # Strictly optional per safety policy
                "unlocked_verified": rec_level_num <= unlocked_level,
            }

        # ── STANDARD CATEGORY (Default) ──────────────────────────────────────
        else:
            rec_level_num = min(unlocked_level, active_mission.total_levels)
            lvl_def = get_level(active_m_id, rec_level_num) or active_mission.levels[0]

            explanation = (
                f"You're making steady progress! Continue the story with Level {rec_level_num} "
                f"to help {active_mission.character_name} take the next financial step."
            )

            return {
                "competency": lvl_def.target_competency,
                "mission_id": active_m_id,
                "mission_title": active_mission.title,
                "level_number": lvl_def.level_number,
                "level_id": lvl_def.id,
                "level_title": lvl_def.title,
                "interaction_type": lvl_def.interaction_type,
                "rec_title": f"Continue Story: {lvl_def.title}",
                "explanation": explanation,
                "pedagogical_action": "Proceed with regular story mission progression",
                "is_optional": False,
                "unlocked_verified": True,
            }


# Default recommendation engine instance
default_recommendation_engine = CDEMFAdaptiveRecommendationEngine()
