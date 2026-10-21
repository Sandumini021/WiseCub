# WiseCub Scam Awareness ML — Model Training & Evaluation Report

**Document Title:** Comparative Machine Learning Evaluation for Secondary School Scam Message Detection  
**Experiment Date:** 2026-10-21  
**Author / Researcher:** Member 4 (Scam Awareness / Scam Safety), WiseCub Project  
**Target Audience:** Final-Year Research Supervisor, Group Leader, Assessment Panel

---

## 1. Research Objectives & Methodology

The objective of this research sub-study is to train, optimize, and scientifically evaluate baseline and classical machine learning models for binary scam classification:
- **`scam_or_suspicious`** (Positive Class)
- **`legitimate_or_benign`** (Negative Class)

### 1.1 Strict Leakage Prevention: Group-Based Splitting

In text classification research, random splitting across text variants generated from the same template induces severe memorization leakage, leading to artificially inflated performance. To prevent this:
- Data was split strictly by **`template_group_id`** using `GroupShuffleSplit`.
- **Zero Template Overlap:** If a template group exists in the training split, no message from that template family exists in the validation or test splits.
- Split proportions:
  - **Training Split:** `1,756 rows` (70.2% of data, 177 template groups)
  - **Validation Split:** `373 rows` (14.9% of data, 38 template groups)
  - **Held-Out Test Split:** `371 rows` (14.8% of data, 38 template groups)

### 1.2 Pipeline Preprocessing Isolation

To guarantee that vocabulary from the test set does not leak into the training process:
- TF-IDF vectorization (`TfidfVectorizer(ngram_range=(1, 2), max_features=5000, sublinear_tf=True)`) was placed strictly inside an `sklearn.pipeline.Pipeline`.
- The vectorizer was fitted solely on training split tokens (`X_train`), never on the pooled corpus.

---

## 2. Model Selection: 5-Fold Grouped Cross-Validation & Validation Tuning

Four models were compared using identical cross-validation partitions:

| Model Architecture | 5-Fold Grouped CV Macro-F1 (Mean ± Std) | Validation Accuracy | Validation Scam Recall | Validation Macro-F1 | Selection Outcome |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Majority-Class Baseline** (`DummyClassifier`) | 0.3222 ± 0.0087 | 49.33% | 100.0% | 0.3303 | Rejected (Trivial baseline) |
| **TF-IDF + Logistic Regression** (`C=1.0`) | 0.9840 ± 0.0089 | 93.03% | 86.96% | 0.9299 | Strong baseline, but lower recall |
| **TF-IDF + Multinomial Naive Bayes** (`alpha=0.5`) | **0.9635 ± 0.0273** | **95.44%** | **97.28%** | **0.9544** | **Selected Best Model** |
| **TF-IDF + Linear Support Vector Classifier** (`C=1.0`) | 0.9818 ± 0.0171 | 94.10% | 88.04% | 0.9407 | High precision, lower recall |

### Why Multinomial Naive Bayes Was Selected

In youth online safety:
1. **Recall is paramount:** Missing a scam (False Negative) can result in a child handing over school login credentials, personal passwords, or pocket money. Multinomial Naive Bayes captured **97.28%** of scam messages on the validation set, compared to only **86.96%** for Logistic Regression and **88.04%** for LinearSVC.
2. **Superior Validation Macro-F1:** Multinomial NB achieved **0.9544** validation Macro-F1, providing the best harmonic balance between precision and recall under zero-leakage grouped splitting.

---

## 3. Final Held-Out Test Evaluation

Following model selection, the chosen `TFIDF_Multinomial_NB` model was evaluated once on the strictly held-out test partition (371 examples, 38 unseen template groups):

### 3.1 Primary Test Metrics

| Metric | Score | Explanation |
| :--- | :---: | :--- |
| **Accuracy** | **98.38%** | 365 out of 371 messages correctly classified |
| **Precision (Scam)** | **97.38%** | When flagging as a scam, the model was correct 97.4% of the time |
| **Recall (Scam)** | **99.47%** | **186 out of 187** scam messages successfully intercepted |
| **F1-Score (Scam)** | **98.41%** | Harmonic mean for the scam class |
| **Macro-F1** | **98.38%** | Balanced across both scam and legitimate classes |

### 3.2 Test Set Confusion Matrix

```
                      Predicted Legitimate   Predicted Scam
Actual Legitimate:            179                   5   (False Positives)
Actual Scam:                    1                 186   (True Positives)
```

- **True Negatives (179):** Authentic youth messages correctly permitted without disruption.
- **False Positives (5):** 5 legitimate messages erroneously flagged (1.3% false alarm rate).
- **False Negatives (1):** Only 1 subtle SMS scam missed as legitimate (0.5% miss rate).
- **True Positives (186):** Malicious scam messages correctly flagged for warning/intervention.

### 3.3 Multi-Model Test Comparison (All Models on Held-Out Test)

For scientific completeness, all candidate pipelines were evaluated on the exact same test partition:

| Model Architecture | Test Accuracy | Test Scam Precision | Test Scam Recall | Test Scam F1 | Test Macro-F1 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Majority Baseline** | 50.40% | 50.40% | 100.00% | 67.03% | 0.3351 |
| **TF-IDF + LinearSVC** | 96.23% | 98.32% | 94.12% | 96.17% | 0.9623 |
| **TF-IDF + Logistic Regression** | 96.50% | 98.88% | 94.12% | 96.44% | 0.9650 |
| **TF-IDF + Multinomial NB** | **98.38%** | **97.38%** | **99.47%** | **98.41%** | **0.9838** |

---

## 4. Empirical Discovery: Provenance Generalization Gap

To test whether the model truly generalizes or merely overfits synthetic patterns, we evaluated the test set partitioned by provenance:

| Test Data Subset | Subset Size | Test Macro-F1 | Test Scam Recall | Test Scam Precision | Key Finding |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Synthetic Subset** | 280 rows | **1.0000** | 100.00% | 100.00% | Artificially perfect performance on parameterized syntax |
| **Public Real-World Subset** | 91 rows | **0.9327** | 97.30% | 87.80% | Real-world noise, slang, and varied tokens reduce precision |

### Academic Discussion
This discrepancy proves an essential research finding:
> **Synthetic training data inflates apparent model performance.**  
> While synthetic examples are necessary to cover modern emerging attacks (quishing, gaming crypto scams) not present in older benchmarks, a classifier trained on synthetic data exhibits a measurable drop in precision (from 100% down to 87.8%) when evaluated against authentic real-world messages.

---

## 5. Summary & Model Artifact Persistence

- **Saved Artifact:** `models/best_model.joblib` (Self-contained pipeline containing vectorizer vocabulary and trained Multinomial Naive Bayes parameters).
- **Execution Script:** `python research/scam-awareness-ml/src/train_and_evaluate.py`
- **Result Metrics File:** `reports/model_evaluation_metrics.json`
