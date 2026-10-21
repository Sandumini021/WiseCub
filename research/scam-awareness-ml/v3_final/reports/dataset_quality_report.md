# WiseCub Scam Awareness ML — Dataset Quality & Integrity Report (v3 Final)

**Document Title:** Quality, Integrity, Provenance & Leakage Verification for Dataset v3.0  
**Experiment Version:** v3 (Final Defensible Experiment)  
**Target Corpus:** `research/scam-awareness-ml/v3_final/data/scam_messages_dataset_v3.csv`  
**Date:** 2026-10-21  

---

## 1. Executive Summary

This report documents the rigorous quality audit of the final dataset `v3.0` developed for the WiseCub Scam Awareness machine learning component.
Building upon the findings of the independent audit, **dataset v3 implements length-stratified sampling across the raw benchmark, multi-criteria campaign clustering, and 100% unique natural-language phrasing without synthetic shortcuts**.

| Integrity Check | Target Requirement | Measured Value (v3) | Status |
| :--- | :---: | :---: | :---: |
| **Schema Adherence** | Strict Adherence | Columns match expected 12 fields exactly | **PASS** |
| **Row Count (N=2,500)** | Strict Adherence | Total rows = 2500 | **PASS** |
| **Missing Values Check** | Strict Adherence | Total null values across all 12 columns = 0 | **PASS** |
| **Unique Example IDs** | Strict Adherence | Unique IDs = 2500 (Zero duplicate IDs) | **PASS** |
| **Text Uniqueness (Exact & Norm)** | Strict Adherence | Exact dupes: 0, Normalized dupes: 0 | **PASS** |
| **Class Balance (50/50)** | Strict Adherence | Scam: 1250 (50.0%), Legit: 1250 (50.0%) | **PASS** |
| **Data Provenance Balance** | Strict Adherence | Synthetic: 1900 (76.0%), Public: 600 (24.0%) | **PASS** |
| **Curriculum Category Coverage** | Strict Adherence | All 6 scam categories + legitimate present: ['legitimate_or_benign', 'sms', 'impersonation', 'qr', 'phishing', 'prize', 'financial'] | **PASS** |
| **Label Shortcut Elimination** | Strict Adherence | Prohibited class markers = 0 (Zero leaks detected) | **PASS** |
| **Template Group Label Purity** | Strict Adherence | Template groups with mixed labels = 0 (Pure groupings) | **PASS** |

---

## 2. Statistical Breakdown

### 2.1 Class & Provenance Distributions

| Source Type | Scam / Suspicious | Legitimate / Benign | Total Examples | Percentage |
| :--- | :---: | :---: | :---: | :---: |
| **Synthetic Curriculum (WiseCub v3.0)** | 950 | 950 | 1900 | 76.0% |
| **Public Benchmark (UCI SMS Collection)** | 300 | 300 | 600 | 24.0% |
| **Total Combined Corpus** | **1250** | **1250** | **2500** | **100.0%** |

### 2.2 Category Breakdown

| Category | Total Count | Proportion | Curricular Description |
| :--- | :---: | :---: | :--- |
| **`legitimate_or_benign`** | 1250 | 50.0% | Aligned with WiseCub 6-level curriculum modules |
| **`sms`** | 315 | 12.6% | Aligned with WiseCub 6-level curriculum modules |
| **`impersonation`** | 200 | 8.0% | Aligned with WiseCub 6-level curriculum modules |
| **`qr`** | 200 | 8.0% | Aligned with WiseCub 6-level curriculum modules |
| **`phishing`** | 200 | 8.0% | Aligned with WiseCub 6-level curriculum modules |
| **`prize`** | 185 | 7.4% | Aligned with WiseCub 6-level curriculum modules |
| **`financial`** | 150 | 6.0% | Aligned with WiseCub 6-level curriculum modules |

---

## 3. Public Benchmark Stratified Sampling & Clustering

- **Sampling Method:** Length-stratified quintile sampling across 641 unique spams and 4,435 unique hams from `SMSSpamCollection`.
- **Spam Campaign Clusters:** Clustered into **`205`** distinct campaign families combining exact classifier TF-IDF representation, cosine similarity ($\\ge 0.40$), and contact number/shortcode matching.
- **Ham Template Clusters:** Clustered into **`297`** template families.
- **Multi-Message Clusters:** Identified `47` multi-variant spam campaigns.

---

## 4. Verification of Token Shortcut Elimination

- Regex scan for prohibited shortcuts (`#LEG-`, `#PH-`, `#QR-`, `#IMP-`, `#FIN-`, `#PRZ-`, `#SMS-`): **0 occurrences**.
- Text uniqueness: **0 exact duplicates, 0 normalized whitespace duplicates** across all 2,500 rows.
