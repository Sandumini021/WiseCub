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
    if result["reliable"] and result["intent"] in {"OPEN_PORTFOLIO", "ASK_ABOUT_PORTFOLIO_MONEY"}:
        assert result["suggested_route"] == "/market/portfolio"


def test_singlish_buy_how_to():
    result = predict_intent("stock ekak buy karanne kohomada?", "student", "/market")
    assert result["used_model"] is True
    if result["reliable"]:
        assert result["intent"] in {"HOW_TO_BUY", "HOW_TO_TRADE", "OPEN_TERMINAL"}


def test_clarification_and_chart_seeds():
    confused = predict_intent("mata therenne naha", "student", "/market")
    chart = predict_intent("me chart eka explain karanna", "student", "/market")
    if confused["reliable"]:
        assert confused["intent"] in {"CLARIFY_CONFUSION", "ASK_FOR_HELP", "FOLLOW_UP_EXPLAIN"}
    if chart["reliable"]:
        assert chart["intent"] in {"ASK_ABOUT_CHART", "EXPLAIN_CURRENT_PAGE"}


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
