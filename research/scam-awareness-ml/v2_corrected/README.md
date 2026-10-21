# WiseCub Scam Awareness ML — Corrected Experiment (v2)

This directory contains the **post-audit, leakage-corrected machine learning experiment** for Member 4 (Scam Awareness / Scam Safety) in the WiseCub undergraduate research project.

The initial baseline experiment (`v1`) remains preserved in `../` for scientific comparison and thesis discussion.

---

## 1. Quick Reproduction Guide

All scripts are deterministic with fixed seeds (`SEED = 42`). Execute them from the repository root using the existing Python virtual environment:

```bash
# 1. Generate the corrected dataset (removes token shortcuts, clusters public campaigns)
./backend/.venv/bin/python research/scam-awareness-ml/v2_corrected/src/generate_dataset_v2.py

# 2. Run independent data validation and integrity verification
./backend/.venv/bin/python research/scam-awareness-ml/v2_corrected/src/validate_dataset_v2.py

# 3. Train all candidate models, perform grouped CV, and evaluate on held-out test split
./backend/.venv/bin/python research/scam-awareness-ml/v2_corrected/src/train_and_evaluate_v2.py

# 4. Run dynamic evidence-based error diagnostics
./backend/.venv/bin/python research/scam-awareness-ml/v2_corrected/src/error_analysis_v2.py
```

---

## 2. Directory Structure

```
v2_corrected/
├── README.md                                  # This documentation file
├── data/
│   ├── scam_messages_dataset_v2.csv           # 2,500 balanced rows (zero shortcuts, 100% unique)
│   ├── dataset_manifest_v2.csv                # Template group and category manifest
│   └── grouping_diagnostics.json              # Public campaign clustering metadata
├── models/
│   └── best_model_v2.joblib                   # Trained, self-contained pipeline artifact
├── reports/
│   ├── data_dictionary_v2.md                  # Comprehensive schema specification
│   ├── dataset_quality_report_v2.md           # Integrity & balance validation report
│   ├── grouping_and_leakage_diagnostics.md    # Cross-split similarity and zero-leakage proof
│   ├── model_evaluation_metrics_v2.json       # JSON record of all numerical metrics
│   ├── model_evaluation_report_v2.md          # Multi-model evaluation report
│   ├── error_analysis_report_v2.md            # Evidence-based error diagnostics report
│   ├── research_limitations_v2.md             # Data scope, child safety, and limitations
│   └── experiment_comparison_v1_vs_v2.md      # Side-by-side comparison of v1 vs v2
└── src/
    ├── generate_dataset_v2.py                 # Dataset generator and campaign clusterer
    ├── validate_dataset_v2.py                 # Automated integrity & schema validator
    ├── train_and_evaluate_v2.py               # Leakage-resistant ML training pipeline
    └── error_analysis_v2.py                   # Dynamic token-attribution error analyzer
```

---

## 3. Key Research Findings at a Glance

| Candidate Model | 5-Fold Grouped CV Macro-F1 | Test Accuracy | Test Scam Recall | Test Scam Precision | Test Macro-F1 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Majority Baseline** | 0.3435 ± 0.0045 | 29.14% | 100.00% | 29.14% | 0.2257 |
| **TF-IDF + Logistic Regression** | 0.9436 ± 0.0294 | **89.30%** | **96.33%** | 74.47% | **0.8798** |
| **TF-IDF + Multinomial NB** | 0.9447 ± 0.0307 | **87.97%** | **99.08%** | 71.05% | **0.8676** |
| **TF-IDF + LinearSVC** | 0.9500 ± 0.0315 | **93.32%** | **97.25%** | 82.81% | **0.9228** |

### Verified Zero Cross-Split Leakage
- **Max Cosine Similarity (Train vs. Test):** `0.6121`
- **Pairs with Similarity $\ge 0.70$ Crossing Splits:** `0` (reduced from 22 in v1)
- **Artificial Token Shortcuts in Message Text:** `0` (reduced from 1,900 in v1)
