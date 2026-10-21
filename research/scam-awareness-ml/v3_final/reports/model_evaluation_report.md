# WiseCub Scam Awareness ML — Model Evaluation Report (v3 Final)

**Document Title:** Comparative Machine Learning Evaluation for Secondary School Scam Message Detection (v3 Final)  
**Experiment Version:** v3 (Final Audited & Leakage-Controlled Experiment)  
**Author / Researcher:** Member 4 (Scam Awareness / Scam Safety), WiseCub Project  
**Date:** 2026-10-21  

---

## 1. Experimental Methodology & Predeclared Model Selection

### Predeclared Selection Criterion
In secondary school online safety, **Scam Recall (minimizing false negatives) is paramount**: missing an authentic scam exposes a child to credential theft or financial loss.
**Selection Rule:** Selected highest scam recall candidate.
**Outcome:** Selected **`TFIDF_Linear_SVC`**.

---

## 2. Model Selection: 5-Fold Grouped Cross-Validation & Validation Tuning

| Candidate Pipeline | 5-Fold Grouped CV Macro-F1 (Mean ± Std) | Validation Accuracy | Validation Scam Recall | Validation Scam Precision | Validation Macro-F1 | Selection Outcome |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Majority_Baseline** | 0.3414 ± 0.0056 | 58.92% | 100.00% | 58.92% | 0.3708 | Baseline |
| **TFIDF_Multinomial_NB** | 0.9292 ± 0.0301 | 95.77% | 93.63% | 99.16% | 0.9568 | Evaluated Candidate |
| **TFIDF_Logistic_Regression** | 0.9341 ± 0.0284 | 95.54% | 93.63% | 98.74% | 0.9544 | Evaluated Candidate |
| **TFIDF_Linear_SVC** | 0.9359 ± 0.0327 | 96.01% | 94.02% | 99.16% | 0.9592 | **Selected Model** |

---

## 3. Final Held-Out Test Split Performance

Evaluated on 404 test instances across 104 unseen template groups:

| Model Architecture | Test Accuracy | Test Scam Precision | Test Scam Recall | Test Scam F1 | Test Macro-F1 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Majority_Baseline | 32.92% | 32.92% | 100.00% | 49.53% | 0.2477 |
| TFIDF_Multinomial_NB | 91.09% | 80.12% | 96.99% | 87.76% | 0.9038 |
| TFIDF_Logistic_Regression | 91.09% | 79.75% | 97.74% | 87.84% | 0.9040 |
| **TFIDF_Linear_SVC** | 92.57% | 82.39% | 98.50% | 89.73% | **0.9196** |

### Confusion Matrix for Selected Model (`TFIDF_Linear_SVC`)

```
                      Predicted Legitimate   Predicted Scam
Actual Legitimate:            243                    28   (False Positives)
Actual Scam:                    2                   131   (True Positives)
```

- **True Negatives:** `243` legitimate youth messages correctly permitted.
- **False Positives:** `28` legitimate messages erroneously flagged.
- **False Negatives:** `2` scam messages missed as safe.
- **True Positives:** `131` scam messages successfully intercepted.

### 95% Bootstrap Confidence Intervals (1,000 Resamples)
- **Macro-F1 95% CI:** `[0.8874, 0.9470]`
- **Scam Recall 95% CI:** `[0.9618, 1.0000]`
- **Scam Precision 95% CI:** `[0.7600, 0.8851]`
- **Accuracy 95% CI:** `[0.8960, 0.9505]`

---

## 4. Provenance Sub-Group Generalization Analysis

| Test Data Partition | Sample Count (Scam / Legit) | Accuracy | Scam Recall | Scam Precision | Macro-F1 | Scientific Finding |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Synthetic Curriculum** | 310 (90 / 220) | 91.61% | 100.00% | 77.59% | **0.9055** | Reflects clean educational curriculum learning without shortcut tokens. |
| **Public Benchmark (UCI)** | 94 (43 / 51) | 95.74% | 95.35% | 95.35% | **0.9571** | Reflects realistic generalization on external public SMS data. |

---

## 5. Artifact Persistence & Reproducibility

- **Model Pipeline:** `models/best_model_v3.joblib`
- **Machine-Readable Metrics:** `reports/model_evaluation_metrics_v3.json`
- **Reproduction Command:** `python research/scam-awareness-ml/v3_final/src/train_and_evaluate_v3.py --save`
