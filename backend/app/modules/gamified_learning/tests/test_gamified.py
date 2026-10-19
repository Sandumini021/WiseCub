"""
WiseCub — Gamified Learning Backend Tests
==========================================
Covers all 12 test scenarios specified in the Phase 2 prompt.

Tests 1-12 use FastAPI's TestClient with a fully in-memory fake MongoDB so
no live database is required.  The fake honors upsert, $set, $push,
$addToSet, $max, and find_one with projection suppression so the full
router logic executes.

Test coverage:
  1.  Student starts a mission
  2.  Student makes a valid financial decision
  3.  Decision is persisted to MongoDB
  4.  Puppy character condition updates correctly
  5.  Competency evidence is recorded
  6.  Student fails a level and the next level remains locked
  7.  Student retries and passes
  8.  Next level unlocks only after mastery
  9.  Progress survives browser refresh  (GET /api/gamified/progress re-reads DB)
  10. Duplicate submissions do not duplicate financial consequences
  11. Unauthorized access is rejected
  12. Existing WiseCub functionality remains unaffected
"""
from __future__ import annotations

import json
from typing import Any

import pytest
from fastapi.testclient import TestClient

import app.modules.gamified_learning.router as gl_router
import app.modules.accounts.router as accounts_router
from app.main import app
from app.modules.accounts.security import hash_password, issue_token, COOKIE_NAME


# ─────────────────────────────────────────────────────────────────────────────
# Fake MongoDB collections
# ─────────────────────────────────────────────────────────────────────────────

class FakeColl:
    def __init__(self):
        self.docs: list[dict] = []

    def _match(self, doc: dict, query: dict) -> bool:
        for k, v in query.items():
            if doc.get(k) != v:
                return False
        return True

    def _project(self, doc: dict, projection: dict | None) -> dict:
        if not projection:
            return dict(doc)
        result = {}
        for k, v in doc.items():
            if k == "_id" and projection.get("_id") == 0:
                continue
            if k in projection and projection[k] == 0:
                continue
            result[k] = v
        return result

    async def find_one(self, query: dict, projection: dict | None = None) -> dict | None:
        for doc in self.docs:
            if self._match(doc, query):
                return self._project(doc, projection)
        return None

    async def insert_one(self, doc: dict) -> None:
        self.docs.append(dict(doc))

    async def update_one(
        self, query: dict, update: dict, upsert: bool = False
    ) -> None:
        matched = None
        for doc in self.docs:
            if self._match(doc, query):
                matched = doc
                break

        if matched is None:
            if upsert:
                new_doc = dict(query)
                on_insert = update.get("$setOnInsert", {})
                new_doc.update(on_insert)
                new_doc.update(update.get("$set", {}))
                self.docs.append(new_doc)
            return

        for key, val in update.get("$set", {}).items():
            # Handle nested key paths like "attempts_by_level.1"
            parts = key.split(".")
            target = matched
            for part in parts[:-1]:
                target = target.setdefault(part, {})
            target[parts[-1]] = val

        for key, val in update.get("$push", {}).items():
            parts = key.split(".")
            target = matched
            for part in parts[:-1]:
                target = target.setdefault(part, {})
            leaf = parts[-1]
            if leaf not in target:
                target[leaf] = []
            target[leaf].append(val)

        for key, val in update.get("$addToSet", {}).items():
            lst = matched.setdefault(key, [])
            if val not in lst:
                lst.append(val)

        for key, val in update.get("$max", {}).items():
            current = matched.get(key, None)
            if current is None or val > current:
                matched[key] = val

    # Cursor-like stub for find().sort().to_list()
    def find(self, query: dict, projection: dict | None = None) -> "_FakeCursor":
        results = [
            self._project(doc, projection)
            for doc in self.docs
            if self._match(doc, query)
        ]
        return _FakeCursor(results)

    async def create_index(self, *args, **kwargs) -> None:
        pass  # no-op in tests


class _FakeCursor:
    def __init__(self, docs: list[dict]):
        self._docs = docs

    def sort(self, *args) -> "_FakeCursor":
        return self

    async def to_list(self, limit: int) -> list[dict]:
        return self._docs[:limit]


class FakeDB:
    def __init__(self):
        self.accounts = FakeColl()
        self.children = FakeColl()
        self.module_state = FakeColl()
        self.gamified_progress = FakeColl()
        self.financial_decisions = FakeColl()
        self.mission_attempts = FakeColl()
        self.competency_assessments = FakeColl()
        self.character_state_history = FakeColl()
        self.market_events = FakeColl()


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

STUDENT_ID = "test-child-1234"
MISSION_ID = "mission_rescue_puppy"
LEVEL_1_ID = "level_puppy_1"
SESSION_ID = "sess_test_001"

# Valid passing decision for Level 1 (needs_wants):
# Must include opt_first_aid + opt_nutrition_pack, NOT opt_squeaky_toy
PASSING_OPTION_IDS = ["opt_first_aid", "opt_nutrition_pack", "opt_cozy_towel"]
# Failing decision: includes squeaky toy (disallowed) and misses nutrition
FAILING_OPTION_IDS = ["opt_first_aid", "opt_squeaky_toy"]


def _make_db_and_student():
    """Return a fresh (fake_db, auth_token) pair with a registered student."""
    fake_db = FakeDB()
    # Pre-seed account
    fake_db.accounts.docs.append({
        "child_id": STUDENT_ID,
        "name": "Test Student",
        "username": "teststudent",
        "email": "",
        "role": "student",
        "age": "12",
        "gender": "",
        "avatar_id": "",
        "language": "en",
        "class_code": "",
        "institution": "",
        "password_hash": hash_password("pass1234"),
        "demo": True,
    })
    token = issue_token(STUDENT_ID, "student", remember=False)
    return fake_db, token


def _session_cookie(token: str) -> dict:
    return {COOKIE_NAME: token}


def _get_client(fake_db: FakeDB, monkeypatch) -> TestClient:
    monkeypatch.setattr(gl_router, "get_db", lambda: fake_db)
    monkeypatch.setattr(accounts_router, "get_db", lambda: fake_db)
    return TestClient(app)


# ─────────────────────────────────────────────────────────────────────────────
# Test 1: Student starts a mission
# ─────────────────────────────────────────────────────────────────────────────

def test_1_student_starts_mission(monkeypatch):
    fake_db, token = _make_db_and_student()
    client = _get_client(fake_db, monkeypatch)

    resp = client.post(
        f"/api/gamified/missions/{MISSION_ID}/start",
        cookies=_session_cookie(token),
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["mission_id"] == MISSION_ID
    assert body["unlocked_level_number"] == 1
    assert body["is_mission_completed"] is False
    # Progress record was created in gamified_progress
    assert len(fake_db.gamified_progress.docs) == 1
    assert fake_db.gamified_progress.docs[0]["child_id"] == STUDENT_ID


# ─────────────────────────────────────────────────────────────────────────────
# Test 2: Student makes a valid financial decision
# ─────────────────────────────────────────────────────────────────────────────

def test_2_valid_financial_decision(monkeypatch):
    fake_db, token = _make_db_and_student()
    client = _get_client(fake_db, monkeypatch)
    # Start mission first
    client.post(f"/api/gamified/missions/{MISSION_ID}/start", cookies=_session_cookie(token))

    resp = client.post(
        "/api/gamified/decisions/submit",
        json={
            "mission_id": MISSION_ID,
            "level_id": LEVEL_1_ID,
            "level_number": 1,
            "session_id": SESSION_ID,
            "interaction_type": "needs_wants",
            "selected_option_ids": PASSING_OPTION_IDS,
            "allocations": {},
            "selected_rationale_id": None,
            "weekly_decisions": [],
        },
        cookies=_session_cookie(token),
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["passed"] is True
    assert body["next_level_unlocked"] is True
    assert body["level_number"] == 1


# ─────────────────────────────────────────────────────────────────────────────
# Test 3: Decision is persisted to MongoDB
# ─────────────────────────────────────────────────────────────────────────────

def test_3_decision_persisted_to_mongodb(monkeypatch):
    fake_db, token = _make_db_and_student()
    client = _get_client(fake_db, monkeypatch)
    client.post(f"/api/gamified/missions/{MISSION_ID}/start", cookies=_session_cookie(token))

    client.post(
        "/api/gamified/decisions/submit",
        json={
            "mission_id": MISSION_ID,
            "level_id": LEVEL_1_ID,
            "level_number": 1,
            "session_id": SESSION_ID,
            "interaction_type": "needs_wants",
            "selected_option_ids": PASSING_OPTION_IDS,
            "allocations": {},
            "selected_rationale_id": None,
            "weekly_decisions": [],
        },
        cookies=_session_cookie(token),
    )
    # All four collections should have one document
    assert len(fake_db.financial_decisions.docs) == 1
    assert len(fake_db.mission_attempts.docs) == 1
    assert len(fake_db.competency_assessments.docs) == 1
    assert len(fake_db.character_state_history.docs) == 1

    dec = fake_db.financial_decisions.docs[0]
    assert dec["child_id"] == STUDENT_ID
    assert dec["mission_id"] == MISSION_ID
    assert dec["level_number"] == 1
    assert dec["passed"] is True
    # Idempotency key present
    assert "idempotency_key" in dec
    # Pseudonymous research ID (not the real child_id)
    assert dec["pseudo_id"] != STUDENT_ID


# ─────────────────────────────────────────────────────────────────────────────
# Test 4: Puppy character condition updates correctly
# ─────────────────────────────────────────────────────────────────────────────

def test_4_puppy_character_condition_updates(monkeypatch):
    fake_db, token = _make_db_and_student()
    client = _get_client(fake_db, monkeypatch)
    client.post(f"/api/gamified/missions/{MISSION_ID}/start", cookies=_session_cookie(token))

    resp = client.post(
        "/api/gamified/decisions/submit",
        json={
            "mission_id": MISSION_ID,
            "level_id": LEVEL_1_ID,
            "level_number": 1,
            "session_id": SESSION_ID,
            "interaction_type": "needs_wants",
            "selected_option_ids": PASSING_OPTION_IDS,
            "allocations": {},
            "selected_rationale_id": None,
            "weekly_decisions": [],
        },
        cookies=_session_cookie(token),
    )
    body = resp.json()
    char = body["character_state"]
    # Level 1 pass → WEAK_STABILIZED / HOPEFUL
    assert char["physical_condition"] == "WEAK_STABILIZED"
    assert char["emotional_state"] == "HOPEFUL"
    assert char["vitality_score"] > 35  # improved from baseline


# ─────────────────────────────────────────────────────────────────────────────
# Test 5: Competency evidence is recorded
# ─────────────────────────────────────────────────────────────────────────────

def test_5_competency_evidence_recorded(monkeypatch):
    fake_db, token = _make_db_and_student()
    client = _get_client(fake_db, monkeypatch)
    client.post(f"/api/gamified/missions/{MISSION_ID}/start", cookies=_session_cookie(token))

    resp = client.post(
        "/api/gamified/decisions/submit",
        json={
            "mission_id": MISSION_ID,
            "level_id": LEVEL_1_ID,
            "level_number": 1,
            "session_id": SESSION_ID,
            "interaction_type": "needs_wants",
            "selected_option_ids": PASSING_OPTION_IDS,
            "allocations": {},
            "selected_rationale_id": None,
            "weekly_decisions": [],
        },
        cookies=_session_cookie(token),
    )
    body = resp.json()
    dims = body["dimension_scores"]
    assert "budgeting_skill" in dims
    assert "spending_discipline" in dims
    assert isinstance(dims["budgeting_skill"], int)
    assert 0 <= dims["budgeting_skill"] <= 100

    # Also check the analytics endpoint
    hist_resp = client.get(
        f"/api/gamified/competency/{MISSION_ID}",
        cookies=_session_cookie(token),
    )
    assert hist_resp.status_code == 200
    hist_body = hist_resp.json()
    assert len(hist_body["entries"]) == 1
    assert hist_body["entries"][0]["passed"] is True


# ─────────────────────────────────────────────────────────────────────────────
# Test 6: Student fails a level and the next level remains locked
# ─────────────────────────────────────────────────────────────────────────────

def test_6_fail_level_next_remains_locked(monkeypatch):
    fake_db, token = _make_db_and_student()
    client = _get_client(fake_db, monkeypatch)
    client.post(f"/api/gamified/missions/{MISSION_ID}/start", cookies=_session_cookie(token))

    resp = client.post(
        "/api/gamified/decisions/submit",
        json={
            "mission_id": MISSION_ID,
            "level_id": LEVEL_1_ID,
            "level_number": 1,
            "session_id": "sess_fail_001",
            "interaction_type": "needs_wants",
            "selected_option_ids": FAILING_OPTION_IDS,  # includes squeaky toy!
            "allocations": {},
            "selected_rationale_id": None,
            "weekly_decisions": [],
        },
        cookies=_session_cookie(token),
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["passed"] is False
    assert body["next_level_unlocked"] is False
    assert len(body["failure_reasons"]) > 0

    # Attempt to start level 2 should be rejected (still locked)
    lock_resp = client.post(
        "/api/gamified/levels/start",
        json={"mission_id": MISSION_ID, "level_number": 2},
        cookies=_session_cookie(token),
    )
    assert lock_resp.status_code == 403

    # Check progress — unlocked_level_number still 1
    progress_resp = client.get(
        f"/api/gamified/progress/{MISSION_ID}",
        cookies=_session_cookie(token),
    )
    assert progress_resp.json()["unlocked_level_number"] == 1


# ─────────────────────────────────────────────────────────────────────────────
# Test 7: Student retries and passes
# ─────────────────────────────────────────────────────────────────────────────

def test_7_retry_and_pass(monkeypatch):
    fake_db, token = _make_db_and_student()
    client = _get_client(fake_db, monkeypatch)
    client.post(f"/api/gamified/missions/{MISSION_ID}/start", cookies=_session_cookie(token))

    # Attempt 1: fail
    client.post(
        "/api/gamified/decisions/submit",
        json={
            "mission_id": MISSION_ID,
            "level_id": LEVEL_1_ID,
            "level_number": 1,
            "session_id": "sess_retry_001",
            "interaction_type": "needs_wants",
            "selected_option_ids": FAILING_OPTION_IDS,
            "allocations": {},
            "selected_rationale_id": None,
            "weekly_decisions": [],
        },
        cookies=_session_cookie(token),
    )
    # Attempt 2: pass (new session ID)
    pass_resp = client.post(
        "/api/gamified/decisions/submit",
        json={
            "mission_id": MISSION_ID,
            "level_id": LEVEL_1_ID,
            "level_number": 1,
            "session_id": "sess_retry_002",
            "interaction_type": "needs_wants",
            "selected_option_ids": PASSING_OPTION_IDS,
            "allocations": {},
            "selected_rationale_id": None,
            "weekly_decisions": [],
        },
        cookies=_session_cookie(token),
    )
    assert pass_resp.status_code == 200, pass_resp.text
    body = pass_resp.json()
    assert body["passed"] is True
    assert body["attempt_number"] == 2  # second attempt

    # Both attempts recorded in history
    assert len(fake_db.mission_attempts.docs) == 2
    attempts = fake_db.mission_attempts.docs
    assert attempts[0]["passed"] is False
    assert attempts[1]["passed"] is True


# ─────────────────────────────────────────────────────────────────────────────
# Test 8: Next level unlocks only after mastery
# ─────────────────────────────────────────────────────────────────────────────

def test_8_next_level_unlocks_after_mastery(monkeypatch):
    fake_db, token = _make_db_and_student()
    client = _get_client(fake_db, monkeypatch)
    client.post(f"/api/gamified/missions/{MISSION_ID}/start", cookies=_session_cookie(token))

    # Pass level 1
    client.post(
        "/api/gamified/decisions/submit",
        json={
            "mission_id": MISSION_ID,
            "level_id": LEVEL_1_ID,
            "level_number": 1,
            "session_id": SESSION_ID,
            "interaction_type": "needs_wants",
            "selected_option_ids": PASSING_OPTION_IDS,
            "allocations": {},
            "selected_rationale_id": None,
            "weekly_decisions": [],
        },
        cookies=_session_cookie(token),
    )
    # Progress should now show level 2 unlocked
    progress_resp = client.get(
        f"/api/gamified/progress/{MISSION_ID}",
        cookies=_session_cookie(token),
    )
    progress = progress_resp.json()
    assert progress["unlocked_level_number"] == 2
    assert 1 in progress["completed_level_numbers"]

    # Starting level 2 should now succeed
    start_resp = client.post(
        "/api/gamified/levels/start",
        json={"mission_id": MISSION_ID, "level_number": 2},
        cookies=_session_cookie(token),
    )
    assert start_resp.status_code == 200


# ─────────────────────────────────────────────────────────────────────────────
# Test 9: Progress survives browser refresh (GET progress returns saved data)
# ─────────────────────────────────────────────────────────────────────────────

def test_9_progress_survives_refresh(monkeypatch):
    fake_db, token = _make_db_and_student()
    client = _get_client(fake_db, monkeypatch)
    client.post(f"/api/gamified/missions/{MISSION_ID}/start", cookies=_session_cookie(token))

    client.post(
        "/api/gamified/decisions/submit",
        json={
            "mission_id": MISSION_ID,
            "level_id": LEVEL_1_ID,
            "level_number": 1,
            "session_id": SESSION_ID,
            "interaction_type": "needs_wants",
            "selected_option_ids": PASSING_OPTION_IDS,
            "allocations": {},
            "selected_rationale_id": None,
            "weekly_decisions": [],
        },
        cookies=_session_cookie(token),
    )

    # Simulate refresh: GET /api/gamified/progress without any local state
    refresh_resp = client.get(
        f"/api/gamified/progress/{MISSION_ID}",
        cookies=_session_cookie(token),
    )
    assert refresh_resp.status_code == 200
    body = refresh_resp.json()
    # Progress is restored from DB
    assert body["unlocked_level_number"] == 2
    assert body["highest_completed_level_number"] == 1
    char = body["character_state"]
    assert char["physical_condition"] == "WEAK_STABILIZED"  # puppy improved


# ─────────────────────────────────────────────────────────────────────────────
# Test 10: Duplicate submissions do not duplicate financial consequences
# ─────────────────────────────────────────────────────────────────────────────

def test_10_duplicate_submissions_rejected(monkeypatch):
    fake_db, token = _make_db_and_student()
    client = _get_client(fake_db, monkeypatch)
    client.post(f"/api/gamified/missions/{MISSION_ID}/start", cookies=_session_cookie(token))

    payload = {
        "mission_id": MISSION_ID,
        "level_id": LEVEL_1_ID,
        "level_number": 1,
        "session_id": SESSION_ID,  # same session_id = same idempotency key
        "interaction_type": "needs_wants",
        "selected_option_ids": PASSING_OPTION_IDS,
        "allocations": {},
        "selected_rationale_id": None,
        "weekly_decisions": [],
    }

    first = client.post("/api/gamified/decisions/submit", json=payload, cookies=_session_cookie(token))
    assert first.status_code == 200

    duplicate = client.post("/api/gamified/decisions/submit", json=payload, cookies=_session_cookie(token))
    assert duplicate.status_code == 409  # Conflict — already submitted

    # Only one financial decision document persisted
    assert len(fake_db.financial_decisions.docs) == 1
    assert len(fake_db.mission_attempts.docs) == 1


# ─────────────────────────────────────────────────────────────────────────────
# Test 11: Unauthorized access is rejected
# ─────────────────────────────────────────────────────────────────────────────

def test_11_unauthorized_access_rejected(monkeypatch):
    fake_db, _ = _make_db_and_student()
    client = _get_client(fake_db, monkeypatch)

    # No cookie → 401
    resp = client.get(f"/api/gamified/progress/{MISSION_ID}")
    assert resp.status_code == 401

    resp2 = client.post(f"/api/gamified/missions/{MISSION_ID}/start")
    assert resp2.status_code == 401

    resp3 = client.post(
        "/api/gamified/decisions/submit",
        json={
            "mission_id": MISSION_ID,
            "level_id": LEVEL_1_ID,
            "level_number": 1,
            "session_id": SESSION_ID,
            "interaction_type": "needs_wants",
            "selected_option_ids": PASSING_OPTION_IDS,
            "allocations": {},
            "selected_rationale_id": None,
            "weekly_decisions": [],
        },
    )
    assert resp3.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# Test 12: Existing WiseCub functionality remains unaffected
# ─────────────────────────────────────────────────────────────────────────────

def test_12_existing_wisecub_unaffected(monkeypatch):
    fake_db, token = _make_db_and_student()
    client = _get_client(fake_db, monkeypatch)

    # /health still works
    assert client.get("/health").status_code == 200

    # /api/me still works
    me = client.get("/api/me", cookies=_session_cookie(token))
    assert me.status_code == 200
    assert me.json()["child_id"] == STUDENT_ID

    # Gamified catalog is accessible without auth
    catalog = client.get("/api/gamified/catalog")
    assert catalog.status_code == 200
    missions = catalog.json()["missions"]
    assert len(missions) > 0
    puppy = next((m for m in missions if m["id"] == MISSION_ID), None)
    assert puppy is not None
    assert puppy["title"] == "Rescue the Injured Puppy"


# ─────────────────────────────────────────────────────────────────────────────
# Automated Feasibility Test: Check every mission level in catalog
# ─────────────────────────────────────────────────────────────────────────────

def test_13_catalog_feasibility_across_all_levels():
    """Verify that every level in the catalog has mathematically possible pass requirements."""
    from app.modules.gamified_learning.catalog import MISSION_CATALOG

    for mission_id, mission in MISSION_CATALOG.items():
        for level in mission.levels:
            # 1. Option-based levels
            if level.options:
                must_include = set(level.pass_criteria.must_include_option_ids)
                if must_include:
                    req_opts = [o for o in level.options if o.id in must_include]
                else:
                    req_opts = [o for o in level.options if o.is_essential]

                min_essential_cost = sum(o.cost_lkr for o in req_opts)
                min_reserve = level.pass_criteria.min_reserve_preserved_lkr or 0
                available = level.starting_budget_lkr + level.existing_reserve_lkr

                assert min_essential_cost + min_reserve <= available, (
                    f"Infeasible option level in {mission_id} L{level.level_number}: "
                    f"min essential ({min_essential_cost}) + min reserve ({min_reserve}) "
                    f"= {min_essential_cost + min_reserve} > available ({available})"
                )

            # 2. Allocation-based levels
            if level.allocation_categories:
                non_reserve_min = sum(
                    c.min_recommended_lkr
                    for c in level.allocation_categories
                    if c.is_essential and c.category not in ("emergency_reserve", "emergency_savings", "savings", "savings_goal")
                )
                reserve_min = sum(
                    c.min_recommended_lkr
                    for c in level.allocation_categories
                    if c.category in ("emergency_reserve", "emergency_savings", "savings", "savings_goal")
                )
                min_reserve_req = level.pass_criteria.min_reserve_preserved_lkr or 0
                effective_reserve_needed = max(reserve_min, min_reserve_req)
                total_needed = non_reserve_min + effective_reserve_needed
                available = level.starting_budget_lkr + level.existing_reserve_lkr

                assert total_needed <= available, (
                    f"Infeasible allocation level in {mission_id} L{level.level_number}: "
                    f"non-reserve essentials ({non_reserve_min}) + reserve ({effective_reserve_needed}) "
                    f"= {total_needed} > available ({available})"
                )

            # 3. Multi-period saving levels
            if level.multi_period_config:
                periods = level.multi_period_config.get("periods", [])
                total_allowance = sum(p["allowance_lkr"] for p in periods)
                total_mandatory = sum(p["mandatory_cost_lkr"] for p in periods)
                max_savings = total_allowance - total_mandatory
                target_goal = level.multi_period_config.get("target_goal_lkr", 0)
                min_reserve = level.pass_criteria.min_reserve_preserved_lkr or 0

                assert target_goal <= max_savings, (
                    f"Infeasible savings goal in {mission_id} L{level.level_number}: "
                    f"target ({target_goal}) > max possible savings ({max_savings})"
                )
                assert min_reserve <= max_savings, (
                    f"Infeasible reserve requirement in {mission_id} L{level.level_number}: "
                    f"min reserve ({min_reserve}) > max possible savings ({max_savings})"
                )


# ─────────────────────────────────────────────────────────────────────────────
# Test 14 & 15: Level 2 Plan the Care Budget validation & unlocking Level 3
# ─────────────────────────────────────────────────────────────────────────────

def test_14_level_2_valid_allocation_satisfies_mastery_and_unlocks_level_3(monkeypatch):
    """Verify that a financially sound allocation in Level 2 satisfies all gates within Rs. 15,000 and unlocks Level 3."""
    fake_db, token = _make_db_and_student()
    client = _get_client(fake_db, monkeypatch)
    client.post(f"/api/gamified/missions/{MISSION_ID}/start", cookies=_session_cookie(token))

    # Pass level 1 first
    client.post(
        "/api/gamified/decisions/submit",
        json={
            "mission_id": MISSION_ID,
            "level_id": LEVEL_1_ID,
            "level_number": 1,
            "session_id": "sess_l1_pass",
            "interaction_type": "needs_wants",
            "selected_option_ids": PASSING_OPTION_IDS,
            "allocations": {},
            "selected_rationale_id": None,
            "weekly_decisions": [],
        },
        cookies=_session_cookie(token),
    )

    # Start Level 2
    l2_start = client.post(
        "/api/gamified/levels/start",
        json={"mission_id": MISSION_ID, "level_number": 2},
        cookies=_session_cookie(token),
    )
    assert l2_start.status_code == 200

    # Submit valid Level 2 allocation:
    # Vet 6000 + Med 3500 + Transport 2000 + Emergency Cushion 3500 = 15,000 (Within 15,000 budget!)
    # Emergency cushion 3,500 >= min reserve 2,500!
    l2_resp = client.post(
        "/api/gamified/decisions/submit",
        json={
            "mission_id": MISSION_ID,
            "level_id": "level_puppy_2",
            "level_number": 2,
            "session_id": "sess_l2_valid",
            "interaction_type": "budget_allocator",
            "selected_option_ids": [],
            "allocations": {
                "cat_vet_check": 6000,
                "cat_medicine_dress": 3500,
                "cat_transport": 2000,
                "cat_emergency_reserve": 3500,
                "cat_deluxe_grooming": 0,
            },
            "selected_rationale_id": None,
            "weekly_decisions": [],
        },
        cookies=_session_cookie(token),
    )
    assert l2_resp.status_code == 200, l2_resp.text
    body = l2_resp.json()
    assert body["passed"] is True, f"Failed with reasons: {body['failure_reasons']}"
    assert body["next_level_unlocked"] is True
    assert body["decision_outcome"]["reserve_preserved_lkr"] == 3500
    assert body["dimension_scores"]["budgeting_skill"] >= 75
    assert body["overall_score"] >= 75
    assert body["character_state"]["physical_condition"] == "WEAK_STABILIZED"
    assert body["character_state"]["emotional_state"] == "HOPEFUL"

    # Verify Level 3 is now unlocked and can be started
    l3_start = client.post(
        "/api/gamified/levels/start",
        json={"mission_id": MISSION_ID, "level_number": 3},
        cookies=_session_cookie(token),
    )
    assert l3_start.status_code == 200
    assert l3_start.json()["level_id"] == "level_puppy_3"


def test_15_level_2_underfunded_reserve_fails_and_level_3_remains_locked(monkeypatch):
    """Verify that underfunding the emergency reserve fails Level 2 and keeps Level 3 locked."""
    fake_db, token = _make_db_and_student()
    client = _get_client(fake_db, monkeypatch)
    client.post(f"/api/gamified/missions/{MISSION_ID}/start", cookies=_session_cookie(token))

    # Pass level 1
    client.post(
        "/api/gamified/decisions/submit",
        json={
            "mission_id": MISSION_ID,
            "level_id": LEVEL_1_ID,
            "level_number": 1,
            "session_id": "sess_l1_pass2",
            "interaction_type": "needs_wants",
            "selected_option_ids": PASSING_OPTION_IDS,
            "allocations": {},
            "selected_rationale_id": None,
            "weekly_decisions": [],
        },
        cookies=_session_cookie(token),
    )

    # Level 2 submission with underfunded emergency cushion:
    # Emergency cushion Rs. 1,000 < min Rs. 2,500, spent Rs. 2,500 on luxury grooming!
    l2_resp = client.post(
        "/api/gamified/decisions/submit",
        json={
            "mission_id": MISSION_ID,
            "level_id": "level_puppy_2",
            "level_number": 2,
            "session_id": "sess_l2_fail_reserve",
            "interaction_type": "budget_allocator",
            "selected_option_ids": [],
            "allocations": {
                "cat_vet_check": 6000,
                "cat_medicine_dress": 3500,
                "cat_transport": 2000,
                "cat_emergency_reserve": 1000,
                "cat_deluxe_grooming": 2500,
            },
            "selected_rationale_id": None,
            "weekly_decisions": [],
        },
        cookies=_session_cookie(token),
    )
    assert l2_resp.status_code == 200
    body = l2_resp.json()
    assert body["passed"] is False
    assert body["next_level_unlocked"] is False
    assert len(body["failure_reasons"]) > 0

    # Level 3 must remain locked (HTTP 403)
    l3_start = client.post(
        "/api/gamified/levels/start",
        json={"mission_id": MISSION_ID, "level_number": 3},
        cookies=_session_cookie(token),
    )
    assert l3_start.status_code == 403


def test_16_level_rejects_mismatched_interaction_type(monkeypatch):
    fake_db, token = _make_db_and_student()
    client = _get_client(fake_db, monkeypatch)
    client.post(f"/api/gamified/missions/{MISSION_ID}/start", cookies=_session_cookie(token))

    level_one_response = client.post(
        "/api/gamified/decisions/submit",
        json={
            "mission_id": MISSION_ID,
            "level_id": LEVEL_1_ID,
            "level_number": 1,
            "session_id": "sess_l1_unlock",
            "interaction_type": "needs_wants",
            "selected_option_ids": PASSING_OPTION_IDS,
        },
        cookies=_session_cookie(token),
    )
    assert level_one_response.status_code == 200
    assert level_one_response.json()["passed"] is True

    response = client.post(
        "/api/gamified/decisions/submit",
        json={
            "mission_id": MISSION_ID,
            "level_id": "level_puppy_2",
            "level_number": 2,
            "session_id": "sess_l2_wrong_interaction",
            "interaction_type": "needs_wants",
            "selected_option_ids": [],
            "allocations": {},
        },
        cookies=_session_cookie(token),
    )

    assert response.status_code == 400
    assert "interaction_type" in response.json()["detail"]


@pytest.mark.parametrize(
    "periods",
    [
        [1, 1, 1],
        [1, 2],
        [1, 2, 4],
    ],
    ids=["duplicate", "missing", "unknown"],
)
def test_multi_period_savings_requires_each_configured_period_once(periods):
    from app.modules.gamified_learning.catalog import get_level
    from app.modules.gamified_learning.engine import simulate_multi_period_savings

    level = get_level(MISSION_ID, 3)
    assert level is not None
    decisions = [
        {
            "period": period,
            "saved_amount_lkr": 4000,
            "resisted_temptation": True,
        }
        for period in periods
    ]

    with pytest.raises(ValueError, match="each configured period exactly once"):
        simulate_multi_period_savings(level, decisions)


def test_multi_period_savings_accepts_complete_period_schedule():
    from app.modules.gamified_learning.catalog import get_level
    from app.modules.gamified_learning.engine import simulate_multi_period_savings

    level = get_level(MISSION_ID, 3)
    assert level is not None
    decisions = [
        {
            "period": period,
            "saved_amount_lkr": 4000,
            "resisted_temptation": True,
        }
        for period in (1, 2, 3)
    ]

    financial_state, outcome = simulate_multi_period_savings(level, decisions)

    assert financial_state.emergency_reserve_lkr == 12000
    assert outcome.essential_needs_covered is True
    assert outcome.is_feasible is True
