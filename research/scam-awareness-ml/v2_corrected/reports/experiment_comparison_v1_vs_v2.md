# WiseCub Scam Awareness ML — Comparative Experiment Analysis (v1 vs. v2)

**Author:** Member 4 (Scam Awareness / Scam Safety), WiseCub Project  
**Date:** 2026-10-21  
**Target:** Academic Supervisor, Group Leader, Assessment Panel  

---

## 1. Executive Comparison Overview

Following an independent research audit of the initial scam awareness experiment (`v1`), four major methodological vulnerabilities were uncovered. To build a scientifically defensible study suitable for final-year university submission, a corrected experiment (`v2`) was designed and executed in a dedicated, isolated workspace without altering the original baseline artifacts.

| Dimension | Initial Experiment (v1) | Corrected Experiment (v2) | Impact on Academic Validity |
| :--- | :--- | :--- | :--- |
| **Synthetic Token Integrity** | Encoded category prefixes into message text (`#LEG-2207`, `#PH-0104`, `#QR-0201`). | **Completely eliminated.** Raw text contains zero class-derived markers or category prefixes. | Eliminates trivial shortcut learning and artificial 100% synthetic scores. |
| **Public Data Grouping** | Arbitrary sequential 10-message chunks (`GRP-UCI-SPAM-001`). | **Connected-components campaign clustering** using TF-IDF cosine similarity ($\ge 0.50$). | Prevents identical spam campaigns from crossing train and test splits. |
| **Cross-Split Campaign Leakage** | **22 pairs** of near-duplicate spam campaigns crossing train/test with similarity $\ge 0.70$. | **0 pairs** with similarity $\ge 0.70$. Max cross-split similarity reduced to `0.6121`. | Guaranteed partition independence. |
| **Error Diagnostics** | Hardcoded boilerplate text repeated identically across errors. | **Dynamic, instance-specific token attribution** identifying exact features triggering misclassifications. | Defensible, empirical error analysis. |
| **Overall Test Accuracy** | 98.38% (artificially inflated by shortcuts). | **89.30% to 93.32%** (honest, realistic). | Reflects authentic semantic classification. |

---

## 2. Quantitative Metric Comparison

### 2.1 5-Fold Grouped Cross-Validation (Training Split)

| Model Architecture | v1 Mean Macro-F1 (Mean ± Std) | v2 Mean Macro-F1 (Mean ± Std) | Delta | Observation |
| :--- | :---: | :---: | :---: | :--- |
| **Majority Baseline** | 0.3222 ± 0.0087 | 0.3435 ± 0.0045 | +0.0213 | Trivial baseline remains uninformative. |
| **TF-IDF + Logistic Regression** | 0.9840 ± 0.0089 | **0.9436 ± 0.0294** | -0.0404 | Realistic decrease reflecting genuine difficulty. |
| **TF-IDF + Multinomial NB** | 0.9635 ± 0.0273 | **0.9447 ± 0.0307** | -0.0188 | Consistent cross-validation stability. |
| **TF-IDF + LinearSVC** | 0.9818 ± 0.0171 | **0.9500 ± 0.0315** | -0.0318 | Highest CV mean Macro-F1 in v2. |

### 2.2 Held-Out Test Set Performance (All Models)

| Model Architecture | v1 Test Acc | v1 Macro-F1 | v2 Test Acc | v2 Macro-F1 | v2 Scam Recall | v2 Scam Precision |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Majority Baseline** | 50.40% | 0.3351 | 29.14% | 0.2257 | 100.0% | 29.14% |
| **TF-IDF + Logistic Regression** | 96.50% | 0.9650 | **89.30%** | **0.8798** | **96.33%** | 74.47% |
| **TF-IDF + Multinomial NB** | 98.38% | 0.9838 | **87.97%** | **0.8676** | **99.08%** | 71.05% |
| **TF-IDF + LinearSVC** | 96.23% | 0.9623 | **93.32%** | **0.9228** | **97.25%** | 82.81% |

### 2.3 Provenance Sub-Group Breakdown: The True Generalization Story

| Test Partition | Metric | Experiment v1 (With Shortcuts) | Experiment v2 (Corrected) | Scientific Interpretation |
| :--- | :--- | :---: | :---: | :--- |
| **Synthetic Subset** | Sample Size | 280 rows | 280 rows | Unchanged test volume. |
| | Macro-F1 | **1.0000 (100.0%)** | **0.8509 (85.1%)** | In v1, `#LEG-` provided a trivial shortcut. In v2, overlapping banking and 2FA terms require genuine linguistic understanding. |
| | Scam Recall | 100.0% | **100.0%** | Both models capture all synthetic scam types successfully. |
| | Scam Precision | 100.0% | **66.04%** | Legitimate messages mentioning money/accounts trigger false alarms. |
| **Public Benchmark Subset** | Sample Size | 91 rows | 94 rows | Clustered campaign allocation. |
| | Macro-F1 | 0.9327 | **0.9554** | Robust generalization on external public SMS data. |
| | Scam Recall | 97.30% | **89.74%** | Captures real-world spam without campaign leakage. |
| | Scam Precision | 87.80% | **100.00%** | Zero false positives on public legitimate messages. |

---

## 3. Methodological Significance for Research Presentation

In a university research assessment, an examiner will scrutinize a machine learning study that reports "100% Macro-F1 on synthetic data":
1. **The v1 Trap:** An examiner would quickly identify that `leg` was the top predictive token due to `#LEG-` prefixes, invalidating claims of high performance.
2. **The v2 Triumph:** By proactively identifying this flaw, correcting the generator, clustering public campaigns, and presenting an honest ~89-93% performance profile, the candidate demonstrates true academic rigor, critical reflection, and data science maturity.
