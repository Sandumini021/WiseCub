"""
WiseCub — CDEMF Held-Out Model Evaluation & Fallback Safety Tests (Checkpoint B2)
================================================================================
Automated test suite verifying the frozen candidate model (v1.0.0), held-out
evaluation metrics, confidence calibration, fallback triggers, and pedagogical
safety invariants.

Covers:
  1. test_frozen_model_evaluation_metrics: Test metrics consistency.
  2. test_confusion_matrix_consistency: Test confusion matrix row sums match true support.
  3. test_class_label_ordering: Pipeline classes match VALID_TARGET_LABELS.
  4. test_probability_outputs_and_bounds: Probabilities are valid simplex vectors.
  5. test_confidence_handling_and_gating: Low-confidence triggers conservative fallback.
  6. test_missing_model_fallback: Non-existent model path triggers graceful fallback.
  7. test_insufficient_history_fallback: Cold-start learners trigger rule-based fallback.
  8. test_model_version_compatibility: Model metadata and version v1.0.0.
  9. test_no_student_overlap_between_train_and_test: Zero student overlap.
 10. test_no_temporal_leakage_in_features: Forbidden columns raise ValueError.
 11. test_pedagogical_safety_invariant: ML prediction never overrides CDEMF mastery.
"""
from __future__ import annotations

import json
from pathlib import Path
import pytest
import joblib
import pandas as pd
import numpy as np

from app.modules.gamified_learning.ml.features import (
    ALL_ALLOWED_FEATURES,
    FORBIDDEN_COLUMNS,
    GROUP_COLUMN,
    TARGET_COLUMN,
    VALID_TARGET_LABELS,
    validate_feature_leakage,
)
from app.modules.gamified_learning.ml.paths import (
    ARTIFACTS_DIR,
    CSV_DATASET_PATH,
)
from app.modules.gamified_learning.ml.train import (
    load_and_split_dataset,
)
from app.modules.gamified_learning.ml.inference import (
    CDEMFSupportPredictor,
    DEFAULT_MODEL_PATH,
    MODEL_VERSION,
    default_predictor,
)


@pytest.fixture(scope="module")
def evaluation_report() -> dict:
    report_path = ARTIFACTS_DIR / "test_evaluation_report.json"
    assert report_path.exists(), f"Missing report at {report_path}"
    with open(report_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="module")
def test_dataset() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    return load_and_split_dataset(seed=42)


def test_frozen_model_evaluation_metrics(evaluation_report: dict):
    """Scenario 1: Verify test set metrics are consistent and within expected generalization bounds."""
    tm = evaluation_report["test_metrics"]
    assert 0.58 <= tm["accuracy"] <= 0.68
    assert 0.56 <= tm["macro_f1"] <= 0.66
    assert 0.56 <= tm["balanced_accuracy"] <= 0.66

    # Verify per-class reports exist for all 3 classes
    clf_rep = tm["classification_report"]
    for label in VALID_TARGET_LABELS:
        assert label in clf_rep
        assert clf_rep[label]["support"] > 0
        assert 0.35 <= clf_rep[label]["f1-score"] <= 0.95


def test_confusion_matrix_consistency(evaluation_report: dict):
    """Scenario 2: Verify confusion matrix dimensions, sums, and support counts."""
    cm = evaluation_report["test_metrics"]["confusion_matrix"]
    assert len(cm) == 3
    assert all(len(row) == 3 for row in cm)

    # Row sums must equal support counts from classification_report
    clf_rep = evaluation_report["test_metrics"]["classification_report"]
    expected_support = [
        int(clf_rep["NEEDS_FOUNDATION_SUPPORT"]["support"]),
        int(clf_rep["READY_FOR_STANDARD"]["support"]),
        int(clf_rep["READY_FOR_ADVANCED"]["support"]),
    ]
    actual_support = [sum(row) for row in cm]
    assert actual_support == expected_support
    assert sum(actual_support) == 373


def test_class_label_ordering():
    """Scenario 3: Verify model pipeline classes match VALID_TARGET_LABELS exactly."""
    model = joblib.load(DEFAULT_MODEL_PATH)
    assert set(model.classes_) == set(VALID_TARGET_LABELS)


def test_probability_outputs_and_bounds(test_dataset):
    """Scenario 4: Verify that predict_proba outputs valid probability distributions."""
    _, _, test_df = test_dataset
    model = joblib.load(DEFAULT_MODEL_PATH)

    sample_X = test_df[ALL_ALLOWED_FEATURES].head(30)
    probas = model.predict_proba(sample_X)

    assert probas.shape == (30, 3)
    assert np.all(probas >= 0.0)
    assert np.all(probas <= 1.0)
    row_sums = np.sum(probas, axis=1)
    np.testing.assert_allclose(row_sums, 1.0, atol=1e-4)


def test_confidence_handling_and_gating():
    """Scenario 5: Low-confidence prediction triggers conservative fallback."""
    predictor = CDEMFSupportPredictor(DEFAULT_MODEL_PATH)

    # Synthetic ambiguous features with near-equal scores across all dimensions
    ambiguous_features = {
        "mission_id": "mission_panda_fair",
        "level_id": "level_panda_3",
        "interaction_type": "trade_off",
        "level_number": 3,
        "starting_budget_lkr": 5000,
        "attempt_number": 1,
        "is_retry": False,
        "step_index": 5,
        "hist_completed_levels_count": 2,
        "hist_prior_attempts_count": 4,
        "hist_retry_rate": 0.5,
        "hist_remediation_count": 1,
        "hist_avg_budgeting_score": 60.0,
        "hist_avg_spending_score": 60.0,
        "hist_avg_saving_score": 60.0,
        "hist_avg_investment_score": 60.0,
        "hist_avg_planning_score": 60.0,
        "hist_avg_emergency_prep_score": 60.0,
        "hist_overall_score_avg": 60.0,
        "hist_consecutive_fails": 0,
        "hist_consecutive_passes": 1,
    }

    # Using high threshold 0.99 forces low-confidence fallback
    result = predictor.predict_support(ambiguous_features, confidence_threshold=0.99)
    assert result.fallback_used is True
    assert "LOW_CONFIDENCE" in (result.fallback_reason or "")
    assert result.predicted_support_need == "READY_FOR_STANDARD"


def test_missing_model_fallback():
    """Scenario 6: Non-existent model path triggers graceful fallback without raising."""
    bogus_path = ARTIFACTS_DIR / "non_existent_model_xyz.joblib"
    predictor = CDEMFSupportPredictor(model_path=bogus_path)

    sample_features = {
        "hist_prior_attempts_count": 5,
        "hist_completed_levels_count": 3,
    }
    result = predictor.predict_support(sample_features)
    assert result.fallback_used is True
    assert result.fallback_reason == "MODEL_ARTIFACT_UNAVAILABLE"
    assert result.predicted_support_need == "READY_FOR_STANDARD"


def test_insufficient_history_fallback():
    """Scenario 7: Cold-start learner with 0 or 1 attempts triggers rule-based fallback."""
    predictor = CDEMFSupportPredictor(DEFAULT_MODEL_PATH)

    cold_features = {
        "hist_prior_attempts_count": 1,
        "hist_completed_levels_count": 0,
        "hist_overall_score_avg": 40.0,
    }
    result = predictor.predict_support(cold_features)
    assert result.fallback_used is True
    assert result.fallback_reason == "INSUFFICIENT_HISTORY_COLD_START"
    assert result.predicted_support_need == "NEEDS_FOUNDATION_SUPPORT"


def test_model_version_compatibility(evaluation_report: dict):
    """Scenario 8: Verify model metadata and version v1.0.0."""
    metadata_path = ARTIFACTS_DIR / "model_metadata.json"
    with open(metadata_path, "r", encoding="utf-8") as f:
        meta = json.load(f)

    assert meta["model_version"] == "v1.0.0"
    assert meta["production_artifact"] == "cdemf_support_model_v1.joblib"
    assert evaluation_report["model_version"] == "v1.0.0"


def test_no_student_overlap_between_train_and_test(test_dataset):
    """Scenario 9: Confirm 0 student overlap across train, val, and test."""
    train_df, val_df, test_df = test_dataset
    train_s = set(train_df[GROUP_COLUMN])
    val_s = set(val_df[GROUP_COLUMN])
    test_s = set(test_df[GROUP_COLUMN])

    assert len(train_s & test_s) == 0
    assert len(val_s & test_s) == 0
    assert len(train_s & val_s) == 0
    assert len(test_s) == 45
    assert len(train_s) == 210
    assert len(val_s) == 45


def test_no_temporal_leakage_in_features():
    """Scenario 10: Forbidden columns raise ValueError."""
    for col in ["overall_score", "passed", "decision_summary", "subsequent_attempt_score"]:
        with pytest.raises(ValueError, match="Data leakage detected"):
            validate_feature_leakage(["level_number", col])


def test_pedagogical_safety_invariant():
    """
    Scenario 11: Pedagogical safety invariant:
    ML support predictions must NEVER alter CDEMF mastery outcome.
    """
    sample_features = {
        "mission_id": "mission_rescue_puppy",
        "level_id": "level_puppy_4",
        "interaction_type": "needs_wants",
        "level_number": 4,
        "starting_budget_lkr": 5000,
        "attempt_number": 1,
        "is_retry": False,
        "step_index": 3,
        "hist_completed_levels_count": 3,
        "hist_prior_attempts_count": 3,
        "hist_retry_rate": 0.0,
        "hist_remediation_count": 0,
        "hist_avg_budgeting_score": 90.0,
        "hist_avg_spending_score": 90.0,
        "hist_avg_saving_score": 85.0,
        "hist_avg_investment_score": 80.0,
        "hist_avg_planning_score": 85.0,
        "hist_avg_emergency_prep_score": 80.0,
        "hist_overall_score_avg": 88.0,
        "hist_consecutive_fails": 0,
        "hist_consecutive_passes": 3,
    }
    result = default_predictor.predict_support(sample_features)
    # The output is strictly a recommendation descriptor
    assert isinstance(result.educational_action, str)
    assert len(result.educational_action) > 0
    # No gate unlocking logic is exposed or permitted
    assert not hasattr(result, "unlock_next_level")
    assert not hasattr(result, "bypass_mastery")
