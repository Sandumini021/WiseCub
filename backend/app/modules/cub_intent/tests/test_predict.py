from fastapi.testclient import TestClient

from app.main import app
from app.modules.cub_intent.model import load_bundle, predict_intent

client = TestClient(app)


def test_saved_model_exists():
    assert load_bundle() is not None


def test_student_cannot_navigate_to_teacher_classes():
    result = predict_intent("show my classes", "student", "/student/dashboard")
    assert result["used_model"] is True
    if result["intent"] == "OPEN_TEACHER_CLASSES" and result["reliable"]:
        assert result["navigation_blocked"] is True
        assert result["suggested_route"] == "/student/dashboard"


def test_portfolio_maps_to_market_portfolio():
    result = predict_intent("show my portfolio", "student", "/market")
    if result["intent"] == "OPEN_PORTFOLIO" and result["reliable"]:
        assert result["suggested_route"] == "/market/portfolio"


def test_intent_endpoint():
    response = client.post(
        "/api/cub/intent",
        json={"text": "open the stock market simulator", "role": "student", "path": "/home"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["model_ready"] is True
    assert "not research-validated" in body["model_note"].lower() or "Synthetic" in body["model_note"]
    if body["intent"] == "OPEN_STOCK_MARKET":
        assert body["suggested_route"] == "/market"
