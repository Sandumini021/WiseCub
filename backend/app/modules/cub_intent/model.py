from __future__ import annotations

import json
from functools import lru_cache
from typing import Any

from app.modules.cub_intent.paths import LABEL_MAPPING_PATH, MODEL_PATH
from app.modules.cub_intent.preprocess import preprocess
from app.modules.cub_intent.routes import resolve_intent_route

MODEL_NOTE = "Synthetic sklearn baseline. Not research-validated."
DEFAULT_THRESHOLD = 0.42


@lru_cache(maxsize=1)
def load_bundle() -> dict[str, Any] | None:
    if not MODEL_PATH.exists() or not LABEL_MAPPING_PATH.exists():
        return None
    import joblib

    pipeline = joblib.load(MODEL_PATH)
    mapping = json.loads(LABEL_MAPPING_PATH.read_text(encoding="utf-8"))
    return {"pipeline": pipeline, "mapping": mapping}


def predict_intent(text: str, role: str | None, from_path: str = "") -> dict[str, Any]:
    bundle = load_bundle()
    if bundle is None:
        return {
            "model_ready": False,
            "used_model": False,
            "model_note": "No saved intent model. Train with: python -m app.modules.cub_intent.train",
            "intent": None,
            "confidence": 0.0,
            "reliable": False,
            "suggested_route": None,
            "navigation_blocked": False,
            "blocked_reason": None,
            "needs_confirm": False,
        }

    mapping = bundle["mapping"]
    threshold = float(mapping.get("confidence_threshold", DEFAULT_THRESHOLD))
    pipeline = bundle["pipeline"]
    cleaned = preprocess(text)
    if not cleaned:
        return {
            "model_ready": True,
            "used_model": False,
            "model_note": mapping.get("model_note", MODEL_NOTE),
            "intent": None,
            "confidence": 0.0,
            "reliable": False,
            "suggested_route": None,
            "navigation_blocked": False,
            "blocked_reason": None,
            "needs_confirm": False,
        }

    proba = pipeline.predict_proba([cleaned])[0]
    classes = list(pipeline.classes_)
    best = int(proba.argmax())
    intent = str(classes[best])
    confidence = float(proba[best])
    routed = resolve_intent_route(intent, role, from_path)
    return {
        "model_ready": True,
        "used_model": True,
        "model_note": mapping.get("model_note", MODEL_NOTE),
        "intent": intent,
        "confidence": confidence,
        "reliable": confidence >= threshold,
        "confidence_threshold": threshold,
        **routed,
    }
