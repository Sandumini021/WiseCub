from __future__ import annotations

import json
from functools import lru_cache
from typing import Any

from app.modules.cub_intent.paths import LABEL_MAPPING_PATH, MODEL_PATH
from app.modules.cub_intent.preprocess import preprocess
from app.modules.cub_intent.routes import resolve_intent_route

MODEL_NOTE = "Synthetic sklearn baseline. Not research-validated."
DEFAULT_THRESHOLD = 0.28

PATH_EXAMPLES = {
    "/market": ["how do I trade", "stock ekak buy karanne kohomada?", "show my portfolio"],
    "/market/terminal": ["how do I buy a stock", "sell order ekak danna kohomada?", "cancel my order"],
    "/market/confirm": ["what happens if I confirm", "can I cancel"],
    "/market/portfolio": ["mage portfolio eka pennanna", "what is my profit", "decision patterns"],
    "/missions": ["what is a budget", "needs vs wants"],
    "/safety": ["are scams real here", "what is a drill"],
}


def example_questions(from_path: str) -> list[str]:
    if from_path.startswith("/market/lessons"):
        return ["what is a share", "what is risk", "explain this page"]
    return PATH_EXAMPLES.get(from_path, ["open the market", "I want to go to trading", "mata therenne naha"])


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
            "example_questions": example_questions(from_path),
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
            "example_questions": example_questions(from_path),
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
        "example_questions": example_questions(from_path),
        **routed,
    }
