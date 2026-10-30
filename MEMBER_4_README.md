# WiseCub (J26-IT-418) — Member 4 Individual Project Documentation

# AI-Powered Scam Simulation and Digital Safety Module (Scam Safety & Awareness)

**University:** Final-Year Undergraduate Research Project  
**Project Identifier:** J26-IT-418 — WiseCub  
**Component Author:** Member 4 — Scam Safety & Awareness  
**Assigned Feature Branch:** `feature/scam-awareness`  
**Target Demographic:** Children and Young Adolescents Aged 12–16  
**Primary Documentation File:** `MEMBER_4_README.md` (Repository Root)  

---

## Table of Contents

1. [Project and Individual Contribution Overview](#1-project-and-individual-contribution-overview)
   - [1.3 Key Individual Contribution and Novel Feature: Guardian-Approved Real Email Scam Simulation](#13-key-individual-contribution-and-novel-feature-guardian-approved-real-email-scam-simulation)
2. [Scam Safety Module — Frontend Implementation](#2-scam-safety-module--frontend-implementation)
3. [Scam Safety Module — Backend Implementation](#3-scam-safety-module--backend-implementation)
4. [Machine Learning Research & Experimentation](#4-machine-learning-research--experimentation)
5. [Final ML Benchmark Experiment (v3 Final)](#5-final-ml-benchmark-experiment-v3-final)
6. [Verified Technologies and Tooling](#6-verified-technologies-and-tooling)
7. [Testing, Validation, and Verification](#7-testing-validation-and-verification)
8. [Individual Contribution Summary](#8-individual-contribution-summary)
9. [Honest Limitations and Future Research Directions](#9-honest-limitations-and-future-research-directions)
10. [Conclusion](#10-conclusion)

---

## 1. Project and Individual Contribution Overview

### 1.1 The WiseCub System
**WiseCub** is an AI-powered financial literacy and digital safety education platform designed specifically for children and young teenagers aged 12–16. In modern digital ecosystems, young people face increasing exposure to online financial interactions (e.g., virtual gaming economies, peer-to-peer microtransactions, mobile payments, and digital banking). Concurrently, predatory threat actors target this demographic with sophisticated social engineering schemes, including credential harvesting, fake giveaways, and deceptive investment proposals.

The overarching WiseCub system is structured into four distinct student member components:
- **Member 1 (Stock Market):** Virtual stock market trading simulator and portfolio coaching.
- **Member 2 (Decision-Making):** Scenario-based decision trees and economic choices.
- **Member 3 (Gamified Learning):** Mission boards, quest tracking, and learning rewards.
- **Member 4 (Scam Safety & Awareness):** AI-powered digital deception simulation, interactive threat education ("Scam Alley"), and offline natural-language scam classification research.

### 1.2 Member 4 Individual Component Scope
As **Member 4**, the individual contribution spans two complementary, rigorous areas of software engineering and computer science research:

1. **Full-Stack Educational Simulation Application:** An interactive, safe educational environment ("Scam Alley") featuring six progressive scam threat categories, an interactive simulated email inbox, dynamic red-flag debriefing, parental/guardian consent lifecycle management, and verified progress tracking.
2. **Academic Machine Learning Research Experiment:** An isolated, statistically defensible machine learning pipeline developed across three iterations (v1, v2, and v3) that evaluates text classification algorithms for discriminating between deceptive/scam messages and benign youth communications.

> [!IMPORTANT]
> **Academic Boundary Notice:**  
> The machine learning classification pipeline is an **offline research experiment** evaluated on benchmark corpora to establish scientific baselines for scam detection. It is **not deployed as an unmonitored production firewall** in the live web application. The full-stack educational simulation and the offline ML research constitute two distinct, verified pillars of Member 4's individual academic contribution.

### 1.3 Key Individual Contribution and Novel Feature: Guardian-Approved Real Email Scam Simulation

The defining innovation and primary individual contribution of Member 4 to the WiseCub project is the **Guardian-Approved Real Email Scam Simulation System**. 

While conventional cybersecurity curricula instruct children through passive slides, static articles, or multiple-choice quizzes in controlled classroom settings, WiseCub directly tackles the psychological vulnerability of young adolescents by providing **controlled, realistic experiential learning directly within their actual email client** under strict parental consent and supervision.

```
+---------------------------------------------------------------------------------------------------------+
|                    GUARDIAN-APPROVED REAL EMAIL SCAM SIMULATION WORKFLOW                                |
+---------------------------------------------------------------------------------------------------------+
|  1. GUARDIAN REGISTRATION & IDENTITY VERIFICATION                                                       |
|     Parent registers contact info -> Receives 6-digit OTP code -> Validates email ownership.            |
|                                                                                                         |
|  2. EXPLICIT CONSENT GATEWAY (Strict Child Protection Boundary)                                         |
|     Guardian explicitly activates simulation privilege; simulations remain disabled by default.         |
|                                                                                                         |
|  3. CURRICULUM MASTERY TRIGGER (Score >= 80%)                                                            |
|     Child passes an educational module -> Triggers corresponding educational simulation (Levels 1 to 6). |
|                                                                                                         |
|  4. CONTROLLED EXTERNAL EMAIL DISPATCH (via SMTP)                                                       |
|     email_service.py renders realistic scenario -> Dispatches via smtplib with educational headers.     |
|                                                                                                         |
|  5. REAL INBOX ENGAGEMENT & TELEMETRY TRACKING                                                          |
|     Child inspects email -> System tracks: open, click simulation link, or report suspicious.           |
|                                                                                                         |
|  6. INSTANT FORMATIVE DEBRIEFING & UNDERSTANDING CHECK                                                  |
|     Safe redirection to WiseCub debrief portal -> Explains red flags -> Tests follow-up retention.       |
+---------------------------------------------------------------------------------------------------------+
```

#### Why This Feature is Novel and Pedagogically Valuable
1. **Bridging the Transfer-of-Learning Gap (Ecological Validity):**  
   Young teenagers frequently recognize red flags on multiple-choice quizzes, but fail to apply those principles when confronted with authentic, panic-inducing messages (such as cloud storage suspension threats or parcel release fees) in their real inboxes. By placing controlled educational simulations in their real-world messaging context, WiseCub trains instinctual skepticism.
2. **Zero-Risk Experiential Safety:**  
   Mistakes made during an email simulation carry zero real-world cost: no malware is downloaded, no credentials are stolen, and no money is transferred. When an unsafe link is clicked, it immediately resolves to an empowering, formative educational debrief rather than financial exploitation.
3. **Parental Partnership in Digital Safety:**  
   Rather than bypassing parents, the system requires verified parental consent and feeds simulation analytics back to the Guardian Dashboard (`/guardian/dashboard`), fostering active family dialogue on cyber safety.

#### End-to-End Technical Verification of the Simulation Architecture
The feature is fully implemented and grounded across verified backend and frontend components:

* **Parent/Guardian Consent Verification (`router.py`):**
  * `PUT /api/safety/guardian/{child_id}` (`save_guardian_details`): Saves parent name, relationship, and target email; automatically generates a 6-digit verification code.
  * `POST /api/safety/guardian/{child_id}/verify` (`verify_guardian_code`): Validates the code to confirm email inbox ownership. A simulated test flag (`is_dev_test=true`) is supported for offline examiner evaluation.
  * `POST /api/safety/guardian/{child_id}/consent` (`update_consent`): Toggles affirmative parental consent (`consent_confirmed: true`, `simulation_enabled: true`). Without active consent, simulation triggers are strictly rejected with HTTP status checks.
* **Mastery Gating & Triggering (`router.py`):**
  * `POST /api/safety/simulation/trigger/{child_id}` (`trigger_simulation`): Enforces that the child achieved a score $\ge 80\%$ on the corresponding category quiz before a simulation email is dispatched.
  * Server-side idempotency prevents duplicate email blasts for the same quiz attempt (`attempt_id`).
* **Controlled External Email Dispatch (`email_service.py`):**
  * Uses Python's standard library (`smtplib`, `email.mime`) with zero external API dependencies.
  * Supports direct SSL (port 465) and STARTTLS (port 587/25) configured via `.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`).
  * **Default-Safe Resilience:** When SMTP credentials are not configured in `.env`, the engine safely marks the attempt as `status="not_configured"` with explicit diagnostic details in MongoDB. It **never crashes** and **never fakes delivery**.
* **Six Realistic Pedagogical Scenarios (`LEVEL_TEMPLATES`):**
  * **Level 1 (Phishing):** *Student Cloud Storage Quota Exceeded (Suspension Threat)*
  * **Level 2 (SMS/Smishing):** *QuickDrop Courier Parcel Release Fee ($1.85)*
  * **Level 3 (QR Quishing):** *Campus Canteen Discount Voucher QR Notice*
  * **Level 4 (Prize Fraud):** *Apex Gaming Gear Lucky Draw Winner Alert*
  * **Level 5 (Impersonation):** *School IT Operations Urgent Password Expiration Notice*
  * **Level 6 (Deceptive Finance):** *CryptoYield Pro Student Guaranteed Daily Yield Opportunity*
* **Granular Action & Telemetry Tracking:**
  The system tracks and persists the following user events in the `safety_simulations` MongoDB collection:
  * `inbox_opened`: Logged when the simulated message is viewed in the webmail interface ([SimulatedInboxPage.tsx](file:///Users/tharushinethra/Desktop/WiseCub/WiseCub/frontend/src/modules/scam-safety/pages/SimulatedInboxPage.tsx)).
  * `link_clicked`: Logged when the student clicks the call-to-action link in the real email or simulated inbox, recording outcome `"unsafe_link_clicked"`.
  * `reported_suspicious`: Logged when the student clicks "Report Suspicious" without clicking the simulated link, recording outcome `"safely_reported"`.
  * `marked_safe`: Logged when the student classifies the message as safe without clicking the link.
  * `debrief_viewed`: Logged when the student reaches the debriefing view ([SimulationFeedbackPage.tsx](file:///Users/tharushinethra/Desktop/WiseCub/WiseCub/frontend/src/modules/scam-safety/pages/SimulationFeedbackPage.tsx)).
  * `follow_up_completed` & `follow_up_correct`: Evaluates and records the student's answer to the post-simulation comprehension check.
* **Automated Security Bot Filtering (`is_scanner_request`):**
  Incoming HTTP requests to simulation links are screened for enterprise mail security scanner user-agents (e.g., `Barracuda`, `GoogleImageProxy`, `Proofpoint`) to ensure automated antivirus crawlers do not falsely register student link clicks.

---

## 2. Scam Safety Module — Frontend Implementation

The frontend of the Scam Safety component is contained entirely within the directory:  
`frontend/src/modules/scam-safety/`  
Integrated routing is registered in `frontend/src/routes/AppRoutes.tsx` under the paths `/safety`, `/safety/inbox`, and `/safety/simulation-feedback`.

```
frontend/src/modules/scam-safety/
├── pages/
│   ├── ScamHomePage.tsx               # Main curriculum hub, category cards, drills, and modal dialogs
│   ├── SimulatedInboxPage.tsx         # Realistic virtual mail client for inspecting threats
│   └── SimulationFeedbackPage.tsx     # Debriefing portal with red-flag breakdowns and follow-up checks
├── services/
│   ├── scamProgress.ts                # Level unlocking, 80% passing logic, and remote state sync
│   ├── researchSession.ts             # Anonymous session UUID tracking for telemetry
│   └── researchLog.ts                 # Interaction event recording for educational analysis
└── data/
    ├── smsScenarios.ts                # Level 2 (SMS) and core scenario schemas
    ├── qrScenarios.ts                 # Level 3 (Quishing) scenarios and warning concepts
    ├── prizeScenarios.ts              # Level 4 (Prize & Lottery) scenarios
    ├── impersonationScenarios.ts      # Level 5 (Impersonation & Social Engineering) scenarios
    └── financialScenarios.ts          # Level 6 (Deceptive Financial Offers) scenarios
```

### 2.1 The Six Curriculum Categories
The curriculum follows a strictly enforced sequential progression (`CATEGORY_ORDER`):

| Level | Identifier | Threat Vector & Focus Area | Real-World Context for Youth | Implementation Status |
|:---:|:---|:---|:---|:---:|
| **1** | `phishing` | Phishing Basics | Fake account security alerts, urgent password reset links, spoofed school portals. | **Fully Implemented** (7 sections, 8 scenarios) |
| **2** | `sms` | SMS Scams (Smishing) | Fake package delivery SMS, bank OTP verification traps, urgent SMS subscription alerts. | **Fully Implemented** (7 sections, 8 scenarios) |
| **3** | `qr` | Fake QR-Code Offers (Quishing) | Malicious QR codes on public posters, gaming reward stickers, redirected payment codes. | **Fully Implemented** (7 sections, 8 scenarios) |
| **4** | `prize` | Prize & Giveaway Fraud | "You won an iPhone", fake Discord Nitro gifts, Roblox Robux / Fortnite V-Bucks generators. | **Fully Implemented** (7 sections, 8 scenarios) |
| **5** | `impersonation` | Authority & Impersonation Scams | Scammers posing as teachers, school IT staff, online friends, or social media moderators. | **Fully Implemented** (7 sections, 8 scenarios) |
| **6** | `financial` | Deceptive Financial Offers | "Double your money" crypto bots, Ponzi investment schemes, guaranteed daily yield scams. | **Fully Implemented** (7 sections, 8 scenarios) |

> [!NOTE]
> **Resolution of "Route Stub" Note in Shared Repository README:**  
> The root repository `WiseCub/README.md` contains an early increment note stating *"Route stubs for Choices, Missions, and Scam Safety"*. This historical line described the initial skeleton before individual component development commenced. Within Member 4's component branch, all six curriculum levels are **100% fully implemented** with complete pedagogical lesson sections (42 total sections) and interactive scenarios (48 total scenarios) in `frontend/src/modules/scam-safety/data/`. None of the six categories are placeholders or stubs.
>
> **Future Increments (Planned, Not Yet Integrated):**
> 1. Multi-lingual voiceover narration for younger students (Sinhala and Tamil translations).
> 2. Live adaptive difficulty sequencing driven by dynamic offline ML model inferences within the client.

### 2.2 Pedagogical Progression & Unlocking Mechanics
* **80% Mastery Threshold:** A student must score $\ge 80\%$ on a category quiz (`PASSING_PERCENTAGE = 80`) to achieve mastery and unlock the subsequent level. Scores $\le 79\%$ keep downstream categories locked.
* **Persistent Progress Architecture (`scamProgress.ts`):** Student progress is maintained in `localStorage` under `wisecub_scam_scores_v1` and synchronized bidirectionally with the backend MongoDB database via the `module_state` collection (`saveModuleState` / `loadModuleState`).
* **Session and Progress Isolation:** Progress from guest sessions does not leak into newly registered accounts; distinct student accounts maintain separate state partitions.

### 2.3 Interactive Simulated Inbox & Real-Time Feedback
* **Virtual Inbox (`SimulatedInboxPage.tsx`):** Renders a simulated webmail interface displaying educational phishing emails. The student can inspect sender domains, subject lines, and body text.
* **Decision Tracking:** The student can choose to **Report as Suspicious** or **Click Link / Interact**. Link clicks do not expose the student to external sites; instead, the system records a `clicked_link` event and safely routes the student to the debriefing view.
* **Formative Feedback (`SimulationFeedbackPage.tsx`):** Highlights every technical warning sign (e.g., mismatched sender domains, false urgency, generic greetings) and administers a follow-up reflection question to solidify understanding.

---

## 3. Scam Safety Module — Backend Implementation

The backend service layer is contained within:  
`backend/app/modules/safety/`  
The FastAPI router is registered at the `/api/safety` prefix in `backend/app/main.py`.

```
backend/app/modules/safety/
├── router.py                          # FastAPI APIRouter declaring all /api/safety routes
├── email_service.py                   # Educational email simulation templates and delivery
├── seed.py                            # Idempotent database seeder for demo fixtures and indexes
├── data/
│   └── synthetic_demo_data.json       # 100% synthetic baseline demo data
└── tests/
    └── test_safety_guardian.py        # Automated test suite (14 unit & integration tests)
```

### 3.1 Verified REST API Endpoints

Every API endpoint implemented in `backend/app/modules/safety/router.py` was inspected and verified:

| HTTP Method | Endpoint Path | Router Handler Function | Functionality & Safeguards |
|:---|:---|:---|:---|
| `GET` | `/api/safety/guardian/{child_id}` | `get_guardian_details()` | Retrieves registered parent/guardian contact details, email verification status, and consent flags. |
| `PUT` | `/api/safety/guardian/{child_id}` | `save_guardian_details()` | Upserts guardian contact details and triggers a 6-digit email verification token. |
| `POST` | `/api/safety/guardian/{child_id}/verify` | `verify_guardian_code()` | Validates the guardian verification OTP code to confirm parent inbox ownership. |
| `POST` | `/api/safety/guardian/{child_id}/consent` | `update_consent()` | Updates explicit guardian consent (`consent_given: bool`) required before simulations can trigger. |
| `POST` | `/api/safety/simulation/trigger/{child_id}` | `trigger_simulation()` | Triggers an educational simulation email for a specific level; enforces consent check and prevents duplicate active attempts. |
| `POST` | `/api/safety/simulation/trigger-passed/{child_id}/{category_id}` | `trigger_passed_level_simulation()` | Bulk-triggers simulations for modules completed prior to parent verification. |
| `GET` | `/api/safety/simulation/status/{child_id}` | `get_simulation_status()` | Returns real-time simulation attempt states across all six categories for a child. |
| `GET` | `/api/safety/simulation/inbox/{child_id}` | `get_simulated_inbox()` | Supplies the simulated email inbox items for the frontend client. |
| `POST` | `/api/safety/simulation/event/{simulation_id}` | `record_simulation_event()` | Records student actions (`inbox_opened`, `clicked_link`, `reported`, `entered_credentials`). |
| `POST` | `/api/safety/simulation/follow-up/{simulation_id}` | `submit_follow_up()` | Receives student answers to follow-up reflection questions and grades understanding. |
| `GET` | `/api/safety/simulation/feedback/{simulation_id}` | `get_simulation_feedback()` | Returns comprehensive simulation debriefing data, learning goals, and red-flag explanations. |
| `GET` | `/api/safety/simulation/metrics/{child_id}` | `get_safety_learning_metrics()` | Computes aggregated learning metrics (total simulations, detection rate, report rate, fall rate). |

### 3.2 Child Digital Safety Safeguards
* **Guardian Consent Requirement:** Simulated educational emails cannot be dispatched to a child's external address without verified parental consent in `guardian_consent`.
* **Safe Educational Banners:** All simulated emails generated via `email_service.py` contain mandatory headers (`X-WiseCub-Simulation: True`) and prominent disclaimer banners stating: *"This is a safe educational exercise from WiseCub. No real account was accessed."*
* **Scanner Bot Filtering:** The endpoint `POST /api/safety/simulation/event/{simulation_id}` detects automated antivirus and mail-scanner user agents (e.g., `Barracuda`, `GoogleImageProxy`) to prevent false-positive link clicks from inflating student error rates.
* **Cross-Student Authorization:** Multi-tenant checks ensure students cannot inspect or modify another learner's simulation history.

### 3.3 Database Collections & Idempotent Seeding
The backend integrates with MongoDB (`wisecub` database) across four core collections:

1. `children`: Stores child profile references and demo user accounts.
2. `guardian_consent`: Stores guardian contact info, verification tokens, and consent flags (`child_id` unique index).
3. `safety_simulations`: Stores simulation logs, attempt numbers, trigger timestamps, and student actions (`simulation_id` unique; compound unique index on `(child_id, category_id, attempt_id)`).
4. `module_state`: Stores cross-module progress state (`(child_id, module)` compound unique index).

**Reproducible Seeding:**  
The seeder script `backend/app/modules/safety/seed.py` loads synthetic fixtures from `data/synthetic_demo_data.json` and performs non-destructive `$set` operations with `upsert=True`. It can be run repeatedly without duplicating records:

```bash
cd WiseCub/backend
python -m app.modules.safety.seed
```

---

## 4. Machine Learning Research & Experimentation

### 4.1 Research Objective
The machine learning component addresses the research question:  
*Can lightweight, interpretable natural language processing models accurately detect youth-targeted digital deception without relying on deep neural networks or external cloud APIs?*

To document the research trajectory rigorously, experiments were structured into three transparent iterations: **v1**, **v2**, and **v3**.

### 4.2 Comprehensive Cross-Iteration Comparison

| Methodological Dimension | v1 Experiment (`scam-awareness-ml/`) | v2 Corrected (`v2_corrected/`) | v3 Final Audited (`v3_final/`) |
|:---|:---|:---|:---|
| **Directory Path** | `research/scam-awareness-ml/` | `research/scam-awareness-ml/v2_corrected/` | `research/scam-awareness-ml/v3_final/` |
| **Total Dataset Size** | 2,500 samples | 2,500 samples | **2,500 samples** |
| **Class Distribution** | 1,250 scam / 1,250 legitimate | 1,250 scam / 1,250 legitimate | **1,250 scam / 1,250 legitimate** |
| **Synthetic Provenance** | 1,900 samples (WiseCub Corpus v1) | 1,900 samples (WiseCub Corpus v2) | **1,900 samples (WiseCub Corpus v3)** |
| **Public Provenance** | 600 samples (UCI SMS Spam) | 600 samples (UCI SMS Spam) | **600 samples (UCI SMS Spam)** |
| **Synthetic Shortcut Leakage** | ⚠️ **Severe:** Embedded label tokens (`#PH-`, `#LEG-`, `#QR-`) | Eliminated (natural text only) | **Audited & Verified:** 0 shortcut tokens |
| **Public Benchmark Sampling** | Sequential top-to-bottom slice | Sequential top-to-bottom slice | **5-quintile length-stratified sampling** |
| **Campaign Grouping Strategy** | Sequential 10-row blocks | Agglomerative clustering (`min_df=1`) | **Classifier feature space ($\cos \ge 0.40$ + regex)** |
| **Cross-Split Similarity Audit** | Not conducted | Max Train-Test cosine = 0.7412 (3 pairs $> 0.70$) | **Max Train-Test cosine = 0.7078** (1 boundary pair) |
| **Cross-Validation Protocol** | Standard 5-fold CV (leakage prone) | 5-fold Grouped CV | **5-fold GroupKFold on Train partition only** |
| **Model Selection Mechanism** | Post-hoc based on test accuracy | Predeclared validation selection | **Predeclared Safety Criterion ($\text{Recall} \ge 95\%$ + Macro-F1)** |
| **Statistical Uncertainty** | None reported | None reported | **Empirical 95% Bootstrap CIs (1,000 resamples)** |
| **Selected Best Model** | `TFIDF_Multinomial_NB` | `TFIDF_Logistic_Regression` | **`TFIDF_Linear_SVC`** |

### 4.3 Analysis of Experiment Trajectory

#### Phase I — v1 (The Illusion of Near-Perfect Accuracy: 98.38%)
In the initial baseline experiment, models achieved an impressive **98.38% test accuracy**. However, rigorous audit revealed that the synthetic dataset generator accidentally embedded curriculum identifiers into message bodies (e.g., *"[#PH-001] Urgent: your account is locked"* vs *"[#LEG-042] Hey, lunch at 12?"*). The classifier exploited these synthetic prefixes as trivial decision boundaries rather than learning actual linguistic markers of social engineering. Furthermore, public SMS messages were divided arbitrarily, allowing identical spam campaign texts to appear simultaneously in training and test splits.

#### Phase II — v2 (Leakage Remediation: 91.71% – 93.32%)
In v2, all synthetic shortcuts were eradicated, forcing models to learn from authentic lexical features. Performance dropped to an honest, realistic ~91%–93%. However, two methodological nuances were identified during peer review:
1. **Feature Space Discrepancy:** Campaign clustering was computed in an unconstrained TF-IDF space (`min_df=1`), whereas the downstream classifier used a restricted space (`max_features=5000, sublinear_tf=True`). Consequently, 3 spam campaign variants appeared distant in clustering but crossed the train-test split with $> 70\%$ cosine similarity.
2. **Public Data Vintage:** Public messages remained a sequential slice of early-2000s UK SMS promotions.

#### Phase III — v3 Final (Audited, Defensible Benchmark: 92.57%)
The v3 experiment resolved all previous methodological concerns. Campaign clustering was performed directly inside the downstream classifier's vector space, length-stratified sampling was applied to the public corpus, a predeclared educational safety criterion was utilized for model selection, and bootstrap confidence intervals were computed.

---

## 5. Final ML Benchmark Experiment (v3 Final)

The complete artifacts for the final research experiment are located in:  
`research/scam-awareness-ml/v3_final/`

```
research/scam-awareness-ml/v3_final/
├── README.md                          # Experiment overview and execution guide
├── data/
│   ├── scam_messages_dataset_v3.csv   # 2,500 balanced research records
│   ├── dataset_manifest_v3.csv        # Metadata manifest across 692 clusters
│   ├── data_dictionary.md             # 12-column schema and domain specifications
│   └── grouping_diagnostics_v3.json   # Algorithmic clustering diagnostic logs
├── models/
│   └── best_model_v3.joblib           # Persisted best model pipeline (TF-IDF + LinearSVC)
├── reports/
│   ├── dataset_quality_report.md      # 10-point automated integrity audit
│   ├── grouping_and_leakage_report.md # Similarity audit and campaign isolation proof
│   ├── model_evaluation_report.md     # Multi-model benchmarks and bootstrap CIs
│   ├── model_evaluation_metrics_v3.json # Machine-readable metrics ground truth
│   ├── error_analysis_report.md       # Token-level linear attribution of test errors
│   ├── limitations_and_ethics.md      # Ethical considerations and child safety boundaries
│   └── v1_v2_v3_comparison.md        # Comprehensive multi-version comparison
└── src/
    ├── generate_dataset_v3.py         # Length-stratified dataset generator
    ├── validate_dataset_v3.py         # 10-point automated validation script
    ├── train_and_evaluate_v3.py       # Grouped CV training and evaluation pipeline
    └── error_analysis_v3.py           # Dynamic error analyzer
```

### 5.1 Dataset Composition & Provenance
* **Total Instances:** 2,500 balanced rows (1,250 scam / 1,250 legitimate).
* **Synthetic Educational Data (76.0%, $n=1,900$):** 950 scam and 950 legitimate messages authored across 400 curriculum templates representing the 6 WiseCub threat vectors, strictly audited to ensure zero label shortcuts and zero duplicate texts.
* **Public Benchmark Data (24.0%, $n=600$):** 300 scam and 300 legitimate messages sampled from the **UCI SMS Spam Collection** (Almeida & Hidalgo, CC BY 4.0). Sampling was conducted using **5-quintile length-stratified sampling** with random seed `42` across the 5,076 unique SMS records.
* **Cluster Isolation:** The dataset is partitioned into **692 mutually exclusive template/campaign groups** (487 synthetic, 205 public) using connected-components clustering ($\cos \ge 0.40$ combined with telephone and shortcode regex extraction).

### 5.2 Zero-Leakage Grouped Splitting
To prevent near-duplicate messages or repeated spam campaigns from populating multiple partitions, splitting is performed strictly at the group level using `GroupShuffleSplit` (Seed `42`):

| Partition | Example Count ($n$) | Group Count ($k$) | Proportion | Class Balance |
|:---|:---:|:---:|:---:|:---|
| **Training Split** | 1,670 | 484 | 66.8% | 866 scam / 804 legitimate |
| **Validation Split** | 426 | 104 | 17.0% | 251 scam / 175 legitimate |
| **Held-Out Test Split** | 404 | 104 | 16.2% | 133 scam / 271 legitimate |

**Crucial Distinction: Zero Cross-Split Group Leakage vs. Cosine Heuristic:**
1. **Zero Shared Groups (100% Group Isolation):**
   * Overlap between Train and Validation: **0 groups (0%)**
   * Overlap between Train and Test: **0 groups (0%)**
   * Overlap between Validation and Test: **0 groups (0%)**
   Every single one of the 692 template and campaign families is strictly assigned to one and only one split partition. No campaign group crosses any partition boundary.
2. **Transparent Audit of the Single Boundary Pair ($\ge 0.70$ Cosine Similarity):**
   Across all 674,680 pairwise comparisons between training and test records, exactly one pair of messages reached a cosine similarity $\ge 0.70$ (specifically **0.7078**):
   * *Test Example (`EX3-0285`, Group `GRP-V3-UCI-SPAM-CAMP-065`):*  
     `"No. 1 Nokia Tone 4 ur mob every week! Just txt NOK to 87021. 1st Tone FREE ! so get txtin now and tell ur friends. 150p/tone. 16 reply HL 4info"`
   * *Train Example (`EX3-1126`, Group `GRP-V3-UCI-SPAM-CAMP-165`):*  
     `"FREE for 1st week! No1 Nokia tone 4 ur mob every week just txt NOKIA to 8007 Get txting and tell ur mates www.getzed.co.uk POBox 36504 W45WQ norm150p/tone 16+"`
   * *Analysis:* These two messages were verified to belong to **two completely separate commercial ringtone promotions** from different companies, operating on different SMS shortcodes (`87021` vs `8007`). Because they discussed the same historical product ("Nokia ringtones") using common commercial jargon ("free", "week", "tone"), their mathematical token cosine similarity was elevated. This transparent finding illustrates that while cosine similarity is a useful mathematical heuristic, it cannot eliminate all semantic topical overlap across independent commercial campaigns. Group isolation remained mathematically complete.

### 5.3 Candidate Models & Evaluation Results

All candidate pipelines use identical text feature extraction:  
`TfidfVectorizer(ngram_range=(1, 2), max_features=5000, sublinear_tf=True)`

#### 5-Fold Grouped Cross-Validation (Training Partition Only, $n=1,670$):
* **Majority Baseline:** Mean Macro-F1 = $0.3414 \pm 0.0056$
* **TF-IDF + Logistic Regression:** Mean Macro-F1 = $0.9341 \pm 0.0284$
* **TF-IDF + Multinomial Naive Bayes:** Mean Macro-F1 = $0.9292 \pm 0.0301$
* **TF-IDF + LinearSVC:** Mean Macro-F1 = **$0.9359 \pm 0.0327$**

#### Held-Out Test Set Evaluation ($n=404$, Source Truth from `model_evaluation_metrics_v3.json`):

| Model Candidate | Test Accuracy | Macro-F1 | Scam Recall | Scam Precision | Legit Recall | Legit Precision |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Majority Baseline** | 32.92% | 0.2477 | 100.00% | 32.92% | 0.00% | 0.00% |
| **TF-IDF + Logistic Regression** | 91.09% | 0.9040 | 97.74% | 79.75% | 87.82% | 98.76% |
| **TF-IDF + Multinomial Naive Bayes** | 91.09% | 0.9038 | 96.99% | 80.12% | 88.19% | 98.35% |
| **TF-IDF + LinearSVC (Selected Model)** | **92.57%** | **0.9196** | **98.50%** | **82.39%** | **89.67%** | **99.18%** |

### 5.4 Model Selection Justification & Confidence Intervals
**Educational Safety Selection Criterion:**  
In a digital safety platform for young learners, **minimizing False Negatives (missed scams) is the paramount safety objective**. Missing a scam exposes a teenager to real-world financial fraud or credential theft, whereas a False Positive (flagging a benign message) offers an immediate educational discussion point. Therefore, `TFIDF_Linear_SVC` was selected based on a predeclared validation threshold requiring **$\ge 95\%$ Scam Recall**, followed by Macro-F1.

On the held-out test set ($n=404$), `TFIDF_Linear_SVC` detected **131 out of 133 scams (98.50% recall)**, missing only 2 deceptive messages.

**Empirical 95% Bootstrap Confidence Intervals (1,000 resamples):**
* **Accuracy:** `[89.60%, 95.05%]`
* **Macro-F1:** `[0.8874, 0.9470]`
* **Scam Recall:** `[96.18%, 100.00%]`
* **Scam Precision:** `[76.00%, 88.51%]`

### 5.5 Subset Generalization Analysis
* **Synthetic Curriculum Subset ($n=310$):** Accuracy = 91.61%, Scam Recall = **100.00%** (90/90 detected), Scam Precision = 77.59%, Macro-F1 = 0.9055.
* **Public Benchmark Subset ($n=94$):** Accuracy = **95.74%**, Scam Recall = 95.35% (41/43 detected), Scam Precision = 95.35%, Macro-F1 = 0.9573.

---

## 6. Verified Technologies and Tooling

Only technologies and libraries actually implemented and verified in Member 4's contribution are listed below:

| Layer / Domain | Technology / Library | Version / Scope | Verified Role in Member 4 Component |
|:---|:---|:---|:---|
| **Frontend UI** | React | 18.x | Modular UI views (`ScamHomePage`, `SimulatedInboxPage`, `SimulationFeedbackPage`). |
| **Frontend Language** | TypeScript | 5.x | Strict type definitions for scenarios, simulation feedback, and progress payloads. |
| **Frontend Build** | Vite | 5.x | Fast HMR dev server and client bundling. |
| **Frontend Styling** | Vanilla CSS / Tailored CSS | CSS3 | Responsive layouts (`scam-safety.css`, `dashboard-long.css`). |
| **Frontend Testing** | Node Test Runner | Node 20+ (`node:test`, `node:assert`) | 43 automated unit tests for progress tracking and guardian consent. |
| **Backend Framework** | FastAPI | 0.110+ | Async REST API endpoints under `/api/safety/*`. |
| **Backend Runtime** | Python | 3.13 (`.venv`) | Backend server and research execution environment. |
| **Database** | MongoDB Community | 7.x (`localhost:27017`) | Persistent collections (`guardian_consent`, `safety_simulations`, `module_state`). |
| **Async Mongo Driver** | Motor / PyMongo | 3.x / 4.x | Non-blocking async database operations and indexing. |
| **Backend Testing** | Pytest | 8.x | 14 automated unit and integration tests with in-memory database mocks. |
| **ML Framework** | Scikit-Learn | 1.6+ | TF-IDF vectorization, GroupKFold, LinearSVC, LogisticRegression, MultinomialNB. |
| **Data Processing** | Pandas & NumPy | 2.x / 1.26+ | Dataset curation, campaign clustering, stratified sampling, and bootstrap metrics. |
| **Model Persistence** | Joblib | 1.4+ | Serialization of trained pipeline (`best_model_v3.joblib`). |
| **Version Control** | Git | 2.4+ | Monitored development on branch `feature/scam-awareness`. |

---

## 7. Testing, Validation, and Verification

Testing for Member 4 was architected across three independent, verified pillars:

### 7.1 Pillar 1: Frontend Automated Test Suite (43 Tests Passing)
* **Standard Package Script Command:**
  ```bash
  cd WiseCub/frontend
  npm run test:scam
  ```
  *(Maps directly in `frontend/package.json` to: `node --experimental-strip-types --test src/tests/*.test.ts`)*
* **Direct Node Test Runner Alternative:**
  ```bash
  cd WiseCub/frontend
  node --test src/tests/scamProgress.test.ts src/tests/guardianConsent.test.ts
  ```
* **Verified Test Results:**
  * `src/tests/scamProgress.test.ts`: **29 tests passing** across 7 suites (validates 80% passing boundary, category unlocking, progress preservation across reloads, guest/registered account isolation).
  * `src/tests/guardianConsent.test.ts`: **14 tests passing** across 1 suite (validates guardian email validation, consent toggles, simulation trigger rules, and learning metrics calculation).
  * **Total:** **43 passing tests, 0 failures, execution time: ~198ms.**

### 7.2 Pillar 2: Backend Automated Pytest Suite (14 Tests)
* **Execution Command:**
  ```bash
  cd WiseCub/backend
  PYTHONPATH=. ./.venv/bin/pytest app/modules/safety/tests/test_safety_guardian.py -v
  ```
  *(Or from the repository root: `PYTHONPATH=backend ./backend/.venv/bin/pytest backend/app/modules/safety/tests/test_safety_guardian.py -v`)*
* **Scope of Tested Behaviors:**
  1. Template validation for all 6 curriculum levels.
  2. Guardian input validation (email regex, required name).
  3. Parent consent lifecycle, verification token generation, and simulated verification.
  4. Idempotent simulation triggering and duplicate-attempt prevention.
  5. Bulk simulation triggering for levels passed prior to guardian registration.
  6. Scanner user-agent detection to prevent mail security crawlers from triggering false clicks.
  7. Cross-student authorization isolation.
  8. Follow-up quiz evaluation and aggregated parent dashboard learning metrics.

### 7.3 Pillar 3: ML Dataset Automated Validation (10/10 Checks Pass)
* **Execution Command (Dry-run mode, safe execution):**
  ```bash
  cd WiseCub
  ./backend/.venv/bin/python research/scam-awareness-ml/v3_final/src/validate_dataset_v3.py
  ```
* **Audit Results (From `dataset_quality_report.md`):**
  * `Check 1 (Schema Adherence)`: **PASS** (Exact 12 required fields).
  * `Check 2 (Row Count)`: **PASS** (Exactly 2,500 rows).
  * `Check 3 (Missing Values)`: **PASS** (Zero null values).
  * `Check 4 (Unique IDs)`: **PASS** (Zero duplicate IDs).
  * `Check 5 (Text Uniqueness)`: **PASS** (Zero exact or normalized duplicates).
  * `Check 6 (Class Balance)`: **PASS** (50.0% scam / 50.0% legitimate).
  * `Check 7 (Provenance Balance)`: **PASS** (76.0% synthetic / 24.0% public).
  * `Check 8 (Curriculum Coverage)`: **PASS** (All 6 categories + legitimate present).
  * `Check 9 (Label Shortcut Check)`: **PASS** (0 synthetic shortcut tokens).
  * `Check 10 (Template Group Purity)`: **PASS** (100% pure group labels).

---

## 8. Individual Contribution Summary

Below is an explicit breakdown of all deliverables individually conceptualized, implemented, tested, and documented by Member 4:

### 8.1 Primary Architectural Innovation: Guardian-Approved Real Email Scam Simulation
* **Conception & Architectural Design:** Originated and designed the end-to-end guardian-approved real email scam simulation workflow that bridges classroom learning with real-world messaging environments.
* **Safe Delivery Engine:** Built `email_service.py` to construct multi-part MIME templates across all 6 threat levels, enforcing zero external destinations, mandatory educational disclaimer headers, and default-safe SMTP error handling.
* **Consent & Telemetry Pipelines:** Implemented guardian email ownership verification (OTP), affirmative consent controls, server-side idempotency, automated mail-scanner defense, and multi-tenant decision tracking (`inbox_opened`, `link_clicked`, `reported_suspicious`, `marked_safe`, `debrief_viewed`, `follow_up_completed`).

### 8.2 Frontend Engineering
* Designed and built the **Scam Safety learning hub** ([ScamHomePage.tsx](file:///Users/tharushinethra/Desktop/WiseCub/WiseCub/frontend/src/modules/scam-safety/pages/ScamHomePage.tsx)) featuring category progress indicators, passing threshold locks, and parent consent status.
* Built the **Simulated Inbox interface** ([SimulatedInboxPage.tsx](file:///Users/tharushinethra/Desktop/WiseCub/WiseCub/frontend/src/modules/scam-safety/pages/SimulatedInboxPage.tsx)) providing realistic inspection of simulated deception.
* Built the **Formative Feedback debriefing view** ([SimulationFeedbackPage.tsx](file:///Users/tharushinethra/Desktop/WiseCub/WiseCub/frontend/src/modules/scam-safety/pages/SimulationFeedbackPage.tsx)) breaking down message red flags and administering follow-up reflection questions.
* Implemented the **progress tracking service** ([scamProgress.ts](file:///Users/tharushinethra/Desktop/WiseCub/WiseCub/frontend/src/modules/scam-safety/services/scamProgress.ts)) managing the 80% passing threshold, local caching, and remote database synchronization.
* Authored all educational scenario datasets across the 6 curriculum levels ([smsScenarios.ts](file:///Users/tharushinethra/Desktop/WiseCub/WiseCub/frontend/src/modules/scam-safety/data/smsScenarios.ts), [qrScenarios.ts](file:///Users/tharushinethra/Desktop/WiseCub/WiseCub/frontend/src/modules/scam-safety/data/qrScenarios.ts), [prizeScenarios.ts](file:///Users/tharushinethra/Desktop/WiseCub/WiseCub/frontend/src/modules/scam-safety/data/prizeScenarios.ts), [impersonationScenarios.ts](file:///Users/tharushinethra/Desktop/WiseCub/WiseCub/frontend/src/modules/scam-safety/data/impersonationScenarios.ts), [financialScenarios.ts](file:///Users/tharushinethra/Desktop/WiseCub/WiseCub/frontend/src/modules/scam-safety/data/financialScenarios.ts)).

### 8.3 Backend Engineering
* Developed the **FastAPI router** ([router.py](file:///Users/tharushinethra/Desktop/WiseCub/WiseCub/backend/app/modules/safety/router.py)) declaring all 12 `/api/safety/*` endpoints for guardian consent, email simulations, and student decision telemetry.
* Implemented the **email simulation service** ([email_service.py](file:///Users/tharushinethra/Desktop/WiseCub/WiseCub/backend/app/modules/safety/email_service.py)) with realistic simulation templates, educational headers, and security banners.
* Created the **idempotent MongoDB seeder** ([seed.py](file:///Users/tharushinethra/Desktop/WiseCub/WiseCub/backend/app/modules/safety/seed.py)) and schema indexes for collections `children`, `guardian_consent`, `safety_simulations`, and `module_state`.

### 8.4 Machine Learning Research & Auditing
* Designed, generated, and validated the **2,500-sample balanced research dataset** (`v3.0`).
* Developed the connected-components campaign clustering algorithm ($\cos \ge 0.40$ + phone/shortcode regex) to prevent near-duplicate leakage.
* Conducted multi-model training and evaluation (Majority Baseline, Multinomial Naive Bayes, Logistic Regression, LinearSVC).
* Implemented the **GroupShuffleSplit** evaluation protocol ensuring zero template leakage across training, validation, and test splits.
* Computed **1,000-resample bootstrap 95% confidence intervals** and dynamic token-attribution error analysis.

---

## 9. Honest Limitations and Future Research Directions

In accordance with rigorous academic integrity standards, the following technical and research limitations are explicitly declared:

1. **Bag-of-Words Independence Assumption:**  
   The selected `TFIDF_Linear_SVC` pipeline treats input text as an unordered collection of n-grams. It lacks deep syntactic parsing, hierarchical attention, and semantic comprehension. Subtle scams employing polite language, literary phrasing, or contextual nuance can bypass bag-of-words classifiers.
2. **Adversarial Character Perturbations:**  
   TF-IDF tokenizers are vulnerable to simple adversarial evasion techniques (e.g., zero-width spaces, leetspeak substitutions like `c1ick h3re`, or homoglyph characters).
3. **Multimodal Blind Spots:**  
   Many modern youth scams rely on visual media (QR code images on social media, Discord DM banners, synthetic voice clips). The text classifier cannot analyze non-textual components.
4. **Historical Corpus Vintage:**  
   The public benchmark subset (600 records) originates from the UCI SMS Spam Collection (2003–2012 UK/Singapore mobile promotions). While valuable as an academic standard, it does not fully reflect modern social platforms (TikTok, Snapchat, Discord).
5. **Synthetic Language Priors:**  
   The synthetic educational scenarios (1,900 records) were authored based on pedagogical templates. While strictly audited to eliminate shortcut tags, they reflect the stylistic priors of adult educators rather than the rapidly shifting slang and abbreviations of teenagers.
6. **No Access to Child Communications:**  
   To strictly uphold child privacy ethics (COPPA, GDPR Article 8, and the UK Age-Appropriate Design Code), **no actual private chat messages or personal data of children were ever collected, scraped, or trained upon**.

---

## 10. Conclusion

Member 4's contribution to the **WiseCub (J26-IT-418)** project successfully demonstrates how full-stack interactive engineering and academic machine learning research can be combined to advance digital financial safety education for children aged 12–16.

By providing a safe, risk-free simulation environment ("Scam Alley"), young learners develop experiential mental models to recognize deceptive tactics before they encounter real-world financial harm. Concurrently, the three-phase machine learning research established a statistically defensible, reproducible benchmark (`92.57% test accuracy`, `98.50% scam recall`, and `0.9196 Macro-F1`) that demonstrates the viability and honest boundaries of lightweight NLP algorithms for youth digital safety education.

---

*This document was compiled, verified, and audited as the authoritative single-file submission record for Member 4 in accordance with university research project standards.*
