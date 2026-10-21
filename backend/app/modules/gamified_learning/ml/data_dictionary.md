# WiseCub CDEMF Machine Learning Data Dictionary

**Dataset File:** `backend/app/modules/gamified_learning/ml/data/cdemf_synthetic_gameplay_2500.csv`  
**JSON Lines File:** `backend/app/modules/gamified_learning/ml/data/cdemf_synthetic_gameplay_2500.jsonl`  
**Total Records:** Exactly 2,500 records across 300 unique synthetic learners  
**Framework:** Competency-Driven Emotional Mission Framework (CDEMF) — WiseCub J26-IT-418  
**Target Variable:** `next_activity_support_need` (`NEEDS_FOUNDATION_SUPPORT`, `READY_FOR_STANDARD`, `READY_FOR_ADVANCED`)

---

## 1. Feature Timing & Data Leakage Categories

To prevent target leakage during model training in Checkpoint B, each field is assigned a strict **Feature Availability Phase**:

| Phase Category | Description | Permitted as ML Training Feature? |
| :--- | :--- | :--- |
| **IDENTIFIER** | Record keys and student identifiers. | **No** (Excluded or used only for GroupKFold cross-validation splitting). |
| **PRE-DECISION (PRIOR)** | Historical performance, cumulative attempts, and pre-attempt state known *before* the child submits a decision. | **Yes** (Primary baseline features). |
| **DECISION_INPUT** | Current gameplay financial allocation choices made by the learner on this level attempt. | **Yes** (Decision behavior features). |
| **CURRENT_EVALUATION** | Immediate CDEMF engine evaluation outcomes for this level attempt (scores, pass, gates, emotion). | **Contextual** (Permitted for post-attempt adaptation or next-activity routing; evaluated with/without in ablation). |
| **LATENT_STATE** | Internal simulated student archetype (used for simulation ground truth). | **No** (Strictly excluded to avoid cheating; the model must infer competency from observable behavior). |
| **TARGET** | Forward-looking instructional support label derived from subsequent learning trajectory. | **Target Only** (Ground truth target for classification). |

---

## 2. Complete Field Dictionary (44 Fields)

| # | Field Name | Data Type | Permitted in ML Model | Allowed Values / Range | Description & CDEMF Semantic Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `record_id` | String | No (Identifier) | `SYNTH_REC_0001` .. `SYNTH_REC_2500` | Globally unique identifier for this synthetic gameplay record. |
| 2 | `synthetic_student_id` | String | Grouping Only | `SYNTH_001` .. `SYNTH_300` | Unique synthetic learner ID. Used for GroupKFold validation to prevent student identity leakage across train/test splits. |
| 3 | `attempt_id` | String | No (Identifier) | `ATT_SYNTH_...` | Globally unique session attempt identifier. |
| 4 | `archetype` | String | No (Latent State) | `STRUGGLING_LEARNER`, `IMPULSIVE_SPENDER`, `CAUTIOUS_IMPROVER`, `ADVANCED_ACHIEVER` | Simulated student behavioral persona. Kept in dataset for cohort analysis and fairness auditing; excluded from model inputs. |
| 5 | `step_index` | Integer | Yes (Numeric) | $0$ to $19$ | 0-indexed sequential attempt counter for this student across their entire journey. |
| 6 | `simulated_timestamp_iso` | String (ISO-8601) | No (Temporal) | ISO-8601 UTC timestamp | Simulated timestamp of attempt execution. |
| 7 | `mission_id` | String | Yes (Categorical) | `mission_rescue_puppy`, `mission_squirrel_savings`, `mission_panda_fair` | The financial mission context being attempted. |
| 8 | `level_number` | Integer | Yes (Numeric) | 1 to 8 | 1-indexed level number within the mission. |
| 9 | `level_id` | String | Yes (Categorical) | `level_puppy_1` .. `level_panda_6` | Unique catalog identifier of the active level. |
| 10 | `interaction_type` | String | Yes (Categorical) | `needs_wants`, `budget_allocator`, `multi_period`, `emergency_response`, `trade_off`, `integrated_budget` | CDEMF interaction mechanic type. |
| 11 | `starting_budget_lkr` | Integer | Yes (Numeric) | $> 0$ (LKR / nuts) | Total liquid funds or resources available to the learner at the start of the level. |
| 12 | `attempt_number` | Integer | Yes (Numeric) | $\ge 1$ (typically 1 to 4) | The attempt sequence number for this specific (student, mission, level) combination. |
| 13 | `is_retry` | Boolean | Yes (Binary) | `True`, `False` | True if `attempt_number > 1` (student is retrying after a prior failure). |
| 14 | `hist_completed_levels_count` | Integer | Yes (Numeric) | $\ge 0$ | Cumulative count of mastered levels prior to this attempt. |
| 15 | `hist_prior_attempts_count` | Integer | Yes (Numeric) | $\ge 0$ | Total number of gameplay attempts completed prior to this attempt. |
| 16 | `hist_retry_rate` | Float | Yes (Numeric) | $0.0$ to $1.0$ | Historical ratio of retries to total attempts prior to this attempt. |
| 17 | `hist_remediation_count` | Integer | Yes (Numeric) | $\ge 0$ | Total remediation interventions encountered prior to this attempt. |
| 18 | `hist_avg_budgeting_score` | Float | Yes (Numeric) | $0.0$ to $100.0$ | Rolling historical average of budgeting competency scores. |
| 19 | `hist_avg_spending_score` | Float | Yes (Numeric) | $0.0$ to $100.0$ | Rolling historical average of spending discipline competency scores. |
| 20 | `hist_avg_saving_score` | Float | Yes (Numeric) | $0.0$ to $100.0$ | Rolling historical average of saving behavior competency scores. |
| 21 | `hist_avg_investment_score` | Float | Yes (Numeric) | $0.0$ to $100.0$ | Rolling historical average of investment awareness competency scores. |
| 22 | `hist_avg_planning_score` | Float | Yes (Numeric) | $0.0$ to $100.0$ | Rolling historical average of planning & goal achievement competency scores. |
| 23 | `hist_avg_emergency_prep_score` | Float | Yes (Numeric) | $0.0$ to $100.0$ | Rolling historical average of emergency preparedness competency scores. |
| 24 | `hist_overall_score_avg` | Float | Yes (Numeric) | $0.0$ to $100.0$ | Rolling historical mean of overall composite competency scores. |
| 25 | `hist_consecutive_fails` | Integer | Yes (Numeric) | $\ge 0$ | Count of consecutive failed attempts immediately preceding this attempt. |
| 26 | `hist_consecutive_passes` | Integer | Yes (Numeric) | $\ge 0$ | Count of consecutive passed attempts immediately preceding this attempt. |
| 27 | `decision_summary` | String | Optional (Text) | Descriptive string | Summary text of decision inputs made by student. |
| 28 | `allocated_amount_lkr` | Integer | Yes (Numeric) | $\ge 0$ (LKR / nuts) | Total financial or resource commitment made in this attempt. |
| 29 | `discretionary_spent_lkr` | Integer | Yes (Numeric) | $\ge 0$ (LKR / nuts) | Amount spent on discretionary or non-essential items in this attempt. |
| 30 | `reserve_preserved_lkr` | Integer | Yes (Numeric) | $\ge 0$ (LKR / nuts) | Amount preserved in emergency reserves or unallocated liquid balance. |
| 31 | `is_budget_feasible` | Boolean | Contextual (Gate) | `True`, `False` | True if total commitments did not violate the available budget constraint. |
| 32 | `essential_needs_covered` | Boolean | Contextual (Gate) | `True`, `False` | True if minimum mandatory requirements (shelter, medical, food) were met. |
| 33 | `score_budgeting` | Integer | Contextual | $0$ to $100$ | CDEMF rubric score for budgeting competency on this attempt. |
| 34 | `score_spending` | Integer | Contextual | $0$ to $100$ | CDEMF rubric score for spending discipline on this attempt. |
| 35 | `score_saving` | Integer | Contextual | $0$ to $100$ | CDEMF rubric score for saving behavior on this attempt. |
| 36 | `score_investment` | Integer | Contextual | $0$ to $100$ | CDEMF rubric score for investment awareness on this attempt. |
| 37 | `score_goal` | Integer | Contextual | $0$ to $100$ | CDEMF rubric score for goal achievement on this attempt. |
| 38 | `overall_score` | Integer | Contextual | $0$ to $100$ | Composite weighted CDEMF competency score for this attempt. |
| 39 | `passed` | Boolean | Contextual | `True`, `False` | Whether this attempt met the CDEMF mastery passing threshold. |
| 40 | `character_condition` | String | Contextual | CDEMF Physical condition (e.g. `CRITICAL`, `WEAK_STABILIZED`, `RECOVERING`, `THRIVING`) | Physical condition of story character following decision evaluation. |
| 41 | `character_emotion` | String | Contextual | CDEMF Emotional state (e.g. `DISTRESSED`, `WORRIED`, `HOPEFUL`, `RELIEVED`, `PROUD`) | Emotional state of story character following decision evaluation. |
| 42 | `transition_direction` | String | Contextual | `IMPROVEMENT`, `SETBACK`, `MAINTAINED`, `RECOVERY` | CDEMF character state transition vector direction. |
| 43 | `remediation_triggered` | Boolean | Contextual | `True`, `False` | True if CDEMF triggered a targeted remediation module for this attempt. |
| 44 | `next_activity_support_need` | String | **Target Label (Y)** | `NEEDS_FOUNDATION_SUPPORT`, `READY_FOR_STANDARD`, `READY_FOR_ADVANCED` | Multi-class target variable indicating forward-looking instructional support needs. |

---

## 3. Recommended Feature Subsets for ML Training

### A. Pre-Attempt Baseline (Prior-Only Model)
Features strictly observable *before* the learner makes a decision on the level:
- `mission_id`, `level_number`, `level_id`, `interaction_type`, `starting_budget_lkr`
- `attempt_number`, `is_retry`, `step_index`
- `hist_completed_levels_count`, `hist_prior_attempts_count`, `hist_retry_rate`, `hist_remediation_count`
- `hist_avg_budgeting_score`, `hist_avg_spending_score`, `hist_avg_saving_score`
- `hist_avg_investment_score`, `hist_avg_planning_score`, `hist_avg_emergency_prep_score`
- `hist_overall_score_avg`, `hist_consecutive_fails`, `hist_consecutive_passes`

### B. Post-Decision Formulation (Full Behavioral Model)
Augments the prior baseline with the student's actual allocation choices and immediate CDEMF feedback:
- Features from **(A)** plus:
- `allocated_amount_lkr`, `discretionary_spent_lkr`, `reserve_preserved_lkr`
- `is_budget_feasible`, `essential_needs_covered`
- `score_budgeting`, `score_spending`, `score_saving`, `score_investment`, `score_goal`
- `overall_score`, `passed`, `character_condition`, `character_emotion`, `transition_direction`, `remediation_triggered`

### C. Forbidden Features (Target Leakage Prevention)
The following fields **MUST NEVER** be passed as predictive features:
- `record_id`, `attempt_id` (identifiers)
- `synthetic_student_id` (only used as `groups` parameter in `GroupKFold` / `StratifiedGroupKFold`)
- `archetype` (unobservable latent persona)
- `simulated_timestamp_iso` (temporal artifact)
- `next_activity_support_need` (the ground truth target)
