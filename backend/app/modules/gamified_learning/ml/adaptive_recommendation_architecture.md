# WiseCub CDEMF — Adaptive Recommendation Architecture & Safety Framework

**Project:** WiseCub — J26-IT-418  
**Module:** Gamified Financial Learning System  
**Deliverable:** Checkpoint C — Adaptive Mission Recommendation Engine  
**Implementation File:** `backend/app/modules/gamified_learning/ml/recommend.py`  
**Production Model:** `HistGradientBoostingClassifier v1.0.0` (`cdemf_support_model_v1.joblib`)  

---

## 1. Executive Summary & Design Principles

The WiseCub Adaptive Recommendation Engine reconciles two complementary paradigms:
1. **Authoritative CDEMF Mastery System**: Deterministic, rubric-based evaluation of financial constraints, solvency gates, and character emotional state transitions across 20 story levels.
2. **Predictive Machine Learning Classifier**: A gradient-boosted decision tree pipeline trained on 21 pre-activity historical features to forecast the child's forward instructional support tier (`NEEDS_FOUNDATION_SUPPORT`, `READY_FOR_STANDARD`, `READY_FOR_ADVANCED`).

### Non-Negotiable Safety Contracts
- **ML NEVER unlocks locked levels**: Progression through story missions is exclusively governed by deterministic CDEMF mastery passing gates ($\ge 75$ or $\ge 80$).
- **No Automatic Difficulty Escalation**: An ML prediction of `READY_FOR_ADVANCED` can **never** unilaterally increase level difficulty. Advanced activities are strictly **optional formative challenges**.
- **Mandatory CDEMF Mastery Verification**: To receive an advanced recommendation, independent CDEMF telemetry must verify concept mastery ($\ge 80$ rolling average, consecutive passes, zero unresolved remediations).
- **Graceful Degradation**: Cold-start learners, low-confidence predictions ($< 0.50$), or missing model artifacts seamlessly fall back to rule-based CDEMF progression.

---

## 2. Recommendation Architecture & Component Roles

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Student Gameplay Telemetry & State                  │
│       (Prior scores, retry rate, consecutive passes, unlocked levels)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │     Inference Engine (inference.py / v1.0.0 Pipeline)   │
       │    Evaluates 21 strictly lagged, pre-decision features   │
       └────────────────────────────┬────────────────────────────┘
                                    │
                         ML Prediction & Confidence
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │   CDEMF Safety Arbitration Gate (recommend.py)          │
       │                                                         │
       │   [Check 1] Cold Start? (Attempts < 2) ───────────────────► Fallback (Standard Rule)
       │   [Check 2] Low Confidence? (< 0.50) ─────────────────────► Fallback (Standard Rule)
       │   [Check 3] ML = ADVANCED & CDEMF < 80? ──────────────────► Safety Override (Standard)
       │   [Check 4] Verified CDEMF Mastery + ML = ADVANCED ──────► Optional Advanced Challenge
       │   [Check 5] ML = SUPPORT or Low CDEMF ───────────────────► Guided Foundation Review
       └────────────────────────────┬────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │    Catalog Level Mapping & Age-Appropriate Explanations │
       │    (Guarantees recommended level <= student unlocked)   │
       └─────────────────────────────────────────────────────────┘
```

### Separation of Responsibilities
| System Layer | Authority & Responsibilities | Boundary Invariants |
| :--- | :--- | :--- |
| **CDEMF Engine** (`engine.py`, `catalog.py`) | Authoritative gatekeeper. Computes multi-attribute rubric scores (budgeting, spending, saving, investment, emergency prep), solvency gates, character physical condition and emotional state transitions. | Sole arbiter of level unlocking and badge awards. |
| **ML Inference Service** (`inference.py`) | Statistical predictor. Estimates forward instructional support needs and provides class probability distributions from historical telemetry. | Has zero write access to student progress records or level locks. |
| **Adaptive Recommender** (`recommend.py`) | Pedagogical synthesizer. Combines CDEMF evidence with ML probabilities to suggest targeted practice cards and story hints. | All advanced practice is strictly optional; never forces higher difficulty. |

---

## 3. Recommendation Categories & Pedagogical Action

| Recommendation Category | Target Learner State | Pedagogical Action | Catalog Mapping Strategy | Optional? |
| :--- | :--- | :--- | :--- | :---: |
| **FOUNDATION** | Learner is struggling with core concepts, has experienced retries, or was flagged by ML for foundation scaffolding. | Review basic budget allocation, needs vs. wants categorization, or emergency reserve preservation with guided hints. | Maps to Level 1 (Needs vs. Wants) or Level 2 (Budget Allocator) of active mission. | No (Recommended Review) |
| **STANDARD** | Learner is progressing steadily, exhibits balanced decision-making, and has passing competencies. | Continue the narrative story arc with the next unlocked, uncompleted mission level. | Maps to current unlocked level ($L \le \text{unlocked}$) of active mission. | No (Core Mission) |
| **ADVANCED** | Learner has independently verified CDEMF mastery ($\ge 80$ score, no fails) AND high-confidence ML readiness. | Offer optional high-complexity trade-off justifications, unit price comparisons, or multi-period optimizations. | Maps to unlocked Level 5 (Trade-off) or Level 6 (Capstone budget) with bonus challenge goals. | **Yes (Strictly Optional)** |

---

## 4. Educational Safety Constraints & Disagreement Resolution

### The Safety Override Mechanism
During Checkpoint B2 held-out testing, the ML model exhibited an educational limitation: **28 out of 112 actual foundation-support learners (7.5% of the test set) were falsely predicted as `READY_FOR_ADVANCED`**.

If an autonomous system relied solely on ML outputs, these 28 struggling adolescent learners would be pushed into premature, highly complex financial tasks without scaffolding, risking cognitive overload and emotional distress.

To prevent this failure mode, the recommendation engine enforces an **Independent CDEMF Mastery Audit**:
$$\text{Advanced Approved} \iff (\hat{Y}_{\text{ML}} = \text{ADVANCED}) \land (\text{Score}_{\text{CDEMF}} \ge 80) \land (\text{Fails} = 0) \land (\text{Remediations} = 0)$$

#### Disagreement Resolution Policy
If $\hat{Y}_{\text{ML}} = \text{ADVANCED}$ but $\text{Score}_{\text{CDEMF}} < 80$ or $\text{Fails} > 0$:
1. A **Safety Disagreement** is logged in `safety_audit.disagreement_detected = True`.
2. The recommendation is immediately demoted to **`STANDARD`** (or `FOUNDATION` if score $< 70$).
3. `prediction_source` is set to `"CDEMF_SAFETY_OVERRIDE"`.
4. The explanation gently encourages the learner to consolidate core mission objectives without exposing them to premature difficulty.

---

## 5. Confidence Gating & Fallback Behavior

Confidence thresholds were derived strictly from validation set distributions rather than held-out test data:
- **Threshold**: $\tau = 0.50$ (maximum class probability).
- **Cold-Start Policy**: $\text{Prior Attempts} < 2$ or $\text{Completed Levels} = 0$.

### Fallback Behavior Matrix
| Trigger Condition | Fallback Status | Assigned Prediction Source | Recommended Category | Fallback Explanation |
| :--- | :---: | :--- | :---: | :--- |
| **Cold-Start** (New learner, 0–1 attempts) | `True` | `"CDEMF_RULE_BASED_COLD_START"` | `STANDARD` (or `FOUNDATION` if initial fail) | "Welcome to your financial journey! Let's begin with the first story level." |
| **Low ML Confidence** ($\max P < 0.50$) | `True` | `"CDEMF_RULE_BASED_LOW_CONFIDENCE"` | `STANDARD` | "You're making steady progress! Continue the story to build your skills." |
| **Missing Model Artifact** (Disk error) | `True` | `"CDEMF_RULE_BASED_MODEL_UNAVAILABLE"` | `STANDARD` | "Continue with your active story mission." |
| **Feature Leakage / Exception** | `True` | `"CDEMF_RULE_BASED_MODEL_UNAVAILABLE"` | `STANDARD` | "Standard CDEMF curriculum progression." |

---

## 6. Concrete Recommendation Examples

### Example 1: Foundation Scaffolding
```json
{
  "recommended_category": "FOUNDATION",
  "recommended_competency": "Budgeting & Needs Prioritization",
  "recommended_mission_id": "mission_rescue_puppy",
  "recommended_mission_title": "Rescue the Injured Puppy",
  "recommended_level_number": 1,
  "recommended_level_id": "level_puppy_1",
  "recommendation_title": "Strengthen Essential Budgeting",
  "explanation": "Try another budgeting challenge to practice keeping enough money for important needs like Barnaby's safety.",
  "pedagogical_action": "Review foundational budget balance with guided hints",
  "is_optional": false,
  "prediction_source": "CDEMF_HYBRID_ML",
  "fallback_used": false
}
```

### Example 2: Standard Story Progression
```json
{
  "recommended_category": "STANDARD",
  "recommended_competency": "Multi-Period Savings Planning",
  "recommended_mission_id": "mission_rescue_puppy",
  "recommended_mission_title": "Rescue the Injured Puppy",
  "recommended_level_number": 3,
  "recommended_level_id": "level_puppy_3",
  "recommendation_title": "Continue Story: Vet Care Across Weeks",
  "explanation": "You're making steady progress! Continue the story with Level 3 to help Barnaby take the next financial step.",
  "pedagogical_action": "Proceed with regular story mission progression",
  "is_optional": false,
  "prediction_source": "CDEMF_HYBRID_ML",
  "fallback_used": false
}
```

### Example 3: Verified Advanced Optional Challenge
```json
{
  "recommended_category": "ADVANCED",
  "recommended_competency": "Trade-off Justification",
  "recommended_mission_id": "mission_panda_fair",
  "recommended_mission_title": "Panda's School Fair",
  "recommended_level_number": 5,
  "recommended_level_id": "level_panda_5",
  "recommendation_title": "Advanced Challenge: Fair Pricing & Margin Simulation",
  "explanation": "Outstanding financial mastery! Help Bao Bao tackle an optional advanced trade-off challenge to optimize savings and quality.",
  "pedagogical_action": "Optional advanced financial trade-off and optimization challenge",
  "is_optional": true,
  "prediction_source": "CDEMF_HYBRID_ML",
  "fallback_used": false
}
```

### Example 4: CDEMF Safety Override (Disagreement Resolution)
```json
{
  "recommended_category": "STANDARD",
  "recommended_competency": "Emergency Reserve Response",
  "recommended_mission_id": "mission_rescue_puppy",
  "recommended_mission_title": "Rescue the Injured Puppy",
  "recommended_level_number": 4,
  "recommended_level_id": "level_puppy_4",
  "recommendation_title": "Continue Story: Emergency Vet Visit",
  "explanation": "You're making steady progress! Continue the story with Level 4 to help Barnaby take the next financial step.",
  "pedagogical_action": "Proceed with regular story mission progression",
  "is_optional": false,
  "prediction_source": "CDEMF_SAFETY_OVERRIDE",
  "fallback_used": false,
  "safety_audit": {
    "cdemf_mastery_confirmed": false,
    "ml_raw_prediction": "READY_FOR_ADVANCED",
    "ml_confidence": 0.74,
    "disagreement_detected": true,
    "disagreement_override_applied": true,
    "override_reason": "ML predicted READY_FOR_ADVANCED, but CDEMF mastery criteria were not met (Score: 62.0<80 or remediation history). Reverted to STANDARD progression for educational safety."
  }
}
```

---

## 7. Child-Centric Communication Style (Age 12–16)

The engine enforces strict linguistic guidelines:
1. **No Stigmatizing Labels**: The terms "weak", "poor", "failing", "incapable", or "incompetent" are strictly barred.
2. **Character & Mission Framing**: Challenges are framed around helping the character (Barnaby, Nutty, Bao Bao), reducing personal performance anxiety.
3. **Formative & Actionable**: Guidance focuses on concrete financial behaviors (e.g., "compare unit prices", "keep a buffer for unexpected rain").

---

## 8. Limitations & Preparation for Checkpoint D

- **Scope Boundary**: Checkpoint C introduces `recommend.py` as a self-contained domain engine. No FastAPI endpoints or live route modifications were made in this phase.
- **Readiness for Checkpoint D**: The engine produces fully validated, typed Pydantic response models (`AdaptiveRecommendationResponse`), ready to be integrated into FastAPI dependency injection and user session authentication in Checkpoint D.
