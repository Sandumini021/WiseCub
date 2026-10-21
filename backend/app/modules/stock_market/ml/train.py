"""Chronological train/val/test for the 3-class index trend model."""

from __future__ import annotations

import json
from datetime import datetime, timezone

import pandas as pd
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_recall_fscore_support,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
import joblib

from app.modules.stock_market.ml.config import (
    DOWN_THRESHOLD,
    FEATURE_COLUMNS,
    HORIZON_DAYS,
    LABELS,
    MAX_DEPTH,
    N_ESTIMATORS,
    RANDOM_STATE,
    TRAIN_DATE_FRAC,
    UP_THRESHOLD,
    VAL_DATE_FRAC,
)
from app.modules.stock_market.ml.paths import (
    ARTIFACTS_DIR,
    BASELINE_PATH,
    CLEANED_CSV_PATH,
    CLEANED_PATH,
    FEATURE_NAMES_PATH,
    LABEL_CONFIG_PATH,
    METRICS_PATH,
    MODEL_PATH,
    REPORT_PATH,
    SPLIT_PATH,
)
from app.modules.stock_market.ml.preprocess import run as run_preprocess


def chrono_masks(dates: pd.Series) -> tuple[pd.Series, pd.Series, pd.Series, dict]:
    unique = pd.Series(sorted(dates.unique()))
    n = len(unique)
    train_end = unique.iloc[max(int(n * TRAIN_DATE_FRAC) - 1, 0)]
    val_end = unique.iloc[max(int(n * (TRAIN_DATE_FRAC + VAL_DATE_FRAC)) - 1, 0)]
    train = dates <= train_end
    val = (dates > train_end) & (dates <= val_end)
    test = dates > val_end
    meta = {
        "train_end": pd.Timestamp(train_end).strftime("%Y-%m-%d"),
        "val_end": pd.Timestamp(val_end).strftime("%Y-%m-%d"),
        "date_min": pd.Timestamp(unique.iloc[0]).strftime("%Y-%m-%d"),
        "date_max": pd.Timestamp(unique.iloc[-1]).strftime("%Y-%m-%d"),
        "n_dates": int(n),
        "shuffle": False,
    }
    return train, val, test, meta


def _scores(y_true, y_pred) -> dict:
    labels = list(LABELS)
    prec, rec, f1, support = precision_recall_fscore_support(
        y_true, y_pred, labels=labels, zero_division=0
    )
    per_class = {
        label: {
            "precision": float(prec[i]),
            "recall": float(rec[i]),
            "f1": float(f1[i]),
            "support": int(support[i]),
        }
        for i, label in enumerate(labels)
    }
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "macro_f1": float(f1_score(y_true, y_pred, average="macro", zero_division=0)),
        "labels": labels,
        "per_class": per_class,
        "confusion_matrix": confusion_matrix(y_true, y_pred, labels=labels).tolist(),
        "classification_report": classification_report(
            y_true, y_pred, labels=labels, zero_division=0
        ),
    }


def _pipe_rf() -> Pipeline:
    return Pipeline(
        [
            ("impute", SimpleImputer(strategy="median")),
            (
                "clf",
                RandomForestClassifier(
                    n_estimators=N_ESTIMATORS,
                    max_depth=MAX_DEPTH,
                    min_samples_leaf=8,
                    class_weight="balanced",
                    random_state=RANDOM_STATE,
                    n_jobs=1,
                ),
            ),
        ]
    )


def _pipe_baseline() -> Pipeline:
    return Pipeline(
        [
            ("impute", SimpleImputer(strategy="median")),
            ("scale", StandardScaler()),
            (
                "clf",
                LogisticRegression(
                    max_iter=400,
                    class_weight="balanced",
                    random_state=RANDOM_STATE,
                ),
            ),
        ]
    )


def _dummy() -> DummyClassifier:
    return DummyClassifier(strategy="most_frequent")


def train(frame: pd.DataFrame | None = None) -> dict:
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    if frame is None:
        if CLEANED_PATH.exists():
            try:
                frame = pd.read_parquet(CLEANED_PATH)
            except Exception:
                frame = pd.read_csv(CLEANED_CSV_PATH, parse_dates=["date"])
        elif CLEANED_CSV_PATH.exists():
            frame = pd.read_csv(CLEANED_CSV_PATH, parse_dates=["date"])
        else:
            frame = run_preprocess()
    train_m, val_m, test_m, split_meta = chrono_masks(frame["date"])
    x = frame[FEATURE_COLUMNS]
    y = frame["label"].astype(str)
    x_train, y_train = x[train_m], y[train_m]
    x_val, y_val = x[val_m], y[val_m]
    x_test, y_test = x[test_m], y[test_m]

    dummy = _dummy()
    dummy.fit(x_train, y_train)
    baseline = _pipe_baseline()
    baseline.fit(x_train, y_train)
    forest = _pipe_rf()
    forest.fit(x_train, y_train)

    payload = {
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "model_note": (
            "Random Forest on historical market indices (Kaggle global indexes). "
            "Not a CSE stock picker. Not validated on children. Education only."
        ),
        "horizon_days": HORIZON_DAYS,
        "up_threshold": UP_THRESHOLD,
        "down_threshold": DOWN_THRESHOLD,
        "features": FEATURE_COLUMNS,
        "split": {
            **split_meta,
            "train_rows": int(train_m.sum()),
            "val_rows": int(val_m.sum()),
            "test_rows": int(test_m.sum()),
            "class_counts_all": y.value_counts().to_dict(),
            "class_counts_train": y_train.value_counts().to_dict(),
            "class_counts_test": y_test.value_counts().to_dict(),
        },
        "dummy_most_frequent": {
            "val": _scores(y_val, dummy.predict(x_val)),
            "test": _scores(y_test, dummy.predict(x_test)),
        },
        "logistic_baseline": {
            "val": _scores(y_val, baseline.predict(x_val)),
            "test": _scores(y_test, baseline.predict(x_test)),
        },
        "random_forest": {
            "val": _scores(y_val, forest.predict(x_val)),
            "test": _scores(y_test, forest.predict(x_test)),
        },
    }
    chosen = "random_forest"
    if payload["logistic_baseline"]["test"]["macro_f1"] > payload["random_forest"]["test"]["macro_f1"]:
        chosen = "logistic_baseline"
        joblib.dump(baseline, MODEL_PATH)
    else:
        joblib.dump(forest, MODEL_PATH)
    joblib.dump(baseline, BASELINE_PATH)
    payload["selected_model"] = chosen
    FEATURE_NAMES_PATH.write_text(json.dumps(FEATURE_COLUMNS, indent=2), encoding="utf-8")
    LABEL_CONFIG_PATH.write_text(
        json.dumps(
            {
                "horizon_days": HORIZON_DAYS,
                "upward": f"future {HORIZON_DAYS}-day return >= {UP_THRESHOLD}",
                "downward": f"future {HORIZON_DAYS}-day return <= {DOWN_THRESHOLD}",
                "sideways": "between thresholds",
                "labels": list(LABELS),
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    SPLIT_PATH.write_text(json.dumps(payload["split"], indent=2), encoding="utf-8")
    METRICS_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    rf_test = payload["random_forest"]["test"]
    bl_test = payload["logistic_baseline"]["test"]
    report = [
        "# Market-trend evaluation (classroom indices)",
        "",
        f"- Horizon: {HORIZON_DAYS} trading days",
        f"- Upward if future return ≥ {UP_THRESHOLD:.1%}; downward if ≤ {DOWN_THRESHOLD:.1%}",
        f"- Train dates through {split_meta['train_end']}; test after {split_meta['val_end']}",
        f"- Train rows {payload['split']['train_rows']}; test rows {payload['split']['test_rows']}",
        f"- Selected model: {chosen}",
        "",
        "## Test metrics (later dates only)",
        "",
        f"| model | accuracy | macro F1 |",
        f"|---|---:|---:|",
        f"| dummy most_frequent | {payload['dummy_most_frequent']['test']['accuracy']:.3f} | {payload['dummy_most_frequent']['test']['macro_f1']:.3f} |",
        f"| logistic baseline | {bl_test['accuracy']:.3f} | {bl_test['macro_f1']:.3f} |",
        f"| random forest | {rf_test['accuracy']:.3f} | {rf_test['macro_f1']:.3f} |",
        "",
        "Random forest test classification report:",
        "",
        "```",
        rf_test["classification_report"],
        "```",
        "",
        "Confusion matrix rows/cols = downward, sideways, upward:",
        "",
        f"`{rf_test['confusion_matrix']}`",
        "",
        "Limitations: indices only (not SUNTEA-style companies); volume often zero; "
        "macro F1 can stay modest. Do not treat this as investment advice.",
        "",
    ]
    REPORT_PATH.write_text("\n".join(report), encoding="utf-8")
    return payload


def main() -> None:
    result = train()
    print("selected", result["selected_model"])
    print("RF test accuracy", result["random_forest"]["test"]["accuracy"])
    print("RF test macro F1", result["random_forest"]["test"]["macro_f1"])
    print("wrote", MODEL_PATH)


if __name__ == "__main__":
    main()
