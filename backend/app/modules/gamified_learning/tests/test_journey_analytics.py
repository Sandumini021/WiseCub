"""
Tests for My Money Journey Analytics & Rewards Endpoints
=========================================================
Covers:
  1. GET /api/gamified/journey/overview requires authentication
  2. GET /api/gamified/journey/overview for new student (insufficient evidence handled gracefully)
  3. GET /api/gamified/journey/overview with multi-mission progress & verified badge unlocks
  4. Resilient Learner badge unlocked only upon verified retry pass
  5. Emotional Story Impact showcase returns CDEMF state transitions
  6. GET /api/gamified/journey/mission-details/{mission_id} returns level progression breakdown
  7. 404 returned for nonexistent mission details
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

import app.modules.gamified_learning.router as gl_router
import app.modules.accounts.router as accounts_router
from app.main import app
from app.modules.accounts.security import COOKIE_NAME, issue_token
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


def _seed_account(fakedb, child_id: str = "child_analytics_test", name: str = "Journey Explorer"):
    fakedb.accounts.docs.append({
        "child_id": child_id,
        "name": name,
        "username": "explorer_test",
        "created_at": "2026-10-20T10:00:00Z",
    })
    token = issue_token(child_id, "student", remember=False)
    return token, child_id


def test_journey_overview_unauthorized(client):
    """Calling journey overview without valid cookie must return 401."""
    res = client.get("/api/gamified/journey/overview")
    assert res.status_code == 401


def test_journey_overview_new_student(client, fakedb):
    """A fresh student has 0 completed levels, insufficient evidence for skills, and locked badges."""
    token, child_id = _seed_account(fakedb, "child_fresh_01", "Amara Silva")
    client.cookies.set(COOKIE_NAME, token)

    res = client.get("/api/gamified/journey/overview")
    assert res.status_code == 200
    data = res.json()

    assert data["student_name"] == "Amara Silva"
    assert data["child_id"] == "child_fresh_01"

    overview = data["overview"]
    assert overview["total_missions_completed"] == 0
    assert overview["total_missions_count"] == 3
    assert overview["total_levels_completed"] == 0
    assert overview["total_levels_count"] == 20
    assert overview["overall_competency_score"] is None
    assert overview["earned_coins"] == 0
    assert overview["mastery_tier"] == "Explorer"
    assert overview["active_mission_id"] == "mission_rescue_puppy"
    assert overview["next_recommended_level"] == 1

    # 3 missions represented
    missions = data["missions"]
    assert len(missions) == 3
    mission_ids = [m["mission_id"] for m in missions]
    assert "mission_rescue_puppy" in mission_ids
    assert "mission_squirrel_savings" in mission_ids
    assert "mission_panda_fair" in mission_ids
    for m in missions:
        assert m["completed_levels_count"] == 0
        assert m["competency_status"] == "Not Started"

    # 7 financial skills - all with insufficient evidence
    skills = data["financial_skills_profile"]
    assert len(skills) == 7
    for s in skills:
        assert s["has_sufficient_evidence"] is False
        assert s["score"] is None
        assert s["status"] == "insufficient_evidence"

    # 5 badges - all locked
    badges = data["achievements"]
    assert len(badges) == 5
    for b in badges:
        assert b["unlocked"] is False

    # Learning tips present
    tips = data["learning_tips"]
    assert len(tips) >= 2


def test_journey_overview_with_progress_and_badge_unlocks(client, fakedb):
    """Verified student progress unlocks corresponding badges and computes evidence-based scores."""
    token, child_id = _seed_account(fakedb, "child_master_02", "Kasun Perera")
    client.cookies.set(COOKIE_NAME, token)

    # 1. Seed puppy progress: 4 levels completed
    fakedb.gamified_progress.docs.append({
        "child_id": child_id,
        "mission_id": "mission_rescue_puppy",
        "unlocked_level_number": 5,
        "completed_level_numbers": [1, 2, 3, 4],
        "is_mission_completed": False,
        "earned_coins": 400,
        "character_state": {
            "character_id": "barnaby_puppy",
            "name": "Barnaby",
            "physical_condition": "RECOVERING",
            "emotional_state": "HAPPY",
            "condition_description": "Barnaby is healing nicely.",
            "vitality_score": 75,
            "happiness_score": 80,
            "active_dialogue": "Tail wag!",
        },
    })

    # 2. Seed squirrel progress: 3 levels completed
    fakedb.gamified_progress.docs.append({
        "child_id": child_id,
        "mission_id": "mission_squirrel_savings",
        "unlocked_level_number": 4,
        "completed_level_numbers": [1, 2, 3],
        "is_mission_completed": False,
        "earned_coins": 300,
        "character_state": {
            "character_id": "nutty_squirrel",
            "name": "Nutty",
            "physical_condition": "WELL_FED",
            "emotional_state": "CONTENT",
            "condition_description": "Nutty has cozy winter stores.",
            "vitality_score": 70,
            "happiness_score": 75,
            "active_dialogue": "Squeak!",
        },
    })

    # 3. Seed panda progress: 3 levels completed
    fakedb.gamified_progress.docs.append({
        "child_id": child_id,
        "mission_id": "mission_panda_fair",
        "unlocked_level_number": 4,
        "completed_level_numbers": [1, 2, 3],
        "is_mission_completed": False,
        "earned_coins": 300,
        "character_state": {
            "character_id": "bao_bao_panda",
            "name": "Bao Bao",
            "physical_condition": "PREPARED",
            "emotional_state": "PROUD",
            "condition_description": "Fair stalls organized.",
            "vitality_score": 80,
            "happiness_score": 85,
            "active_dialogue": "Ready for the charity fair!",
        },
    })

    # 4. Seed competency assessments with realistic evidence
    fakedb.competency_assessments.docs.append({
        "child_id": child_id,
        "mission_id": "mission_rescue_puppy",
        "level_number": 1,
        "attempt_number": 1,
        "passed": True,
        "budgeting_skill": 85,
        "spending_discipline": 80,
        "saving_behavior": 70,
        "investment_awareness": 75,
        "goal_achievement": 80,
        "overall_score": 80,
        "secondary_scores": {
            "prioritization": 90,
            "emergency_preparedness": 60,
        },
        "assessed_at": "2026-10-20T10:10:00Z",
    })
    fakedb.competency_assessments.docs.append({
        "child_id": child_id,
        "mission_id": "mission_squirrel_savings",
        "level_number": 2,
        "attempt_number": 1,
        "passed": True,
        "budgeting_skill": 75,
        "spending_discipline": 85,
        "saving_behavior": 90,
        "investment_awareness": 80,
        "goal_achievement": 85,
        "overall_score": 83,
        "secondary_scores": {
            "prioritization": 85,
            "emergency_preparedness": 70,
        },
        "assessed_at": "2026-10-20T10:20:00Z",
    })

    # 5. Seed mission attempts with a retry pass (level 3 attempt 1 failed, attempt 2 passed)
    fakedb.mission_attempts.docs.append({
        "child_id": child_id,
        "mission_id": "mission_rescue_puppy",
        "level_number": 3,
        "attempt_number": 1,
        "passed": False,
        "overall_score": 45,
    })
    fakedb.mission_attempts.docs.append({
        "child_id": child_id,
        "mission_id": "mission_rescue_puppy",
        "level_number": 3,
        "attempt_number": 2,
        "passed": True,
        "overall_score": 88,
    })

    # 6. Seed character state history
    fakedb.character_state_history.docs.append({
        "child_id": child_id,
        "mission_id": "mission_rescue_puppy",
        "level_number": 3,
        "attempt_number": 2,
        "physical_condition": "RECOVERING",
        "emotional_state": "HAPPY",
        "vitality_score": 75,
        "happiness_score": 80,
        "transition_direction": "POSITIVE",
        "transition_reason": "Purchased certified orthopedic splint within budget.",
        "character_dialogue": "Woof! My leg feels much better!",
        "learning_explanation": "Prioritizing certified medical essentials over luxury items saved money and healed Barnaby.",
        "visual_cue": "Barnaby standing with splint",
        "recorded_at": "2026-10-20T10:30:00Z",
    })

    res = client.get("/api/gamified/journey/overview")
    assert res.status_code == 200
    data = res.json()

    overview = data["overview"]
    assert overview["total_levels_completed"] == 10  # 4 + 3 + 3
    assert overview["total_levels_count"] == 20
    assert overview["earned_coins"] == 1000  # 400 + 300 + 300
    assert overview["mastery_tier"] == "Money Smart"  # >= 10 levels
    assert overview["overall_competency_score"] == 82  # (80 + 83) / 2 = 81.5 -> 82

    # Check badges: all 5 should be unlocked!
    badges = {b["id"]: b for b in data["achievements"]}
    assert badges["badge_caring_budgeter"]["unlocked"] is True
    assert badges["badge_winter_savings_hero"]["unlocked"] is True
    assert badges["badge_smart_fair_planner"]["unlocked"] is True
    assert badges["badge_money_skills_explorer"]["unlocked"] is True
    assert badges["badge_resilient_learner"]["unlocked"] is True

    # Check skills have evidence and realistic scores
    skills = {s["skill_key"]: s for s in data["financial_skills_profile"]}
    assert skills["budgeting"]["has_sufficient_evidence"] is True
    assert skills["budgeting"]["score"] == 80  # (85 + 75) / 2
    assert skills["saving"]["score"] == 80     # (70 + 90) / 2
    assert skills["needs_wants"]["score"] == 88 # (90 + 85) / 2

    # Check emotional impact showcase contains the retry recovery event
    showcase = data["emotional_impact_showcase"]
    assert len(showcase) >= 1
    recent = showcase[0]
    assert recent["character_name"] == "Barnaby"
    assert recent["improved_after_retry"] is True
    assert recent["direction"] == "POSITIVE"


def test_journey_mission_detail_endpoint(client, fakedb):
    """GET /api/gamified/journey/mission-details/{mission_id} returns detailed progression tree."""
    token, child_id = _seed_account(fakedb, "child_detail_03", "Nimal Perera")
    client.cookies.set(COOKIE_NAME, token)

    fakedb.gamified_progress.docs.append({
        "child_id": child_id,
        "mission_id": "mission_squirrel_savings",
        "unlocked_level_number": 3,
        "completed_level_numbers": [1, 2],
        "is_mission_completed": False,
        "earned_coins": 200,
        "attempts_by_level": {
            "1": [{"attempt_number": 1, "passed": True, "score": 90}],
            "2": [{"attempt_number": 1, "passed": True, "score": 85}],
        },
    })

    res = client.get("/api/gamified/journey/mission-details/mission_squirrel_savings")
    assert res.status_code == 200
    data = res.json()

    assert data["mission_id"] == "mission_squirrel_savings"
    assert data["total_levels"] == 6
    assert data["completed_levels_count"] == 2
    assert data["progress_percent"] == 33  # 2/6 = 33%

    levels = data["levels"]
    assert len(levels) == 6
    assert levels[0]["level_number"] == 1
    assert levels[0]["status"] == "COMPLETED"
    assert levels[0]["best_score"] == 90

    assert levels[1]["level_number"] == 2
    assert levels[1]["status"] == "COMPLETED"
    assert levels[1]["best_score"] == 85

    assert levels[2]["level_number"] == 3
    assert levels[2]["status"] == "CURRENT"

    assert levels[3]["level_number"] == 4
    assert levels[3]["status"] == "LOCKED"


def test_journey_mission_detail_not_found(client, fakedb):
    """Nonexistent mission returns 404."""
    token, _ = _seed_account(fakedb, "child_404", "Ghost")
    client.cookies.set(COOKIE_NAME, token)

    res = client.get("/api/gamified/journey/mission-details/mission_does_not_exist")
    assert res.status_code == 404
