"""
WiseCub — Squirrel's Winter Savings (Nutty's Winter Survival Story)
===================================================================
Automated Test Suite for the 6-Level CDEMF Mission.

Covers:
  1. Catalog completeness: 6 distinct levels with unique mechanics.
  2. Mathematical feasibility for all 6 levels.
  3. Level 1: Needs vs Wants (spending discipline, Nutty: WORRIED -> HOPEFUL).
  4. Level 2: Budget Allocator (saving behavior, Nutty: HOPEFUL -> CONFIDENT).
  5. Level 3: Multi-Period Saving (delayed gratification across 3 weeks).
  6. Level 4: Emergency Response (unexpected rain flood, reserve deployment).
  7. Level 5: Trade-off Justification (complex freeze decision + rationale).
  8. Level 6: Capstone Integrated Winter Budget (Nutty: HAPPY_AND_SECURE).
  9. Level Locking & Mastery Gates: Failure blocks next level, retry succeeds.
 10. Student Isolation: Student A and Student B maintain independent progress.
 11. Live MongoDB Persistence: Decision records, attempts, and character state history.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.accounts.security import hash_password, issue_token, COOKIE_NAME
from app.modules.gamified_learning.catalog import (
    MISSION_CATALOG,
    get_mission,
    get_level,
)
from app.modules.gamified_learning.engine import (
    run_cdemf_pipeline,
    simulate_option_selections,
    simulate_category_allocations,
    simulate_multi_period_savings,
    evaluate_competencies,
    evaluate_mastery,
)
import app.modules.gamified_learning.router as gl_router
import app.modules.accounts.router as accounts_router


# ─────────────────────────────────────────────────────────────────────────────
# Test Fixtures & Fakes
# ─────────────────────────────────────────────────────────────────────────────

from app.modules.gamified_learning.tests.test_gamified import FakeColl, FakeDB


@pytest.fixture(autouse=True)
def mock_db_fixture(monkeypatch):
    fake_db = FakeDB()
    monkeypatch.setattr(gl_router, "get_db", lambda: fake_db)
    monkeypatch.setattr(accounts_router, "get_db", lambda: fake_db)
    return fake_db


def _auth_student(fake_db: FakeDB, child_id: str, username: str) -> dict[str, str]:
    fake_db.accounts.docs.append({
        "child_id": child_id,
        "name": username.capitalize(),
        "username": username,
        "email": "",
        "role": "student",
        "age": "14",
        "gender": "",
        "avatar_id": "",
        "language": "en",
        "class_code": "",
        "institution": "",
        "password_hash": hash_password("pass1234"),
        "demo": True,
    })
    token = issue_token(child_id, "student", remember=False)
    return {COOKIE_NAME: token}


# ─────────────────────────────────────────────────────────────────────────────
# 1. Catalog & Structure Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_squirrel_catalog_structure():
    mission = get_mission("mission_squirrel_savings")
    assert mission is not None
    assert mission.character_name == "Nutty"
    assert mission.character_id == "char_squirrel_nutty"
    assert mission.total_levels == 6
    assert len(mission.levels) == 6

    # Verify mechanics are distinct
    interactions = [lvl.interaction_type for lvl in mission.levels]
    assert interactions[0] == "needs_wants"
    assert interactions[1] == "budget_allocator"
    assert interactions[2] == "multi_period_saving"
    assert interactions[3] == "emergency_response"
    assert interactions[4] == "tradeoff_justification"
    assert interactions[5] == "budget_allocator"


def test_feasibility_across_all_6_levels():
    """Verify that every single level has at least one valid winning choice that passes 100%."""
    from app.modules.gamified_learning.engine import CharacterState
    mission = get_mission("mission_squirrel_savings")
    assert mission is not None

    init_char = CharacterState(
        character_id="char_squirrel_nutty",
        name="Nutty",
        physical_condition="NEEDS_CARE",
        emotional_state="WORRIED",
        condition_description="Pantry is low.",
        vitality_score=40,
        happiness_score=35,
        active_dialogue="Chirp!",
    )

    # Level 1 Feasibility
    l1 = mission.levels[0]
    _, _, _, char1, _, m1, _ = run_cdemf_pipeline(
        level=l1,
        interaction_type="needs_wants",
        selected_option_ids=["opt_sq_essential_nuts", "opt_sq_shelter_patch"],
        allocations={},
        selected_rationale_id=None,
        weekly_decisions=[],
        previous_char_state=init_char,
        decision_id="test_d1",
        current_level_number=1,
        consecutive_fails=0,
        budgeting_profile=70,
        discipline_profile=70,
        saving_profile=70,
        mastery_level="DEVELOPING",
        mission_id="mission_squirrel_savings",
    )
    assert m1.passed is True, f"Level 1 failed: {m1.failure_reasons}"

    # Level 2 Feasibility
    l2 = mission.levels[1]
    _, _, _, char2, _, m2, _ = run_cdemf_pipeline(
        level=l2,
        interaction_type="budget_allocator",
        selected_option_ids=[],
        allocations={
            "cat_sq_winter_food": 3000,
            "cat_sq_weatherproofing": 1500,
            "cat_sq_emergency_reserve": 3000,
            "cat_sq_decorations": 500,
        },
        selected_rationale_id=None,
        weekly_decisions=[],
        previous_char_state=char1,
        decision_id="test_d2",
        current_level_number=2,
        consecutive_fails=0,
        budgeting_profile=70,
        discipline_profile=70,
        saving_profile=70,
        mastery_level="DEVELOPING",
        mission_id="mission_squirrel_savings",
    )
    assert m2.passed is True, f"Level 2 failed: {m2.failure_reasons}"

    # Level 3 Feasibility
    l3 = mission.levels[2]
    _, _, _, char3, _, m3, _ = run_cdemf_pipeline(
        level=l3,
        interaction_type="multi_period_saving",
        selected_option_ids=[],
        allocations={},
        selected_rationale_id=None,
        weekly_decisions=[
            {"period": 1, "saved_amount_lkr": 3000, "resisted_temptation": True},
            {"period": 2, "saved_amount_lkr": 3000, "resisted_temptation": True},
            {"period": 3, "saved_amount_lkr": 2000, "resisted_temptation": True},
        ],
        previous_char_state=char2,
        decision_id="test_d3",
        current_level_number=3,
        consecutive_fails=0,
        budgeting_profile=70,
        discipline_profile=70,
        saving_profile=70,
        mastery_level="DEVELOPING",
        mission_id="mission_squirrel_savings",
    )
    assert m3.passed is True, f"Level 3 failed: {m3.failure_reasons}"

    # Level 4 Feasibility
    l4 = mission.levels[3]
    _, _, _, char4, _, m4, _ = run_cdemf_pipeline(
        level=l4,
        interaction_type="emergency_response",
        selected_option_ids=["opt_sq_emergency_seed_bulk", "opt_sq_tarp_seal_patch"],
        allocations={},
        selected_rationale_id=None,
        weekly_decisions=[],
        previous_char_state=char3,
        decision_id="test_d4",
        current_level_number=4,
        consecutive_fails=0,
        budgeting_profile=70,
        discipline_profile=70,
        saving_profile=70,
        mastery_level="DEVELOPING",
        mission_id="mission_squirrel_savings",
    )
    assert m4.passed is True, f"Level 4 failed: {m4.failure_reasons}"

    # Level 5 Feasibility
    l5 = mission.levels[4]
    _, _, _, char5, _, m5, _ = run_cdemf_pipeline(
        level=l5,
        interaction_type="tradeoff_justification",
        selected_option_ids=["opt_sq_thick_moss_insulation", "opt_sq_protein_walnut_pack"],
        allocations={},
        selected_rationale_id="rat_sq_safety_first",
        weekly_decisions=[],
        previous_char_state=char4,
        decision_id="test_d5",
        current_level_number=5,
        consecutive_fails=0,
        budgeting_profile=70,
        discipline_profile=70,
        saving_profile=70,
        mastery_level="DEVELOPING",
        mission_id="mission_squirrel_savings",
    )
    assert m5.passed is True, f"Level 5 failed: {m5.failure_reasons}"

    # Level 6 Feasibility
    l6 = mission.levels[5]
    _, _, _, char6, _, m6, _ = run_cdemf_pipeline(
        level=l6,
        interaction_type="budget_allocator",
        selected_option_ids=[],
        allocations={
            "cat_sq_deep_winter_food": 5000,
            "cat_sq_hollow_fortification": 3500,
            "cat_sq_snowstorm_contingency": 3000,
            "cat_sq_festive_celebration": 500,
        },
        selected_rationale_id=None,
        weekly_decisions=[],
        previous_char_state=char5,
        decision_id="test_d6",
        current_level_number=6,
        consecutive_fails=0,
        budgeting_profile=70,
        discipline_profile=70,
        saving_profile=70,
        mastery_level="DEVELOPING",
        mission_id="mission_squirrel_savings",
    )
    assert m6.passed is True, f"Level 6 failed: {m6.failure_reasons}"
    assert char6.emotional_state == "HAPPY_AND_SECURE"


# ─────────────────────────────────────────────────────────────────────────────
# 2. CDEMF Emotional Transition & Gameplay Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_nutty_character_state_and_dialogue_transition(mock_db_fixture):
    """Verify Nutty transitions through appropriate emotions and dialogues."""
    client = TestClient(app)
    cookies = _auth_student(mock_db_fixture, "student_nutty_fan", "nutty_fan")

    # Start mission
    init_res = client.post(
        "/api/gamified/missions/mission_squirrel_savings/start",
        cookies=cookies,
    )
    assert init_res.status_code == 200
    prog = init_res.json()
    assert prog["character_state"]["name"] == "Nutty"
    assert prog["character_state"]["emotional_state"] == "WORRIED"
    assert "Nutty" in prog["character_state"]["condition_description"] or "pantry" in prog["character_state"]["condition_description"]

    # Submit Level 1 decision
    dec_res = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_squirrel_savings",
            "level_id": "level_squirrel_1",
            "level_number": 1,
            "session_id": "sess_sq_1",
            "interaction_type": "needs_wants",
            "selected_option_ids": ["opt_sq_essential_nuts", "opt_sq_shelter_patch"],
        },
    )
    assert dec_res.status_code == 200
    eval_out = dec_res.json()
    assert eval_out["passed"] is True
    assert eval_out["character_state"]["emotional_state"] == "HOPEFUL"
    assert eval_out["next_level_unlocked"] is True


def test_nutty_level_2_allocation_and_savings_reserve(mock_db_fixture):
    client = TestClient(app)
    cookies = _auth_student(mock_db_fixture, "student_nutty_fan_2", "nutty_fan_2")

    # Pass Level 1 first
    client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_squirrel_savings",
            "level_id": "level_squirrel_1",
            "level_number": 1,
            "session_id": "sess_sq_1",
            "interaction_type": "needs_wants",
            "selected_option_ids": ["opt_sq_essential_nuts", "opt_sq_shelter_patch"],
        },
    )

    # Level 2 decision: Valid allocation with >= 2,500 emergency reserve
    res = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_squirrel_savings",
            "level_id": "level_squirrel_2",
            "level_number": 2,
            "session_id": "sess_sq_2",
            "interaction_type": "budget_allocator",
            "allocations": {
                "cat_sq_winter_food": 3000,
                "cat_sq_weatherproofing": 1500,
                "cat_sq_emergency_reserve": 3000,
                "cat_sq_decorations": 500,
            },
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["passed"] is True
    assert data["character_state"]["emotional_state"] == "CONFIDENT"
    assert data["next_level_unlocked"] is True


def test_nutty_level_3_multi_period_savings(mock_db_fixture):
    client = TestClient(app)
    cookies = _auth_student(mock_db_fixture, "student_nutty_saver", "nutty_saver")

    # Pass Level 1 & 2
    client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_squirrel_savings",
            "level_id": "level_squirrel_1",
            "level_number": 1,
            "session_id": "s1",
            "interaction_type": "needs_wants",
            "selected_option_ids": ["opt_sq_essential_nuts", "opt_sq_shelter_patch"],
        },
    )
    client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_squirrel_savings",
            "level_id": "level_squirrel_2",
            "level_number": 2,
            "session_id": "s2",
            "interaction_type": "budget_allocator",
            "allocations": {
                "cat_sq_winter_food": 3000,
                "cat_sq_weatherproofing": 1500,
                "cat_sq_emergency_reserve": 3000,
                "cat_sq_decorations": 500,
            },
        },
    )

    # Submit Level 3 multi-period saving
    res = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_squirrel_savings",
            "level_id": "level_squirrel_3",
            "level_number": 3,
            "session_id": "s3",
            "interaction_type": "multi_period_saving",
            "weekly_decisions": [
                {"period": 1, "saved_amount_lkr": 3000, "resisted_temptation": True},
                {"period": 2, "saved_amount_lkr": 3000, "resisted_temptation": True},
                {"period": 3, "saved_amount_lkr": 2000, "resisted_temptation": True},
            ],
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["passed"] is True
    assert data["character_state"]["emotional_state"] == "RELIEVED"
    assert data["next_level_unlocked"] is True


def test_student_isolation_between_student_a_and_student_b(mock_db_fixture):
    """Verify Student A and Student B maintain independent progress."""
    client = TestClient(app)
    cookies_a = _auth_student(mock_db_fixture, "student_alpha", "alpha")
    cookies_b = _auth_student(mock_db_fixture, "student_beta", "beta")

    # Student A plays Level 1 and passes
    res_a = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies_a,
        json={
            "mission_id": "mission_squirrel_savings",
            "level_id": "level_squirrel_1",
            "level_number": 1,
            "session_id": "sess_a_1",
            "interaction_type": "needs_wants",
            "selected_option_ids": ["opt_sq_essential_nuts", "opt_sq_shelter_patch"],
        },
    )
    assert res_a.status_code == 200
    assert res_a.json()["next_level_unlocked"] is True

    # Student A progress check -> unlocked level 2
    prog_a = client.get(
        "/api/gamified/progress/mission_squirrel_savings",
        cookies=cookies_a,
    ).json()
    assert prog_a["unlocked_level_number"] == 2
    assert 1 in prog_a["completed_level_numbers"]

    # Student B logs in -> starts fresh at level 1
    prog_b = client.get(
        "/api/gamified/progress/mission_squirrel_savings",
        cookies=cookies_b,
    ).json()
    assert prog_b["unlocked_level_number"] == 1
    assert prog_b["completed_level_numbers"] == []
    assert prog_b["character_state"]["emotional_state"] == "WORRIED"


def test_level_lock_enforcement_and_retry(mock_db_fixture):
    """Verify failed attempts lock progression and subsequent retry unlocks it."""
    client = TestClient(app)
    cookies = _auth_student(mock_db_fixture, "student_retrier", "retrier")

    # Fail Level 1 by omitting essential shelter seal
    fail_res = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_squirrel_savings",
            "level_id": "level_squirrel_1",
            "level_number": 1,
            "session_id": "fail_sess_1",
            "interaction_type": "needs_wants",
            "selected_option_ids": ["opt_sq_glitter_feather"],  # Disallowed want!
        },
    )
    assert fail_res.status_code == 200
    fail_data = fail_res.json()
    assert fail_data["passed"] is False
    assert fail_data["next_level_unlocked"] is False
    assert fail_data["character_state"]["emotional_state"] in ("WORRIED", "ANXIOUS")

    # Level 2 must reject start since Level 1 was not passed
    start_l2 = client.post(
        "/api/gamified/levels/start",
        cookies=cookies,
        json={"mission_id": "mission_squirrel_savings", "level_number": 2},
    )
    assert start_l2.status_code == 403

    # Retry Level 1 with correct essentials
    pass_res = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_squirrel_savings",
            "level_id": "level_squirrel_1",
            "level_number": 1,
            "session_id": "retry_sess_1",
            "interaction_type": "needs_wants",
            "selected_option_ids": ["opt_sq_essential_nuts", "opt_sq_shelter_patch"],
        },
    )
    assert pass_res.status_code == 200
    assert pass_res.json()["passed"] is True
    assert pass_res.json()["next_level_unlocked"] is True

    # Now Level 2 start is permitted
    start_l2_ok = client.post(
        "/api/gamified/levels/start",
        cookies=cookies,
        json={"mission_id": "mission_squirrel_savings", "level_number": 2},
    )
    assert start_l2_ok.status_code == 200


def test_nutty_full_campaign_completion(mock_db_fixture):
    """Play through all 6 levels sequentially to achieve full mission completion."""
    client = TestClient(app)
    cookies = _auth_student(mock_db_fixture, "student_champ", "champ")

    # Level 1
    r1 = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_squirrel_savings",
            "level_id": "level_squirrel_1",
            "level_number": 1,
            "session_id": "s1",
            "interaction_type": "needs_wants",
            "selected_option_ids": ["opt_sq_essential_nuts", "opt_sq_shelter_patch"],
        },
    )
    assert r1.status_code == 200 and r1.json()["passed"] is True

    # Level 2
    r2 = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_squirrel_savings",
            "level_id": "level_squirrel_2",
            "level_number": 2,
            "session_id": "s2",
            "interaction_type": "budget_allocator",
            "allocations": {
                "cat_sq_winter_food": 3000,
                "cat_sq_weatherproofing": 1500,
                "cat_sq_emergency_reserve": 3000,
                "cat_sq_decorations": 500,
            },
        },
    )
    assert r2.status_code == 200 and r2.json()["passed"] is True

    # Level 3
    r3 = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_squirrel_savings",
            "level_id": "level_squirrel_3",
            "level_number": 3,
            "session_id": "s3",
            "interaction_type": "multi_period_saving",
            "weekly_decisions": [
                {"period": 1, "saved_amount_lkr": 3000, "resisted_temptation": True},
                {"period": 2, "saved_amount_lkr": 3000, "resisted_temptation": True},
                {"period": 3, "saved_amount_lkr": 2000, "resisted_temptation": True},
            ],
        },
    )
    assert r3.status_code == 200 and r3.json()["passed"] is True

    # Level 4
    r4 = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_squirrel_savings",
            "level_id": "level_squirrel_4",
            "level_number": 4,
            "session_id": "s4",
            "interaction_type": "emergency_response",
            "selected_option_ids": ["opt_sq_emergency_seed_bulk", "opt_sq_tarp_seal_patch"],
        },
    )
    assert r4.status_code == 200 and r4.json()["passed"] is True

    # Level 5
    r5 = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_squirrel_savings",
            "level_id": "level_squirrel_5",
            "level_number": 5,
            "session_id": "s5",
            "interaction_type": "tradeoff_justification",
            "selected_option_ids": ["opt_sq_thick_moss_insulation", "opt_sq_protein_walnut_pack"],
            "selected_rationale_id": "rat_sq_safety_first",
        },
    )
    assert r5.status_code == 200 and r5.json()["passed"] is True

    # Level 6 (Capstone)
    r6 = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_squirrel_savings",
            "level_id": "level_squirrel_6",
            "level_number": 6,
            "session_id": "s6",
            "interaction_type": "budget_allocator",
            "allocations": {
                "cat_sq_deep_winter_food": 5000,
                "cat_sq_hollow_fortification": 3500,
                "cat_sq_snowstorm_contingency": 3000,
                "cat_sq_festive_celebration": 500,
            },
        },
    )
    assert r6.status_code == 200
    res6_data = r6.json()
    assert res6_data["passed"] is True
    assert res6_data["character_state"]["emotional_state"] == "HAPPY_AND_SECURE"

    # Progress check -> Mission Completed
    prog = client.get(
        "/api/gamified/progress/mission_squirrel_savings",
        cookies=cookies,
    ).json()
    assert prog["is_mission_completed"] is True
    assert len(prog["completed_level_numbers"]) == 6


def test_live_mongodb_persistence_for_nutty(monkeypatch):
    """Verify persistence against live running MongoDB."""
    import pymongo
    from app.core.config import settings
    from app.database.mongo import get_db as real_get_db

    try:
        c = pymongo.MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=1500)
        c.admin.command("ping")
    except Exception:
        pytest.skip("Local MongoDB server not available for live write test")

    monkeypatch.setattr(gl_router, "get_db", real_get_db)
    monkeypatch.setattr(accounts_router, "get_db", real_get_db)

    db = c[settings.mongodb_db]
    test_child = "student_live_nutty_test"
    db.accounts.delete_many({"child_id": test_child})
    db.gamified_progress.delete_many({"child_id": test_child})
    db.financial_decisions.delete_many({"child_id": test_child})
    db.mission_attempts.delete_many({"child_id": test_child})

    db.accounts.insert_one({
        "child_id": test_child,
        "name": "Live Test Nutty",
        "username": "livenutty",
        "role": "student",
        "password_hash": hash_password("pass1234"),
    })

    tok = issue_token(test_child, "student", remember=False)
    cookies = {COOKIE_NAME: tok}

    with TestClient(app) as client:
        # Play Level 1 against live backend & live Mongo
        res = client.post(
            "/api/gamified/decisions/submit",
            cookies=cookies,
            json={
                "mission_id": "mission_squirrel_savings",
                "level_id": "level_squirrel_1",
                "level_number": 1,
                "session_id": "sess_live_1",
                "interaction_type": "needs_wants",
                "selected_option_ids": ["opt_sq_essential_nuts", "opt_sq_shelter_patch"],
            },
        )
        assert res.status_code == 200
        assert res.json()["passed"] is True

    # Inspect real MongoDB documents!
    prog_doc = db.gamified_progress.find_one({"child_id": test_child, "mission_id": "mission_squirrel_savings"})
    assert prog_doc is not None
    assert prog_doc["unlocked_level_number"] == 2
    assert 1 in prog_doc["completed_level_numbers"]

    dec_doc = db.financial_decisions.find_one({"child_id": test_child, "mission_id": "mission_squirrel_savings"})
    assert dec_doc is not None
    assert dec_doc["level_id"] == "level_squirrel_1"
    assert dec_doc["passed"] is True

    # Cleanup
    db.gamified_progress.delete_many({"child_id": test_child})
    db.financial_decisions.delete_many({"child_id": test_child})
    db.mission_attempts.delete_many({"child_id": test_child})
    c.close()
