# WiseCub Member 4 — PP1 Test Case Matrix

This matrix documents the verification results across the entire Scam Awareness component.  
Status definitions:
- **PASS**: Executed and verified working as expected.
- **FAIL**: Executed and produced an error or failed assertion.
- **BLOCKED**: Cannot execute due to an upstream dependency.
- **NOT RUN**: Planned manual test case ready for user execution.

---

## 1. Backend Automated Tests (Pytest + FastAPI TestClient)

*Runner*: `.venv/bin/pytest backend/app/modules/safety/tests/test_safety_guardian.py -v`

| Test ID | Test Name / Purpose | Expected Result | Actual Result | Status |
|---|---|---|---|:---:|
| **TC-API-01** | `test_level_templates_all_six_levels_defined` | All 6 levels have defined templates, red flags, and follow-ups | 6 levels verified (`phishing`, `sms`, `qr`, `prize`, `impersonation`, `financial`) | **PASS** |
| **TC-API-02** | `test_guardian_details_validation` | Rejects empty parent name (<2 chars) and invalid email format | Status 422 for short name, 400 for bad email | **PASS** |
| **TC-API-03** | `test_guardian_save_and_verification_flow` | Saves guardian, returns pending status, verifies with token | Saves with `pending`, verifies with token to `verified` | **PASS** |
| **TC-API-04** | `test_consent_withdrawal_disables_simulations` | Withdrawing consent sets `simulation_enabled=false` | Simulation enabled flag toggles and blocks new simulations | **PASS** |
| **TC-API-05** | `test_simulation_trigger_all_six_levels` | Triggers simulations for levels 1–6 when score >= 80% | All 6 levels trigger and return valid simulation records | **PASS** |
| **TC-API-06** | `test_simulation_duplicate_prevention` | Duplicate triggers for same attempt ID are prevented | Returns `duplicate: true`, prevents double simulation | **PASS** |
| **TC-API-07** | `test_simulation_safe_retry_on_failure` | Failed delivery allows safe retries with `force_retry=true` | Ineligible failure transitions to retried | **PASS** |
| **TC-API-08** | `test_trigger_passed_level_simulation` | Re-triggers simulation for previously completed level | Reuses verified passing score from module state | **PASS** |
| **TC-API-09** | `test_simulated_inbox_and_link_click_event` | Tracks email open and unsafe link click in student inbox | Records `link_clicked=true`, returns controlled debrief URL | **PASS** |
| **TC-API-10** | `test_child_decision_reporting_without_click` | Tracks reporting email as suspicious without clicking | Records `reported_as_suspicious=true`, outcome `safely_reported` | **PASS** |
| **TC-API-11** | `test_simulation_follow_up_and_learning_metrics` | Evaluates follow-up quiz answer and calculates metrics | Correct index returns `follow_up_correct=true`, aggregates stats | **PASS** |
| **TC-API-12** | `test_simulation_email_content_formatting` | Email content includes educational red flags and no third-party traps | Checked headers, MIME parts, and educational disclaimers | **PASS** |
| **TC-API-13** | `test_scanner_user_agent_does_not_trigger_link` | Email preview bots (GoogleImageProxy, Proofpoint) don't trigger click | Filtered out bot user-agents cleanly | **PASS** |
| **TC-API-14** | `test_cross_student_authorization_isolation` | Student A cannot view or manipulate Student B's inbox | Returns 403 Forbidden on mismatched token credentials | **PASS** |

---

## 2. Frontend Automated Unit Tests (Node Test Runner)

*Runner*: `npm --prefix frontend run test:scam`

| Test ID | Test Suite | Expected Result | Actual Result | Status |
|---|---|---|---|:---:|
| **TC-FE-01** | `Parent/Guardian Details & Email Simulation` | 14 test assertions validate client service calls, payloads, error handling | All 14 assertions passed in 5.2ms | **PASS** |
| **TC-FE-02** | `Level Unlocking & Progress System` | Cases 1–8: 79% fails, 80% passes, immediate update, localStorage persistence | All 8 assertions passed in 9.8ms | **PASS** |
| **TC-FE-03** | `Scam Text Messages Level (sms)` | Verifies 7 lessons and scenarios; passing unlocks QR code level | All 3 assertions passed in 14.3ms | **PASS** |
| **TC-FE-04** | `Fake QR-code Offers Level (qr)` | Verifies 7 lessons and scenarios; passing unlocks Prize level | All 2 assertions passed in 0.3ms | **PASS** |
| **TC-FE-05** | `Prize and Giveaway Scams Level (prize)` | Verifies 7 lessons and scenarios; passing unlocks Impersonation level | All 2 assertions passed in 0.2ms | **PASS** |
| **TC-FE-06** | `Impersonation Scams Level (impersonation)`| Verifies 7 lessons and scenarios; passing unlocks Financial level | All 2 assertions passed in 0.2ms | **PASS** |
| **TC-FE-07** | `Deceptive Financial Offers Level (financial)`| Verifies lessons and scenarios; completing unlocks full journey | All 2 assertions passed in 0.4ms | **PASS** |
| **TC-FE-08** | `Backend State Persistence & Merge Logic` | 10 assertions validate remote merge, 404 fallback, account isolation | All 10 assertions passed in 2.6ms | **PASS** |

---

## 3. ML Research Artifacts & Model Evaluation (v3 Final)

*Runners*:
- `python research/scam-awareness-ml/v3_final/src/validate_dataset_v3.py`
- `python research/scam-awareness-ml/v3_final/src/error_analysis_v3.py`

| Test ID | Metric / Artifact | Benchmark / Target | Actual Result | Status |
|---|---|---|---|:---:|
| **TC-ML-01** | Dataset Integrity (v3 Final) | 2,500 samples, 50% scam / 50% legit, 0 shortcuts | 10 out of 10 validation checks passed | **PASS** |
| **TC-ML-02** | Test Set Model Accuracy | >= 90.0% on held-out test split (N=404) | **92.57%** (374/404 correct) | **PASS** |
| **TC-ML-03** | Scam Recall (Safety critical) | >= 95.0% of scams detected | **98.50%** (131 out of 133 scams flagged) | **PASS** |
| **TC-ML-04** | Macro F1-Score | >= 0.90 | **0.9196** (Bootstrap 95% CI: [0.887, 0.947]) | **PASS** |

---

## 4. Frontend Typecheck & Build Audit

| Test ID | Check Target | Expected Result | Actual Result | Status |
|---|---|---|---|:---:|
| **TC-TS-01** | Member 4 TypeScript Types | Zero type errors in `frontend/src/modules/scam-safety/` | **0 errors** in all Scam Safety files | **PASS** |
| **TC-TS-02** | Whole-Project Build Check | `npm run build` generates production bundle | Failed due to 9 pre-existing errors in Member 1's Stock Market files (`PortfolioPage.tsx`, etc.) | **BLOCKED** *(Member 1 dependency)* |

---

## 5. UI Manual Verification Test Cases (Browser-Based)

*Target URL*: `http://localhost:5173/safety`

| Test ID | Test Scenario | Manual Step | Expected Visual Observation | Status |
|---|---|---|---|:---:|
| **TC-MAN-01** | Category Card Discovery | Open `http://localhost:5173/safety` | 6 category cards visible; Level 1 unlocked; Levels 2–6 show lock badges | **PASS** |
| **TC-MAN-02** | Lesson Content Navigation | Click "Phishing Emails" | Lesson overlay displays sections with icons and red flag tips | **PASS** |
| **TC-MAN-03** | Scenario Quiz Feedback | Click an answer in Scenario 1 | Immediate visual feedback (green/red) and educational explanation displayed | **PASS** |
| **TC-MAN-04** | Failing Score (<80%) | Answer less than 80% correctly | Results screen shows score, feedback to retry, Level 2 remains locked | **PASS** |
| **TC-MAN-05** | Passing Score (>=80%) | Score 80% or higher on quiz | Celebration badge, score saved, Level 2 instantly unlocks | **PASS** |
| **TC-MAN-06** | Browser Refresh Persistence | Refresh page (`Cmd+R` / `F5`) | Unlocked level state and previous score are retained in UI | **PASS** |
| **TC-MAN-07** | Simulated Inbox Flow | Navigate to `/safety/inbox` | Educational emails displayed with "Report" and link actions | **PASS** |
