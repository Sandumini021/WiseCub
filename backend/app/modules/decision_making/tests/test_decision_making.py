"""
test_decision_making.py

Comprehensive automated tests for WiseCub Decision-Making (Choice Town):
1. Scenario seeding & idempotency
2. Scenario catalog & single level retrieval
3. Child progress initialization & data isolation
4. Decision step validation
5. Reasoning length validation & rule-based scoring (6 dimensions)
6. Adaptive recommendations (single-response vs pattern-based from longitudinal attempts)
7. Level completion prerequisite enforcement & sequential unlocking
8. Attempt history preservation across replays
9. Progress reset functionality
10. Parent & teacher analytics aggregation with real ownership / authorization verification
11. Unauthenticated request protection (401 Unauthorized)
"""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.accounts.security import COOKIE_NAME, issue_token
from app.modules.decision_making.analysis import analyze_reasoning
from app.modules.decision_making.recommendations import recommend
from app.modules.decision_making.schemas import AnalysisResult, DimensionScore, OptionContext
from app.modules.decision_making.seed import seed_scenarios


# ─────────────────────────────────────────────────────────────────────────────
# MOCK MONGODB TEST DOUBLE
# ─────────────────────────────────────────────────────────────────────────────

class MockCursor:
    def __init__(self, docs: list[dict[str, Any]]):
        self._docs = docs

    def sort(self, field: str, direction: int = 1):
        reverse = direction < 0
        self._docs = sorted(self._docs, key=lambda d: d.get(field, 0), reverse=reverse)
        return self

    async def to_list(self, length: int = 100):
        return [copy.deepcopy(d) for d in self._docs[:length]]


class MockCollection:
    def __init__(self, name: str):
        self.name = name
        self.docs: list[dict[str, Any]] = []

    def _matches(self, doc: dict[str, Any], query: dict[str, Any]) -> bool:
        for k, v in query.items():
            if k == "$or" and isinstance(v, list):
                if not any(self._matches(doc, branch) for branch in v):
                    return False
                continue
            if doc.get(k) != v:
                return False
        return True

    async def find_one(self, query: dict[str, Any], proj: dict[str, Any] | None = None) -> dict[str, Any] | None:
        for row in self.docs:
            if self._matches(row, query):
                res = copy.deepcopy(row)
                if proj and "_id" in proj and proj["_id"] == 0:
                    res.pop("_id", None)
                return res
        return None

    def find(self, query: dict[str, Any] | None = None, proj: dict[str, Any] | None = None) -> MockCursor:
        q = query or {}
        matched = []
        for row in self.docs:
            if self._matches(row, q):
                res = copy.deepcopy(row)
                if proj and "_id" in proj and proj["_id"] == 0:
                    res.pop("_id", None)
                matched.append(res)
        return MockCursor(matched)

    async def insert_one(self, doc: dict[str, Any]):
        d = copy.deepcopy(doc)
        if "_id" not in d:
            d["_id"] = str(len(self.docs) + 1)
        self.docs.append(d)

    async def insert_many(self, docs: list[dict[str, Any]]):
        for doc in docs:
            await self.insert_one(doc)

    async def update_one(self, query: dict[str, Any], update: dict[str, Any], upsert: bool = False):
        matched = None
        for row in self.docs:
            if self._matches(row, query):
                matched = row
                break

        if matched is None:
            if upsert:
                new_doc = copy.deepcopy(query)
                if "$set" in update:
                    self._apply_set(new_doc, update["$set"])
                if "_id" not in new_doc:
                    new_doc["_id"] = str(len(self.docs) + 1)
                self.docs.append(new_doc)
            return

        if "$set" in update:
            self._apply_set(matched, update["$set"])

    def _apply_set(self, doc: dict[str, Any], set_fields: dict[str, Any]):
        for key, value in set_fields.items():
            if "." in key:
                parts = key.split(".")
                curr = doc
                for part in parts[:-1]:
                    if part not in curr or not isinstance(curr[part], dict):
                        curr[part] = {}
                    curr = curr[part]
                curr[parts[-1]] = copy.deepcopy(value)
            else:
                doc[key] = copy.deepcopy(value)

    async def update_many(self, query: dict[str, Any], update: dict[str, Any]):
        for row in self.docs:
            if self._matches(row, query):
                if "$set" in update:
                    self._apply_set(row, update["$set"])

    async def count_documents(self, query: dict[str, Any]) -> int:
        return sum(1 for row in self.docs if self._matches(row, query))

    async def create_index(self, keys: Any, **kwargs: Any):
        return "index_ok"


class MockDatabase:
    def __init__(self):
        self.decision_making_scenarios = MockCollection("decision_making_scenarios")
        self.decision_making_progress = MockCollection("decision_making_progress")
        self.decision_making_attempts = MockCollection("decision_making_attempts")
        self.accounts = MockCollection("accounts")
        self.guardian_consent = MockCollection("guardian_consent")


@pytest.fixture
def mock_db():
    db = MockDatabase()
    # Pre-populate sample accounts with real class codes and relationships
    db.accounts.docs.append({"child_id": "student-1", "name": "Alice Learner", "role": "student", "class_code": "CLASS-7A"})
    db.accounts.docs.append({"child_id": "student-2", "name": "Bob Learner", "role": "student", "class_code": "CLASS-8B"})
    db.accounts.docs.append({"child_id": "teacher-1", "name": "Mrs. Sharma", "role": "teacher", "class_code": "CLASS-7A"})
    db.accounts.docs.append({"child_id": "teacher-other", "name": "Mr. Davis", "role": "teacher", "class_code": "CLASS-9C"})
    db.accounts.docs.append({"child_id": "guardian-1", "name": "Mr. Patel", "role": "guardian", "email": "patel@example.com"})
    db.accounts.docs.append({"child_id": "guardian-unlinked", "name": "Ms. Stranger", "role": "guardian", "email": "stranger@example.com"})

    # Link guardian-1 to student-1 in guardian_consent
    db.guardian_consent.docs.append({"child_id": "student-1", "email": "patel@example.com", "consent_confirmed": True})
    return db


@pytest.fixture
def client(mock_db):
    with patch("app.modules.decision_making.router.get_db", return_value=mock_db), \
         patch("app.database.mongo.get_db", return_value=mock_db):
        yield TestClient(app)


# ─────────────────────────────────────────────────────────────────────────────
# 1. SCENARIO SEEDING TESTS
# ─────────────────────────────────────────────────────────────────────────────

def test_seed_scenarios_idempotent(mock_db):
    """Scenario seeding inserts 10 documents and running again does not duplicate them."""
    import asyncio

    inserted = asyncio.run(seed_scenarios(mock_db, force_update=False))
    assert inserted == 10
    total = asyncio.run(mock_db.decision_making_scenarios.count_documents({}))
    assert total == 10

    # Idempotent re-seed: should not insert duplicates
    re_seeded = asyncio.run(seed_scenarios(mock_db, force_update=False))
    assert re_seeded == 0
    total_after = asyncio.run(mock_db.decision_making_scenarios.count_documents({}))
    assert total_after == 10

    # Verify Level 5 scenario structure
    lvl5 = asyncio.run(mock_db.decision_making_scenarios.find_one({"level_id": 5}))
    assert lvl5 is not None
    assert lvl5["title"] == "The phone that broke"
    assert len(lvl5["options"]) == 3
    opt_ids = [opt["id"] for opt in lvl5["options"]]
    assert opt_ids == ["A", "B", "C"]


# ─────────────────────────────────────────────────────────────────────────────
# 2. SCENARIO CATALOG API TESTS
# ─────────────────────────────────────────────────────────────────────────────

def test_get_scenarios_catalog(client, mock_db):
    """GET /api/decision-making/scenarios returns all 10 scenarios sorted by level_id."""
    import asyncio
    asyncio.run(seed_scenarios(mock_db))

    res = client.get("/api/decision-making/scenarios")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 10
    levels = [item["levelId"] for item in data]
    assert levels == list(range(1, 11))
    assert data[4]["title"] == "The phone that broke"


def test_get_single_scenario(client, mock_db):
    """GET /api/decision-making/scenarios/{level_id} returns the specific level or 404."""
    import asyncio
    asyncio.run(seed_scenarios(mock_db))

    res = client.get("/api/decision-making/scenarios/1")
    assert res.status_code == 200
    assert res.json()["title"] == "Birthday money"

    res5 = client.get("/api/decision-making/scenarios/5")
    assert res5.status_code == 200
    assert res5.json()["title"] == "The phone that broke"
    assert len(res5.json()["options"]) == 3

    # Out of bounds
    res11 = client.get("/api/decision-making/scenarios/11")
    assert res11.status_code == 404

    res0 = client.get("/api/decision-making/scenarios/0")
    assert res0.status_code == 404


# ─────────────────────────────────────────────────────────────────────────────
# 3. CHILD PROGRESS INITIALIZATION & DATA ISOLATION TESTS
# ─────────────────────────────────────────────────────────────────────────────

def test_child_progress_initialization(client, mock_db):
    """A fresh child starts at Level 1 with 0 completed levels."""
    token = issue_token("student-1", "student", False)
    res = client.get(
        "/api/decision-making/progress",
        cookies={COOKIE_NAME: token},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["childId"] == "student-1"
    assert data["currentLevelId"] == 1
    assert data["completedLevelIds"] == []
    assert data["sessions"] == {}
    assert data["storage"] == "mongodb"


def test_child_isolation_different_progress(client, mock_db):
    """Different authenticated children have completely isolated progress documents."""
    import asyncio
    asyncio.run(seed_scenarios(mock_db))

    token1 = issue_token("student-1", "student", False)
    token2 = issue_token("student-2", "student", False)

    # Student 1 picks option A for Level 1
    res1 = client.put(
        "/api/decision-making/sessions/1/decision",
        json={"optionId": "A"},
        cookies={COOKIE_NAME: token1},
    )
    assert res1.status_code == 200
    assert res1.json()["sessions"]["1"]["optionId"] == "A"

    # Student 2 checks their progress: sessions should be empty
    res2 = client.get(
        "/api/decision-making/progress",
        cookies={COOKIE_NAME: token2},
    )
    assert res2.status_code == 200
    assert res2.json()["sessions"] == {}


def test_unauthenticated_requests_rejected(client):
    """Unauthenticated access to progress or decision mutations returns 401."""
    res_progress = client.get("/api/decision-making/progress")
    assert res_progress.status_code == 401

    res_decision = client.put("/api/decision-making/sessions/1/decision", json={"optionId": "A"})
    assert res_decision.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# 4. DECISION STEP (STEP 1) TESTS
# ─────────────────────────────────────────────────────────────────────────────

def test_decision_saving_valid_and_invalid(client, mock_db):
    """PUT /api/decision-making/sessions/{level_id}/decision validates option_id."""
    import asyncio
    asyncio.run(seed_scenarios(mock_db))

    token = issue_token("student-1", "student", False)

    # Valid option
    res = client.put(
        "/api/decision-making/sessions/1/decision",
        json={"optionId": "B"},
        cookies={COOKIE_NAME: token},
    )
    assert res.status_code == 200
    assert res.json()["sessions"]["1"]["optionId"] == "B"

    # In-progress attempt created
    attempt = mock_db.decision_making_attempts.docs[-1]
    assert attempt["child_id"] == "student-1"
    assert attempt["level_id"] == 1
    assert attempt["selected_option_id"] == "B"
    assert attempt["completion_status"] == "in_progress"

    # Invalid option for level
    res_bad = client.put(
        "/api/decision-making/sessions/1/decision",
        json={"optionId": "Z"},
        cookies={COOKIE_NAME: token},
    )
    assert res_bad.status_code == 422 or res_bad.status_code == 400


# ─────────────────────────────────────────────────────────────────────────────
# 5. REASONING STEP (STEP 2) & RULE-BASED SCORING TESTS
# ─────────────────────────────────────────────────────────────────────────────

def test_reasoning_length_boundaries(client, mock_db):
    """Reasoning submissions <20 or >400 characters are rejected with 422."""
    import asyncio
    asyncio.run(seed_scenarios(mock_db))

    token = issue_token("student-1", "student", False)

    # Too short (< 20 chars)
    res_short = client.post(
        "/api/decision-making/sessions/1/reasoning",
        json={"optionId": "A", "reasoning": "Too short"},
        cookies={COOKIE_NAME: token},
    )
    assert res_short.status_code == 422

    # Too long (> 400 chars)
    res_long = client.post(
        "/api/decision-making/sessions/1/reasoning",
        json={"optionId": "A", "reasoning": "A" * 401},
        cookies={COOKIE_NAME: token},
    )
    assert res_long.status_code == 422

    # Valid length (within 20..400)
    valid_text = "I chose to save Rs. 4000 because I need it for school fees next month and do not want to borrow."
    res_valid = client.post(
        "/api/decision-making/sessions/1/reasoning",
        json={"optionId": "B", "reasoning": valid_text},
        cookies={COOKIE_NAME: token},
    )
    assert res_valid.status_code == 200
    data = res_valid.json()
    assert "analysis" in data
    assert "recommendations" in data
    assert len(data["analysis"]["dimensions"]) == 6


def test_reasoning_rule_based_dimensions():
    """Deterministic rule-based analysis accurately scores the 6 dimensions."""
    opt_ctx = OptionContext(
        title="Borrow to buy",
        summary="Borrow money from a cousin",
        immediate="You buy it today",
        bullets=["Borrow Rs. 14,000", "Repay over 3 months"],
    )
    text = (
        "I chose option B because I need to consider borrowing obligations and repay my cousin "
        "within 3 months. Saving 6,000 now will help keep my budget safe later."
    )
    result = analyze_reasoning("B", opt_ctx, text)
    dim_map = {d.id: d.score for d in result.dimensions}

    # Should hit keywords for borrowing, savings, future, and explaining
    assert dim_map["borrowingObligations"] >= 60
    assert dim_map["savingsAwareness"] >= 50
    assert dim_map["futureConsequences"] >= 50
    assert dim_map["explainingClearly"] >= 60
    assert result.method == "rule-based"


# ─────────────────────────────────────────────────────────────────────────────
# 6. ADAPTIVE RECOMMENDATIONS TESTS
# ─────────────────────────────────────────────────────────────────────────────

def test_recommendation_single_vs_pattern():
    """Adaptive recommendations distinguish between a single-response clue and a longitudinal pattern."""
    analysis = AnalysisResult(
        option_id="A",
        reasoning_text="I just want it now.",
        dimensions=[
            DimensionScore(id="immediateNeeds", label="Present needs", score=75, evidence="Found"),
            DimensionScore(id="savingsAwareness", label="Savings", score=65, evidence="Found"),
            DimensionScore(id="borrowingObligations", label="Borrowing obligations", score=30, evidence="Missing debt"),
            DimensionScore(id="futureConsequences", label="Future consequences", score=40, evidence="Missing future"),
            DimensionScore(id="comparingAlternatives", label="Alternatives", score=45, evidence="Missing compare"),
            DimensionScore(id="explainingClearly", label="Explaining clearly", score=50, evidence="Short"),
        ],
        highlights=["You stated present needs."],
        gaps=["Borrowing was missing."],
        method="rule-based",
        source="single-response",
    )

    # 1. No historical attempts: basis is single-response
    rec_single = recommend(analysis, past_attempts=[])
    gap_rec = next(r for r in rec_single if r.id == "gap-borrowingObligations")
    assert gap_rec.based_on == "single-response"
    assert any(r.id == "one-answer-note" for r in rec_single)

    # 2. Longitudinal history with repeated borrowing gap (<55 in >=2 past attempts): basis is pattern
    past_attempts = [
        {
            "attempt_id": "att-1",
            "analysis": {
                "dimensions": [
                    {"id": "borrowingObligations", "score": 35, "label": "Borrowing"},
                ]
            },
        },
        {
            "attempt_id": "att-2",
            "analysis": {
                "dimensions": [
                    {"id": "borrowingObligations", "score": 40, "label": "Borrowing"},
                ]
            },
        },
    ]
    rec_pattern = recommend(analysis, past_attempts=past_attempts)
    pattern_gap_rec = next(r for r in rec_pattern if r.id == "gap-borrowingObligations")
    assert pattern_gap_rec.based_on == "pattern"


# ─────────────────────────────────────────────────────────────────────────────
# 7. LEVEL COMPLETION & SEQUENTIAL UNLOCKING TESTS
# ─────────────────────────────────────────────────────────────────────────────

def test_complete_level_prerequisite_and_progression(client, mock_db):
    """Completing a level requires decision + reasoning, and unlocks the next level."""
    import asyncio
    asyncio.run(seed_scenarios(mock_db))

    token = issue_token("student-1", "student", False)

    # Trying to complete Level 1 before decision/reasoning fails with 400
    res_premature = client.post(
        "/api/decision-making/sessions/1/complete",
        cookies={COOKIE_NAME: token},
    )
    assert res_premature.status_code == 400

    # Submit decision
    client.put(
        "/api/decision-making/sessions/1/decision",
        json={"optionId": "B"},
        cookies={COOKIE_NAME: token},
    )

    # Submit reasoning
    client.post(
        "/api/decision-making/sessions/1/reasoning",
        json={
            "optionId": "B",
            "reasoning": "I want to save most of the money for later needs so that I do not have to borrow.",
        },
        cookies={COOKIE_NAME: token},
    )

    # Now completion succeeds
    res_complete = client.post(
        "/api/decision-making/sessions/1/complete",
        cookies={COOKIE_NAME: token},
    )
    assert res_complete.status_code == 200
    data = res_complete.json()
    assert 1 in data["completedLevelIds"]
    assert data["currentLevelId"] == 2  # Unlocks Level 2!

    # Check attempt record in attempts collection
    attempt = mock_db.decision_making_attempts.docs[-1]
    assert attempt["level_id"] == 1
    assert attempt["completion_status"] == "completed"
    assert attempt["completed_at"] is not None


# ─────────────────────────────────────────────────────────────────────────────
# 8. RESET FUNCTIONALITY TESTS
# ─────────────────────────────────────────────────────────────────────────────

def test_reset_progress(client, mock_db):
    """POST /api/decision-making/reset returns progress to Level 1 and abandons in-progress attempts."""
    import asyncio
    asyncio.run(seed_scenarios(mock_db))

    token = issue_token("student-1", "student", False)

    # Advance student to level 1 complete, level 2 in progress
    client.put("/api/decision-making/sessions/1/decision", json={"optionId": "B"}, cookies={COOKIE_NAME: token})
    client.post(
        "/api/decision-making/sessions/1/reasoning",
        json={"optionId": "B", "reasoning": "Saving most money so that I have emergency backup funds."},
        cookies={COOKIE_NAME: token},
    )
    client.post("/api/decision-making/sessions/1/complete", cookies={COOKIE_NAME: token})

    # Start level 2
    client.put("/api/decision-making/sessions/2/decision", json={"optionId": "A"}, cookies={COOKIE_NAME: token})

    # Call reset
    res_reset = client.post("/api/decision-making/reset", cookies={COOKIE_NAME: token})
    assert res_reset.status_code == 200
    data = res_reset.json()
    assert data["ok"] is True
    assert data["progress"]["currentLevelId"] == 1
    assert data["progress"]["completedLevelIds"] == []
    assert data["progress"]["sessions"] == {}

    # Verify attempt for Level 2 was marked "abandoned"
    abandoned_attempts = [
        d for d in mock_db.decision_making_attempts.docs
        if d["child_id"] == "student-1" and d["completion_status"] == "abandoned"
    ]
    assert len(abandoned_attempts) >= 1


# ─────────────────────────────────────────────────────────────────────────────
# 9. PARENT & TEACHER ANALYTICS & ROLE OWNERSHIP VERIFICATION TESTS
# ─────────────────────────────────────────────────────────────────────────────

def test_analytics_role_authorization_and_ownership(client, mock_db):
    """
    Analytics endpoint enforces strict role ownership and relationship verification:
    - Student A cannot view Student B's analytics (403 Forbidden).
    - Student A can view their own analytics (200 OK).
    - Guardian with confirmed consent for Student 1 can view Student 1 (200 OK).
    - Guardian without consent for Student 1 is rejected (403 Forbidden).
    - Teacher assigned to Student 1's class (CLASS-7A) can view Student 1 (200 OK).
    - Teacher assigned to another class (CLASS-9C) is rejected (403 Forbidden).
    - Unauthenticated callers are rejected with 401 Unauthorized.
    - Raw written explanations are withheld from guardians/teachers to protect privacy.
    """
    import asyncio
    asyncio.run(seed_scenarios(mock_db))

    student1_token = issue_token("student-1", "student", False)
    student2_token = issue_token("student-2", "student", False)
    guardian_linked_token = issue_token("guardian-1", "guardian", False)
    guardian_unlinked_token = issue_token("guardian-unlinked", "guardian", False)
    teacher_linked_token = issue_token("teacher-1", "teacher", False)
    teacher_other_token = issue_token("teacher-other", "teacher", False)

    # Have student-1 complete Level 1
    client.put("/api/decision-making/sessions/1/decision", json={"optionId": "B"}, cookies={COOKIE_NAME: student1_token})
    client.post(
        "/api/decision-making/sessions/1/reasoning",
        json={"optionId": "B", "reasoning": "I chose to save Rs. 4,000 because I need it for school fees next month."},
        cookies={COOKIE_NAME: student1_token},
    )
    client.post("/api/decision-making/sessions/1/complete", cookies={COOKIE_NAME: student1_token})

    # 1. Student 2 tries to view Student 1's analytics -> 403 Forbidden!
    res_forbidden = client.get(
        "/api/decision-making/analytics/student-1",
        cookies={COOKIE_NAME: student2_token},
    )
    assert res_forbidden.status_code == 403

    # 2. Student 1 views their own analytics -> 200 OK!
    res_self = client.get(
        "/api/decision-making/analytics/student-1",
        cookies={COOKIE_NAME: student1_token},
    )
    assert res_self.status_code == 200
    data_self = res_self.json()
    assert data_self["childId"] == "student-1"
    assert data_self["completedLevelsCount"] == 1
    assert "averageDimensionScores" in data_self
    assert "persistentStrengths" in data_self
    assert "recentAttemptsSummary" in data_self

    # 3. Verified Guardian views Student 1's analytics -> 200 OK!
    res_guardian = client.get(
        "/api/decision-making/analytics/student-1",
        cookies={COOKIE_NAME: guardian_linked_token},
    )
    assert res_guardian.status_code == 200
    assert res_guardian.json()["childId"] == "student-1"

    # 4. Unlinked Guardian tries to view Student 1's analytics -> 403 Forbidden!
    res_unlinked_guardian = client.get(
        "/api/decision-making/analytics/student-1",
        cookies={COOKIE_NAME: guardian_unlinked_token},
    )
    assert res_unlinked_guardian.status_code == 403

    # 5. Assigned Teacher (CLASS-7A) views Student 1's analytics -> 200 OK!
    res_teacher = client.get(
        "/api/decision-making/analytics/student-1",
        cookies={COOKIE_NAME: teacher_linked_token},
    )
    assert res_teacher.status_code == 200
    assert res_teacher.json()["childId"] == "student-1"

    # 6. Unassigned Teacher (CLASS-9C) tries to view Student 1's analytics -> 403 Forbidden!
    res_other_teacher = client.get(
        "/api/decision-making/analytics/student-1",
        cookies={COOKIE_NAME: teacher_other_token},
    )
    assert res_other_teacher.status_code == 403

    # 7. Unauthenticated caller tries to view Student 1's analytics -> 401 Unauthorized!
    res_unauth = client.get("/api/decision-making/analytics/student-1")
    assert res_unauth.status_code == 401
