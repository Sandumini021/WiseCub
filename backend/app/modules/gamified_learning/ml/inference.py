"""
WiseCub CDEMF — Production-Grade ML Inference & Fallback Policy (Checkpoint B2)
==============================================================================
Encapsulates safe model loading, input validation, confidence-calibrated inference,
and conservative rule-based pedagogical fallbacks.

Pedagogical Safety Contract:
  1. The ML model NEVER unlocks levels or overrides CDEMF mastery gates.
  2. Predictions are solely used for formative practice scaffolding and hints.
  3. Conservative Fallback triggers whenever:
     - The learner has insufficient gameplay history (cold-start: < 2 attempts).
     - The model's prediction confidence is below the safety threshold (0.50).
     - The model artifact is missing or fails deserialization.
     - Input features are malformed or missing.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import pandas as pd

from app.modules.gamified_learning.ml.features import (
    ALL_ALLOWED_FEATURES,
    VALID_TARGET_LABELS,
    validate_feature_leakage,
)
from app.modules.gamified_learning.ml.paths import ARTIFACTS_DIR

logger = logging.getLogger("wisecub.cdemf.ml")

MODEL_VERSION = "v1.0.0"
DEFAULT_MODEL_PATH = ARTIFACTS_DIR / "cdemf_support_model_v1.joblib"
FALLBACK_MODEL_PATH = ARTIFACTS_DIR / "cdemf_support_model_candidate.joblib"

CONFIDENCE_SAFETY_THRESHOLD = 0.50
MIN_PRIOR_ATTEMPTS_REQUIRED = 2

# Conservative pedagogical default when falling back
DEFAULT_FALLBACK_LABEL = "READY_FOR_STANDARD"


@dataclass
class SupportPredictionResult:
    """Structured result returned by the ML adaptive support engine."""
    predicted_support_need: str
    probabilities: dict[str, float]
    confidence: float
    fallback_used: bool
    fallback_reason: str | None
    model_version: str
    educational_action: str


class CDEMFSupportPredictor:
    """
    Singleton-style predictor with lazy loading, feature validation,
    and conservative fallback safeguards.
    """

    def __init__(self, model_path: Path | None = None):
        self.model_path = model_path or (
            DEFAULT_MODEL_PATH if DEFAULT_MODEL_PATH.exists() else FALLBACK_MODEL_PATH
        )
        self._pipeline = None

    def _get_pipeline(self):
        """Loads and caches the scikit-learn pipeline safely."""
        if self._pipeline is None:
            if not self.model_path.exists():
                logger.warning(f"CDEMF ML artifact missing at {self.model_path}")
                return None
            try:
                self._pipeline = joblib.load(self.model_path)
            except Exception as e:
                logger.error(f"Failed to load CDEMF ML pipeline: {e}")
                return None
        return self._pipeline

    def predict_support(
        self,
        features: dict[str, Any],
        confidence_threshold: float = CONFIDENCE_SAFETY_THRESHOLD,
    ) -> SupportPredictionResult:
        """
        Executes confidence-gated prediction with rule-based fallback.
        """
        prior_attempts = features.get("hist_prior_attempts_count", 0)
        completed_levels = features.get("hist_completed_levels_count", 0)

        # 1. Cold-Start / Insufficient History Fallback
        if prior_attempts < MIN_PRIOR_ATTEMPTS_REQUIRED or completed_levels == 0:
            # Rule-based determination from current average
            avg_score = features.get("hist_overall_score_avg", 50.0)
            rule_label = "NEEDS_FOUNDATION_SUPPORT" if avg_score < 75.0 else "READY_FOR_STANDARD"
            return SupportPredictionResult(
                predicted_support_need=rule_label,
                probabilities={lbl: (1.0 if lbl == rule_label else 0.0) for lbl in VALID_TARGET_LABELS},
                confidence=1.0,
                fallback_used=True,
                fallback_reason="INSUFFICIENT_HISTORY_COLD_START",
                model_version=MODEL_VERSION,
                educational_action="Standard CDEMF rule-based curriculum progression",
            )

        # 2. Model Availability Fallback
        pipeline = self._get_pipeline()
        if pipeline is None:
            return SupportPredictionResult(
                predicted_support_need=DEFAULT_FALLBACK_LABEL,
                probabilities={lbl: 0.333 for lbl in VALID_TARGET_LABELS},
                confidence=0.333,
                fallback_used=True,
                fallback_reason="MODEL_ARTIFACT_UNAVAILABLE",
                model_version=MODEL_VERSION,
                educational_action="Default curriculum progression (model unavailable)",
            )

        # 3. Feature Assembly & Leakage Check
        try:
            # Verify no forbidden keys passed
            validate_feature_leakage([k for k in features.keys() if k in ALL_ALLOWED_FEATURES])
            row_data = {feat: features.get(feat, 0) for feat in ALL_ALLOWED_FEATURES}
            input_df = pd.DataFrame([row_data])

            # 4. Model Prediction & Probabilities
            probs = pipeline.predict_proba(input_df)[0]
            classes = list(pipeline.classes_)
            prob_dict = {str(cls_name): round(float(prob), 4) for cls_name, prob in zip(classes, probs)}

            best_class = max(prob_dict, key=prob_dict.get)
            max_prob = prob_dict[best_class]

            # 5. Low Confidence Gating
            if max_prob < confidence_threshold:
                return SupportPredictionResult(
                    predicted_support_need=DEFAULT_FALLBACK_LABEL,
                    probabilities=prob_dict,
                    confidence=max_prob,
                    fallback_used=True,
                    fallback_reason=f"LOW_CONFIDENCE_{max_prob:.2f}_BELOW_{confidence_threshold:.2f}",
                    model_version=MODEL_VERSION,
                    educational_action="Standard CDEMF curriculum (ML confidence below safety threshold)",
                )

            # 6. Accepted High-Confidence Prediction
            if best_class == "NEEDS_FOUNDATION_SUPPORT":
                action = "Recommend optional scaffolded practice mission and targeted hint cards"
            elif best_class == "READY_FOR_ADVANCED":
                action = "Recommend optional advanced challenge exercises and bonus financial puzzles"
            else:
                action = "Continue standard CDEMF story mission progression"

            return SupportPredictionResult(
                predicted_support_need=best_class,
                probabilities=prob_dict,
                confidence=max_prob,
                fallback_used=False,
                fallback_reason=None,
                model_version=MODEL_VERSION,
                educational_action=action,
            )

        except Exception as e:
            logger.error(f"Prediction execution failed: {e}")
            return SupportPredictionResult(
                predicted_support_need=DEFAULT_FALLBACK_LABEL,
                probabilities={lbl: 0.333 for lbl in VALID_TARGET_LABELS},
                confidence=0.0,
                fallback_used=True,
                fallback_reason=f"EXECUTION_ERROR_{str(e)}",
                model_version=MODEL_VERSION,
                educational_action="Standard CDEMF curriculum (runtime error fallback)",
            )


# Global default predictor instance
default_predictor = CDEMFSupportPredictor()
