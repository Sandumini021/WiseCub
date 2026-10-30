"""Chronological S&P 500 trend model. Reuses the index-trend split and sklearn pipes."""

from __future__ import annotations

import json
from datetime import datetime, timezone

import joblib
import pandas as pd

from app.modules.stock_market.ml.config import (
    DOWN_THRESHOLD,
    FEATURE_COLUMNS,
    HORIZON_DAYS,
    UP_THRESHOLD,
)
from app.modules.stock_market.ml.paths import (
    SP500_ARTIFACTS_DIR,
    SP500_BASELINE_PATH,
    SP500_FEATURES_PATH,
    SP500_METRICS_PATH,
    SP500_MODEL_PATH,
    SP500_REPORT_PATH,
    SP500_SPLIT_PATH,
)
from app.modules.stock_market.ml.sp500_preprocess import run as run_preprocess
from app.modules.stock_market.ml.train import (
    _dummy,
    _pipe_baseline,
    _pipe_rf,
    _scores,
    chrono_masks,
)

# Full S&P table is millions of rows. Fit RF on a train-only subsample; score on full test.
RF_TRAIN_MAX_ROWS = 250_000


def _load_features() -> pd.DataFrame:
    if SP500_FEATURES_PATH.exists():
        try:
            return pd.read_parquet(SP500_FEATURES_PATH)
        except Exception:
            pass
    return run_preprocess()


def train(frame: pd.DataFrame | None = None) -> dict:
    SP500_ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    if frame is None:
        frame = _load_features()
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

    rf_note = "random_forest trained on full train split"
    if len(x_train) > RF_TRAIN_MAX_ROWS:
        chunks = []
        cap = max(RF_TRAIN_MAX_ROWS // 3, 1)
        for _label, group in frame.loc[train_m].groupby("label"):
            chunks.append(group.sample(n=min(len(group), cap), random_state=42))
        sample = pd.concat(chunks, ignore_index=True)
        if len(sample) > RF_TRAIN_MAX_ROWS:
            sample = sample.sample(n=RF_TRAIN_MAX_ROWS, random_state=42)
        rf_note = (
            f"random_forest fit on {len(sample)} train-only rows "
            f"(cap {RF_TRAIN_MAX_ROWS}); metrics use the full chrono test split"
        )
        x_rf, y_rf = sample[FEATURE_COLUMNS], sample["label"].astype(str)
    else:
        x_rf, y_rf = x_train, y_train
    forest = _pipe_rf()
    forest.fit(x_rf, y_rf)

    payload = {
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset": "sp500_stocks.csv + sp500_companies.csv",
        "model_note": (
            "3-class 5-day trend on historical S&P 500 company bars. "
            "Not a CSE picker. Not validated on children. Pretend money only."
        ),
        "rf_fit_note": rf_note,
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
        joblib.dump(baseline, SP500_MODEL_PATH)
    else:
        joblib.dump(forest, SP500_MODEL_PATH)
    joblib.dump(baseline, SP500_BASELINE_PATH)
    payload["selected_model"] = chosen
    SP500_SPLIT_PATH.write_text(json.dumps(payload["split"], indent=2), encoding="utf-8")
    SP500_METRICS_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    bl = payload["logistic_baseline"]["test"]
    rf = payload["random_forest"]["test"]
    report = [
        "# S&P 500 classroom-trend evaluation",
        "",
        f"- Data: daily bars in `data/raw/sp500_stocks.csv` (originals not edited)",
        f"- Horizon: {HORIZON_DAYS} trading days",
        f"- Upward if future return ≥ {UP_THRESHOLD:.1%}; downward if ≤ {DOWN_THRESHOLD:.1%}",
        f"- Chrono split: train through {split_meta['train_end']}; test after {split_meta['val_end']}",
        f"- Train rows {payload['split']['train_rows']}; test rows {payload['split']['test_rows']}",
        f"- Selected model: {chosen}",
        f"- {rf_note}",
        "",
        "## Test metrics (later dates only)",
        "",
        "| model | accuracy | macro F1 |",
        "|---|---:|---:|",
        f"| dummy most_frequent | {payload['dummy_most_frequent']['test']['accuracy']:.3f} | {payload['dummy_most_frequent']['test']['macro_f1']:.3f} |",
        f"| logistic baseline | {bl['accuracy']:.3f} | {bl['macro_f1']:.3f} |",
        f"| random forest | {rf['accuracy']:.3f} | {rf['macro_f1']:.3f} |",
        "",
        "Selected-model test classification report:",
        "",
        "```",
        payload[chosen]["test"]["classification_report"],
        "```",
        "",
        "This is a classroom label on old US large-cap prices. It is often wrong. "
        "WiseCub still uses pretend rupees. It is not a tip to buy or sell.",
        "",
    ]
    SP500_REPORT_PATH.write_text("\n".join(report), encoding="utf-8")
    return payload


def main() -> None:
    result = train()
    print("selected", result["selected_model"])
    print("logistic test acc", result["logistic_baseline"]["test"]["accuracy"])
    print("logistic test macro F1", result["logistic_baseline"]["test"]["macro_f1"])
    print("RF test acc", result["random_forest"]["test"]["accuracy"])
    print("RF test macro F1", result["random_forest"]["test"]["macro_f1"])
    print("wrote", SP500_MODEL_PATH)


if __name__ == "__main__":
    main()
