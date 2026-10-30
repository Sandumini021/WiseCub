# WiseCub Member 4 — PP1 Testing Evidence & Screenshot Checklist

This checklist provides step-by-step instructions for generating and capturing all genuine testing evidence required for the **WiseCub Member 4 (Scam Awareness)** PP1 milestone.

---

## 1. Summary of Verifiable Pillars

| Pillar | Method / Command | What is Verified | Output / Screenshot Location |
|---|---|---|---|
| **1. Backend Pytest** | `.venv/bin/pytest backend/app/modules/safety/tests/test_safety_guardian.py -v` | 14 automated unit & security tests | Terminal screenshot showing `14 passed in 0.87s` |
| **2. Live API cURL** | `bash docs/testing/scam-safety/api_smoke_tests.sh` | 6 live API endpoints tested against running backend | Terminal screenshot showing all 6 `[PASS]` |
| **3. Frontend Unit Tests**| `npm --prefix frontend run test:scam` | 43 unit tests across 8 suites (unlocks, scoring, persistence) | Terminal screenshot showing `pass 43, fail 0` |
| **4. ML Dataset Validation** | `.venv/bin/python research/scam-awareness-ml/v3_final/src/validate_dataset_v3.py` | 10 integrity checks on 2,500 curriculum samples | Terminal screenshot showing 10/10 `[PASS]` |
| **5. ML Error Analysis** | `.venv/bin/python research/scam-awareness-ml/v3_final/src/error_analysis_v3.py` | Model evaluation metrics (92.57% accuracy, 98.5% recall) | Terminal screenshot of test set metrics |
| **6. Browser UI Flow** | `http://localhost:5173/safety` | Interactive lessons, quiz feedback, level unlocks | Browser screenshots of Level 1, Quiz, and Level 2 Unlock |
| **7. MongoDB Compass** | `mongodb://localhost:27017` > `wisecub` | Seeded collections: `guardian_consent`, `safety_simulations` | Compass screenshot showing seeded documents |

---

## 2. Beginner-Friendly Step-by-Step Instructions

### Step 1: Capture Backend Pytest Proof (Terminal Screenshot)
Run this command from the project root:
```bash
.venv/bin/pytest backend/app/modules/safety/tests/test_safety_guardian.py -v
```
📸 **Screenshot 1**: Capture the terminal output showing all 14 tests marked `PASSED` in green.

---

### Step 2: Capture Live API Smoke Test Proof (Terminal Screenshot)
Make sure the backend is running (`uvicorn app.main:app --port 8000`), then run:
```bash
bash docs/testing/scam-safety/api_smoke_tests.sh
```
📸 **Screenshot 2**: Capture the terminal output showing all 6 smoke tests marked `[PASS]`.

---

### Step 3: Capture Frontend Unit Test Proof (Terminal Screenshot)
Run this command:
```bash
npm --prefix frontend run test:scam
```
📸 **Screenshot 3**: Capture the summary showing `ℹ tests 43`, `ℹ pass 43`, `ℹ fail 0`.

---

### Step 4: Capture ML Dataset Integrity & Model Evaluation Proof (Terminal Screenshot)
Run the dataset validator:
```bash
.venv/bin/python research/scam-awareness-ml/v3_final/src/validate_dataset_v3.py
```
📸 **Screenshot 4A**: Capture the 10 green `[PASS]` checks.

Then run the model evaluator:
```bash
.venv/bin/python research/scam-awareness-ml/v3_final/src/error_analysis_v3.py
```
📸 **Screenshot 4B**: Capture the test split accuracy (92.57%) and error distribution.

---

### Step 5: Capture Browser UI Demonstration (Browser Screenshots)
Open `http://localhost:5173/safety` in your browser:
1. 📸 **Screenshot 5A (Category Hub)**: Showing Level 1 unlocked and subsequent levels locked.
2. 📸 **Screenshot 5B (Interactive Lesson)**: Click Level 1 to show the interactive curriculum sections.
3. 📸 **Screenshot 5C (Practice Quiz & Instant Feedback)**: Answer a scenario and capture the instant educational feedback explanation.
4. 📸 **Screenshot 5D (Progress & Unlock)**: Complete the level with >=80% and capture the unlocked Level 2 (SMS Scams) badge.

---

### Step 6: Capture MongoDB Compass Verification (Database Screenshot)
Open MongoDB Compass:
1. Connect to `mongodb://localhost:27017`.
2. Click on the `wisecub` database.
3. 📸 **Screenshot 6**: Capture the collection list showing `guardian_consent` and `safety_simulations` with documents.

---

## 3. Evidence Compilation Table for Submission

| Evidence Artifact Name | File Format | Status | Notes |
|---|---|:---:|---|
| `evidence_01_backend_pytest.png` | PNG | Verified | 14/14 tests pass |
| `evidence_02_curl_api_smoke.png` | PNG | Verified | 6/6 endpoints pass |
| `evidence_03_frontend_scam_tests.png` | PNG | Verified | 43/43 tests pass |
| `evidence_04a_ml_dataset_validation.png` | PNG | Verified | 10/10 dataset rules pass |
| `evidence_04b_ml_model_evaluation.png` | PNG | Verified | LinearSVC 92.57% test accuracy |
| `evidence_05_ui_scam_homepage.png` | PNG | Ready | Browser view at `localhost:5173/safety` |
| `evidence_06_mongodb_compass.png` | PNG | Ready | Compass view of `wisecub` collections |
