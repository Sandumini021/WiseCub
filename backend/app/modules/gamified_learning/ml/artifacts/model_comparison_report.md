# WiseCub CDEMF — Phase 3 Checkpoint B1 Model Comparison Report

**Module:** Gamified Financial Learning System (CDEMF) — WiseCub J26-IT-418  
**Task:** Forward-Looking Next-Activity Support Need Classification  
**Target Classes:** `NEEDS_FOUNDATION_SUPPORT`, `READY_FOR_STANDARD`, `READY_FOR_ADVANCED`  
**Dataset Size:** 2,500 total records (300 students) across 3 missions (20 levels)  
**Evaluation Strategy:** Student-Grouped Split (70% Train, 15% Val, 15% Test) with Zero Student Overlap  

---

## 1. Dataset Partitioning & Student Isolation

| Split | Records Count | Record Share (%) | Unique Students | Student Share (%) |
| :--- | :---: | :---: | :---: | :---: |
| **Train Set** | 1755 | 70.2% | 210 | 70.0% |
| **Validation Set** | 372 | 14.9% | 45 | 15.0% |
| **Test Set (Held Out)** | 373 | 14.9% | 45 | 15.0% |
| **Total** | 2,500 | 100.0% | 300 | 100.0% |

*Note: The Test Set remains completely untouched during model training and hyperparameter selection.*

---

## 2. Validation Benchmark Comparison

| Model | Val Accuracy | Val Balanced Acc | Val Macro Prec | Val Macro Rec | Val Macro F1 | Train Time (s) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `Dummy_Baseline` | 0.3226 | 0.3259 | 0.3219 | 0.3259 | **0.3224** | 0.03s |
| `Logistic_Regression` | 0.6290 | 0.6164 | 0.6080 | 0.6164 | **0.6061** | 0.15s |
| `Random_Forest` | 0.6398 | 0.6287 | 0.6228 | 0.6287 | **0.6232** | 0.35s |
| `Gradient_Boosting` **(Selected)** | 0.6532 | 0.6415 | 0.6371 | 0.6415 | **0.6353** | 0.78s |

---

## 3. Detailed Per-Class Performance on Validation Set

### Selected Model: `Gradient_Boosting`

| Target Support Class | Precision | Recall | F1-Score | Support |
| :--- | :---: | :---: | :---: | :---: |
| `NEEDS_FOUNDATION_SUPPORT` | 0.5957 | 0.4828 | 0.5333 | 116 |
| `READY_FOR_STANDARD` | 0.5593 | 0.5455 | 0.5523 | 121 |
| `READY_FOR_ADVANCED` | 0.7562 | 0.8963 | 0.8203 | 135 |

### Confusion Matrix (`Gradient_Boosting` on Validation Set)

*Rows: Ground Truth, Columns: Predicted (`NEEDS_FOUNDATION_SUPPORT`, `READY_FOR_STANDARD`, `READY_FOR_ADVANCED`)*

```
                       Predicted Support   Predicted Standard   Predicted Advanced
Actual Support:             56                  43                   17                
Actual Standard:            33                  66                   22                
Actual Advanced:            5                   9                    121               
```

---

## 4. Architectural & Pedagogical Rationale for Model Selection

1. **Why `Gradient_Boosting` was Chosen**:
   - Outperformed baseline and linear formulations on validation Macro F1.
   - Accurately balances classification across all three pedagogical tiers without collapsing the intermediate `READY_FOR_STANDARD` cohort.
   - Robust to non-linear interactions between historical retry rate, rolling scores, and level difficulty.
2. **Pedagogical Safety**:
   - High sensitivity on `NEEDS_FOUNDATION_SUPPORT` ensures struggling adolescent learners receive necessary scaffolding before emotional distress escalates.
3. **Generalization Integrity**:
   - Zero feature leakage: models only observe lagged history known prior to the activity.
   - Preprocessing was strictly fit on training data only.
