# WiseCub CDEMF Synthetic Dataset Generation Methodology

**Project:** WiseCub — J26-IT-418  
**Module:** Gamified Financial Learning System (CDEMF)  
**Deliverable:** Phase 3 — Checkpoint A2 Synthetic Dataset Generation  
**Dataset Artifacts:**  
- `data/cdemf_synthetic_gameplay_2500.csv` (2,500 records, 32 columns)  
- `data/cdemf_synthetic_gameplay_2500.jsonl` (2,500 JSON lines)  
- `dataset_validation_report.json` (Automated verification output)  
- `data_dictionary.md` (Variable definitions & leakage constraints)  

---

## 1. Executive Summary & Research Motivation

In the Competency-Driven Emotional Mission Framework (CDEMF), adolescent learners (aged 12–16) navigate real-world financial decision scenarios embedded in narrative story arcs. Rather than treating financial education as static, memorization-heavy quizzes, CDEMF operationalizes financial literacy as active, multi-attribute decision-making under resource constraints and emotional consequences.

To train adaptive pedagogical machine learning models (Phase 3) prior to extensive school classroom deployments, a high-fidelity synthetic gameplay dataset was generated. The dataset mirrors the exact structural mechanics, financial constraints, and evaluation pipelines of all three completed WiseCub missions:
1. **Rescue the Injured Puppy** (8 levels — Budgeting & Prioritization)
2. **Squirrel's Winter Savings** (6 levels — Saving, Storage & Compound Returns)
3. **Panda's School Fair** (6 levels — Smart Spending, Pricing & Profit Margins)

The generation methodology strictly adheres to psychometric principles from Item Response Theory (IRT) and Bayesian Knowledge Tracing (BKT), producing 2,500 validated gameplay records across 300 simulated student profiles with reproducible seed control (`seed=42`).

---

## 2. PISA 2022 Financial Literacy Framework Alignment

WiseCub draws its theoretical foundations from the **OECD PISA 2022 Financial Literacy Assessment Framework**. PISA defines financial literacy across three interrelated dimensions:
1. **Content**: Money and transactions; planning and managing finances; risk and reward; financial landscape.
2. **Processes**: Identify financial information; analyze information in a financial context; evaluate financial issues; apply financial knowledge and understanding.
3. **Contexts**: Education and work; home and family; individual; societal.

### Methodological Separation & Empirical Status
As established in Checkpoint A1, **OECD PISA 2022 data is used exclusively as external research evidence to ground the behavioral competencies and question constructs**. WiseCub does NOT merge raw PISA assessment survey rows into the gameplay dataset because:
- PISA measures cross-sectional paper/computer questionnaire responses without sequential narrative agency.
- WiseCub measures dynamic, sequential resource allocation within an emotional feedback loop.
- Cross-contamination between international survey items and game telemetry would compromise construct validity.

**Clarification on Archetype Parameterization:**
While the competency constructs (spending discipline, emergency reserve allocation, needs vs. wants prioritization) are conceptually grounded in the PISA 2022 Financial Literacy Framework, the specific numerical parameters governing the simulated student archetypes (such as initial proficiency means $\mu$, cognitive variances $\sigma^2$, learning gains $\Delta\theta$, and temptation biases) **are research-informed simulation assumptions** rather than empirically calibrated values directly fitted from OECD microdata. They represent plausible adolescent learning trajectories designed to stress-test the machine learning adaptation pipeline across diverse behavioral profiles prior to field deployment.

Instead, the synthetic learner behavioral rules and financial decision choices in WiseCub are mapped qualitatively to PISA competency tiers:
- *Level 1–2 (Low proficiency)*: Struggle with multi-category trade-offs, display high impulse spending, deplete emergency buffers.
- *Level 3 (Baseline proficiency)*: Allocate sufficient funds to primary goals but neglect safety reserves or long-term storage.
- *Level 4–5 (Advanced proficiency)*: Balance current needs against future uncertainty, compare unit costs, and preserve liquidity.

---

## 3. Synthetic Learner Archetypes & Psychometric Profiles

To avoid unrealistic homogeneous student cohorts, 300 unique synthetic learners were instantiated across four psychometrically distinct archetypes:

| Archetype | Count | Initial Ability $\theta_0 \sim \mathcal{N}(\mu, \sigma^2)$ | Impulsivity Index | Learning Gain $\Delta\theta$ per Attempt | Behavioral Characterization |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **STRUGGLING_LEARNER** | 75 | $\mu = -1.2, \sigma = 0.35$ | $0.65$ | $0.08$ | Frequent budget overruns, low emergency allocations, repeated retries on intermediate levels. |
| **IMPULSIVE_SPENDER** | 75 | $\mu = -0.3, \sigma = 0.40$ | $0.80$ | $0.14$ | Prone to selecting tempting/high-cost luxury options; improves significantly after seeing targeted remediation. |
| **CAUTIOUS_IMPROVER** | 90 | $\mu = +0.2, \sigma = 0.30$ | $0.25$ | $0.22$ | Highly risk-averse, occasionally under-invests in growth items, steady progression with high retention. |
| **ADVANCED_ACHIEVER** | 60 | $\mu = +1.5, \sigma = 0.30$ | $0.10$ | $0.15$ | High first-attempt pass rates, optimizes trade-offs, consistently maintains emergency reserves. |

### Dynamic Latent State Trajectory
Learner proficiency is dynamic. At each sequential attempt $t$, the student's latent proficiency evolves:
$$\theta_{t+1} = \theta_t + \Delta\theta \cdot (1 - \text{pass}_t \cdot 0.3) + \eta_t$$
where $\eta_t \sim \mathcal{N}(0, 0.05)$ represents stochastic cognitive drift, and experiencing remediation triggers an additional proficiency boost $\Delta\theta_{\text{rem}} = 0.18$ for receptive archetypes.

Decision choice probabilities follow a 2-parameter logistic (2PL) IRT formulation parameterized by the catalog level difficulty $b_j$ and discrimination $a_j$:
$$P(\text{Optimal Decision} \mid \theta_i) = \frac{1}{1 + \exp(-a_j(\theta_i - b_j))}$$

---

## 4. CDEMF Game Simulation Engine Integration

Rather than approximating gameplay outcomes using random numbers, the synthetic data generator directly executes the authentic production CDEMF pipeline:

1. **Mission Cohorts**: To ensure balanced telemetry across all 20 levels in the curriculum, students were assigned to initial mission cohorts:
   - Cohort 1 (Puppy Rescue): 105 students
   - Cohort 2 (Squirrel Savings): 98 students
   - Cohort 3 (Panda Fair): 97 students
2. **Decision Generation**: For each level, student parameters dictate their choice from actual level options defined in `catalog.py` (e.g., vet care options, winter food caches, vendor wholesale tiers, multi-period budgets).
3. **Execution via `run_cdemf_pipeline`**: The decision payload is fed into `backend/app/modules/gamified_learning/engine.py`. This executes:
   - Financial constraints and solvency checks (`gate_passed`).
   - Rubric-based competency scoring across 3 core dimensions (`overall_competency_score`).
   - Character emotional state transitions (`emotional_state_before` $\to$ `emotional_state_after`).
   - Adaptive remediation triggering (`remediation_triggered`, `remediation_rule_id`).
4. **Progression and Retries**: If a student fails a level, they retry with an updated emotional state (e.g., `anxious` or `sad`) and increased information from remediation, up to a maximum retry cap before assisted progression.

---

## 5. Target Label Formulation & Leakage Prevention

The classification objective for Phase 3 ML models is **Forward-Looking Instructional Support Prediction**:
$$\hat{Y} \in \{\text{NEEDS\_FOUNDATION\_SUPPORT}, \text{READY\_FOR\_STANDARD}, \text{READY\_FOR\_ADVANCED}\}$$

### Avoiding Simplistic Score Thresholding
A common flaw in synthetic educational datasets is defining target labels merely by thresholding the current attempt's score (e.g., `score < 75 -> SUPPORT`). This creates an artificial, trivial correlation that fails to evaluate true forward learning needs.

In WiseCub Checkpoint A2, the target label is derived from a **Forward-Looking Multi-Factor Trajectory**:
1. **Subsequent Attempt Performance**: Observes the student's actual performance on their *subsequent* attempt ($t+1$).
2. **Latent Proficiency State ($\theta_t$)**: Incorporates whether the student's underlying ability indicates mastery or lingering misconceptions.
3. **Remediation & Retry History**: Accounts for whether current success required multiple retries or was achieved effortlessly on attempt 1.

$$\text{Target} = \begin{cases} 
\text{NEEDS\_FOUNDATION\_SUPPORT} & \text{if } (\text{next\_pass} = \text{False}) \lor (\theta_t < -0.3) \lor (\text{retries} \ge 2 \land \text{score}_t < 80) \\
\text{READY\_FOR\_ADVANCED} & \text{if } (\text{next\_pass} = \text{True} \land \theta_t > 0.6 \land \text{score}_t \ge 85 \land \text{retries} = 0) \\
\text{READY\_FOR\_STANDARD} & \text{otherwise}
\end{cases}$$

### Strict Temporal Separation (No Data Leakage)
To guarantee valid machine learning models in Checkpoint B:
- `subsequent_attempt_score` is strictly excluded from feature inputs.
- `latent_theta_proficiency` and `learner_archetype` are excluded from feature inputs.
- Student identities (`synthetic_student_id`) are preserved only for `GroupKFold` splitting, preventing data leakage between training and validation splits.

---

## 6. Empirical Dataset Statistics

The generated dataset (`cdemf_synthetic_gameplay_2500.csv`) exhibits balanced and realistic characteristics:

| Metric | Measured Value | Target / Requirement | Status |
| :--- | :--- | :--- | :--- |
| **Total Record Count** | **2,500** | Exactly 2,500 | PASS |
| **Unique Student Count** | **300** | Exactly 300 | PASS |
| **Mission Representation** | Puppy: 974 (39.0%), Panda: 808 (32.3%), Squirrel: 718 (28.7%) | All 3 missions represented | PASS |
| **Archetype Representation** | Struggling: 625 (25.0%), Impulsive: 624 (25.0%), Cautious: 748 (29.9%), Advanced: 503 (20.1%) | 4 archetypes balanced | PASS |
| **Target Label Distribution** | Support: 845 (33.8%), Standard: 828 (33.1%), Advanced: 827 (33.1%) | Balanced 3-class distribution | PASS |
| **Overall Attempt Pass Rate** | 80.3% | Realistic gamified progression (~75–85%) | PASS |
| **Missing / Null Values** | 0 in non-nullable columns | Zero nulls | PASS |
| **Deterministic Seed** | 42 | 100% reproducible | PASS |

---

## 7. Research Validity & Limitations

1. **Synthetic Nature**: The dataset reflects simulated adolescent decision behavior guided by CDEMF rules and psychometric assumptions. It serves as a prior for pre-training and pipeline testing before human classroom trials.
2. **Transfer to Real Telemetry**: In Phase 4/5, transfer learning or Bayesian updating will be utilized to calibrate the model weights as empirical classroom data is gathered in schools.
3. **Ethical Use**: Predictions generated by models trained on this dataset must be used solely to provide encouraging, formative scaffolding and never for punitive, gatekeeping, or tracking purposes.
