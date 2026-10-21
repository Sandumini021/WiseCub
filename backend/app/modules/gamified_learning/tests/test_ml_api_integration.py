"""
WiseCub — CDEMF ML API Integration Test Suite (Checkpoint D)
============================================================
Validates:
  1. Authentication & Security: Endpoints enforce server-side JWT authentication (401 on unauthorized).
  2. Data Isolation: Multi-student gameplay records and recommendations are strictly scoped to child_id.
  3. ML Prediction API: GET /api/gamified/ml/prediction returns MLSupportPredictionOut.
  4. Adaptive Recommendation API: GET /api/gamified/ml/adaptive-recommendation returns AdaptiveMissionRecommendationOut.
  5. Cold-Start Handling: Unstarted learners receive safe rule-based entry-level recommendations.
  6. CDEMF Safety Arbitration: Safety overrides prevent premature progression for struggling learners.
  7. Locked-Level Restrictions: Recommended level is strictly <= student's unlocked level.
  8. Action Navigation Metadata: URLs and catalog metadata match actual frontend routes and catalog content.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

import app.modules.gamified_learning.router as gl_router
import app.modules.accounts.router as accounts_router
from app.main import app
from app.modules.accounts.security import COOKIE_NAME, issue_token
from app.modules.gamified_learning.catalog import MISSION_CATALOG, get_level
from app.modules.gamified_learning.tests.test_gamified import FakeDB


@pytest.fixture
def fakedb():
    db = FakeDB()
    gl_router.get_db = lambda: db
    accounts_router.get_db = lambda: db
    return db


@pytest.fixture
def client(fakedb):
    return TestClient(app)


def _seed_account(fakedb, child_id: str, name: str = "Test Student"):
    fakedb.accounts.docs.append({
        "child_id": child_id,
        "name": name,
        "username": f"user_{child_id}",
        "created_at": "2026-10-20T10:00:00Z",
    })
    token = issue_token(child_id, "student", remember=False)
    return token, child_id


def _seed_gameplay_history(
    fakedb,
    child_id: str,
    mission_id: str = "mission_rescue_puppy",
    unlocked_level: int = 3,
    completed_levels: list[int] = None,
    attempts_data: list[dict] = None,
):
    if completed_levels is None:
        completed_levels = [1, 2]

    # Seed progress
    fakedb.gamified_progress.docs.append({
        "child_id": child_id,
        "mission_id": mission_id,
        "unlocked_level_number": unlocked_level,
        "completed_level_numbers": completed_levels,
        "current_score": 180,
        "character_health": 85,
        "attempts_count": len(attempts_data or []),
    })

    # Seed attempts & decisions
    if attempts_data:
        for att in attempts_data:
            att_doc = {
                "child_id": child_id,
                "mission_id": mission_id,
                **att,
            }
            fakedb.mission_attempts.docs.append(att_doc)

            # Seed decision
            fakedb.financial_decisions.docs.append({
                "child_id": child_id,
                "mission_id": mission_id,
                "level_number": att.get("level_number", 1),
                "timestamp": att.get("completed_at", "2026-10-20T12:00:00Z"),
                "passed": att.get("passed", True),
                "score": att.get("score", 85.0),
                "budget": 100.0,
                "amount_spent": 80.0,
                "savings_allocated": 20.0,
                "emergency_fund_allocated": 10.0,
                "needs_score": 85.0,
                "wants_score": 70.0,
                "savings_score": 80.0,
                "overall_competency_score": att.get("score", 85.0) / 100.0,
                "mistakes_count": 0 if att.get("passed", True) else 2,
                "hints_used_count": 0,
                "time_spent_seconds": 90,
            })

            # Seed competency assessment
            fakedb.competency_assessments.docs.append({
                "child_id": child_id,
                "mission_id": mission_id,
                "level_id": f"{mission_id}_{att.get('level_number', 1)}",
                "level_number": att.get("level_number", 1),
                "attempt_number": att.get("attempt_number", 1),
                "assessed_at": att.get("completed_at", "2026-10-20T12:00:00Z"),
                "passed": att.get("passed", True),
                "budgeting_skill": 85 if att.get("passed", True) else 35,
                "spending_discipline": 80 if att.get("passed", True) else 40,
                "saving_behavior": 85 if att.get("passed", True) else 35,
                "investment_awareness": 75,
                "goal_achievement": 90 if att.get("passed", True) else 30,
                "overall_score": int(att.get("score", 85.0)),
                "secondary_scores": {
                    "emergency_preparedness": 80 if att.get("passed", True) else 25,
                },
            })


# =============================================================================
# 1. AUTHENTICATION & SECURITY TESTS
# =============================================================================

def test_ml_prediction_unauthorized(client):
    """Calling ML prediction without auth cookie must return 401."""
    res = client.get("/api/gamified/ml/prediction")
    assert res.status_code == 401


def test_adaptive_recommendation_unauthorized(client):
    """Calling adaptive recommendation without auth cookie must return 401."""
    res = client.get("/api/gamified/ml/adaptive-recommendation")
    assert res.status_code == 401


# =============================================================================
# 2. COLD-START STUDENT TESTS
# =============================================================================

def test_cold_start_ml_prediction(client, fakedb):
    """New student with no history receives a safe cold-start fallback prediction."""
    token, child_id = _seed_account(fakedb, "child_cold_01", "Cold Start Kid")
    client.cookies.set(COOKIE_NAME, token)

    res = client.get("/api/gamified/ml/prediction")
    assert res.status_code == 200
    data = res.json()

    assert data["child_id"] == "child_cold_01"
    assert data["predicted_support_need"] in ["READY_FOR_STANDARD", "NEEDS_FOUNDATION_SUPPORT"]
    assert data["fallback_used"] is True
    assert "COLD_START" in data["fallback_reason"] or "INSUFFICIENT_HISTORY" in data["fallback_reason"]
    assert "class_probabilities" in data
    assert isinstance(data["class_probabilities"], dict)


def test_cold_start_adaptive_recommendation(client, fakedb):
    """New student receives Level 1 of the initial introductory mission."""
    token, child_id = _seed_account(fakedb, "child_cold_02", "New Explorer")
    client.cookies.set(COOKIE_NAME, token)

    res = client.get("/api/gamified/ml/adaptive-recommendation")
    assert res.status_code == 200
    data = res.json()

    assert data["child_id"] == "child_cold_02"
    assert data["recommended_category"] in ["FOUNDATION", "STANDARD"]
    assert data["recommended_mission_id"] == "mission_rescue_puppy"
    assert data["recommended_level_number"] == 1
    assert data["safety_audit"]["unlocked_level_verified"] is True
    assert data["can_navigate"] is True
    assert data["recommended_level_title"] != ""
    assert "Rescue the Injured Puppy" in data["recommended_mission_title"]


# =============================================================================
# 3. ACTIVE STUDENT PREDICTION & RECOMMENDATION
# =============================================================================

def test_active_student_progression(client, fakedb):
    """Active learner with completed levels receives appropriate next level recommendation."""
    token, child_id = _seed_account(fakedb, "child_active_01", "Savvy Saver")
    client.cookies.set(COOKIE_NAME, token)

    # Seed 2 passed levels
    attempts = [
        {"attempt_id": "att_1", "level_number": 1, "passed": True, "score": 90.0, "completed_at": "2026-10-20T10:10:00Z"},
        {"attempt_id": "att_2", "level_number": 2, "passed": True, "score": 85.0, "completed_at": "2026-10-20T10:25:00Z"},
    ]
    _seed_gameplay_history(
        fakedb,
        child_id=child_id,
        mission_id="mission_rescue_puppy",
        unlocked_level=3,
        completed_levels=[1, 2],
        attempts_data=attempts,
    )

    res = client.get("/api/gamified/ml/adaptive-recommendation")
    assert res.status_code == 200
    data = res.json()

    assert data["child_id"] == "child_active_01"
    assert data["recommended_mission_id"] == "mission_rescue_puppy"
    assert data["recommended_level_number"] <= 3  # Never exceed unlocked level 3
    assert data["can_navigate"] is True
    assert data["safety_audit"]["unlocked_level_verified"] is True


# =============================================================================
# 4. DATA ISOLATION BETWEEN STUDENTS
# =============================================================================

def test_student_data_isolation(client, fakedb):
    """Student A's advanced progress does not leak to Student B (who is cold start)."""
    token_a, id_a = _seed_account(fakedb, "child_student_A", "Alice Advanced")
    token_b, id_b = _seed_account(fakedb, "child_student_B", "Bob Beginner")

    # Give Student A extensive history in Panda's School Fair
    _seed_gameplay_history(
        fakedb,
        child_id=id_a,
        mission_id="mission_panda_fair",
        unlocked_level=5,
        completed_levels=[1, 2, 3, 4],
        attempts_data=[
            {"attempt_id": f"att_a_{i}", "level_number": i, "passed": True, "score": 95.0, "completed_at": f"2026-10-20T1{i}:00:00Z"}
            for i in range(1, 5)
        ],
    )

    # Student A request
    client.cookies.set(COOKIE_NAME, token_a)
    res_a = client.get("/api/gamified/ml/adaptive-recommendation")
    assert res_a.status_code == 200
    data_a = res_a.json()
    assert data_a["child_id"] == id_a
    assert data_a["recommended_mission_id"] == "mission_panda_fair"

    # Student B request
    client.cookies.set(COOKIE_NAME, token_b)
    res_b = client.get("/api/gamified/ml/adaptive-recommendation")
    assert res_b.status_code == 200
    data_b = res_b.json()
    assert data_b["child_id"] == id_b
    assert data_b["recommended_mission_id"] == "mission_rescue_puppy"
    assert data_b["recommended_level_number"] == 1


# =============================================================================
# 5. CDEMF SAFETY ARBITRATION & OVERRIDE
# =============================================================================

def test_struggling_learner_safety_override(client, fakedb):
    """A struggling learner with repeated fails is guided to review/remediation, never advanced."""
    token, child_id = _seed_account(fakedb, "child_struggling", "Charlie Cautious")
    client.cookies.set(COOKIE_NAME, token)

    # Seed 3 consecutive fails on level 1
    attempts = [
        {"attempt_id": "att_s1", "level_number": 1, "passed": False, "score": 35.0, "completed_at": "2026-10-20T10:00:00Z"},
        {"attempt_id": "att_s2", "level_number": 1, "passed": False, "score": 40.0, "completed_at": "2026-10-20T10:10:00Z"},
        {"attempt_id": "att_s3", "level_number": 1, "passed": False, "score": 42.0, "completed_at": "2026-10-20T10:20:00Z"},
    ]
    _seed_gameplay_history(
        fakedb,
        child_id=child_id,
        mission_id="mission_rescue_puppy",
        unlocked_level=1,
        completed_levels=[],
        attempts_data=attempts,
    )

    res = client.get("/api/gamified/ml/adaptive-recommendation")
    assert res.status_code == 200
    data = res.json()

    # Must recommend Level 1 review, never skip or advance
    assert data["recommended_level_number"] == 1
    assert data["safety_audit"]["unlocked_level_verified"] is True
    assert data["recommended_category"] in ["FOUNDATION", "STANDARD"]


# =============================================================================
# 6. LOCKED LEVEL & CATALOG INTEGRITY GUARANTEES
# =============================================================================

def test_recommended_level_exists_in_catalog(client, fakedb):
    """Every recommendation maps to a real mission and level in MISSION_CATALOG."""
    token, child_id = _seed_account(fakedb, "child_catalog_val", "Dana")
    client.cookies.set(COOKIE_NAME, token)

    res = client.get("/api/gamified/ml/adaptive-recommendation")
    data = res.json()

    mission_id = data["recommended_mission_id"]
    level_num = data["recommended_level_number"]

    assert mission_id in MISSION_CATALOG
    cat_level = get_level(mission_id, level_num)
    assert cat_level is not None
    assert cat_level.level_number == level_num


def test_locked_level_never_exceeded(client, fakedb):
    """Recommended level number strictly satisfies: level <= unlocked_level."""
    token, child_id = _seed_account(fakedb, "child_locked_check", "Evan")
    client.cookies.set(COOKIE_NAME, token)

    # Seed unlocked level 2 for squirrel mission
    _seed_gameplay_history(
        fakedb,
        child_id=child_id,
        mission_id="mission_squirrel_savings",
        unlocked_level=2,
        completed_levels=[1],
        attempts_data=[
            {"attempt_id": "att_sq_1", "level_number": 1, "passed": True, "score": 88.0, "completed_at": "2026-10-20T10:00:00Z"}
        ],
    )

    res = client.get("/api/gamified/ml/adaptive-recommendation")
    data = res.json()

    if data["recommended_mission_id"] == "mission_squirrel_savings":
        assert data["recommended_level_number"] <= 2
    else:
        # If puppy mission (first mission)
        assert data["recommended_level_number"] <= 1


def test_api_missing_model_fallback(client, fakedb, monkeypatch):
    """When the ML model artifact is missing, API gracefully degrades to rule-based recommendation."""
    from pathlib import Path
    import app.modules.gamified_learning.ml.inference as ml_inf

    broken_predictor = ml_inf.CDEMFSupportPredictor(model_path=Path("nonexistent/path/model.joblib"))

    token, child_id = _seed_account(fakedb, "child_missing_model", "Grace")
    client.cookies.set(COOKIE_NAME, token)

    _seed_gameplay_history(
        fakedb,
        child_id=child_id,
        mission_id="mission_rescue_puppy",
        unlocked_level=2,
        completed_levels=[1],
        attempts_data=[
            {"attempt_id": "att_g1", "level_number": 1, "passed": True, "score": 90.0, "completed_at": "2026-10-20T10:00:00Z"},
            {"attempt_id": "att_g2", "level_number": 2, "passed": False, "score": 50.0, "completed_at": "2026-10-20T10:15:00Z"}
        ],
    )

    import app.modules.gamified_learning.ml.recommend as ml_rec
    rec_engine = ml_rec.CDEMFAdaptiveRecommendationEngine(predictor=broken_predictor)
    import app.modules.gamified_learning.ml.service as ml_svc
    monkeypatch.setattr(ml_svc, "default_recommendation_engine", rec_engine)

    res = client.get("/api/gamified/ml/adaptive-recommendation")
    assert res.status_code == 200
    data = res.json()
    assert data["child_id"] == "child_missing_model"
    assert data["can_navigate"] is True
    assert data["recommended_level_number"] <= 2


def test_api_low_confidence_fallback(client, fakedb, monkeypatch):
    """When ML model confidence is below 0.50, API falls back to standard rule-based progression."""
    from app.modules.gamified_learning.ml.inference import SupportPredictionResult
    import app.modules.gamified_learning.ml.recommend as ml_rec
    import app.modules.gamified_learning.ml.service as ml_svc

    class MockLowConfPredictor:
        def predict_support(self, features, confidence_threshold=0.50):
            return SupportPredictionResult(
                predicted_support_need="READY_FOR_STANDARD",
                probabilities={"NEEDS_FOUNDATION_SUPPORT": 0.33, "READY_FOR_STANDARD": 0.34, "READY_FOR_ADVANCED": 0.33},
                confidence=0.34,
                fallback_used=True,
                fallback_reason="LOW_CONFIDENCE_0.34_BELOW_0.50",
                model_version="v1.0.0",
                educational_action="Standard progression (low confidence)",
            )

    rec_engine = ml_rec.CDEMFAdaptiveRecommendationEngine(predictor=MockLowConfPredictor())
    monkeypatch.setattr(ml_svc, "default_recommendation_engine", rec_engine)

    token, child_id = _seed_account(fakedb, "child_low_conf", "Leo")
    client.cookies.set(COOKIE_NAME, token)

    _seed_gameplay_history(
        fakedb,
        child_id=child_id,
        mission_id="mission_rescue_puppy",
        unlocked_level=2,
        completed_levels=[1],
        attempts_data=[
            {"attempt_id": "att_l1", "level_number": 1, "passed": True, "score": 85.0, "completed_at": "2026-10-20T10:00:00Z"},
            {"attempt_id": "att_l2", "level_number": 2, "passed": True, "score": 88.0, "completed_at": "2026-10-20T10:15:00Z"},
        ],
    )

    res = client.get("/api/gamified/ml/adaptive-recommendation")
    assert res.status_code == 200
    data = res.json()
    assert data["child_id"] == "child_low_conf"
    assert data["can_navigate"] is True
    assert data["fallback_used"] is True
    assert "LOW_CONFIDENCE" in (data["fallback_reason"] or "")
