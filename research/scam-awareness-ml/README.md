# WiseCub Member 4 — Scam Awareness Machine Learning Research

**Component:** Scam Message Classification Pipeline & Educational Evaluation  
**Researcher:** Member 4 (Scam Awareness / Safety Module), Final-Year IT Undergraduate  
**Isolated Research Root:** `research/scam-awareness-ml/`  
**Execution Environment:** `WiseCub/backend/.venv` (Python 3.13, Scikit-Learn 1.6+, Pandas, Joblib)  

> [!NOTE]
> **Research Experiment Versions:**
> - **v1 (Baseline Experiment):** Initial experiment documented in this root directory (`data/`, `src/`, `reports/`, `models/`). Preserved for comparative analysis.
> - **v2 (Corrected Experiment):** Located in [`v2_corrected/`](file:///Users/tharushinethra/Desktop/WiseCub/WiseCub/research/scam-awareness-ml/v2_corrected/README.md). Addresses all independent audit findings (removes synthetic token shortcuts, applies connected-components campaign clustering to public data, proves zero cross-split campaign leakage, and provides dynamic evidence-based error diagnostics).


This isolated research package provides an end-to-end, scientifically validated machine learning pipeline for detecting deceptive online messages aimed at youth aged 12–16.

### Key Highlights
- **Canonical Dataset:** 2,500 balanced rows (1,250 scam vs. 1,250 benign) with zero duplicates across 253 template groups.
- **Strict Provenance:** 600 real-world public examples (UCI SMS Spam Collection, CC BY 4.0) + 1,900 educational synthetic examples (WiseCub Corpus v1.0).
- **Curriculum Coverage:** Covers all 6 scam levels: Phishing, SMS Scams, QR Quishing, Prize Scams, Impersonation, and Deceptive Financial Offers.
- **Zero-Leakage Grouped Splitting:** GroupShuffleSplit ensures no message template family crosses train, validation, or test boundaries.
- **Best Model:** TF-IDF + Multinomial Naive Bayes (`alpha=0.5`), achieving **98.38% Test Accuracy**, **99.47% Scam Recall**, and **0.9838 Macro-F1**.

---

## 2. Directory Structure

```
research/scam-awareness-ml/
├── README.md                           # This guide: reproduction steps and documentation
├── requirements_status.md              # Audit of installed Python dependencies
├── data/
│   ├── scam_messages_dataset.csv       # Canonical 2,500-example dataset
│   ├── dataset_manifest.csv            # Statistical metadata manifest
│   └── raw/                            # Raw benchmark files (UCI SMS Collection)
├── src/
│   ├── generate_dataset.py             # Deterministic corpus generation script
│   ├── validate_dataset.py             # 10-point structural & semantic validation suite
│   ├── train_and_evaluate.py           # Grouped CV training and multi-model evaluation
│   └── error_analysis.py               # False positive/negative diagnostic audit
├── models/
│   └── best_model.joblib               # Persisted best model pipeline (TF-IDF + MNB)
└── reports/
    ├── data_dictionary.md              # Full column schema and domain specifications
    ├── dataset_quality_report.md       # Distribution, provenance, and duplicate checks
    ├── model_evaluation_report.md      # Detailed metrics, CV results, and test evaluation
    ├── model_evaluation_metrics.json   # Machine-readable evaluation output
    ├── error_analysis_report.md        # Category-by-category false alarm audit
    └── research_limitations.md         # Critical assessment of limitations & ethics
```

---

## 3. Step-by-Step Reproduction Guide

All commands run directly from the repository root (`WiseCub`) using the existing backend Python environment:

### Step 1: Validate the Dataset
Runs the 10-point automated integrity suite (schema, row bounds, missing values, domain limits, exact duplicates, near-duplicates, class balance, template group clustering, licenses):

```bash
./backend/.venv/bin/python research/scam-awareness-ml/src/validate_dataset.py
```
*Expected Output: `ALL 10 VALIDATION CHECKS PASSED SUCCESSFULLY (Exit Code 0)`*

---

### Step 2: Train and Evaluate Models
Runs grouped 5-fold cross-validation on the training split, selects the best model using the validation split, and produces held-out test metrics:

```bash
./backend/.venv/bin/python research/scam-awareness-ml/src/train_and_evaluate.py
```
*Expected Output:*
- Evaluates Majority Baseline, Logistic Regression, Multinomial Naive Bayes, and LinearSVC.
- Persists best pipeline to `models/best_model.joblib`.
- Exports metrics to `reports/model_evaluation_metrics.json`.

---

### Step 3: Run Diagnostic Error Analysis
Analyzes false positives, false negatives, top predictive n-grams, and the generalization gap between synthetic and real-world public data:

```bash
./backend/.venv/bin/python research/scam-awareness-ml/src/error_analysis.py
```
*Expected Output: Generates `reports/error_analysis_report.md`.*

---

### Optional: Re-generate the Dataset from Scratch
To re-generate the dataset deterministically using seed `42`:

```bash
./backend/.venv/bin/python research/scam-awareness-ml/src/generate_dataset.py
```

---

## 4. Academic Integrity & Project Boundaries

1. **Isolation:** All code and data reside exclusively within `research/scam-awareness-ml/`. No production frontend or backend files were altered.
2. **Zero Student Data:** No learner accounts, passwords, session tokens, or MongoDB records were queried or exported.
3. **No External Package Installations:** Only pre-installed libraries (`scikit-learn`, `pandas`, `numpy`, `joblib`) were used.
4. **Honest Scope:** This is a supervised text classification research study. It is not integrated into production and does not predict student psychological susceptibility.
