from __future__ import annotations

import json
from functools import lru_cache
from typing import Any

import joblib
import pandas as pd

from app.modules.stock_market.ml.config import DEMO_INDEX_MAP, DISCLAIMER, FEATURE_COLUMNS
from app.modules.stock_market.ml.explain import explain
from app.modules.stock_market.ml.paths import (
    ASSETS_PATH,
    HISTORY_PATH,
    LATEST_PATH,
    METRICS_PATH,
    MODEL_PATH,
)


class TrendModelMissing(FileNotFoundError):
    pass


def resolve_symbol(raw: str) -> str:
    key = raw.strip().upper()
    return DEMO_INDEX_MAP.get(key, key)


@lru_cache(maxsize=1)
def load_model():
    if not MODEL_PATH.exists():
        raise TrendModelMissing(str(MODEL_PATH))
    return joblib.load(MODEL_PATH)


@lru_cache(maxsize=1)
def load_assets() -> list[dict[str, Any]]:
    if not ASSETS_PATH.exists():
        return []
    return json.loads(ASSETS_PATH.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def load_history() -> dict[str, list[dict[str, Any]]]:
    if not HISTORY_PATH.exists():
        return {}
    return json.loads(HISTORY_PATH.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def load_latest() -> dict[str, dict[str, Any]]:
    if not LATEST_PATH.exists():
        return {}
    return json.loads(LATEST_PATH.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def load_metrics() -> dict[str, Any]:
    if not METRICS_PATH.exists():
        return {}
    return json.loads(METRICS_PATH.read_text(encoding="utf-8"))


def list_assets() -> list[dict[str, Any]]:
    docs = load_assets()
    for item in docs:
        item["kind"] = "market_index"
        item["note"] = "Historical index, not a WiseCub practice company."
    return docs


def history_for(symbol: str, limit: int = 180) -> dict[str, Any]:
    key = resolve_symbol(symbol)
    points = load_history().get(key)
    if not points:
        raise KeyError(key)
    return {"symbol": key, "points": points[-limit:], "disclaimer": DISCLAIMER}


def analysis_for(symbol: str) -> dict[str, Any]:
    key = resolve_symbol(symbol)
    latest = load_latest().get(key)
    assets = {item["symbol"]: item for item in load_assets()}
    meta = assets.get(key)
    if not latest or not meta:
        raise KeyError(key)
    model = load_model()
    row = pd.DataFrame([{col: latest.get(col) for col in FEATURE_COLUMNS}])
    pred = str(model.predict(row)[0])
    proba = None
    if hasattr(model, "predict_proba"):
        raw = model.predict_proba(row)[0]
        classes = list(model.classes_) if hasattr(model, "classes_") else list(getattr(model[-1], "classes_", []))
        if not classes and hasattr(model, "named_steps"):
            classes = list(model.named_steps["clf"].classes_)
        proba = {str(label): float(score) for label, score in zip(classes, raw)}
    copy = explain(pred)
    metrics = load_metrics()
    test = metrics.get("random_forest", {}).get("test", {})
    return {
        "symbol": key,
        "requested": symbol.upper(),
        "mapped_from_demo": symbol.upper() in DEMO_INDEX_MAP,
        "name": meta.get("exchange") or key,
        "region": meta.get("region"),
        "currency": meta.get("currency"),
        "category": "market_index",
        "as_of": latest.get("date"),
        "last_close": latest.get("close"),
        "trend": pred,
        "title": copy["title"],
        "explanation": copy["kid"],
        "risk": copy["risk"],
        "probabilities": proba,
        "indicators": {
            "ret_1": latest.get("ret_1"),
            "ret_5": latest.get("ret_5"),
            "ma5": latest.get("ma5"),
            "ma20": latest.get("ma20"),
            "close_ma20": latest.get("close_ma20"),
            "vol_20": latest.get("vol_20"),
            "hl_range": latest.get("hl_range"),
        },
        "model": {
            "file": MODEL_PATH.name,
            "selected": metrics.get("selected_model"),
            "test_accuracy": test.get("accuracy"),
            "test_macro_f1": test.get("macro_f1"),
            "trained_at": metrics.get("trained_at"),
        },
        "disclaimer": DISCLAIMER,
    }
