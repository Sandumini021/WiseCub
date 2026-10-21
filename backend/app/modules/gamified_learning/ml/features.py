"""
WiseCub CDEMF — ML Feature Engineering & Leakage Prevention (Checkpoint B1)
==========================================================================
Defines strict feature allowlists, forbidden target-leakage columns, and the
reproducible scikit-learn preprocessing pipeline for next-activity support
prediction.
"""
from __future__ import annotations

from typing import Any
import numpy as np

# ─────────────────────────────────────────────────────────────────────────────
# 1. Feature Allowlist Definitions (Pre-Activity Lagged Evidence Only)
# ─────────────────────────────────────────────────────────────────────────────

CATEGORICAL_FEATURES: list[str] = [
    "mission_id",
    "level_id",
    "interaction_type",
]

NUMERICAL_FEATURES: list[str] = [
    "level_number",
    "starting_budget_lkr",
    "attempt_number",
    "is_retry",
    "step_index",
    "hist_completed_levels_count",
    "hist_prior_attempts_count",
    "hist_retry_rate",
    "hist_remediation_count",
    "hist_avg_budgeting_score",
    "hist_avg_spending_score",
    "hist_avg_saving_score",
    "hist_avg_investment_score",
    "hist_avg_planning_score",
    "hist_avg_emergency_prep_score",
    "hist_overall_score_avg",
    "hist_consecutive_fails",
    "hist_consecutive_passes",
]

ALL_ALLOWED_FEATURES: list[str] = CATEGORICAL_FEATURES + NUMERICAL_FEATURES

TARGET_COLUMN: str = "next_activity_support_need"
GROUP_COLUMN: str = "synthetic_student_id"

# ─────────────────────────────────────────────────────────────────────────────
# 2. Forbidden Columns (Strict Target Leakage & Cheating Prevention)
# ─────────────────────────────────────────────────────────────────────────────

FORBIDDEN_COLUMNS: set[str] = {
    # Record and session identifiers (not generalizable features)
    "record_id",
    "attempt_id",
    # Student grouping key (used only for GroupKFold split stratification)
    "synthetic_student_id",
    # Unobservable simulation archetype
    "archetype",
    # Temporal timestamp
    "simulated_timestamp_iso",
    # Current level decision inputs (unknown before child acts)
    "decision_summary",
    "allocated_amount_lkr",
    "discretionary_spent_lkr",
    "reserve_preserved_lkr",
    # Current level evaluation gates & outcomes (produced after decision)
    "is_budget_feasible",
    "essential_needs_covered",
    "score_budgeting",
    "score_spending",
    "score_saving",
    "score_investment",
    "score_goal",
    "overall_score",
    "passed",
    "character_condition",
    "character_emotion",
    "transition_direction",
    "remediation_triggered",
    # The ground truth target label itself
    "next_activity_support_need",
    # Latent variables or future forward observations
    "subsequent_attempt_score",
    "latent_theta_proficiency",
    "latent_impulsivity",
    "_theta_avg",
}

VALID_TARGET_LABELS: list[str] = [
    "NEEDS_FOUNDATION_SUPPORT",
    "READY_FOR_STANDARD",
    "READY_FOR_ADVANCED",
]


def validate_feature_leakage(feature_names: list[str]) -> None:
    """
    Validates that no forbidden or target-leaking column is included in the feature set.
    Raises ValueError immediately if a violation is detected.
    """
    for col in feature_names:
        if col in FORBIDDEN_COLUMNS:
            raise ValueError(
                f"Data leakage detected! Column '{col}' is in FORBIDDEN_COLUMNS and "
                "must never be supplied to predictive models."
            )
        if col not in ALL_ALLOWED_FEATURES:
            raise ValueError(
                f"Unapproved feature detected: '{col}'. Only features in ALL_ALLOWED_FEATURES "
                "are permitted to maintain strict pedagogical validity."
            )


def build_preprocessor():
    """
    Constructs an isolated scikit-learn ColumnTransformer for preprocessing.
    Numeric: SimpleImputer(median) -> StandardScaler()
    Categorical: SimpleImputer(constant) -> OneHotEncoder(handle_unknown='ignore')
    """
    from sklearn.compose import ColumnTransformer
    from sklearn.impute import SimpleImputer
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import OneHotEncoder, StandardScaler

    num_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    cat_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="constant", fill_value="missing")),
            ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", num_pipeline, NUMERICAL_FEATURES),
            ("cat", cat_pipeline, CATEGORICAL_FEATURES),
        ],
        remainder="drop",
    )
    return preprocessor
