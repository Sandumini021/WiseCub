"""
train_and_evaluate.py

Reproducible training, cross-validation, and rigorous evaluation pipeline for WiseCub Scam Awareness ML.
Adheres strictly to research guidelines:
1. Strict Group-Based Splitting by `template_group_id` (Train 70%, Validation 15%, Test 15%)
   - Prevents template memorization leakage
   - Zero overlap of template groups between train, validation, and test splits
2. Data Preprocessing strictly inside sklearn Pipelines:
   - TF-IDF vectorizer is fit ONLY on training data, never on the full dataset
3. Models Evaluated:
   - Baseline: Majority-Class DummyClassifier
   - Model 1: TF-IDF + Logistic Regression (L2 regularization)
   - Model 2: TF-IDF + Multinomial Naive Bayes (Laplace smoothing)
   - Model 3: TF-IDF + Linear Support Vector Classifier (LinearSVC)
4. Comprehensive Metrics:
   - Accuracy, Precision, Recall, Macro-F1, Per-Class F1, Confusion Matrix
   - Focus on Scam Recall (minimizing false negatives) and Benign Precision (minimizing false positives)
5. Out-of-Distribution Generalization Test:
   - Separate evaluation on public-only test examples (UCI SMS benchmark) vs synthetic test examples
6. Artifact Persistence:
   - Saves best performing pipeline to `models/best_model.joblib`
   - Exports evaluation metrics to `reports/model_evaluation_metrics.json`
"""

import json
import os
import random
from pathlib import Path
from typing import Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.dummy import DummyClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import GroupKFold, GroupShuffleSplit
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC

SEED = 42
random.seed(SEED)
np.random.seed(SEED)

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT_DIR / "data" / "scam_messages_dataset.csv"
MODELS_DIR = ROOT_DIR / "models"
REPORTS_DIR = ROOT_DIR / "reports"


def load_dataset() -> pd.DataFrame:
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found at {DATA_PATH}. Run generate_dataset.py first.")
    df = pd.read_csv(DATA_PATH)
    return df


def perform_grouped_split(
    df: pd.DataFrame,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Splits data into Train (70%), Validation (15%), and Test (15%)
    strictly partitioned by `template_group_id` to prevent data leakage.
    """
    groups = df["template_group_id"].values

    # First split: 70% train, 30% temp (val + test)
    gss1 = GroupShuffleSplit(n_splits=1, train_size=0.70, random_state=SEED)
    train_idx, temp_idx = next(gss1.split(df, groups=groups))

    train_df = df.iloc[train_idx].copy()
    temp_df = df.iloc[temp_idx].copy()

    # Second split: split temp equally into 50% val (15% overall) and 50% test (15% overall)
    gss2 = GroupShuffleSplit(n_splits=1, train_size=0.50, random_state=SEED)
    val_rel_idx, test_rel_idx = next(gss2.split(temp_df, groups=temp_df["template_group_id"].values))

    val_df = temp_df.iloc[val_rel_idx].copy()
    test_df = temp_df.iloc[test_rel_idx].copy()

    # Verify zero group leakage
    train_groups = set(train_df["template_group_id"])
    val_groups = set(val_df["template_group_id"])
    test_groups = set(test_df["template_group_id"])

    assert len(train_groups & val_groups) == 0, "Leakage: Overlapping groups between Train and Val"
    assert len(train_groups & test_groups) == 0, "Leakage: Overlapping groups between Train and Test"
    assert len(val_groups & test_groups) == 0, "Leakage: Overlapping groups between Val and Test"

    return train_df, val_df, test_df


def build_candidate_pipelines() -> Dict[str, Pipeline]:
    """
    Defines model pipelines using TF-IDF feature extraction inside the pipeline.
    """
    return {
        "Majority_Baseline": Pipeline([
            ("clf", DummyClassifier(strategy="most_frequent"))
        ]),
        "TFIDF_Logistic_Regression": Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=5000, sublinear_tf=True)),
            ("clf", LogisticRegression(C=1.0, random_state=SEED, max_iter=1000))
        ]),
        "TFIDF_Multinomial_NB": Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=5000, sublinear_tf=True)),
            ("clf", MultinomialNB(alpha=0.5))
        ]),
        "TFIDF_Linear_SVC": Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=5000, sublinear_tf=True)),
            ("clf", LinearSVC(C=1.0, random_state=SEED, max_iter=2000))
        ]),
    }


def compute_metrics(y_true, y_pred, pos_label="scam_or_suspicious") -> Dict[str, float]:
    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, pos_label=pos_label, zero_division=0))
    rec = float(recall_score(y_true, y_pred, pos_label=pos_label, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, pos_label=pos_label, zero_division=0))
    macro_f1 = float(f1_score(y_true, y_pred, average="macro", zero_division=0))
    cm = confusion_matrix(y_true, y_pred, labels=["legitimate_or_benign", "scam_or_suspicious"]).tolist()

    return {
        "accuracy": round(acc, 4),
        "precision_scam": round(prec, 4),
        "recall_scam": round(rec, 4),
        "f1_scam": round(f1, 4),
        "macro_f1": round(macro_f1, 4),
        "confusion_matrix": cm,  # [[TN, FP], [FN, TP]]
    }


def run_cross_validation(train_df: pd.DataFrame, pipelines: Dict[str, Pipeline], n_splits=5) -> Dict[str, Dict]:
    """Performs grouped K-Fold cross validation on the training set."""
    cv_results = {}
    gkf = GroupKFold(n_splits=n_splits)
    groups = train_df["template_group_id"].values
    X = train_df["message_text"].values
    y = train_df["binary_label"].values

    for name, pipe in pipelines.items():
        fold_scores = []
        for train_idx, val_idx in gkf.split(X, y, groups=groups):
            X_tr, y_tr = X[train_idx], y[train_idx]
            X_va, y_va = X[val_idx], y[val_idx]

            pipe.fit(X_tr, y_tr)
            preds = pipe.predict(X_va)
            metrics = compute_metrics(y_va, preds)
            fold_scores.append(metrics["macro_f1"])

        cv_results[name] = {
            "mean_macro_f1": round(float(np.mean(fold_scores)), 4),
            "std_macro_f1": round(float(np.std(fold_scores)), 4),
            "fold_macro_f1s": [round(s, 4) for s in fold_scores]
        }
    return cv_results


def main():
    print("=" * 70)
    print("WiseCub Scam Awareness ML — Model Training & Evaluation")
    print("=" * 70)

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    df = load_dataset()
    print(f"\nLoaded full dataset: {len(df)} records.")

    # 1. Grouped Split
    train_df, val_df, test_df = perform_grouped_split(df)
    print("\n[Data Split Summary]")
    print(f"  Training Set:   {len(train_df)} rows ({len(set(train_df['template_group_id']))} template groups)")
    print(f"  Validation Set: {len(val_df)} rows ({len(set(val_df['template_group_id']))} template groups)")
    print(f"  Test Set:       {len(test_df)} rows ({len(set(test_df['template_group_id']))} template groups)")

    # Display split class balance
    for name, split in [("Train", train_df), ("Val", val_df), ("Test", test_df)]:
        scam_cnt = sum(split["binary_label"] == "scam_or_suspicious")
        legit_cnt = sum(split["binary_label"] == "legitimate_or_benign")
        print(f"    - {name} Balance: {scam_cnt} scam ({scam_cnt/len(split)*100:.1f}%), {legit_cnt} legit ({legit_cnt/len(split)*100:.1f}%)")

    # 2. Cross-Validation on Training Split
    print("\n[Step 2/5] Running 5-Fold Grouped Cross-Validation on Training Split...")
    pipelines = build_candidate_pipelines()
    cv_summary = run_cross_validation(train_df, pipelines, n_splits=5)
    for model_name, res in cv_summary.items():
        print(f"  {model_name:28s} Mean Macro-F1: {res['mean_macro_f1']:.4f} (+/- {res['std_macro_f1']:.4f})")

    # 3. Model Selection on Validation Split
    print("\n[Step 3/5] Fitting Models on Training Set and Evaluating on Validation Split...")
    val_results = {}
    fitted_models = {}

    X_train, y_train = train_df["message_text"].values, train_df["binary_label"].values
    X_val, y_val = val_df["message_text"].values, val_df["binary_label"].values

    for model_name, pipe in pipelines.items():
        pipe.fit(X_train, y_train)
        fitted_models[model_name] = pipe
        val_preds = pipe.predict(X_val)
        val_metrics = compute_metrics(y_val, val_preds)
        val_results[model_name] = val_metrics
        print(f"  {model_name:28s} Acc: {val_metrics['accuracy']:.4f} | Prec: {val_metrics['precision_scam']:.4f} | Rec: {val_metrics['recall_scam']:.4f} | Macro-F1: {val_metrics['macro_f1']:.4f}")

    # Determine best model based on validation macro-F1 (with recall priority)
    best_model_name = max(val_results.keys(), key=lambda k: (val_results[k]["macro_f1"], val_results[k]["recall_scam"]))
    print(f"\n[Selection Decision] Best Model Selected: '{best_model_name}' (Val Macro-F1: {val_results[best_model_name]['macro_f1']:.4f})")

    # 4. Final Evaluation on Held-Out Test Split
    print("\n[Step 4/5] Evaluating Best Model on Held-Out Test Split...")
    best_pipe = fitted_models[best_model_name]
    X_test, y_test = test_df["message_text"].values, test_df["binary_label"].values
    test_preds = best_pipe.predict(X_test)
    test_metrics = compute_metrics(y_test, test_preds)

    print(f"\nFinal Test Results for '{best_model_name}':")
    print(f"  Accuracy:       {test_metrics['accuracy']:.4f}")
    print(f"  Precision Scam: {test_metrics['precision_scam']:.4f}")
    print(f"  Recall Scam:    {test_metrics['recall_scam']:.4f}")
    print(f"  F1 Scam:        {test_metrics['f1_scam']:.4f}")
    print(f"  Macro-F1:       {test_metrics['macro_f1']:.4f}")
    print(f"  Confusion Matrix (rows=True [Legit, Scam], cols=Pred [Legit, Scam]):\n    {test_metrics['confusion_matrix']}")

    # 5. Out-of-Distribution / Provenance Sub-Evaluation
    print("\n[Step 5/5] Sourced Sub-Group Evaluation on Test Set...")
    public_mask = test_df["source_type"] == "public_dataset"
    synthetic_mask = test_df["source_type"] == "synthetic"

    pub_metrics = compute_metrics(y_test[public_mask], test_preds[public_mask])
    syn_metrics = compute_metrics(y_test[synthetic_mask], test_preds[synthetic_mask])

    print(f"  Public-Source Test Subset (n={sum(public_mask)}):")
    print(f"    Macro-F1: {pub_metrics['macro_f1']:.4f} | Scam Recall: {pub_metrics['recall_scam']:.4f} | Scam Prec: {pub_metrics['precision_scam']:.4f}")
    print(f"  Synthetic-Source Test Subset (n={sum(synthetic_mask)}):")
    print(f"    Macro-F1: {syn_metrics['macro_f1']:.4f} | Scam Recall: {syn_metrics['recall_scam']:.4f} | Scam Prec: {syn_metrics['precision_scam']:.4f}")

    # Save Best Model Artifact
    model_artifact_path = MODELS_DIR / "best_model.joblib"
    joblib.dump(best_pipe, model_artifact_path)
    print(f"\nSaved best model artifact to: {model_artifact_path}")

    # Export Evaluation Results JSON
    evaluation_summary = {
        "metadata": {
            "dataset_path": str(DATA_PATH),
            "random_seed": SEED,
            "train_rows": len(train_df),
            "val_rows": len(val_df),
            "test_rows": len(test_df),
            "best_model_selected": best_model_name,
        },
        "cross_validation_5fold": cv_summary,
        "validation_set_comparison": val_results,
        "final_test_set_evaluation": {
            "overall": test_metrics,
            "public_subset": pub_metrics,
            "synthetic_subset": syn_metrics,
        },
        "all_models_test_comparison": {}
    }

    # Evaluate all models on test for full scientific comparison
    for name, pipe in fitted_models.items():
        preds = pipe.predict(X_test)
        evaluation_summary["all_models_test_comparison"][name] = compute_metrics(y_test, preds)

    metrics_export_path = REPORTS_DIR / "model_evaluation_metrics.json"
    with open(metrics_export_path, "w", encoding="utf-8") as f:
        json.dump(evaluation_summary, f, indent=2)
    print(f"Exported metrics report to: {metrics_export_path}")


if __name__ == "__main__":
    main()
