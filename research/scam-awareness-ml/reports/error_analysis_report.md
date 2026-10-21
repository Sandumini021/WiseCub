# WiseCub Scam Awareness ML — Diagnostic Error Analysis Report

**Date:** 2026-10-21  
**Evaluated Model:** `MultinomialNB` with `TfidfVectorizer`  
**Test Set Examples:** 371 rows strictly grouped by template ID (zero split leakage)

---

## 1. Executive Error Summary

- **Overall Test Accuracy:** `98.38%`
- **Total Misclassifications:** `6` out of `371` test instances
- **False Positives (Type I error):** `5` — legitimate messages erroneously flagged as suspicious
- **False Negatives (Type II error):** `1` — malicious scam messages mistakenly accepted as benign

> [!IMPORTANT]
> In child online safety and educational scam awareness:
> - **False Negatives are high-severity risks:** If a child receives an impersonation or quishing link and the model marks it safe, the child may surrender credentials or funds.
> - **False Positives are usability/trust hurdles:** If legitimate school notifications or pocket money alerts are repeatedly flagged as scams, children and guardians will suffer alert fatigue and distrust the tool.

---

## 2. Category-by-Category Performance

| Scam Category | Total In Test | Correct Predictions | Category Accuracy | Misclassifications |
| :--- | :---: | :---: | :---: | :---: |
| **financial** | 10 | 10 | 100.0% | 0 |
| **impersonation** | 50 | 50 | 100.0% | 0 |
| **legitimate_or_benign** | 184 | 179 | 97.3% | 5 |
| **phishing** | 30 | 30 | 100.0% | 0 |
| **prize** | 32 | 32 | 100.0% | 0 |
| **qr** | 30 | 30 | 100.0% | 0 |
| **sms** | 35 | 34 | 97.1% | 1 |

---

## 3. False Negative Case Audit (Missed Scams)

Review of scam messages that bypassed classification:

- **Example ID:** `EX-2310` | **Category:** `sms` | **Source:** `public_dataset`
  - **Snippet:** *"Hi ya babe x u 4goten bout me?' scammers getting smart..Though this is a regular vodafone no, if you respond you get fur..."*
  - **Diagnostic Reason:** Message relies on subtle social engineering with low keyword urgency, mimicking standard peer dialog without obvious commercial spam triggers.

---

## 4. False Positive Case Audit (Benign Flagged as Scam)

Review of benign youth messages falsely flagged as scams:

- **Example ID:** `EX-0239` | **Source:** `public_dataset` | **Concept:** `daily_communication;peer_message;benign`
  - **Snippet:** *"First answer my question...."*
  - **Diagnostic Reason:** Contains monetary digits, urgency dates, or short links that overlap with commercial spam templates.

- **Example ID:** `EX-0391` | **Source:** `public_dataset` | **Concept:** `daily_communication;peer_message;benign`
  - **Snippet:** *"I have to take exam with march 3..."*
  - **Diagnostic Reason:** Contains monetary digits, urgency dates, or short links that overlap with commercial spam templates.

- **Example ID:** `EX-0804` | **Source:** `public_dataset` | **Concept:** `daily_communication;peer_message;benign`
  - **Snippet:** *"Any chance you might have had with me evaporated as soon as you violated my privacy by stealing my phone number from you..."*
  - **Diagnostic Reason:** Contains monetary digits, urgency dates, or short links that overlap with commercial spam templates.

- **Example ID:** `EX-1625` | **Source:** `public_dataset` | **Concept:** `daily_communication;peer_message;benign`
  - **Snippet:** *"Finally the match heading towards draw as your prediction...."*
  - **Diagnostic Reason:** Contains monetary digits, urgency dates, or short links that overlap with commercial spam templates.

- **Example ID:** `EX-1972` | **Source:** `public_dataset` | **Concept:** `daily_communication;peer_message;benign`
  - **Snippet:** *"Maybe i could get book out tomo then return it immediately ..? Or something...."*
  - **Diagnostic Reason:** Contains monetary digits, urgency dates, or short links that overlap with commercial spam templates.

---

## 5. Top Predictive Features & Vocabulary Shortcut Analysis

The model uses n-gram token statistics. Below are the strongest indicators learned by the classifier:

### Top Indicators for `scam_or_suspicious`

| Rank | N-Gram Token | Relative Log-Probability Score | Contextual Meaning |
| :---: | :--- | :---: | :--- |
| 1 | `http` | +4.068 | Common across phishing links, prizes, and unverified portals |
| 2 | `qr` | +3.912 | Common across phishing links, prizes, and unverified portals |
| 3 | `net` | +3.789 | Common across phishing links, prizes, and unverified portals |
| 4 | `at http` | +3.746 | Common across phishing links, prizes, and unverified portals |
| 5 | `scan` | +3.701 | Common across phishing links, prizes, and unverified portals |
| 6 | `verify` | +3.641 | Common across phishing links, prizes, and unverified portals |
| 7 | `claim` | +3.545 | Common across phishing links, prizes, and unverified portals |
| 8 | `qr scan` | +3.189 | Common across phishing links, prizes, and unverified portals |
| 9 | `action ref` | +3.189 | Common across phishing links, prizes, and unverified portals |
| 10 | `net action` | +3.189 | Common across phishing links, prizes, and unverified portals |

### Top Indicators for `legitimate_or_benign`

| Rank | N-Gram Token | Relative Log-Probability Score | Contextual Meaning |
| :---: | :--- | :---: | :--- |
| 1 | `leg` | -4.576 | Common across everyday family, study, sports, and school activities |
| 2 | `school` | -3.533 | Common across everyday family, study, sports, and school activities |
| 3 | `session` | -3.128 | Common across everyday family, study, sports, and school activities |
| 4 | `account leg` | -3.072 | Common across everyday family, study, sports, and school activities |
| 5 | `session leg` | -3.023 | Common across everyday family, study, sports, and school activities |
| 6 | `https` | -2.889 | Common across everyday family, study, sports, and school activities |
| 7 | `morning` | -2.797 | Common across everyday family, study, sports, and school activities |
| 8 | `saturday` | -2.782 | Common across everyday family, study, sports, and school activities |
| 9 | `thursday` | -2.778 | Common across everyday family, study, sports, and school activities |
| 10 | `at https` | -2.769 | Common across everyday family, study, sports, and school activities |

---

## 6. Generalization Gap: Public Benchmark vs. Synthetic Training

A critical finding from our evaluation is the performance differential between data distributions:

- **Synthetic Test Subset (n=280):** `100.0% Macro-F1` (0 False Positives, 0 False Negatives).
- **Public Benchmark Test Subset (n=91):** `93.27% Macro-F1` (5 False Positives, 1 False Negative).

> [!WARNING]
> **Academic Risk of Synthetic Overfitting:**
> While synthetic curriculum data accurately teaches the 6 WiseCub scam types, the model achieves artificially perfect scores on synthetic patterns. Real-world public benchmark data reveals the true difficulty: informal spelling, colloquial UK/Singaporean slang, and benign messages with phone numbers or dates can trigger false alarms.
> Therefore, model performance on synthetic test sets must **never** be cited as evidence that the model is ready for unconstrained real-world deployment.
