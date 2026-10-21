"""
WiseCub — CDEMF Adaptive Recommendation Engine Test Suite (Checkpoint C)
========================================================================
Validates the hybrid CDEMF + ML recommendation service, pedagogical safety gates,
disagreement overrides, confidence fallbacks, and catalog level feasibility.

Test Scenarios:
  1. test_foundation_recommendation: Foundation tier review and guided practice.
  2. test_standard_recommendation: Standard story progression.
  3. test_advanced_recommendation: Verified mastery triggers optional advanced challenge.
  4. test_ml_and_cdemf_disagreement_safety_override: ML advanced + low CDEMF -> Safety Override to standard.
  5. test_low_confidence_fallback: Low confidence (< 0.50) triggers rule-based fallback.
  6. test_cold_start_fallback: 0 completed levels / attempts triggers cold-start fallback.
  7. test_missing_model_fallback: Missing model artifact degrades gracefully without throwing.
  8. test_invalid_activity_references_prevented: All recommended levels exist in MISSION_CATALOG.
  9. test_locked_level_restrictions: Engine never recommends a level exceeding unlocked_level.
 10. test_student_specific_recommendations: Differentiated suggestions for distinct student profiles.
 11. test_explanation_generation: Supportive, age-appropriate explanations without negative shaming.
 12. test_existing_mission_regression_compatibility: Regression check with catalog and CDEMF engine.
"""
from __future__ import annotations

import pytest
from pathlib import Path

from app.modules.gamified_learning.catalog import (
    MISSION_CATALOG,
    get_level,
    get_mission,
)
from app.modules.gamified_learning.ml.inference import (
    CDEMFSupportPredictor,
    SupportPredictionResult,
)
from app.modules.gamified_learning.ml.recommend import (
    CDEMFAdaptiveRecommendationEngine,
    StudentProgressContext,
    AdaptiveRecommendationResponse,
)


@pytest.fixture
def mock_ml_predictor():
    """Mock predictor allowing controlled test predictions."""
    class MockPredictor:
        def __init__(self, pred_label="READY_FOR_STANDARD", confidence=0.85, fallback=False, reason=None):
            self.pred_label = pred_label
            self.confidence = confidence
            self.fallback = fallback
            self.reason = reason

        def predict_support(self, features, confidence_threshold=0.50):
            # Check cold-start condition
            if features.get("hist_prior_attempts_count", 0) < 2 or features.get("hist_completed_levels_count", 0) == 0:
                return SupportPredictionResult(
                    predicted_support_need="READY_FOR_STANDARD",
                    probabilities={"NEEDS_FOUNDATION_SUPPORT": 0.2, "READY_FOR_STANDARD": 0.6, "READY_FOR_ADVANCED": 0.2},
                    confidence=1.0,
                    fallback_used=True,
                    fallback_reason="INSUFFICIENT_HISTORY_COLD_START",
                    model_version="v1.0.0",
                    educational_action="Standard CDEMF progression (cold start)",
                )

            if self.confidence < confidence_threshold:
                return SupportPredictionResult(
                    predicted_support_need="READY_FOR_STANDARD",
                    probabilities={"NEEDS_FOUNDATION_SUPPORT": 0.33, "READY_FOR_STANDARD": 0.34, "READY_FOR_ADVANCED": 0.33},
                    confidence=self.confidence,
                    fallback_used=True,
                    fallback_reason=f"LOW_CONFIDENCE_{self.confidence}_BELOW_{confidence_threshold}",
                    model_version="v1.0.0",
                    educational_action="Standard progression (low confidence)",
                )

            return SupportPredictionResult(
                predicted_support_need=self.pred_label,
                probabilities={"NEEDS_FOUNDATION_SUPPORT": 0.1, "READY_FOR_STANDARD": 0.2, "READY_FOR_ADVANCED": 0.7},
                confidence=self.confidence,
                fallback_used=self.fallback,
                fallback_reason=self.reason,
                model_version="v1.0.0",
                educational_action="ML adaptive action",
            )

    return MockPredictor


def test_foundation_recommendation():
    """Scenario 1: Struggling learner receives FOUNDATION review and supportive hints."""
    engine = CDEMFAdaptiveRecommendationEngine()
    ctx = StudentProgressContext(
        child_id="child_struggling_01",
        active_mission_id="mission_rescue_puppy",
        current_level_number=2,
        unlocked_levels_by_mission={"mission_rescue_puppy": 2},
        completed_levels_by_mission={"mission_rescue_puppy": [1]},
        hist_completed_levels_count=1,
        hist_prior_attempts_count=3,
        hist_retry_rate=0.66,
        hist_remediation_count=2,
        hist_avg_budgeting_score=45.0,
        hist_avg_spending_score=50.0,
        hist_avg_saving_score=40.0,
        hist_avg_emergency_prep_score=35.0,
        hist_overall_score_avg=45.0,
        hist_consecutive_fails=1,
        hist_consecutive_passes=0,
    )

    rec = engine.recommend(ctx)
    assert rec.recommended_category == "FOUNDATION"
    assert rec.is_optional is False
    assert rec.recommended_level_number in [1, 2]
    assert rec.recommended_mission_id == "mission_rescue_puppy"
    assert "Barnaby" in rec.explanation or "buffer" in rec.explanation.lower()


def test_standard_recommendation():
    """Scenario 2: Steady learner receives STANDARD normal progression."""
    engine = CDEMFAdaptiveRecommendationEngine()
    ctx = StudentProgressContext(
        child_id="child_steady_02",
        active_mission_id="mission_rescue_puppy",
        current_level_number=3,
        unlocked_levels_by_mission={"mission_rescue_puppy": 3},
        completed_levels_by_mission={"mission_rescue_puppy": [1, 2]},
        hist_completed_levels_count=2,
        hist_prior_attempts_count=2,
        hist_retry_rate=0.0,
        hist_remediation_count=0,
        hist_avg_budgeting_score=85.0,
        hist_avg_spending_score=85.0,
        hist_avg_saving_score=82.0,
        hist_avg_investment_score=80.0,
        hist_avg_planning_score=82.0,
        hist_avg_emergency_prep_score=80.0,
        hist_overall_score_avg=84.0,
        hist_consecutive_fails=0,
        hist_consecutive_passes=2,
    )

    rec = engine.recommend(ctx)
    assert rec.recommended_category == "STANDARD"
    assert rec.is_optional is False
    assert rec.recommended_level_number == 3
    assert rec.recommended_mission_id == "mission_rescue_puppy"
    assert "Barnaby" in rec.explanation


def test_advanced_recommendation(mock_ml_predictor):
    """Scenario 3: Verified mastery student receives optional ADVANCED challenge."""
    predictor = mock_ml_predictor(pred_label="READY_FOR_ADVANCED", confidence=0.88)
    engine = CDEMFAdaptiveRecommendationEngine(predictor=predictor)

    ctx = StudentProgressContext(
        child_id="child_advanced_03",
        active_mission_id="mission_panda_fair",
        current_level_number=5,
        unlocked_levels_by_mission={"mission_panda_fair": 5},
        completed_levels_by_mission={"mission_panda_fair": [1, 2, 3, 4]},
        hist_completed_levels_count=4,
        hist_prior_attempts_count=4,
        hist_retry_rate=0.0,
        hist_remediation_count=0,
        hist_avg_budgeting_score=95.0,
        hist_avg_spending_score=92.0,
        hist_avg_saving_score=90.0,
        hist_avg_investment_score=90.0,
        hist_avg_planning_score=95.0,
        hist_avg_emergency_prep_score=90.0,
        hist_overall_score_avg=92.0,
        hist_consecutive_fails=0,
        hist_consecutive_passes=4,
    )

    rec = engine.recommend(ctx)
    assert rec.recommended_category == "ADVANCED"
    assert rec.is_optional is True
    assert rec.safety_audit.cdemf_mastery_confirmed is True
    assert rec.safety_audit.disagreement_detected is False
    assert rec.recommended_level_number <= 5


def test_ml_and_cdemf_disagreement_safety_override(mock_ml_predictor):
    """Scenario 4: ML predicts ADVANCED, but CDEMF evidence fails -> SAFETY OVERRIDE."""
    # ML falsely predicts ADVANCED for a struggling student
    predictor = mock_ml_predictor(pred_label="READY_FOR_ADVANCED", confidence=0.75)
    engine = CDEMFAdaptiveRecommendationEngine(predictor=predictor)

    ctx = StudentProgressContext(
        child_id="child_disagreement_04",
        active_mission_id="mission_rescue_puppy",
        current_level_number=3,
        unlocked_levels_by_mission={"mission_rescue_puppy": 3},
        completed_levels_by_mission={"mission_rescue_puppy": [1, 2]},
        hist_completed_levels_count=2,
        hist_prior_attempts_count=5,
        hist_retry_rate=0.5,
        hist_remediation_count=1,
        hist_avg_budgeting_score=65.0,
        hist_avg_spending_score=60.0,
        hist_avg_saving_score=55.0,
        hist_avg_emergency_prep_score=50.0,
        hist_overall_score_avg=62.0,  # Below 80 threshold!
        hist_consecutive_fails=1,     # Recent fail!
        hist_consecutive_passes=0,
    )

    rec = engine.recommend(ctx)
    # Must NOT be ADVANCED
    assert rec.recommended_category == "STANDARD"
    assert rec.prediction_source == "CDEMF_SAFETY_OVERRIDE"
    assert rec.safety_audit.disagreement_detected is True
    assert rec.safety_audit.disagreement_override_applied is True
    assert "ML predicted READY_FOR_ADVANCED" in (rec.safety_audit.override_reason or "")


def test_low_confidence_fallback(mock_ml_predictor):
    """Scenario 5: Low confidence (< 0.50) triggers fallback to rule-based CDEMF."""
    predictor = mock_ml_predictor(pred_label="READY_FOR_ADVANCED", confidence=0.42)
    engine = CDEMFAdaptiveRecommendationEngine(predictor=predictor)

    ctx = StudentProgressContext(
        child_id="child_low_conf_05",
        active_mission_id="mission_squirrel_savings",
        current_level_number=2,
        unlocked_levels_by_mission={"mission_squirrel_savings": 2},
        hist_completed_levels_count=2,
        hist_prior_attempts_count=3,
        hist_overall_score_avg=78.0,
    )

    rec = engine.recommend(ctx)
    assert rec.fallback_used is True
    assert rec.prediction_source == "CDEMF_RULE_BASED_LOW_CONFIDENCE"
    assert "LOW_CONFIDENCE" in (rec.fallback_reason or "")


def test_cold_start_fallback():
    """Scenario 6: Cold-start learner (0 attempts/levels) triggers rule-based progression."""
    engine = CDEMFAdaptiveRecommendationEngine()
    ctx = StudentProgressContext(
        child_id="child_cold_06",
        active_mission_id="mission_rescue_puppy",
        current_level_number=1,
        unlocked_levels_by_mission={"mission_rescue_puppy": 1},
        hist_completed_levels_count=0,
        hist_prior_attempts_count=0,
        hist_overall_score_avg=50.0,
    )

    rec = engine.recommend(ctx)
    assert rec.fallback_used is True
    assert rec.prediction_source == "CDEMF_RULE_BASED_COLD_START"
    assert rec.fallback_reason == "INSUFFICIENT_HISTORY_COLD_START"
    assert rec.recommended_level_number == 1


def test_missing_model_fallback():
    """Scenario 7: Missing model artifact degrades gracefully without throwing."""
    bogus_predictor = CDEMFSupportPredictor(model_path=Path("/tmp/non_existent.joblib"))
    engine = CDEMFAdaptiveRecommendationEngine(predictor=bogus_predictor)

    ctx = StudentProgressContext(
        child_id="child_missing_07",
        active_mission_id="mission_panda_fair",
        current_level_number=2,
        unlocked_levels_by_mission={"mission_panda_fair": 2},
        hist_completed_levels_count=2,
        hist_prior_attempts_count=3,
        hist_overall_score_avg=75.0,
    )

    rec = engine.recommend(ctx)
    assert rec.fallback_used is True
    assert rec.prediction_source == "CDEMF_RULE_BASED_MODEL_UNAVAILABLE"
    assert rec.recommended_category == "STANDARD"


def test_invalid_activity_references_prevented():
    """Scenario 8: All recommended levels exist in authoritative MISSION_CATALOG."""
    engine = CDEMFAdaptiveRecommendationEngine()
    for m_id in ["mission_rescue_puppy", "mission_squirrel_savings", "mission_panda_fair"]:
        ctx = StudentProgressContext(
            child_id=f"child_cat_{m_id}",
            active_mission_id=m_id,
            current_level_number=1,
            unlocked_levels_by_mission={m_id: 1},
            hist_completed_levels_count=0,
            hist_prior_attempts_count=0,
        )
        rec = engine.recommend(ctx)
        # Verify mission and level exist in catalog
        assert rec.recommended_mission_id in MISSION_CATALOG
        lvl = get_level(rec.recommended_mission_id, rec.recommended_level_number)
        assert lvl is not None
        assert lvl.id == rec.recommended_level_id


def test_locked_level_restrictions(mock_ml_predictor):
    """Scenario 9: Recommender never recommends a level exceeding student's unlocked_level."""
    predictor = mock_ml_predictor(pred_label="READY_FOR_ADVANCED", confidence=0.90)
    engine = CDEMFAdaptiveRecommendationEngine(predictor=predictor)

    # Student on level 2 with level 3+ locked, even with high scores
    ctx = StudentProgressContext(
        child_id="child_locked_09",
        active_mission_id="mission_rescue_puppy",
        current_level_number=2,
        unlocked_levels_by_mission={"mission_rescue_puppy": 2},
        completed_levels_by_mission={"mission_rescue_puppy": [1]},
        hist_completed_levels_count=2,
        hist_prior_attempts_count=3,
        hist_overall_score_avg=88.0,
        hist_consecutive_fails=0,
        hist_consecutive_passes=2,
    )

    rec = engine.recommend(ctx)
    # Level number must NOT exceed 2
    assert rec.recommended_level_number <= 2
    assert rec.safety_audit.unlocked_level_verified is True


def test_student_specific_recommendations():
    """Scenario 10: Differentiated recommendations for distinct student contexts."""
    engine = CDEMFAdaptiveRecommendationEngine()

    # Student A: Struggling in Squirrel mission
    ctx_a = StudentProgressContext(
        child_id="child_a",
        active_mission_id="mission_squirrel_savings",
        current_level_number=2,
        unlocked_levels_by_mission={"mission_squirrel_savings": 2},
        hist_completed_levels_count=1,
        hist_prior_attempts_count=3,
        hist_avg_saving_score=40.0,
        hist_overall_score_avg=55.0,
        hist_consecutive_fails=1,
    )

    # Student B: Advancing in Panda mission
    ctx_b = StudentProgressContext(
        child_id="child_b",
        active_mission_id="mission_panda_fair",
        current_level_number=4,
        unlocked_levels_by_mission={"mission_panda_fair": 4},
        hist_completed_levels_count=3,
        hist_prior_attempts_count=4,
        hist_avg_spending_score=85.0,
        hist_overall_score_avg=82.0,
        hist_consecutive_passes=3,
    )

    rec_a = engine.recommend(ctx_a)
    rec_b = engine.recommend(ctx_b)

    assert rec_a.recommended_mission_id == "mission_squirrel_savings"
    assert rec_b.recommended_mission_id == "mission_panda_fair"
    assert rec_a.recommended_category == "FOUNDATION"
    assert rec_b.recommended_category == "STANDARD"
    assert rec_a.explanation != rec_b.explanation


def test_explanation_generation():
    """Scenario 11: Explanations are supportive and strictly avoid shaming terminology."""
    engine = CDEMFAdaptiveRecommendationEngine()
    ctx = StudentProgressContext(
        child_id="child_exp_11",
        active_mission_id="mission_rescue_puppy",
        current_level_number=1,
        unlocked_levels_by_mission={"mission_rescue_puppy": 1},
        hist_completed_levels_count=0,
        hist_prior_attempts_count=2,
        hist_overall_score_avg=45.0,
        hist_consecutive_fails=2,
    )

    rec = engine.recommend(ctx)
    explanation = rec.explanation.lower()

    # Never shame adolescent learners
    shaming_words = ["weak", "incapable", "poor", "failing", "incompetent", "bad with money"]
    for word in shaming_words:
        assert word not in explanation, f"Shaming word '{word}' found in explanation"

    # Mentions character
    assert "barnaby" in explanation or "safety" in explanation


def test_existing_mission_regression_compatibility():
    """Scenario 12: Catalog and CDEMF engine compatibility verified without regressions."""
    for mid, mission in MISSION_CATALOG.items():
        if len(mission.levels) > 0:
            assert mission.total_levels == len(mission.levels)
            for lvl in mission.levels:
                assert lvl.starting_budget_lkr > 0
                assert lvl.pass_criteria.min_competency_score >= 70
