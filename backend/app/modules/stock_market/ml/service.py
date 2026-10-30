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
    SP500_ASSETS_PATH,
    SP500_HISTORY_PATH,
    SP500_LATEST_PATH,
    SP500_METRICS_PATH,
    SP500_MODEL_PATH,
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


@lru_cache(maxsize=1)
def load_sp500_model():
    if not SP500_MODEL_PATH.exists():
        raise TrendModelMissing(str(SP500_MODEL_PATH))
    return joblib.load(SP500_MODEL_PATH)


@lru_cache(maxsize=1)
def load_sp500_assets() -> list[dict[str, Any]]:
    if not SP500_ASSETS_PATH.exists():
        return []
    return json.loads(SP500_ASSETS_PATH.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def load_sp500_history() -> dict[str, list[dict[str, Any]]]:
    if not SP500_HISTORY_PATH.exists():
        return {}
    return json.loads(SP500_HISTORY_PATH.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def load_sp500_latest() -> dict[str, dict[str, Any]]:
    if not SP500_LATEST_PATH.exists():
        return {}
    return json.loads(SP500_LATEST_PATH.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def load_sp500_metrics() -> dict[str, Any]:
    if not SP500_METRICS_PATH.exists():
        return {}
    return json.loads(SP500_METRICS_PATH.read_text(encoding="utf-8"))


def list_assets() -> list[dict[str, Any]]:
    docs = []
    for item in load_assets():
        row = dict(item)
        row["kind"] = "market_index"
        row["note"] = "Historical index, not a WiseCub practice company."
        docs.append(row)
    for item in load_sp500_assets():
        row = dict(item)
        row["kind"] = "sp500_company"
        row["note"] = "Historical S&P 500 company file. Not a WiseCub pretend ticker. Classroom chart only."
        docs.append(row)
    return docs


def _predict(model, latest: dict[str, Any]) -> tuple[str, dict[str, float] | None]:
    row = pd.DataFrame([{col: latest.get(col) for col in FEATURE_COLUMNS}])
    pred = str(model.predict(row)[0])
    proba = None
    if hasattr(model, "predict_proba"):
        raw = model.predict_proba(row)[0]
        classes = list(model.classes_) if hasattr(model, "classes_") else list(getattr(model[-1], "classes_", []))
        if not classes and hasattr(model, "named_steps"):
            classes = list(model.named_steps["clf"].classes_)
        proba = {str(label): float(score) for label, score in zip(classes, raw)}
    return pred, proba


def history_for(symbol: str, limit: int = 180) -> dict[str, Any]:
    key = resolve_symbol(symbol)
    points = load_sp500_history().get(key) or load_history().get(key)
    if not points:
        raise KeyError(key)
    source = "sp500_company" if key in load_sp500_history() else "market_index"
    return {"symbol": key, "points": points[-limit:], "source": source, "disclaimer": DISCLAIMER}


def analysis_for(symbol: str) -> dict[str, Any]:
    requested = symbol.strip().upper()
    key = resolve_symbol(symbol)
    sp_latest = load_sp500_latest().get(requested)
    if sp_latest:
        meta = {item["symbol"]: item for item in load_sp500_assets()}.get(requested) or {}
        model = load_sp500_model()
        pred, proba = _predict(model, sp_latest)
        copy = explain(pred)
        metrics = load_sp500_metrics()
        selected = metrics.get("selected_model") or "logistic_baseline"
        test = metrics.get(selected, {}).get("test", {})
        return {
            "symbol": requested,
            "requested": requested,
            "mapped_from_demo": False,
            "name": meta.get("name") or requested,
            "region": meta.get("region") or "United States",
            "currency": meta.get("currency") or "USD",
            "sector": meta.get("sector"),
            "category": "sp500_company",
            "as_of": sp_latest.get("date"),
            "last_close": sp_latest.get("close"),
            "trend": pred,
            "title": copy["title"],
            "explanation": copy["kid"],
            "risk": copy["risk"],
            "probabilities": proba,
            "indicators": {
                "ret_1": sp_latest.get("ret_1"),
                "ret_5": sp_latest.get("ret_5"),
                "ma5": sp_latest.get("ma5"),
                "ma20": sp_latest.get("ma20"),
                "close_ma20": sp_latest.get("close_ma20"),
                "vol_20": sp_latest.get("vol_20"),
                "hl_range": sp_latest.get("hl_range"),
            },
            "model": {
                "file": SP500_MODEL_PATH.name,
                "selected": selected,
                "test_accuracy": test.get("accuracy"),
                "test_macro_f1": test.get("macro_f1"),
                "trained_at": metrics.get("trained_at"),
            },
            "disclaimer": DISCLAIMER,
        }
    latest = load_latest().get(key)
    assets = {item["symbol"]: item for item in load_assets()}
    meta = assets.get(key)
    if not latest or not meta:
        raise KeyError(key)
    model = load_model()
    pred, proba = _predict(model, latest)
    copy = explain(pred)
    metrics = load_metrics()
    selected = metrics.get("selected_model") or "random_forest"
    test = metrics.get(selected, {}).get("test", {})
    return {
        "symbol": key,
        "requested": requested,
        "mapped_from_demo": requested in DEMO_INDEX_MAP,
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
            "selected": selected,
            "test_accuracy": test.get("accuracy"),
            "test_macro_f1": test.get("macro_f1"),
            "trained_at": metrics.get("trained_at"),
        },
        "disclaimer": DISCLAIMER,
    }
