"""
test_safety_guardian.py

Comprehensive tests for Scam Safety parent/guardian consent, verification,
and 6-level educational email simulations.
"""

from unittest.mock import patch
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.modules.safety import router as safety_router
from app.modules.safety.email_service import LEVEL_TEMPLATES


class _Cursor:
    def __init__(self, docs):
        self.docs = docs

    def sort(self, field, direction):
        return self

    async def to_list(self, length=100):
        return [dict(d) for d in self.docs[:length]]


class _Coll:
    def __init__(self):
        self.docs: list[dict] = []

    async def find_one(self, query, _proj=None):
        for row in self.docs:
            if all(row.get(k) == v for k, v in query.items()):
                return dict(row)
        return None

    def find(self, query, _proj=None):
        matched = [dict(row) for row in self.docs if all(row.get(k) == v for k, v in query.items())]
        return _Cursor(matched)

    async def insert_one(self, doc):
        self.docs.append(dict(doc))

    async def update_one(self, query, update, upsert=False):
        matched = None
        for row in self.docs:
            if all(row.get(k) == v for k, v in query.items()):
                matched = row
                break
        payload = dict(update.get("$set", {}))
        if matched is None:
            if upsert:
                new_doc = {**query, **payload}
                self.docs.append(new_doc)
            return
        matched.update(payload)


class _DB:
    def __init__(self):
        self.guardian_consent = _Coll()
        self.safety_simulations = _Coll()
        self.children = _Coll()
        self.module_state = _Coll()
        self.module_states = self.module_state


@pytest.fixture
def mock_db(monkeypatch):
    from app.api import routes as api_routes

    fake = _DB()
    monkeypatch.setattr(safety_router, "get_db", lambda: fake)
    monkeypatch.setattr(api_routes, "get_db", lambda: fake)
    return fake


@pytest.fixture
def client(mock_db):
    return TestClient(app)


def test_level_templates_all_six_levels_defined():
    """Verify all 6 Scam Safety categories have dedicated templates and red flags."""
    expected_levels = ["phishing", "sms", "qr", "prize", "impersonation", "financial"]
    for idx, lvl in enumerate(expected_levels, start=1):
        assert lvl in LEVEL_TEMPLATES, f"Missing template for {lvl}"
        tpl = LEVEL_TEMPLATES[lvl]
        assert tpl["level_number"] == str(idx)
        assert len(tpl["red_flags"]) >= 3
        assert len(tpl["learning_goal"]) > 10
        assert "simulated_body" in tpl
        assert "email_subject" in tpl


def test_guardian_details_validation(client):
    """Test validation of parent/guardian name and email address."""
    child_id = "test-child-val-1"

    # Name too short (Pydantic returns 422)
    res_bad_name = client.put(
        f"/api/safety/guardian/{child_id}",
        json={
            "parent_name": "A",
            "email": "parent@example.com",
            "relationship": "Mother",
            "consent_confirmed": True,
            "simulation_enabled": True,
        },
    )
    assert res_bad_name.status_code == 422

    # Invalid email format (our validator returns 400)
    res_bad_email = client.put(
        f"/api/safety/guardian/{child_id}",
        json={
            "parent_name": "Jane Doe",
            "email": "not-an-email",
            "relationship": "Mother",
            "consent_confirmed": True,
            "simulation_enabled": True,
        },
    )
    assert res_bad_email.status_code == 400


def test_guardian_save_and_verification_flow(client):
    """Test saving guardian details, pending status, and email verification."""
    child_id = "test-child-verify-flow"

    # Save guardian
    res = client.put(
        f"/api/safety/guardian/{child_id}",
        json={
            "parent_name": "Sarah Connor",
            "email": "sarah.connor@testmail.com",
            "relationship": "Mother",
            "consent_confirmed": True,
            "simulation_enabled": True,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["parent_name"] == "Sarah Connor"
    assert data["email"] == "sarah.connor@testmail.com"
    assert data["verification_status"] == "pending"
    assert data["consent_confirmed"] is True
    token = data["verification_token_dev"]
    assert token

    # Check status endpoint
    get_res = client.get(f"/api/safety/guardian/{child_id}")
    assert get_res.status_code == 200
    assert get_res.json()["verification_status"] == "pending"

    # Verify with token
    verify_res = client.post(
        f"/api/safety/guardian/{child_id}/verify",
        json={"token": token},
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["verification_status"] == "verified"

    # Confirm verified in get
    get_res_after = client.get(f"/api/safety/guardian/{child_id}")
    assert get_res_after.json()["verification_status"] == "verified"
    assert get_res_after.json()["verified_at"] is not None


def test_consent_withdrawal_disables_simulations(client):
    """Test withdrawing consent or disabling simulation emails."""
    child_id = "test-child-consent-withdraw"

    # Register & verify
    client.put(
        f"/api/safety/guardian/{child_id}",
        json={
            "parent_name": "John Smith",
            "email": "john.smith@testmail.com",
            "relationship": "Father",
            "consent_confirmed": True,
            "simulation_enabled": True,
        },
    )
    client.post(f"/api/safety/guardian/{child_id}/verify", json={})

    # Withdraw consent
    res = client.post(
        f"/api/safety/guardian/{child_id}/consent",
        json={"consent_confirmed": False, "simulation_enabled": False},
    )
    assert res.status_code == 200
    assert res.json()["consent_confirmed"] is False
    assert res.json()["simulation_enabled"] is False

    # Attempt trigger simulation -> must be rejected due to withdrawn consent
    sim_res = client.post(
        f"/api/safety/simulation/trigger/{child_id}",
        json={"category_id": "phishing", "score": 90, "attempt_id": "attempt-1"},
    )
    assert sim_res.status_code == 200
    data = sim_res.json()
    assert data["eligible"] is False
    assert data["status"] in ("consent_required", "disabled")


def test_simulation_trigger_all_six_levels(client):
    """Test triggering educational simulations across all 6 levels when passed."""
    child_id = "test-child-all-levels"

    # Register and verify parent
    client.put(
        f"/api/safety/guardian/{child_id}",
        json={
            "parent_name": "Maria Garcia",
            "email": "maria.garcia@testmail.com",
            "relationship": "Parent",
            "consent_confirmed": True,
            "simulation_enabled": True,
        },
    )
    client.post(f"/api/safety/guardian/{child_id}/verify", json={})

    categories = ["phishing", "sms", "qr", "prize", "impersonation", "financial"]

    # Mock email sending to avoid real network calls
    with patch(
        "app.modules.safety.router.send_simulation_email",
        return_value={
            "success": True,
            "status": "sent",
            "subject": "Mock Subject",
            "to_email": "maria.garcia@testmail.com",
            "detail": "Delivered via mock",
        },
    ):
        for idx, cat in enumerate(categories, start=1):
            # Attempt with score < 80 must NOT trigger email
            fail_res = client.post(
                f"/api/safety/simulation/trigger/{child_id}",
                json={"category_id": cat, "score": 75, "attempt_id": f"fail-{idx}"},
            )
            assert fail_res.json()["eligible"] is False
            assert fail_res.json()["status"] == "not_passed"

            # Attempt with score >= 80 triggers simulation for this level
            pass_res = client.post(
                f"/api/safety/simulation/trigger/{child_id}",
                json={
                    "category_id": cat,
                    "score": 85,
                    "attempt_id": f"pass-{idx}",
                    "red_flags_identified": ["artificial urgency"],
                },
            )
            assert pass_res.status_code == 200
            data = pass_res.json()
            assert data["eligible"] is True
            assert data["category_id"] == cat
            assert data["level_number"] == str(idx)
            assert data["status"] == "sent"
            assert "feedback_url" in data
            simulation_id = data["simulation_id"]

            # Test controlled educational feedback page
            feedback_res = client.get(f"/api/safety/simulation/feedback/{simulation_id}")
            assert feedback_res.status_code == 200
            fb_data = feedback_res.json()
            assert fb_data["simulation_id"] == simulation_id
            assert fb_data["educational_link_clicked"] is True
            assert len(fb_data["red_flags"]) >= 3


def test_simulation_duplicate_prevention(client):
    """Test server-side idempotency preventing duplicate simulation emails."""
    child_id = "test-child-idempotency"

    client.put(
        f"/api/safety/guardian/{child_id}",
        json={
            "parent_name": "Robert Taylor",
            "email": "robert@testmail.com",
            "relationship": "Father",
            "consent_confirmed": True,
            "simulation_enabled": True,
        },
    )
    client.post(f"/api/safety/guardian/{child_id}/verify", json={})

    attempt_id = "unique-completion-uuid-999"

    with patch(
        "app.modules.safety.router.send_simulation_email",
        return_value={
            "success": True,
            "status": "sent",
            "subject": "Mock Subject",
            "to_email": "robert@testmail.com",
            "detail": "Delivered via mock",
        },
    ) as mock_send:
        # First trigger
        res1 = client.post(
            f"/api/safety/simulation/trigger/{child_id}",
            json={"category_id": "qr", "score": 100, "attempt_id": attempt_id},
        )
        assert res1.json()["eligible"] is True
        assert res1.json().get("duplicate") is False
        assert mock_send.call_count == 1

        # Second trigger (page refresh / duplicate call for same attempt)
        res2 = client.post(
            f"/api/safety/simulation/trigger/{child_id}",
            json={"category_id": "qr", "score": 100, "attempt_id": attempt_id},
        )
        assert res2.json()["eligible"] is True
        assert res2.json()["duplicate"] is True
        # mock_send should still only have been called once!
        assert mock_send.call_count == 1


def test_simulation_safe_retry_on_failure(client):
    """Test that a simulation whose previous delivery status is not_configured or failed can be retried."""
    child_id = "test-child-retry"

    client.put(
        f"/api/safety/guardian/{child_id}",
        json={
            "parent_name": "Elena Smith",
            "email": "elena@testmail.com",
            "relationship": "Mother",
            "consent_confirmed": True,
            "simulation_enabled": True,
        },
    )
    client.post(f"/api/safety/guardian/{child_id}/verify", json={})

    attempt_id = "attempt-failed-then-retried-1"

    # 1. Initial attempt fails / not_configured
    with patch(
        "app.modules.safety.router.send_simulation_email",
        return_value={
            "success": False,
            "status": "not_configured",
            "subject": "Mock Subject",
            "to_email": "elena@testmail.com",
            "detail": "SMTP not configured",
        },
    ):
        res1 = client.post(
            f"/api/safety/simulation/trigger/{child_id}",
            json={"category_id": "sms", "score": 88, "attempt_id": attempt_id},
        )
        assert res1.json()["status"] == "not_configured"

    # 2. Safe retry after configuration is corrected -> updates existing attempt
    with patch(
        "app.modules.safety.router.send_simulation_email",
        return_value={
            "success": True,
            "status": "sent",
            "subject": "Mock Subject",
            "to_email": "elena@testmail.com",
            "detail": "Delivered via mock",
        },
    ):
        res2 = client.post(
            f"/api/safety/simulation/trigger/{child_id}",
            json={"category_id": "sms", "score": 88, "attempt_id": attempt_id, "force_retry": True},
        )
        assert res2.json()["status"] == "sent"
        assert res2.json()["retried"] is True

        # 3. Third call now that it is sent -> prevents duplicate sending!
        res3 = client.post(
            f"/api/safety/simulation/trigger/{child_id}",
            json={"category_id": "sms", "score": 88, "attempt_id": attempt_id},
        )
        assert res3.json()["duplicate"] is True
        assert res3.json()["status"] == "sent"


def test_trigger_passed_level_simulation(client):
    """Test triggering an educational simulation for a level that was passed earlier."""
    child_id = "test-child-passed-earlier"

    client.put(
        f"/api/safety/guardian/{child_id}",
        json={
            "parent_name": "David Brown",
            "email": "david@testmail.com",
            "relationship": "Father",
            "consent_confirmed": True,
            "simulation_enabled": True,
        },
    )
    client.post(f"/api/safety/guardian/{child_id}/verify", json={})

    # Save module state showing child completed phishing with 90%
    client.put(
        f"/api/state/{child_id}/safety",
        json={"data": {"completedCategories": ["phishing"], "categoryScores": {"phishing": 90}}},
    )

    with patch(
        "app.modules.safety.router.send_simulation_email",
        return_value={
            "success": True,
            "status": "sent",
            "subject": "Mock Subject",
            "to_email": "david@testmail.com",
            "detail": "Delivered via mock",
        },
    ):
        res = client.post(f"/api/safety/simulation/trigger-passed/{child_id}/phishing")
        assert res.status_code == 200
        assert res.json()["status"] == "sent"
        assert res.json()["category_id"] == "phishing"


def test_simulated_inbox_and_link_click_event(client):
    """Test retrieving child inbox and tracking link click event with debrief navigation."""
    child_id = "test-child-inbox-click"

    # Setup verified guardian
    client.put(
        f"/api/safety/guardian/{child_id}",
        json={
            "parent_name": "Elena Rostova",
            "email": "elena@testmail.com",
            "relationship": "Mother",
            "consent_confirmed": True,
            "simulation_enabled": True,
        },
    )
    client.post(f"/api/safety/guardian/{child_id}/verify", json={})

    # Trigger simulation for phishing level
    with patch(
        "app.modules.safety.router.send_simulation_email",
        return_value={"success": True, "status": "sent", "to_email": "elena@testmail.com"},
    ):
        trigger_res = client.post(
            f"/api/safety/simulation/trigger/{child_id}",
            json={"category_id": "phishing", "score": 90, "attempt_id": "attempt-phishing-1"},
        )
        sim_id = trigger_res.json()["simulation_id"]

    # 1. Inspect inbox
    inbox_res = client.get(f"/api/safety/simulation/inbox/{child_id}")
    assert inbox_res.status_code == 200
    inbox_data = inbox_res.json()
    assert inbox_data["total"] >= 1
    item = next(i for i in inbox_data["items"] if i["simulation_id"] == sim_id)
    assert item["category_id"] == "phishing"
    assert len(item["sender_name"]) > 0
    assert "@" in item["sender_email"]
    assert item["link_clicked"] is False
    assert item["outcome"] == "pending_decision"

    # 2. Record inbox opened event
    open_res = client.post(
        f"/api/safety/simulation/event/{sim_id}",
        json={"event_type": "inbox_opened"},
    )
    assert open_res.status_code == 200
    assert open_res.json()["event_type"] == "inbox_opened"

    # 3. Child clicks the simulated link -> record unsafe link click
    click_res = client.post(
        f"/api/safety/simulation/event/{sim_id}",
        json={"event_type": "link_clicked"},
    )
    assert click_res.status_code == 200
    click_data = click_res.json()
    assert click_data["link_clicked"] is True
    assert click_data["outcome"] == "unsafe_link_clicked"
    assert "/safety/simulation-feedback?id=" in click_data["redirect_url"]
    # Ensure controlled WiseCub URL, no external scam redirect
    assert "http://" not in click_data["redirect_url"] and "https://" not in click_data["redirect_url"]


def test_child_decision_reporting_without_click(client):
    """Test child recognizing scam and reporting it as suspicious without clicking."""
    child_id = "test-child-report-suspicious"

    client.put(
        f"/api/safety/guardian/{child_id}",
        json={
            "parent_name": "Marcus Vance",
            "email": "marcus@testmail.com",
            "relationship": "Father",
            "consent_confirmed": True,
            "simulation_enabled": True,
        },
    )
    client.post(f"/api/safety/guardian/{child_id}/verify", json={})

    with patch(
        "app.modules.safety.router.send_simulation_email",
        return_value={"success": True, "status": "sent", "to_email": "marcus@testmail.com"},
    ):
        trigger_res = client.post(
            f"/api/safety/simulation/trigger/{child_id}",
            json={"category_id": "sms", "score": 85, "attempt_id": "attempt-sms-1"},
        )
        sim_id = trigger_res.json()["simulation_id"]

    # Child reports the message without clicking the link
    report_res = client.post(
        f"/api/safety/simulation/event/{sim_id}",
        json={"event_type": "reported_suspicious", "selected_classification": "suspicious"},
    )
    assert report_res.status_code == 200
    rep_data = report_res.json()
    assert rep_data["reported_as_suspicious"] is True
    assert rep_data["link_clicked"] is False
    assert rep_data["outcome"] == "safely_reported"
    assert "action=reported" in rep_data["redirect_url"]


def test_simulation_follow_up_and_learning_metrics(client):
    """Test debrief follow-up question submission and parent learning analytics calculation."""
    child_id = "test-child-analytics-followup"

    client.put(
        f"/api/safety/guardian/{child_id}",
        json={
            "parent_name": "Samantha Wu",
            "email": "samantha@testmail.com",
            "relationship": "Guardian",
            "consent_confirmed": True,
            "simulation_enabled": True,
        },
    )
    client.post(f"/api/safety/guardian/{child_id}/verify", json={})

    with patch(
        "app.modules.safety.router.send_simulation_email",
        return_value={"success": True, "status": "sent", "to_email": "samantha@testmail.com"},
    ):
        res1 = client.post(
            f"/api/safety/simulation/trigger/{child_id}",
            json={"category_id": "phishing", "score": 90, "attempt_id": "wu-1"},
        )
        sim_id1 = res1.json()["simulation_id"]

    # Safely report simulation 1
    client.post(
        f"/api/safety/simulation/event/{sim_id1}",
        json={"event_type": "reported_suspicious", "selected_classification": "suspicious"},
    )

    # View debrief
    fb_res = client.get(f"/api/safety/simulation/feedback/{sim_id1}")
    assert fb_res.status_code == 200
    fb_data = fb_res.json()
    assert fb_data["reported_as_suspicious"] is True
    assert "follow_up" in fb_data
    correct_idx = fb_data["follow_up"]["correct_index"]

    # Submit follow-up question answer
    followup_res = client.post(
        f"/api/safety/simulation/follow-up/{sim_id1}",
        json={"selected_index": correct_idx},
    )
    assert followup_res.status_code == 200
    f_data = followup_res.json()
    assert f_data["is_correct"] is True
    assert len(f_data["explanation"]) > 0

    # Fetch Parent Learning Metrics
    metrics_res = client.get(f"/api/safety/simulation/metrics/{child_id}")
    assert metrics_res.status_code == 200
    m_data = metrics_res.json()
    assert m_data["total_simulations"] >= 1
    assert m_data["correctly_reported_count"] >= 1
    assert m_data["unsafe_clicks_count"] == 0
    assert m_data["safe_avoidance_rate"] == 100.0
    assert m_data["follow_up_completed_count"] >= 1
    assert m_data["follow_up_accuracy"] == 100.0
    assert "phishing" in m_data["by_level"]
    assert m_data["by_level"]["phishing"]["correctly_reported"] >= 1


def test_simulation_email_content_and_realistic_formatting():
    """Verify outgoing simulation email matches inbox content without red flag spoilers."""
    from app.modules.safety.email_service import build_simulation_html, LEVEL_TEMPLATES

    for cat_id, tpl in LEVEL_TEMPLATES.items():
        subject, plain_text, html = build_simulation_html(
            parent_name="Alex",
            category_id=cat_id,
            simulation_id="test-sim-123",
            feedback_url="http://localhost:5173/safety/simulation-feedback?id=test-sim-123",
            child_name="Leo",
        )
        assert len(subject) > 5
        assert len(plain_text) > 20
        # Verify no upfront spoilers
        assert "Red Flags to Discuss Together" not in html
        assert "red-flag" not in html.lower()
        # Verify realistic scenario elements
        assert tpl["call_to_action"] in html
        assert "test-sim-123" in html
        assert "Consented Learning Simulation" in html
        assert "safety/simulation-feedback?id=test-sim-123" in html


def test_scanner_user_agent_does_not_trigger_link_click(client):
    """Verify security scanner / bot prefetch does not count as an unsafe child click."""
    child_id = "test-child-scanner"

    client.put(
        f"/api/safety/guardian/{child_id}",
        json={
            "parent_name": "Scanner Test",
            "email": "scanner@testmail.com",
            "relationship": "Parent",
            "consent_confirmed": True,
            "simulation_enabled": True,
        },
    )
    client.post(f"/api/safety/guardian/{child_id}/verify", json={})

    with patch(
        "app.modules.safety.router.send_simulation_email",
        return_value={"success": True, "status": "sent", "to_email": "scanner@testmail.com"},
    ):
        res = client.post(
            f"/api/safety/simulation/trigger/{child_id}",
            json={"category_id": "phishing", "score": 95, "attempt_id": "attempt-scanner-1"},
        )
        sim_id = res.json()["simulation_id"]

    # Request with scanner User-Agent (GoogleImageProxy)
    scanner_headers = {"User-Agent": "GoogleImageProxy/1.0"}
    fb_res = client.get(f"/api/safety/simulation/feedback/{sim_id}", headers=scanner_headers)
    assert fb_res.status_code == 200

    # Ensure link_clicked is STILL False
    status_res = client.get(f"/api/safety/simulation/inbox/{child_id}")
    items = status_res.json()["items"]
    sim_item = next(i for i in items if i["simulation_id"] == sim_id)
    assert sim_item["link_clicked"] is False
    assert sim_item["outcome"] == "pending_decision"


def test_cross_student_authorization_isolation(client):
    """Verify student A cannot access student B's inbox, status, or trigger events."""
    from app.modules.accounts.security import COOKIE_NAME, issue_token

    student_a_token = issue_token(child_id="student-A", role="student", remember=False)
    client.cookies.set(COOKIE_NAME, student_a_token)

    # Student A attempts to access Student B's inbox
    res_inbox = client.get("/api/safety/simulation/inbox/student-B")
    assert res_inbox.status_code == 403
    assert "Unauthorized" in res_inbox.json()["detail"]

    # Student A attempts to access Student B's status
    res_status = client.get("/api/safety/simulation/status/student-B")
    assert res_status.status_code == 403

    # Student A attempts to access Student B's metrics
    res_metrics = client.get("/api/safety/simulation/metrics/student-B")
    assert res_metrics.status_code == 403


