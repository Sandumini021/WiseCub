# WiseCub Scam Awareness ML Research Experiment (v3 Final)

**Author:** WiseCub Research Team (Member 4 - Scam Awareness & Safety)  
**Academic Role:** Senior Machine Learning Researcher & Reproducibility Auditor  
**Target Demographic:** Financial literacy and digital safety for youth aged 12–16  
**Artifact Location:** `research/scam-awareness-ml/v3_final/`  
**Execution Environment:** `./backend/.venv/bin/python` from repository root  

---

## 1. Project Overview

This directory contains the final, isolated, and audited machine learning research experiment for the WiseCub Scam Awareness module. 

### Core Research Objective
To develop a statistically defensible, reproducible offline classification experiment distinguishing `scam_or_suspicious` from `legitimate_or_benign` messages, while eliminating synthetic shortcut leakage, mitigating cross-split near-duplicate contamination, and providing clear academic reproducibility.

> [!IMPORTANT]
> **Research Prototype Notice:** This experiment is an educational research baseline and pedagogical scaffolding prototype. It is **NOT** an unmonitored production firewall and **NOT** a psychological model of children's cognitive susceptibility.

---

## 2. Directory Structure

```text
research/scam-awareness-ml/v3_final/
├── README.md                                 # This reproducibility guide
├── data/
│   ├── data_dictionary.md                   # 12-column schema & category definitions
│   ├── dataset_manifest_v3.csv              # Group-level metadata across 692 clusters
│   ├── grouping_diagnostics_v3.json         # Algorithmic clustering diagnostic logs
│   └── scam_messages_dataset_v3.csv         # 2,500 balanced, audited research records
├── models/
│   └── best_model_v3.joblib                 # Serialized pipeline (TF-IDF + LinearSVC)
├── reports/
│   ├── dataset_quality_report.md            # 10/10 automated data integrity audit
│   ├── error_analysis_report.md             # Token-level linear attribution of errors
│   ├── grouping_and_leakage_report.md       # Similarity audit & campaign isolation
│   ├── limitations_and_ethics.md            # Child protection, bias & architectural limits
│   ├── model_evaluation_metrics_v3.json     # Complete machine-readable results JSON
│   ├── model_evaluation_report.md           # Model benchmarks & bootstrap 95% CIs
│   └── v1_v2_v3_comparison.md              # Historical trajectory & audit resolution
└── src/
    ├── error_analysis_v3.py                 # Dynamic error inspection script
    ├── generate_dataset_v3.py               # Length-stratified sampling & dataset builder
    ├── train_and_evaluate_v3.py             # Grouped CV, training, audit & evaluation
    └── validate_dataset_v3.py               # Comprehensive dataset integrity validator
```

---

## 3. Dataset Summary

- **Total Instances:** 2,500 messages
- **Target Classes:** 1,250 `scam_or_suspicious` (50.0%) / 1,250 `legitimate_or_benign` (50.0%)
- **Data Provenance:**
  - **Synthetic Educational Scenarios:** 1,900 instances (950 scam, 950 legitimate) authored across 400 curriculum templates covering the 6 WiseCub learning categories without shortcut tokens.
  - **Public Benchmark (UCI SMS Spam Collection):** 600 instances (300 scam, 300 legitimate) sampled using **5-quintile length-stratified sampling** with a fixed random seed (`SEED = 42`).
- **Group Isolation:** 692 mutually exclusive template/campaign groups clustered in the exact downstream classifier feature space ($\cos \ge 0.40$ + phone/shortcode regex).

---

## 4. Key Empirical Findings (Held-Out Test Set, $n = 404$)

| Model Candidate | Test Accuracy | Macro-F1 | Scam Recall | Scam Precision |
|---|---|---|---|---|
| **Majority Baseline** | 32.92% | 0.2477 | 100.00% | 32.92% |
| **TF-IDF + Logistic Regression** | 91.09% | 0.9040 | 97.74% | 79.75% |
| **TF-IDF + Multinomial Naive Bayes** | 91.09% | 0.9038 | 96.99% | 80.12% |
| **TF-IDF + LinearSVC (Selected Model)** | **92.57%** | **0.9196** | **98.50%** | **82.39%** |

### Selected Model Justification:
`TFIDF_Linear_SVC` was chosen based on a predeclared educational safety criterion: prioritizing highest scam recall ($\ge 95\%$) on the validation split, followed by Macro-F1. In an educational safety tool for youth, minimizing missed scams (only 2 missed out of 133 in test) is paramount.

### Bootstrap 95% Confidence Intervals (1,000 resamples):
- **Accuracy:** `[0.8960, 0.9505]`
- **Macro-F1:** `[0.8874, 0.9470]`
- **Scam Recall:** `[0.9618, 1.0000]`
- **Scam Precision:** `[0.7600, 0.8851]`

---

## 5. Exact Step-by-Step Reproduction Instructions

All scripts are executed from the **repository root** using the virtual environment in `backend/.venv`:

```bash
# Ensure current working directory is the repository root
cd /Users/tharushinethra/Desktop/WiseCub/WiseCub

# Step 1: Generate Dataset & Campaign Groups
./backend/.venv/bin/python research/scam-awareness-ml/v3_final/src/generate_dataset_v3.py --save

# Step 2: Validate Dataset Integrity & Leakage Rules
./backend/.venv/bin/python research/scam-awareness-ml/v3_final/src/validate_dataset_v3.py --save

# Step 3: Train Pipelines, Run Similarity Audit & Evaluate on Test Set
./backend/.venv/bin/python research/scam-awareness-ml/v3_final/src/train_and_evaluate_v3.py --save

# Step 4: Run Token-Level Error Analysis & Attribution
./backend/.venv/bin/python research/scam-awareness-ml/v3_final/src/error_analysis_v3.py --save
```

> [!NOTE]
> **Default-Safe Execution:** Every script executes in **dry-run mode** by default, printing reports and diagnostics directly to standard output. The `--save` flag must be explicitly passed to persist models, datasets, or markdown reports to disk.

---

## 6. Strict Non-Interference Verification

This experiment maintains total isolation:
- Existing `research/scam-awareness-ml/` (v1) and `research/scam-awareness-ml/v2_corrected/` (v2) directories remain completely untouched.
- No modifications were made to frontend, backend, database collections, API routes, or environment configurations.
- No Git commits, branches, merges, or pushes were initiated.
