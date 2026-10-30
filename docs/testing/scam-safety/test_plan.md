# WiseCub Member 4 — Scam Awareness Postman-Free Testing Plan (PP1)

## 1. Overview & Context

* **Project**: WiseCub (Project ID: J26-IT-418)
* **Component**: Member 4 — Scam Awareness / Scam Safety
* **Objective**: Provide a rigorous, end-to-end, Postman-free testing workflow that validates all backend APIs, frontend interactive flows, persistent progress tracking, and machine learning research artifacts for PP1 milestone submission.
* **Working Branch**: `feature/scam-awareness`
* **Test Environment**:
  - Python: 3.13 (`.venv`)
  - Backend: FastAPI, Motor / PyMongo, Uvicorn (Port 8000)
  - Frontend: React 18, Vite 5, TypeScript 5 (Port 5173)
  - Database: MongoDB Community (localhost:27017, db: `wisecub`)
  - ML Stack: Scikit-Learn 1.9+, Pandas 3.0+, Joblib 1.6+

---

## 2. Five-Pillar Postman-Free Test Architecture

Instead of relying on Postman, testing is divided across five verified pillars:

```
+---------------------------------------------------------------------------------------+
|                               POSTMAN-FREE TESTING PLAN                               |
+---------------------------------------------------------------------------------------+
|  1. BACKEND API AUTOMATION     | Pytest + FastAPI TestClient (14 tests in 0.87s)      |
|  2. LIVE API SMOKE TESTING     | cURL CLI script (Non-destructive JSON verification)  |
|  3. UI / LESSON FLOWS          | Browser manual test cases (Lessons, Quizzes, Unlock) |
|  4. ML RESEARCH EVALUATION     | Python scripts (v3 dataset, metrics, LinearSVC)      |
|  5. FRONTEND CODE & PROGRESS   | Node test runner + TypeScript audit (43 tests pass)  |
+---------------------------------------------------------------------------------------+
```

---

## 3. Pillar 1: Backend Automated Pytest Suite

* **Runner**: `.venv/bin/pytest backend/app/modules/safety/tests/test_safety_guardian.py -v`
* **Technology**: `pytest` + `fastapi.testclient.TestClient` + in-memory mock MongoDB fixture.
* **Scope**: 14 unit and integration tests covering:
  1. Template definitions for all 6 curriculum levels (`phishing`, `sms`, `qr`, `prize`, `impersonation`, `financial`).
  2. Input validation for guardian names, relationship types, and emails.
  3. Parent consent lifecycle, verification token issuance, and simulated dev-assist verification.
  4. Simulation triggering for individual levels and idempotent duplicate-attempt prevention.
  5. Bulk simulation triggering for levels passed prior to guardian registration (`trigger-passed`).
  6. Scanner user-agent detection to prevent automated mail security bots from triggering false link-clicks.
  7. Cross-student authorization isolation (preventing Student A from inspecting Student B's simulated inbox).
  8. Follow-up quiz evaluations and aggregated parent dashboard learning metrics.

---

## 4. Pillar 2: Live API Smoke Testing via cURL

* **Runner**: `bash docs/testing/scam-safety/api_smoke_tests.sh`
* **Endpoints Tested**:
  - `GET /health` — Verifies FastAPI and MongoDB connectivity.
  - `GET /api/safety/guardian/{child_id}` — Inspects guardian configuration and SMTP status.
  - `PUT /api/safety/guardian/{child_id}` — Saves verified demo guardian details.
  - `POST /api/safety/guardian/{child_id}/verify` — Confirms simulated dev verification.
  - `GET /api/safety/simulation/inbox/{child_id}` — Retrieves educational simulation inbox.
  - `GET /api/safety/simulation/metrics/{child_id}` — Retrieves aggregated score and red flag metrics.
* **Safety Rules**: Operates strictly with synthetic demo ID `demo-test-smoke-001`; never modifies real student records or drops collections.

---

## 5. Pillar 3: Browser Manual UI & Journey Test Cases

* **Entry Point**: `http://localhost:5173/safety`
* **Key User Journeys**:
  1. **Journey 1: Category Card Discovery & Locks**:
     - Level 1 (Phishing) is unlocked by default.
     - Levels 2–6 (SMS, QR, Prize, Impersonation, Financial) are sequentially locked until prerequisite levels are passed with >=80%.
  2. **Journey 2: Interactive Curriculum & Practice Quizzes**:
     - Completing lesson sections.
     - Answering situational scenarios.
     - Real-time instant feedback on selected answers with educational explanations.
  3. **Journey 3: Threshold Scoring & Instant Unlock**:
     - Scoring < 80% retains locked state on subsequent level.
     - Scoring >= 80% instantly unlocks the next category without page reload.
  4. **Journey 4: Progress Persistence Across Refresh**:
     - Reloading browser preserves unlocked levels and scores from `localStorage`.
     - Syncing progress with MongoDB via `PUT /api/state/{child_id}/safety`.
  5. **Journey 5: Simulated Inbox & Feedback Flow**:
     - Navigating to `/safety/inbox`.
     - Reviewing educational scam simulations.
     - Selecting "Report as Suspicious" vs clicking the warning link.
     - Reviewing the safe debriefing explanation on `/safety/simulation-feedback`.

---

## 6. Pillar 4: ML Research Evaluation (v3 Final)

* **Code Location**: `research/scam-awareness-ml/v3_final/`
* **Components**:
  1. `validate_dataset_v3.py`: Evaluates 10 dataset integrity rules (2,500 samples, 50/50 class balance, 0 shortcuts, 0 leakage).
  2. `error_analysis_v3.py`: Evaluates the trained `best_model_v3.joblib` (TF-IDF + LinearSVC) on held-out test groups (N=404).
  3. Metric reports in `model_evaluation_metrics_v3.json`:
     - Test Accuracy: **92.57%**
     - Scam Recall: **98.50%**
     - Scam Precision: **82.39%**
     - Macro F1: **0.9196**

---

## 7. Pillar 5: Frontend TypeScript & Unit Tests

* **Unit Test Runner**: `npm --prefix frontend run test:scam`
  - 43 tests across 8 test suites validating progress calculation, merging algorithms, scenario answer keys, and account isolation.
* **TypeScript Audit**: Verified 0 TypeScript errors in `frontend/src/modules/scam-safety/`.
