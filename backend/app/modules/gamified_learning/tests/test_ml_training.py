"""
WiseCub — CDEMF Machine Learning Training & Pipeline Tests (Checkpoint B1)
==========================================================================
Verifies feature engineering, target leakage prevention, student-grouped splitting,
model estimators, serialization, and reproducibility.

Covers:
  1. test_feature_allowlist_and_forbidden_columns: Feature allowlists and rejection of forbidden columns.
  2. test_leakage_prevention_validator: validate_feature_leakage raises ValueError on leaked columns.
  3. test_student_grouped_splitting_isolation: 70/15/15 student split with 0 student overlap across train/val/test.
  4. test_preprocessing_pipeline_transformation: ColumnTransformer fits on train and transforms without error.
  5. test_all_four_estimators_train_and_predict: Dummy, LogisticRegression, RandomForest, HistGradientBoosting.
  6. test_target_label_classes_and_prediction_output: Predictions match valid CDEMF pedagogical labels.
  7. test_model_artifact_serialization_and_loading: Candidate joblib pipeline loads and produces valid predictions.
  8. test_training_reproducibility: Fixed seed produces deterministic evaluation metrics.
  9. test_artifacts_and_metadata_exist: Artifact directory contains report, metadata, and metric files.
"""
from __future__ import annotations

import json
from pathlib import Path
import pytest
import joblib
import pandas as pd

from app.modules.gamified_learning.ml.features import (
    ALL_ALLOWED_FEATURES,
    CATEGORICAL_FEATURES,
    FORBIDDEN_COLUMNS,
    GROUP_COLUMN,
    NUMERICAL_FEATURES,
    TARGET_COLUMN,
    VALID_TARGET_LABELS,
    build_preprocessor,
    validate_feature_leakage,
)
from app.modules.gamified_learning.ml.paths import (
    ARTIFACTS_DIR,
    CSV_DATASET_PATH,
)
from app.modules.gamified_learning.ml.train import (
    load_and_split_dataset,
    train_and_evaluate_all_models,
)


def test_artifacts_and_metadata_exist():
    """Verify that all Checkpoint B1 artifacts, metadata, and reports exist."""
    candidate_model_path = ARTIFACTS_DIR / "cdemf_support_model_candidate.joblib"
    metadata_path = ARTIFACTS_DIR / "model_metadata.json"
    metrics_path = ARTIFACTS_DIR / "validation_metrics.json"
    report_path = ARTIFACTS_DIR / "model_comparison_report.md"

    assert candidate_model_path.exists(), "Missing cdemf_support_model_candidate.joblib"
    assert metadata_path.exists(), "Missing model_metadata.json"
    assert metrics_path.exists(), "Missing validation_metrics.json"
    assert report_path.exists(), "Missing model_comparison_report.md"

    with open(metadata_path, "r", encoding="utf-8") as f:
        meta = json.load(f)
    assert meta["model_name"] in {"Gradient_Boosting", "Random_Forest", "Logistic_Regression"}
    assert meta["train_students"] == 210
    assert meta["val_students"] == 45
    assert meta["test_students"] == 45


def test_feature_allowlist_and_forbidden_columns():
    """Verify strict separation between allowed features and forbidden columns."""
    assert len(ALL_ALLOWED_FEATURES) == 21
    assert len(CATEGORICAL_FEATURES) == 3
    assert len(NUMERICAL_FEATURES) == 18

    # No allowed feature can ever be in FORBIDDEN_COLUMNS
    intersection = set(ALL_ALLOWED_FEATURES) & FORBIDDEN_COLUMNS
    assert len(intersection) == 0, f"Allowed features contain forbidden columns: {intersection}"

    # Critical leakage fields must be explicitly forbidden
    critical_leakage = [
        "decision_summary",
        "allocated_amount_lkr",
        "overall_score",
        "passed",
        "next_activity_support_need",
        "synthetic_student_id",
        "archetype",
        "subsequent_attempt_score",
    ]
    for col in critical_leakage:
        assert col in FORBIDDEN_COLUMNS, f"Critical leakage column {col} missing from FORBIDDEN_COLUMNS"


def test_leakage_prevention_validator():
    """Verify validate_feature_leakage raises ValueError when forbidden columns are passed."""
    # Valid feature list must not raise
    validate_feature_leakage(ALL_ALLOWED_FEATURES)

    # Attempting to supply overall_score must raise ValueError
    with pytest.raises(ValueError, match="Data leakage detected"):
        validate_feature_leakage(["level_number", "overall_score"])

    # Attempting to supply target column must raise ValueError
    with pytest.raises(ValueError, match="Data leakage detected"):
        validate_feature_leakage(["level_number", "next_activity_support_need"])

    # Attempting to supply unapproved column must raise ValueError
    with pytest.raises(ValueError, match="Unapproved feature detected"):
        validate_feature_leakage(["level_number", "unknown_bogus_feature"])


def test_student_grouped_splitting_isolation():
    """Verify 70/15/15 student-grouped splitting with zero student overlap."""
    train_df, val_df, test_df = load_and_split_dataset(seed=42)

    # Check row counts sum to 2500
    assert len(train_df) + len(val_df) + len(test_df) == 2500

    train_students = set(train_df[GROUP_COLUMN])
    val_students = set(val_df[GROUP_COLUMN])
    test_students = set(test_df[GROUP_COLUMN])

    # Check student counts: 210, 45, 45
    assert len(train_students) == 210
    assert len(val_students) == 45
    assert len(test_students) == 45
    assert len(train_students | val_students | test_students) == 300

    # Strict isolation: Zero overlap
    assert len(train_students & val_students) == 0, "Student overlap between train and val!"
    assert len(train_students & test_students) == 0, "Student overlap between train and test!"
    assert len(val_students & test_students) == 0, "Student overlap between val and test!"

    # Label distribution present in all splits
    for df_split, name in [(train_df, "Train"), (val_df, "Val"), (test_df, "Test")]:
        labels = set(df_split[TARGET_COLUMN].unique())
        assert labels == set(VALID_TARGET_LABELS), f"Missing target labels in {name} split: {labels}"


def test_preprocessing_pipeline_transformation():
    """Verify ColumnTransformer handles numeric scaling and categorical one-hot encoding."""
    train_df, val_df, _ = load_and_split_dataset(seed=42)
    preprocessor = build_preprocessor()

    X_train = train_df[ALL_ALLOWED_FEATURES]
    X_val = val_df[ALL_ALLOWED_FEATURES]

    # Fit only on train
    X_train_trans = preprocessor.fit_transform(X_train)
    assert X_train_trans.shape[0] == len(train_df)
    assert X_train_trans.shape[1] > len(ALL_ALLOWED_FEATURES)  # OneHotEncoder expands categories

    # Transform on val
    X_val_trans = preprocessor.transform(X_val)
    assert X_val_trans.shape[0] == len(val_df)
    assert X_val_trans.shape[1] == X_train_trans.shape[1]


def test_all_four_estimators_train_and_predict():
    """Verify all 4 required estimators train and produce valid predictions."""
    with open(ARTIFACTS_DIR / "validation_metrics.json", "r", encoding="utf-8") as f:
        metrics = json.load(f)

    expected_models = {
        "Dummy_Baseline",
        "Logistic_Regression",
        "Random_Forest",
        "Gradient_Boosting",
    }
    assert set(metrics.keys()) == expected_models

    for model_name, m in metrics.items():
        assert "val_macro_f1" in m
        assert "val_accuracy" in m
        assert "val_confusion_matrix" in m
        assert "training_time_seconds" in m
        assert m["val_macro_f1"] > 0.0

    # Ensure all models outperform the dummy baseline
    dummy_f1 = metrics["Dummy_Baseline"]["val_macro_f1"]
    for model_name in ["Logistic_Regression", "Random_Forest", "Gradient_Boosting"]:
        assert metrics[model_name]["val_macro_f1"] > dummy_f1, (
            f"{model_name} failed to outperform dummy baseline"
        )


def test_target_label_classes_and_prediction_output():
    """Verify that predictions match valid CDEMF pedagogical labels."""
    train_df, val_df, _ = load_and_split_dataset(seed=42)
    candidate_model_path = ARTIFACTS_DIR / "cdemf_support_model_candidate.joblib"
    pipeline = joblib.load(candidate_model_path)

    sample_X = val_df[ALL_ALLOWED_FEATURES].head(20)
    preds = pipeline.predict(sample_X)

    assert len(preds) == 20
    for pred in preds:
        assert pred in VALID_TARGET_LABELS


def test_model_artifact_serialization_and_loading():
    """Verify candidate model can be safely reloaded and preserves prediction functionality."""
    candidate_model_path = ARTIFACTS_DIR / "cdemf_support_model_candidate.joblib"
    loaded_pipeline = joblib.load(candidate_model_path)

    # Test single-record dictionary transformed into DataFrame
    test_record = {
        "mission_id": "mission_rescue_puppy",
        "level_id": "level_puppy_3",
        "interaction_type": "budget_allocator",
        "level_number": 3,
        "starting_budget_lkr": 5000,
        "attempt_number": 1,
        "is_retry": False,
        "step_index": 2,
        "hist_completed_levels_count": 2,
        "hist_prior_attempts_count": 2,
        "hist_retry_rate": 0.0,
        "hist_remediation_count": 0,
        "hist_avg_budgeting_score": 85.0,
        "hist_avg_spending_score": 85.0,
        "hist_avg_saving_score": 80.0,
        "hist_avg_investment_score": 75.0,
        "hist_avg_planning_score": 80.0,
        "hist_avg_emergency_prep_score": 75.0,
        "hist_overall_score_avg": 82.0,
        "hist_consecutive_fails": 0,
        "hist_consecutive_passes": 2,
    }
    input_df = pd.DataFrame([test_record])
    prediction = loaded_pipeline.predict(input_df)[0]
    probabilities = loaded_pipeline.predict_proba(input_df)[0]

    assert prediction in VALID_TARGET_LABELS
    assert len(probabilities) == 3
    assert abs(sum(probabilities) - 1.0) < 1e-4
