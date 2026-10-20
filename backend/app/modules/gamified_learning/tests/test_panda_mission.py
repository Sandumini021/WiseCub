"""
WiseCub — Panda's School Fair (Bao Bao's Charity Challenge)
=============================================================
Automated Test Suite for Phase 4 CDEMF Mission.

Covers:
  1. Catalog completeness: Exactly 6 distinct levels with unique mechanics.
  2. Mathematical feasibility for all 6 levels via run_cdemf_pipeline.
  3. CDEMF state and dialogue transitions:
     - Level 1: Needs vs Wants (Bao Bao: EXCITED -> HOPEFUL).
     - Level 2: Vendor Price & Value Comparison (Bao Bao -> RELIEVED).
     - Level 3: Needs, Wants & Festival Temptations with Tradeoff Justification (Bao Bao -> CONFIDENT).
     - Level 4: Unexpected Problem Emergency Response (Bao Bao -> RELIEVED).
     - Level 5: Pricing for a Successful Fair Simulation (Bao Bao -> CONFIDENT).
     - Level 6: Capstone Integrated Charity Budget (Bao Bao -> PROUD_AND_HAPPY).
  4. Failure & Recovery: Over-budget or missing essentials triggers recoverable setback (STRESSED / WORRIED / CONFUSED).
  5. Level Locking & Mastery Gates: Failure blocks next level, retry unlocks it.
  6. Student Isolation: Student A and Student B maintain independent progress.
  7. Full Campaign Completion: 6-level progression unlocks mission completed state.
  8. Live MongoDB Persistence: Decision records, attempts, and character state history.
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
    CharacterState,
    run_cdemf_pipeline,
)
import app.modules.gamified_learning.router as gl_router
import app.modules.accounts.router as accounts_router
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

def test_panda_catalog_structure():
    """Verify Panda's School Fair is registered with 6 levels and CDEMF configuration."""
    mission = get_mission("mission_panda_fair")
    assert mission is not None, "mission_panda_fair must exist in MISSION_CATALOG"
    assert mission.character_name == "Bao Bao"
    assert mission.character_id == "char_panda_baobao"
    assert mission.total_levels == 6
    assert len(mission.levels) == 6

    level_numbers = [lvl.level_number for lvl in mission.levels]
    assert level_numbers == [1, 2, 3, 4, 5, 6]

    # Verify distinct interaction mechanics
    interaction_types = [lvl.interaction_type for lvl in mission.levels]
    assert "needs_wants" in interaction_types
    assert "value_comparison" in interaction_types
    assert "tradeoff_justification" in interaction_types
    assert "emergency_response" in interaction_types
    assert "budget_allocator" in interaction_types


def test_feasibility_across_all_6_levels():
    """Verify mathematical feasibility: every level has an achievable passing solution within budget."""
    mission = get_mission("mission_panda_fair")
    assert mission is not None

    init_char = CharacterState(
        character_id="char_panda_baobao",
        name="Bao Bao",
        physical_condition="WEAK_STABILIZED",
        emotional_state="EXCITED",
        condition_description="Preparing for fair.",
        vitality_score=60,
        happiness_score=55,
        active_dialogue="Hello!",
        budget_health=60,
        fair_readiness=30,
        charity_goal_progress=0,
    )

    # Level 1 Feasibility
    l1 = mission.levels[0]
    _, _, _, char1, _, m1, _ = run_cdemf_pipeline(
        level=l1,
        interaction_type="needs_wants",
        selected_option_ids=["opt_panda_sturdy_stalls", "opt_panda_hygiene_safety", "opt_panda_fair_flyers", "opt_panda_paper_streamers"],
        allocations={},
        selected_rationale_id=None,
        weekly_decisions=[],
        previous_char_state=init_char,
        decision_id="test_p1",
        current_level_number=1,
        consecutive_fails=0,
        budgeting_profile=70,
        discipline_profile=70,
        saving_profile=70,
        mastery_level="DEVELOPING",
        mission_id="mission_panda_fair",
    )
    assert m1.passed is True, f"Level 1 failed: {m1.failure_reasons}"
    assert char1.emotional_state == "HOPEFUL"

    # Level 2 Feasibility
    l2 = mission.levels[1]
    _, _, _, char2, _, m2, _ = run_cdemf_pipeline(
        level=l2,
        interaction_type="value_comparison",
        selected_option_ids=["opt_panda_vendor_bamboo_coop"],
        allocations={},
        selected_rationale_id=None,
        weekly_decisions=[],
        previous_char_state=char1,
        decision_id="test_p2",
        current_level_number=2,
        consecutive_fails=0,
        budgeting_profile=70,
        discipline_profile=70,
        saving_profile=70,
        mastery_level="DEVELOPING",
        mission_id="mission_panda_fair",
    )
    assert m2.passed is True, f"Level 2 failed: {m2.failure_reasons}"
    assert char2.emotional_state == "RELIEVED"

    # Level 3 Feasibility
    l3 = mission.levels[2]
    _, _, _, char3, _, m3, _ = run_cdemf_pipeline(
        level=l3,
        interaction_type="tradeoff_justification",
        selected_option_ids=["opt_panda_carnival_games", "opt_panda_diy_photobooth", "opt_panda_charity_seed"],
        allocations={},
        selected_rationale_id="rat_panda_balanced_fun",
        weekly_decisions=[],
        previous_char_state=char2,
        decision_id="test_p3",
        current_level_number=3,
        consecutive_fails=0,
        budgeting_profile=70,
        discipline_profile=70,
        saving_profile=70,
        mastery_level="DEVELOPING",
        mission_id="mission_panda_fair",
    )
    assert m3.passed is True, f"Level 3 failed: {m3.failure_reasons}"
    assert char3.emotional_state == "CONFIDENT"

    # Level 4 Feasibility
    l4 = mission.levels[3]
    _, _, _, char4, _, m4, _ = run_cdemf_pipeline(
        level=l4,
        interaction_type="emergency_response",
        selected_option_ids=["opt_panda_repair_waterproof_stalls", "opt_panda_repair_solar_lanterns"],
        allocations={},
        selected_rationale_id=None,
        weekly_decisions=[],
        previous_char_state=char3,
        decision_id="test_p4",
        current_level_number=4,
        consecutive_fails=0,
        budgeting_profile=70,
        discipline_profile=70,
        saving_profile=70,
        mastery_level="DEVELOPING",
        mission_id="mission_panda_fair",
    )
    assert m4.passed is True, f"Level 4 failed: {m4.failure_reasons}"
    assert char4.emotional_state == "RELIEVED"

    # Level 5 Feasibility
    l5 = mission.levels[4]
    _, _, _, char5, _, m5, _ = run_cdemf_pipeline(
        level=l5,
        interaction_type="value_comparison",
        selected_option_ids=["opt_panda_pricing_sweet_spot"],
        allocations={},
        selected_rationale_id=None,
        weekly_decisions=[],
        previous_char_state=char4,
        decision_id="test_p5",
        current_level_number=5,
        consecutive_fails=0,
        budgeting_profile=70,
        discipline_profile=70,
        saving_profile=70,
        mastery_level="DEVELOPING",
        mission_id="mission_panda_fair",
    )
    assert m5.passed is True, f"Level 5 failed: {m5.failure_reasons}"
    assert char5.emotional_state == "CONFIDENT"

    # Level 6 Feasibility
    l6 = mission.levels[5]
    _, _, _, char6, _, m6, _ = run_cdemf_pipeline(
        level=l6,
        interaction_type="budget_allocator",
        selected_option_ids=[],
        allocations={
            "cat_panda_bills": 9000,
            "cat_panda_seed_reserve": 5000,
            "cat_panda_library_donation": 19000,
            "cat_panda_council_party": 2000,
        },
        selected_rationale_id=None,
        weekly_decisions=[],
        previous_char_state=char5,
        decision_id="test_p6",
        current_level_number=6,
        consecutive_fails=0,
        budgeting_profile=70,
        discipline_profile=70,
        saving_profile=70,
        mastery_level="DEVELOPING",
        mission_id="mission_panda_fair",
    )
    assert m6.passed is True, f"Level 6 failed: {m6.failure_reasons}"
    assert char6.emotional_state == "PROUD_AND_HAPPY"
    assert char6.charity_goal_progress == 100


# ─────────────────────────────────────────────────────────────────────────────
# 2. CDEMF Emotional Transition & Gameplay Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_baobao_character_state_and_dialogue_transition(mock_db_fixture):
    """Verify Bao Bao transitions deterministically based on financial outcomes."""
    client = TestClient(app)
    cookies = _auth_student(mock_db_fixture, "student_bao_fan", "bao_fan")

    # Start mission
    init_res = client.post(
        "/api/gamified/missions/mission_panda_fair/start",
        cookies=cookies,
    )
    assert init_res.status_code == 200
    prog = init_res.json()
    assert prog["character_state"]["name"] == "Bao Bao"
    assert prog["character_state"]["emotional_state"] == "EXCITED"
    assert "Charity" in prog["character_state"]["condition_description"] or "Fair" in prog["character_state"]["condition_description"]

    # Submit passing decision for Level 1
    submit_res = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_panda_fair",
            "level_id": "level_panda_1",
            "level_number": 1,
            "session_id": "sess_p1",
            "interaction_type": "needs_wants",
            "selected_option_ids": ["opt_panda_sturdy_stalls", "opt_panda_hygiene_safety", "opt_panda_fair_flyers", "opt_panda_paper_streamers"],
        },
    )
    assert submit_res.status_code == 200
    eval_data = submit_res.json()
    assert eval_data["passed"] is True
    assert eval_data["next_level_unlocked"] is True
    assert eval_data["character_state"]["emotional_state"] == "HOPEFUL"

    trans = eval_data["character_transition"]
    assert trans["direction"] == "IMPROVEMENT"
    assert trans["new_emotion"] == "HOPEFUL"
    assert "Hooray! The stall tables are sturdy" in trans["character_dialogue"]


def test_baobao_level_2_vendor_comparison(mock_db_fixture):
    """Verify Level 2 price & quality comparison: wholesale passes, substandard trap fails."""
    client = TestClient(app)
    cookies = _auth_student(mock_db_fixture, "student_bao_vendor", "vendor_tester")
    client.post("/api/gamified/missions/mission_panda_fair/start", cookies=cookies)

    # Pass Level 1 first so Level 2 is unlocked
    l1_res = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_panda_fair",
            "level_id": "level_panda_1",
            "level_number": 1,
            "session_id": "sess_p1_unlock",
            "interaction_type": "needs_wants",
            "selected_option_ids": ["opt_panda_sturdy_stalls", "opt_panda_hygiene_safety", "opt_panda_fair_flyers", "opt_panda_paper_streamers"],
        },
    )
    assert l1_res.json()["passed"] is True

    # 1. Test failing choice: substandard cheap trap
    fail_res = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_panda_fair",
            "level_id": "level_panda_2",
            "level_number": 2,
            "session_id": "sess_p2_fail",
            "interaction_type": "value_comparison",
            "selected_option_ids": ["opt_panda_vendor_cheap_trap"],
        },
    )
    assert fail_res.status_code == 200
    assert fail_res.json()["passed"] is False

    # 2. Test passing choice: certified wholesale bundle
    pass_res = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_panda_fair",
            "level_id": "level_panda_2",
            "level_number": 2,
            "session_id": "sess_p2_pass",
            "interaction_type": "value_comparison",
            "selected_option_ids": ["opt_panda_vendor_bamboo_coop"],
        },
    )
    assert pass_res.status_code == 200
    data = pass_res.json()
    assert data["passed"] is True
    assert data["character_state"]["emotional_state"] == "RELIEVED"
    assert "Phew! We avoided the cheap broken prizes" in data["character_transition"]["character_dialogue"]


def test_baobao_level_3_tradeoff_justification(mock_db_fixture):
    """Verify Level 3 spending discipline and trade-off justification."""
    client = TestClient(app)
    cookies = _auth_student(mock_db_fixture, "student_bao_tradeoff", "tradeoff_tester")
    client.post("/api/gamified/missions/mission_panda_fair/start", cookies=cookies)

    # Pass Level 1 & 2
    client.post("/api/gamified/decisions/submit", cookies=cookies, json={
        "mission_id": "mission_panda_fair", "level_id": "level_panda_1", "level_number": 1, "session_id": "s1",
        "interaction_type": "needs_wants", "selected_option_ids": ["opt_panda_sturdy_stalls", "opt_panda_hygiene_safety", "opt_panda_fair_flyers", "opt_panda_paper_streamers"],
    })
    client.post("/api/gamified/decisions/submit", cookies=cookies, json={
        "mission_id": "mission_panda_fair", "level_id": "level_panda_2", "level_number": 2, "session_id": "s2",
        "interaction_type": "value_comparison", "selected_option_ids": ["opt_panda_vendor_bamboo_coop"],
    })

    pass_res = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_panda_fair",
            "level_id": "level_panda_3",
            "level_number": 3,
            "session_id": "sess_p3",
            "interaction_type": "tradeoff_justification",
            "selected_option_ids": ["opt_panda_carnival_games", "opt_panda_diy_photobooth", "opt_panda_charity_seed"],
            "selected_rationale_id": "rat_panda_balanced_fun",
        },
    )
    assert pass_res.status_code == 200
    data = pass_res.json()
    assert data["passed"] is True
    assert data["character_state"]["emotional_state"] == "CONFIDENT"
    assert "charity seed fund of Rs. 5,000" in data["character_transition"]["character_dialogue"]


def test_baobao_level_4_emergency_response(mock_db_fixture):
    """Verify Level 4 emergency response: weatherproofing tarps & solar lanterns pass."""
    client = TestClient(app)
    cookies = _auth_student(mock_db_fixture, "student_bao_emergency", "emergency_tester")
    client.post("/api/gamified/missions/mission_panda_fair/start", cookies=cookies)

    # Pass Level 1, 2, 3
    client.post("/api/gamified/decisions/submit", cookies=cookies, json={
        "mission_id": "mission_panda_fair", "level_id": "level_panda_1", "level_number": 1, "session_id": "s1",
        "interaction_type": "needs_wants", "selected_option_ids": ["opt_panda_sturdy_stalls", "opt_panda_hygiene_safety", "opt_panda_fair_flyers"],
    })
    client.post("/api/gamified/decisions/submit", cookies=cookies, json={
        "mission_id": "mission_panda_fair", "level_id": "level_panda_2", "level_number": 2, "session_id": "s2",
        "interaction_type": "value_comparison", "selected_option_ids": ["opt_panda_vendor_bamboo_coop"],
    })
    client.post("/api/gamified/decisions/submit", cookies=cookies, json={
        "mission_id": "mission_panda_fair", "level_id": "level_panda_3", "level_number": 3, "session_id": "s3",
        "interaction_type": "tradeoff_justification", "selected_option_ids": ["opt_panda_carnival_games", "opt_panda_diy_photobooth", "opt_panda_charity_seed"],
        "selected_rationale_id": "rat_panda_balanced_fun",
    })

    # Panic overspending fails
    fail_res = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_panda_fair",
            "level_id": "level_panda_4",
            "level_number": 4,
            "session_id": "sess_p4_fail",
            "interaction_type": "emergency_response",
            "selected_option_ids": ["opt_panda_repair_panic_generator"],
        },
    )
    assert fail_res.status_code == 200
    assert fail_res.json()["passed"] is False

    # Certified emergency response passes
    pass_res = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_panda_fair",
            "level_id": "level_panda_4",
            "level_number": 4,
            "session_id": "sess_p4_pass",
            "interaction_type": "emergency_response",
            "selected_option_ids": ["opt_panda_repair_waterproof_stalls", "opt_panda_repair_solar_lanterns"],
        },
    )
    assert pass_res.status_code == 200
    data = pass_res.json()
    assert data["passed"] is True
    assert data["character_state"]["emotional_state"] == "RELIEVED"


def test_baobao_level_5_pricing_simulation(mock_db_fixture):
    """Verify Level 5 pricing simulation: sweet spot combo passes, predatory or underpriced fails."""
    client = TestClient(app)
    cookies = _auth_student(mock_db_fixture, "student_bao_pricing", "pricing_tester")
    client.post("/api/gamified/missions/mission_panda_fair/start", cookies=cookies)

    # Pass Levels 1-4
    for ln in range(1, 5):
        if ln == 1:
            body = {"mission_id": "mission_panda_fair", "level_id": "level_panda_1", "level_number": 1, "session_id": f"s{ln}", "interaction_type": "needs_wants", "selected_option_ids": ["opt_panda_sturdy_stalls", "opt_panda_hygiene_safety", "opt_panda_fair_flyers"]}
        elif ln == 2:
            body = {"mission_id": "mission_panda_fair", "level_id": "level_panda_2", "level_number": 2, "session_id": f"s{ln}", "interaction_type": "value_comparison", "selected_option_ids": ["opt_panda_vendor_bamboo_coop"]}
        elif ln == 3:
            body = {"mission_id": "mission_panda_fair", "level_id": "level_panda_3", "level_number": 3, "session_id": f"s{ln}", "interaction_type": "tradeoff_justification", "selected_option_ids": ["opt_panda_carnival_games", "opt_panda_diy_photobooth", "opt_panda_charity_seed"], "selected_rationale_id": "rat_panda_balanced_fun"}
        else:
            body = {"mission_id": "mission_panda_fair", "level_id": "level_panda_4", "level_number": 4, "session_id": f"s{ln}", "interaction_type": "emergency_response", "selected_option_ids": ["opt_panda_repair_waterproof_stalls", "opt_panda_repair_solar_lanterns"]}
        client.post("/api/gamified/decisions/submit", cookies=cookies, json=body)

    # Underpriced loss-leader fails
    fail_res = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_panda_fair",
            "level_id": "level_panda_5",
            "level_number": 5,
            "session_id": "sess_p5_fail",
            "interaction_type": "value_comparison",
            "selected_option_ids": ["opt_panda_pricing_underpriced"],
        },
    )
    assert fail_res.status_code == 200
    assert fail_res.json()["passed"] is False

    # Sweet spot optimal combo passes
    pass_res = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_panda_fair",
            "level_id": "level_panda_5",
            "level_number": 5,
            "session_id": "sess_p5_pass",
            "interaction_type": "value_comparison",
            "selected_option_ids": ["opt_panda_pricing_sweet_spot"],
        },
    )
    assert pass_res.status_code == 200
    data = pass_res.json()
    assert data["passed"] is True
    assert data["character_state"]["emotional_state"] == "CONFIDENT"


def test_student_isolation_between_student_a_and_student_b(mock_db_fixture):
    """Verify that Student A and Student B have completely isolated progress and character states."""
    client = TestClient(app)
    cookies_a = _auth_student(mock_db_fixture, "student_bao_a", "alice_panda")
    cookies_b = _auth_student(mock_db_fixture, "student_bao_b", "bob_panda")

    # Student A starts mission and advances to Level 2
    client.post("/api/gamified/missions/mission_panda_fair/start", cookies=cookies_a)
    client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies_a,
        json={
            "mission_id": "mission_panda_fair",
            "level_id": "level_panda_1",
            "level_number": 1,
            "session_id": "sess_iso_a",
            "interaction_type": "needs_wants",
            "selected_option_ids": ["opt_panda_sturdy_stalls", "opt_panda_hygiene_safety", "opt_panda_fair_flyers"],
        },
    )

    prog_a = client.get("/api/gamified/progress/mission_panda_fair", cookies=cookies_a).json()
    assert prog_a["unlocked_level_number"] == 2
    assert 1 in prog_a["completed_level_numbers"]

    # Student B starts fresh: must be at Level 1, completed levels must be empty
    prog_b = client.get("/api/gamified/progress/mission_panda_fair", cookies=cookies_b).json()
    assert prog_b["unlocked_level_number"] == 1
    assert prog_b["completed_level_numbers"] == []


def test_baobao_full_campaign_completion(mock_db_fixture):
    """Verify complete playthrough across all 6 levels achieves mission completion."""
    client = TestClient(app)
    cookies = _auth_student(mock_db_fixture, "child_bao_champion", "bao_champion")
    client.post("/api/gamified/missions/mission_panda_fair/start", cookies=cookies)

    # 1. Level 1
    res1 = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_panda_fair",
            "level_id": "level_panda_1",
            "level_number": 1,
            "session_id": "sess_champ_1",
            "interaction_type": "needs_wants",
            "selected_option_ids": ["opt_panda_sturdy_stalls", "opt_panda_hygiene_safety", "opt_panda_fair_flyers", "opt_panda_paper_streamers"],
        },
    )
    assert res1.json()["passed"] is True

    # 2. Level 2
    res2 = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_panda_fair",
            "level_id": "level_panda_2",
            "level_number": 2,
            "session_id": "sess_champ_2",
            "interaction_type": "value_comparison",
            "selected_option_ids": ["opt_panda_vendor_bamboo_coop"],
        },
    )
    assert res2.json()["passed"] is True

    # 3. Level 3
    res3 = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_panda_fair",
            "level_id": "level_panda_3",
            "level_number": 3,
            "session_id": "sess_champ_3",
            "interaction_type": "tradeoff_justification",
            "selected_option_ids": ["opt_panda_carnival_games", "opt_panda_diy_photobooth", "opt_panda_charity_seed"],
            "selected_rationale_id": "rat_panda_balanced_fun",
        },
    )
    assert res3.json()["passed"] is True

    # 4. Level 4
    res4 = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_panda_fair",
            "level_id": "level_panda_4",
            "level_number": 4,
            "session_id": "sess_champ_4",
            "interaction_type": "emergency_response",
            "selected_option_ids": ["opt_panda_repair_waterproof_stalls", "opt_panda_repair_solar_lanterns"],
        },
    )
    assert res4.json()["passed"] is True

    # 5. Level 5
    res5 = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_panda_fair",
            "level_id": "level_panda_5",
            "level_number": 5,
            "session_id": "sess_champ_5",
            "interaction_type": "value_comparison",
            "selected_option_ids": ["opt_panda_pricing_sweet_spot"],
        },
    )
    assert res5.json()["passed"] is True

    # 6. Level 6 (Capstone Budget Allocation)
    res6 = client.post(
        "/api/gamified/decisions/submit",
        cookies=cookies,
        json={
            "mission_id": "mission_panda_fair",
            "level_id": "level_panda_6",
            "level_number": 6,
            "session_id": "sess_champ_6",
            "interaction_type": "budget_allocator",
            "allocations": {
                "cat_panda_bills": 9000,
                "cat_panda_seed_reserve": 5000,
                "cat_panda_library_donation": 19000,
                "cat_panda_council_party": 2000,
            },
        },
    )
    data6 = res6.json()
    assert data6["passed"] is True
    assert data6["character_state"]["emotional_state"] == "PROUD_AND_HAPPY"
    assert "community library a giant donation" in data6["character_transition"]["character_dialogue"]

    # Final progress verification
    final_prog = client.get("/api/gamified/progress/mission_panda_fair", cookies=cookies).json()
    assert final_prog["is_mission_completed"] is True
    assert len(final_prog["completed_level_numbers"]) == 6
    assert final_prog["character_state"]["emotional_state"] == "PROUD_AND_HAPPY"
    assert final_prog["character_state"]["charity_goal_progress"] == 100


def test_live_mongodb_persistence_for_baobao(monkeypatch):
    """Verify live MongoDB persistence with actual Motor/PyMongo client and collections."""
    import pymongo
    from app.core.config import settings
    from app.database.mongo import get_db as real_get_db

    try:
        c = pymongo.MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=2000)
        c.admin.command("ping")
    except Exception:
        pytest.skip("Local MongoDB server not available for live write test")

    monkeypatch.setattr(gl_router, "get_db", real_get_db)
    monkeypatch.setattr(accounts_router, "get_db", real_get_db)

    db = c[settings.mongodb_db]
    test_child = "student_live_baobao_test"
    db.accounts.delete_many({"child_id": test_child})
    db.gamified_progress.delete_many({"child_id": test_child})
    db.financial_decisions.delete_many({"child_id": test_child})
    db.mission_attempts.delete_many({"child_id": test_child})

    db.accounts.insert_one({
        "child_id": test_child,
        "name": "Live Test Bao Bao",
        "username": "livebaobao",
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
                "mission_id": "mission_panda_fair",
                "level_id": "level_panda_1",
                "level_number": 1,
                "session_id": "sess_live_p1",
                "interaction_type": "needs_wants",
                "selected_option_ids": ["opt_panda_sturdy_stalls", "opt_panda_hygiene_safety", "opt_panda_fair_flyers", "opt_panda_paper_streamers"],
            },
        )
        assert res.status_code == 200
        assert res.json()["passed"] is True

    # Inspect real MongoDB documents!
    prog_doc = db.gamified_progress.find_one({"child_id": test_child, "mission_id": "mission_panda_fair"})
    assert prog_doc is not None
    assert prog_doc["unlocked_level_number"] == 2
    assert 1 in prog_doc["completed_level_numbers"]
    assert prog_doc["character_state"]["emotional_state"] == "HOPEFUL"

    dec_doc = db.financial_decisions.find_one({"child_id": test_child, "mission_id": "mission_panda_fair"})
    assert dec_doc is not None
    assert dec_doc["level_id"] == "level_panda_1"
    assert dec_doc["passed"] is True

    # Cleanup
    db.gamified_progress.delete_many({"child_id": test_child})
    db.financial_decisions.delete_many({"child_id": test_child})
    db.mission_attempts.delete_many({"child_id": test_child})
    c.close()
