# WiseCub Scam Awareness ML — Grouping & Data Leakage Diagnostics (v2)

**Document Title:** Mathematical & Empirical Verification of Zero Data Leakage  
**Experiment Version:** v2 (Corrected Experiment)  
**Date:** 2026-10-21  

---

## 1. Group-Based Partitioning Integrity

| Split Partition | Row Count | Proportion | Unique Template Groups | Public Groups | Synthetic Groups |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Training Set** | 1722 | 68.9% | 500 | 370 | 130 |
| **Validation Set** | 404 | 16.2% | 107 | 75 | 32 |
| **Held-Out Test Set** | 374 | 15.0% | 108 | 80 | 28 |

### Exact Template ID Intersections
- Overlap between Train and Validation: **`0 groups`**
- Overlap between Train and Test: **`0 groups`**
- Overlap between Validation and Test: **`0 groups`**

---

## 2. Cross-Split Text Similarity & Campaign Leakage Audit

In text classification, identical spam campaigns can be worded with minor cosmetic variations (e.g. changing phone numbers).
To mathematically prove that campaign clustering successfully grouped related public messages:

| Metric | Audit Finding | Interpretation |
| :--- | :---: | :--- |
| **Max Cosine Similarity (Train vs. Test)** | **`0.6121`** | No duplicate or near-duplicate messages cross the train/test split. |
| **Max Cosine Similarity (Train vs. Val)** | **`0.6276`** | Clean partition between training and validation tuning. |
| **Max Cosine Similarity (Val vs. Test)** | **`0.6117`** | Strict partition between validation and final test set. |
| **Cross-Split Pairs with Sim >= 0.70** | **`0`** | In v1, there were 22 leaked pairs; in v2, campaign clustering reduced near-duplicate leakage to zero. |

---

## 3. Label Shortcut Verification

- Scanned full corpus for artificial markers (`#LEG-`, `#PH-`, `#QR-`, `#IMP-`, `#FIN-`, `#PRZ-`, `#SMS-`).
- **Total Shortcuts Detected:** `0`
- Input features are strictly raw `message_text`. All metadata fields (`binary_label`, `scam_category`, `source_type`, `template_group_id`) are excluded from model input.
