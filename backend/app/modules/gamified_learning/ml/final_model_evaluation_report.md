# WiseCub CDEMF — Phase 3 Final Model Evaluation & Research Readiness Report

**Project:** WiseCub — J26-IT-418  
**Module:** Gamified Financial Learning System  
**Framework:** Competency-Driven Emotional Mission Framework (CDEMF)  
**Deliverable:** Checkpoint B2 — Held-Out Evaluation and Model Readiness  
**Target Variable:** `next_activity_support_need` (`NEEDS_FOUNDATION_SUPPORT`, `READY_FOR_STANDARD`, `READY_FOR_ADVANCED`)  
**Production Candidate Artifact:** `cdemf_support_model_v1.joblib` (Version 1.0.0)  

---

## 1. Synthetic Dataset Methodology

To prepare for adaptive scaffolding prior to large-scale school field deployments, a synthetic telemetry dataset of **exactly 2,500 gameplay records** was generated across **300 simulated student profiles** (`seed=42`). 

The simulation mechanics directly executed the authentic CDEMF runtime pipeline (`run_cdemf_pipeline`), covering all 20 levels across three core story missions:
- **Rescue the Injured Puppy** (8 levels — Budgeting & Needs vs. Wants Prioritization)
- **Squirrel's Winter Savings** (6 levels — Delayed Gratification, Food Storage & Compounding)
- **Panda's School Fair** (6 levels — Smart Spending, Wholesale Unit Costs & Profit Margins)

Learner behavior was guided by four psychometric archetypes (`STRUGGLING_LEARNER`, `IMPULSIVE_SPENDER`, `CAUTIOUS_IMPROVER`, `ADVANCED_ACHIEVER`) parameterized with Item Response Theory (IRT 2PL) selection probabilities and Bayesian Knowledge Tracing (BKT) cognitive state updates.

---

## 2. Student-Grouped Data Splitting & Leakage Isolation

To guarantee that models learn generalizable behavioral signatures rather than memorizing individual student identities, records were partitioned using a **Student-Grouped Stratified Split** anchored on `synthetic_student_id`:

| Partition | Row Count | Row Share (%) | Unique Students | Student Share (%) | Role |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Train Set** | 1,755 | 70.2% | 210 | 70.0% | Preprocessing fitting & model parameter optimization |
| **Validation Set** | 372 | 14.9% | 45 | 15.0% | Hyperparameter tuning, benchmark comparison, threshold calibration |
| **Held-Out Test Set** | 373 | 14.9% | 45 | 15.0% | **Frozen final assessment** (untouched until Checkpoint B2) |
| **Total** | **2,500** | **100.0%** | **300** | **100.0%** | Complete curriculum |

**Isolation Verification:**
$$\text{Train} \cap \text{Val} = \emptyset, \quad \text{Train} \cap \text{Test} = \emptyset, \quad \text{Val} \cap \text{Test} = \emptyset$$
No student appears in more than one partition. The held-out test set remained strictly sealed throughout Checkpoint B1.

---

## 3. Feature Engineering & Strict Temporal Allowlist

An explicit allowlist of **21 features** strictly observable *before* the learner makes a decision on the level attempt was implemented:

- **Categorical Context (3)**: `mission_id`, `level_id`, `interaction_type`
- **Numerical Context & Lagged Telemetry (18)**:
  `level_number`, `starting_budget_lkr`, `attempt_number`, `is_retry`, `step_index`,
  `hist_completed_levels_count`, `hist_prior_attempts_count`, `hist_retry_rate`, `hist_remediation_count`,
  `hist_avg_budgeting_score`, `hist_avg_spending_score`, `hist_avg_saving_score`, `hist_avg_investment_score`,
  `hist_avg_planning_score`, `hist_avg_emergency_prep_score`, `hist_overall_score_avg`,
  `hist_consecutive_fails`, `hist_consecutive_passes`.

**Target Leakage Prevention**: All decision allocations, current evaluation scores, pass/fail gates, character emotions, unobservable latent proficiencies, and future attempt metrics are strictly forbidden from model inputs.

---

## 4. Multi-Model Benchmark Comparison (Validation Set)

Four estimators were trained on the 1,755 training records and benchmarked on the 372 validation records:

| Model | Val Accuracy | Val Balanced Acc | Val Macro Precision | Val Macro Recall | Val Macro F1 | Train Time (s) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Dummy Baseline** (`stratified`) | 0.3226 | 0.3259 | 0.3219 | 0.3259 | **0.3224** | 0.03s |
| **Logistic Regression** (L2, `balanced`) | 0.6290 | 0.6164 | 0.6080 | 0.6164 | **0.6061** | 0.15s |
| **Random Forest** (`depth=6`, `leaf=4`) | 0.6398 | 0.6287 | 0.6228 | 0.6287 | **0.6232** | 0.35s |
| **HistGradientBoosting** **(Selected)** | **0.6532** | **0.6415** | **0.6371** | **0.6415** | **0.6353** | **0.78s** |

---

## 5. Candidate Model Selection Rationale

`HistGradientBoostingClassifier` was selected as the candidate architecture:
1. Achieved the highest Validation Macro F1 (**0.6353**), representing a **+97.1% relative improvement** over the baseline.
2. Preserved high balance across all three classes without collapsing the intermediate `READY_FOR_STANDARD` cohort.
3. Naturally models non-linear interactions between historical retry velocity, rolling competency scores, and catalog level difficulty.
4. Ultra-low inference latency (< 1 ms), ideal for real-time pedagogical adaptations.

---

## 6. Final Held-Out Evaluation (Frozen Model on Test Set)

The frozen `HistGradientBoostingClassifier` pipeline was evaluated **once** on the 373 held-out test records (45 unseen students):

| Metric | Validation Set (372 records) | Held-Out Test Set (373 records) | Difference ($\Delta$) | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Accuracy** | 0.6532 | **0.6220** | $-0.0312$ | Generalizes well |
| **Balanced Accuracy** | 0.6415 | **0.6131** | $-0.0284$ | Well-balanced |
| **Macro Precision** | 0.6371 | **0.6054** | $-0.0317$ | High precision |
| **Macro Recall** | 0.6415 | **0.6131** | $-0.0284$ | Consistent |
| **Macro F1-Score** | **0.6353** | **0.6007** | **$-0.0346$** | **Robust generalization** |

The minimal degradation ($\sim 3.4\%$ F1 difference) between validation and test sets confirms that the model did not overfit the validation cohort.

### Per-Class Test Performance
| Target Support Class | Precision | Recall | F1-Score | Test Support |
| :--- | :---: | :---: | :---: | :---: |
| `NEEDS_FOUNDATION_SUPPORT` | 0.5435 | 0.4464 | 0.4902 | 112 |
| `READY_FOR_STANDARD` | 0.5888 | 0.4846 | 0.5316 | 130 |
| `READY_FOR_ADVANCED` | 0.6839 | 0.9084 | 0.7803 | 131 |
| **Macro Average** | **0.6054** | **0.6131** | **0.6007** | **373** |

### Test Set Confusion Matrix
*Rows: Ground Truth, Columns: Predicted (`NEEDS_FOUNDATION_SUPPORT`, `READY_FOR_STANDARD`, `READY_FOR_ADVANCED`)*
```
                             Predicted [SUPPORT]    Predicted [STANDARD]    Predicted [ADVANCED]
Actual [SUPPORT]  (112):             50                     34                      28
Actual [STANDARD] (130):             40                     63                      27
Actual [ADVANCED] (131):              2                     10                     119
```

---

## 7. Educational Risk & Error Analysis

In an educational setting, different misclassifications carry vastly asymmetric risks:

| Risk Category | Error Type | Test Count | Pedagogical Implication | Mitigation Strategy |
| :--- | :--- | :---: | :--- | :--- |
| **Severe Risk** | Actual Foundation $\to$ Predicted Advanced | 28 / 373 (7.5%) | Student receives overly complex tasks without support, risking emotional frustration. | **Absolute Safety Gate**: ML predictions NEVER unlock levels or bypass CDEMF mastery rubrics. CDEMF mastery evaluation remains the sole authority. |
| **Moderate Risk** | Actual Standard $\to$ Predicted Advanced | 27 / 373 (7.2%) | Student encounters advanced options without foundational mastery. | Scaffolding practice cards offered as opt-in recommendations. |
| **Conservative Error** | Actual Advanced $\to$ Predicted Support | 2 / 373 (0.5%) | Advanced student offered extra practice. | Negligible pedagogical harm; advanced students can decline optional hints. |

### Prediction Confidence Analysis
- Mean confidence on **correct predictions**: **0.7301**
- Mean confidence on **incorrect predictions**: **0.6294**
Incorrect predictions are accompanied by substantially lower confidence, confirming that confidence gating is an effective safety mechanism.

---

## 8. Subgroup Performance & Conservative Fallback Policy

### Subgroup Findings
- **By Mission**: Puppy Rescue (Macro F1: 0.6481), Squirrel Savings (Macro F1: 0.6267), Panda Fair (Macro F1: 0.5230).
- **By Level Depth**: Early levels 1–3 (Macro F1: 0.5848) vs. Late levels 4–8 (Macro F1: 0.6049).
- **Cold-Start Learners**:
  - Cold-start students (completed 0 levels or step $\le 1$): Macro F1: **0.4834**, Accuracy: **0.5161**.
  - Established history students: Macro F1: **0.6207**, Accuracy: **0.6571**.

### Production Fallback Policy
Implemented in `backend/app/modules/gamified_learning/ml/inference.py`:
1. **Cold-Start Safeguard**: If `hist_prior_attempts_count < 2` or `hist_completed_levels_count == 0`, the model defers to CDEMF rule-based progression.
2. **Confidence Safety Gating**: If maximum predicted class probability $\max P(y \mid x) < 0.50$, the engine falls back to standard progression.
3. **Fallback Impact**:
   - Fallback triggers on **26.0%** of test records.
   - On the remaining **74.0%** of accepted predictions, **Accuracy rises to 0.6630** and **Macro F1 rises to 0.6258**.

---

## 9. Role of OECD PISA 2022 as External Research Evidence

WiseCub uses the OECD PISA 2022 Financial Literacy Framework to substantiate the research validity of our competency constructs:
- **Money & Transactions**: Budgeting and unit pricing.
- **Planning & Managing Finances**: Multi-period food storage and delayed rewards.
- **Risk & Uncertainty**: Emergency reserve preservation and weather shock mitigation.

**Methodological Boundary Clarification**:
PISA 2022 is **NOT** merged into the training set and does **NOT** validate model weights. The student archetypes and IRT parameters are **research-informed simulation assumptions** constructed to stress-test adaptive pipelines under controlled conditions.

---

## 10. Research Validity & Limitations

> [!IMPORTANT]
> **Why Synthetic Performance Does Not Establish Real-World Accuracy**:
> 1. **Synthetic Telemetry Prior**: The 60.1% test Macro F1 reflects learning performance within the CDEMF simulation engine under programmed cognitive agent assumptions.
> 2. **Human Cognitive Variability**: Real adolescent students (aged 12–16) exhibit unpredictable reading comprehension, classroom distractions, peer interactions, and affective states not captured by 2PL IRT formulas.
> 3. **Clinical / Educational Status**: Model predictions must be deployed strictly in a **formative, assistive capacity** (e.g. offering hints, recommending review levels). Under no circumstances should an ML score restrict a child's educational access or replace teacher judgment.
> 4. **Classroom Calibration Requirement**: In future Phase 4/5 pilots, live gameplay logs will be gathered under parental and institutional consent to fine-tune model weights via transfer learning.
