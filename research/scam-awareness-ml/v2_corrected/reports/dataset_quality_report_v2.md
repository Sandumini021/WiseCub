# WiseCub Scam Awareness ML — Dataset Quality & Integrity Report (v2)

**Document Title:** Quality, Integrity, Provenance & Leakage Verification for Dataset v2.0  
**Experiment Version:** v2 (Corrected Experiment)  
**Target Corpus:** `research/scam-awareness-ml/v2_corrected/data/scam_messages_dataset_v2.csv`  
**Date:** 2026-10-21  

---

## 1. Executive Summary

This report documents the rigorous quality audit of the corrected dataset `v2.0` developed for the WiseCub Scam Awareness machine learning component.
Unlike version 1, which suffered from synthetic label-revealing tokens (`#LEG-`, `#PH-`) and unclustered public SMS campaigns, **version 2 implements complete token shortcut elimination and graph-based campaign clustering**.

| Integrity Check | Target Requirement | Measured Value (v2) | Status |
| :--- | :---: | :---: | :---: |
| **Schema Adherence** | Strict Adherence | Columns match expected 12 fields exactly: ['example_id', 'message_text', 'binary_label', 'scam_category', 'concept_tags', 'difficulty', 'source_type', 'source_name', 'source_reference', 'license', 'template_group_id', 'generation_or_review_notes'] | **PASS** |
| **Row Count Verification** | Strict Adherence | Total rows = 2500 (Expected exactly 2,500) | **PASS** |
| **Null Values Check** | Strict Adherence | Total missing values across all columns = 0 | **PASS** |
| **Unique Example IDs** | Strict Adherence | Unique IDs = 2500 (Matches total rows, zero duplicate IDs) | **PASS** |
| **Exact Duplicate Texts** | Strict Adherence | Exact duplicate texts = 0 | **PASS** |
| **Class Balance (50/50)** | Strict Adherence | Scam: 1250 (50.0%), Legitimate: 1250 (50.0%) | **PASS** |
| **Data Provenance Balance** | Strict Adherence | Synthetic: 1900 (76.0%), Public Benchmark: 600 (24.0%) | **PASS** |
| **Label Shortcut Elimination** | Strict Adherence | Occurrences of artificial label prefixes = 0 (Zero leaks detected) | **PASS** |
| **Template Group Label Purity** | Strict Adherence | Template groups with mixed labels = 0 (Pure groupings guaranteed) | **PASS** |
| **Template Groups Count** | Strict Adherence | Total unique template groups = 715 (190 synthetic + clustered public) | **PASS** |

---

## 2. Statistical Breakdown

### 2.1 Class & Provenance Distributions

| Source Type | Scam / Suspicious | Legitimate / Benign | Total Examples | Percentage |
| :--- | :---: | :---: | :---: | :---: |
| **Synthetic Curriculum (WiseCub v2.0)** | 950 | 950 | 1900 | 76.0% |
| **Public Benchmark (UCI SMS Spam)** | 300 | 300 | 600 | 24.0% |
| **Total Combined Corpus** | **1250** | **1250** | **2500** | **100.0%** |

### 2.2 Category Breakdown

| Category | Total Count | Proportion | Educational Focus / Description |
| :--- | :---: | :---: | :--- |
| **`legitimate_or_benign`** | 1250 | 50.0% | Authentic peer dialog, family coordination, school notices, 2FA codes, transparent student banking |
| **`sms`** | 304 | 12.2% | Courier fee fraud, fake parcel clearance, utility shutoff threats, telco promotions |
| **`impersonation`** | 200 | 8.0% | Hi-mum family emergencies, fake principal/counselor notices, peer money borrowing, teacher spoofing |
| **`qr`** | 200 | 8.0% | Tampered flyers, cafeteria discount barcodes, event passes, locker combination updates |
| **`phishing`** | 200 | 8.0% | Spoofed school login portals, fake exam timetables, credential harvesting forms |
| **`prize`** | 196 | 7.8% | Unsolicited gift cards, lottery draws, gaming console giveaways, VIP concert tickets |
| **`financial`** | 150 | 6.0% | Crypto doubling, high-yield youth investment schemes, passive video ad tasks, P2P cash flips |

---

## 3. Public Data Provenance & Campaign Clustering Diagnostics

To prevent near-duplicate spam campaigns in the public UCI benchmark from crossing data splits, public records were clustered using **TF-IDF pairwise cosine similarity with a conservative threshold of 0.50** combined with connected components graph clustering.

- **Similarity Threshold:** `0.50`
- **Public Spam Messages:** `300` records grouped into **`230`** distinct campaign families.
- **Public Ham Messages:** `300` records grouped into **`295`** template families.
- **Multi-Message Spam Campaigns Identified:** `45` clusters containing multiple variants of identical spam operations (e.g. secret admirer campaigns, urgent £2000 prize calls, SIM card points).

By enforcing that all variants in a campaign share the exact same `template_group_id`, `GroupShuffleSplit` guarantees that related messages stay together in the same split partition.

---

## 4. Verification of Token Shortcut Elimination

> [!IMPORTANT]
> **Methodological Correction from Audit Finding:**
> In dataset v1, the synthetic generator placed `#LEG-` in 950 legitimate messages and `#PH-`, `#QR-` in scam messages. This caused TF-IDF to pick up `leg` as an artificial 100% predictive token.
> In dataset v2, **all reference tags are either eliminated or replaced with natural numbers/identifiers unlinked to the target label**.
> Independent regex verification confirms **0 occurrences of prohibited label shortcuts in `message_text`**.
