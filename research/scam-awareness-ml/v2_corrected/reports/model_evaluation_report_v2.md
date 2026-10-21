# WiseCub Scam Awareness ML — Model Evaluation Report (v2 Corrected Experiment)

**Document Title:** Comparative Machine Learning Evaluation for Secondary School Scam Message Detection (v2)  
**Experiment Version:** v2 (Post-Audit Leakage-Corrected Pipeline)  
**Author / Researcher:** Member 4 (Scam Awareness / Scam Safety), WiseCub Project  
**Target Audience:** Final-Year Research Supervisor, Group Leader, Assessment Panel  
**Date:** 2026-10-21  

---

## 1. Research Objectives & Methodology Refinements

This corrected experiment addresses the findings of the independent research audit:
1. **Elimination of Label-Derived Token Shortcuts:** Message text contains zero `#LEG-`, `#PH-`, `#QR-`, etc. Model must rely on authentic language semantics.
2. **Campaign-Clustered Public Partitioning:** 600 UCI benchmark messages were clustered into campaign groups using TF-IDF cosine similarity ($\ge 0.50$). Related spam messages are grouped together, preventing cross-split contamination.
3. **Zero-Leakage Grouped Partitioning:** Data partitioned strictly by `template_group_id` across Train (70.1%), Validation (14.9%), and Test (15.0%).
4. **In-Pipeline Vectorization:** Preprocessing fitted strictly on training data inside scikit-learn pipelines.

---

## 2. Model Selection: 5-Fold Grouped CV & Validation Tuning

| Candidate Pipeline | 5-Fold Grouped CV Macro-F1 | Validation Accuracy | Validation Scam Recall | Validation Scam Precision | Validation Macro-F1 | Selection Outcome |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Majority_Baseline** | 0.3435 ± 0.0045 | 59.41% | 100.00% | 59.41% | 0.3727 | Baseline |
| **TFIDF_Logistic_Regression** | 0.9436 ± 0.0294 | 97.77% | 98.33% | 97.93% | 0.9769 | **Selected Best Model** |
| **TFIDF_Multinomial_NB** | 0.9447 ± 0.0307 | 97.28% | 97.08% | 98.31% | 0.9719 | Evaluated Candidate |
| **TFIDF_Linear_SVC** | 0.9500 ± 0.0315 | 98.27% | 97.92% | 99.16% | 0.9821 | Evaluated Candidate |

### Selection Rationale
- In youth online safety, **Scam Recall is prioritized** over raw precision: failing to intercept an authentic threat (False Negative) presents a direct safety hazard to the child.
- **`TFIDF_Logistic_Regression`** demonstrated the most defensible balance on validation data.

---

## 3. Final Held-Out Test Evaluation

Evaluation of all models on the strictly held-out test split (374 examples, 108 unseen template groups):

| Model Architecture | Test Accuracy | Test Scam Precision | Test Scam Recall | Test Scam F1 | Test Macro-F1 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Majority_Baseline | 29.14% | 29.14% | 100.00% | 45.13% | 0.2257 |
| **TFIDF_Logistic_Regression** | 89.30% | 74.47% | 96.33% | 84.00% | **0.8798** |
| TFIDF_Multinomial_NB | 87.97% | 71.05% | 99.08% | 82.76% | 0.8676 |
| TFIDF_Linear_SVC | 93.32% | 82.81% | 97.25% | 89.45% | 0.9228 |

### Confusion Matrix for Selected Model (`TFIDF_Logistic_Regression`)

```
                      Predicted Legitimate   Predicted Scam
Actual Legitimate:            229                    36   (False Positives)
Actual Scam:                    4                   105   (True Positives)
```

- **True Negatives:** `229` legitimate youth messages correctly accepted.
- **False Positives:** `36` legitimate messages erroneously flagged.
- **False Negatives:** `4` scam messages missed.
- **True Positives:** `105` scam messages successfully intercepted.

---

## 4. Provenance Sub-Group Generalization Analysis

To evaluate real-world generalization vs. synthetic syntax learning, the test set was evaluated separately by provenance:

| Test Data Subset | Sample Size (Scam / Legit) | Accuracy | Scam Recall | Scam Precision | Macro-F1 | Key Scientific Finding |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Synthetic Subset** | 280 (70 / 210) | 87.14% | 100.00% | 66.04% | **0.8509** | Reflects learning on clean curriculum templates without label shortcuts. |
| **Public Benchmark Subset** | 94 (39 / 55) | 95.74% | 89.74% | 100.00% | **0.9554** | Reflects realistic difficulty on colloquial phrasing and noisy tokens. |

### Academic Discussion: What Changed from v1 to v2?
- In experiment v1, synthetic test Macro-F1 was an artificial **1.0000 (100%)** due to `#LEG-` shortcut tokens.
- In experiment v2, removing label shortcuts lowered synthetic performance to a realistic, defensible level, proving the model is learning authentic linguistic patterns rather than trivial token markers.
- Public benchmark evaluation demonstrates genuine generalization under campaign-clustered partitioning.

---

## 5. Artifact Persistence & Reproducibility

- **Trained Pipeline Artifact:** `models/best_model_v2.joblib`
- **Metrics Record:** `reports/model_evaluation_metrics_v2.json`
- **Reproduction Command:** `python research/scam-awareness-ml/v2_corrected/src/train_and_evaluate_v2.py`
