from __future__ import annotations

import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support
from sklearn.pipeline import FeatureUnion, Pipeline

from app.modules.cub_intent.dataset import file_sha256, grouped_split, load_rows, split_has_group_leak
from app.modules.cub_intent.paths import (
    ARTIFACTS_DIR,
    DATA_CSV,
    LABEL_MAPPING_PATH,
    METRICS_PATH,
    MODEL_PATH,
    SPLIT_PATH,
)
from app.modules.cub_intent.preprocess import preprocess
from app.modules.cub_intent.routes import DATASET_ROUTE_CORRECTIONS, INTENT_APP_ROUTES

RANDOM_STATE = 42
MODEL_NOTE = "Synthetic sklearn baseline on the 5000-row classroom CSV. Not research-validated."


def build_pipeline() -> Pipeline:
    features = FeatureUnion(
        [
            (
                "word",
                TfidfVectorizer(
                    preprocessor=preprocess,
                    analyzer="word",
                    ngram_range=(1, 2),
                    min_df=2,
                    lowercase=False,
                    token_pattern=r"(?u)\b\w+\b",
                ),
            ),
            (
                "char",
                TfidfVectorizer(
                    preprocessor=preprocess,
                    analyzer="char",
                    ngram_range=(3, 5),
                    min_df=2,
                    lowercase=False,
                ),
            ),
        ]
    )
    classifier = LogisticRegression(
        max_iter=2000,
        class_weight="balanced",
        C=2.0,
        solver="lbfgs",
        random_state=RANDOM_STATE,
    )
    return Pipeline([("features", features), ("clf", classifier)])


def _subset(rows: list[dict[str, str]], indexes: list[int]) -> tuple[list[str], list[str], list[str]]:
    texts = [rows[i]["text"] for i in indexes]
    labels = [rows[i]["intent"] for i in indexes]
    langs = [rows[i]["language"] for i in indexes]
    return texts, labels, langs


def _report(y_true: list[str], y_pred: list[str], labels: list[str], present_only: bool = False) -> dict:
    used = [label for label in labels if label in set(y_true)] if present_only else labels
    if not used:
        return {
            "macro_precision": 0.0,
            "macro_recall": 0.0,
            "macro_f1": 0.0,
            "n": 0,
            "per_class": {},
            "confusion_matrix_labels": [],
            "confusion_matrix": [],
            "sklearn_report": "no rows",
            "intents_present": [],
        }
    precision, recall, f1, support = precision_recall_fscore_support(
        y_true, y_pred, labels=used, average=None, zero_division=0
    )
    macro_p, macro_r, macro_f1, _ = precision_recall_fscore_support(
        y_true, y_pred, labels=used, average="macro", zero_division=0
    )
    per_class = {}
    for index, label in enumerate(used):
        per_class[label] = {
            "precision": float(precision[index]),
            "recall": float(recall[index]),
            "f1": float(f1[index]),
            "support": int(support[index]),
        }
    matrix = confusion_matrix(y_true, y_pred, labels=used).tolist()
    return {
        "macro_precision": float(macro_p),
        "macro_recall": float(macro_r),
        "macro_f1": float(macro_f1),
        "n": len(y_true),
        "per_class": per_class,
        "confusion_matrix_labels": used,
        "confusion_matrix": matrix,
        "sklearn_report": classification_report(y_true, y_pred, labels=used, zero_division=0),
        "intents_present": used,
    }


def _eval_by_language(y_true: list[str], y_pred: list[str], langs: list[str], labels: list[str]) -> dict:
    by_lang: dict[str, dict] = {}
    grouped_true: dict[str, list[str]] = defaultdict(list)
    grouped_pred: dict[str, list[str]] = defaultdict(list)
    for truth, pred, lang in zip(y_true, y_pred, langs):
        grouped_true[lang].append(truth)
        grouped_pred[lang].append(pred)
    for lang in sorted(grouped_true):
        by_lang[lang] = _report(grouped_true[lang], grouped_pred[lang], labels, present_only=True)
    return by_lang


def train_and_evaluate() -> dict:
    rows = load_rows()
    split = grouped_split(rows, seed=RANDOM_STATE)
    leak = split_has_group_leak(rows, split)
    labels = sorted({row["intent"] for row in rows})
    pipeline = build_pipeline()
    x_train, y_train, _ = _subset(rows, split["train"])
    pipeline.fit(x_train, y_train)

    metrics: dict = {
        "model_note": MODEL_NOTE,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset_path": str(DATA_CSV),
        "dataset_sha256": file_sha256(DATA_CSV),
        "n_rows_loaded": len(rows),
        "n_rows_trained": len(split["train"]),
        "n_discarded": 0,
        "grouped_split_leak_groups": leak,
        "split_sizes": {name: len(indexes) for name, indexes in split.items()},
        "split_language_counts": {},
        "quality_flag_counts": dict(Counter(flag for row in rows for flag in row["quality_flags"].split(",") if flag)),
        "intents": labels,
        "interpretation": (
            "Scores are on this synthetic, keyword-separated CSV only. "
            "English templates often collapse to one stem per intent, so grouped English test/val "
            "coverage is thin. Perfect F1 does not mean Cub understands real child speech."
        ),
    }
    for name, indexes in split.items():
        metrics["split_language_counts"][name] = dict(Counter(rows[i]["language"] for i in indexes))

    for split_name in ("validation", "test"):
        texts, y_true, langs = _subset(rows, split[split_name])
        y_pred = pipeline.predict(texts).tolist()
        metrics[split_name] = {
            "overall": _report(y_true, y_pred, labels),
            "by_language": _eval_by_language(y_true, y_pred, langs, labels),
        }
        flagged_idx = [i for i, row_i in enumerate(split[split_name]) if rows[row_i]["quality_flags"]]
        keep = [i for i in range(len(y_true)) if i not in set(flagged_idx)]
        metrics[split_name]["ablation_without_quality_flags"] = {
            "n_held_out_flagged": len(flagged_idx),
            "overall": _report([y_true[i] for i in keep], [y_pred[i] for i in keep], labels) if keep else None,
        }

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    import joblib

    joblib.dump(pipeline, MODEL_PATH)
    mapping = {
        "model_note": MODEL_NOTE,
        "intents": labels,
        "intent_to_id": {label: index for index, label in enumerate(labels)},
        "id_to_intent": {str(index): label for index, label in enumerate(labels)},
        "intent_app_routes": INTENT_APP_ROUTES,
        "dataset_route_corrections": DATASET_ROUTE_CORRECTIONS,
        "confidence_threshold": 0.42,
        "dataset_sha256": metrics["dataset_sha256"],
        "n_rows_trained": metrics["n_rows_trained"],
    }
    LABEL_MAPPING_PATH.write_text(json.dumps(mapping, indent=2, ensure_ascii=False), encoding="utf-8")
    SPLIT_PATH.write_text(
        json.dumps(
            {
                "seed": RANDOM_STATE,
                "method": "grouped_by_language_intent_canonical_stem",
                "csv_split_column_ignored": True,
                "leak_groups": leak,
                "indexes": split,
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    METRICS_PATH.write_text(json.dumps(_jsonable(metrics), indent=2, ensure_ascii=False), encoding="utf-8")
    return metrics


def _jsonable(value):
    if isinstance(value, dict):
        return {str(key): _jsonable(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_jsonable(item) for item in value]
    return value


def _print_split_report(title: str, block: dict) -> None:
    overall = block["overall"]
    print(f"\n=== {title} ===")
    print(
        f"n={overall['n']}  macro-P={overall['macro_precision']:.4f}  "
        f"macro-R={overall['macro_recall']:.4f}  macro-F1={overall['macro_f1']:.4f}"
    )
    print(overall["sklearn_report"])
    for lang, lang_block in block["by_language"].items():
        print(
            f"  [{lang}] n={lang_block['n']}  "
            f"macro-P={lang_block['macro_precision']:.4f}  "
            f"macro-R={lang_block['macro_recall']:.4f}  "
            f"macro-F1={lang_block['macro_f1']:.4f}"
        )
        print(lang_block["sklearn_report"])
        print(f"  [{lang}] confusion matrix (rows=true, cols=pred, order=intents A-Z)")
        labels = lang_block["confusion_matrix_labels"]
        print("   ", " ".join(f"{i:02d}" for i in range(len(labels))))
        for row_i, row in enumerate(lang_block["confusion_matrix"]):
            print(f"  {row_i:02d}", " ".join(f"{cell:3d}" for cell in row), labels[row_i])


def main() -> None:
    metrics = train_and_evaluate()
    print(MODEL_NOTE)
    print("rows loaded", metrics["n_rows_loaded"], "trained", metrics["n_rows_trained"], "discarded", metrics["n_discarded"])
    print("group leak (must be 0)", metrics["grouped_split_leak_groups"])
    print("split sizes", metrics["split_sizes"])
    print("quality flags", metrics["quality_flag_counts"])
    _print_split_report("validation", metrics["validation"])
    _print_split_report("test", metrics["test"])
    print("saved", MODEL_PATH)
    print("saved", LABEL_MAPPING_PATH)
    print("saved", METRICS_PATH)


if __name__ == "__main__":
    main()
