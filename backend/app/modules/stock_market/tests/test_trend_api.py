from fastapi.testclient import TestClient

from app.main import app


def test_assets_endpoint_does_not_need_mongo():
    client = TestClient(app)
    response = client.get("/api/market/assets")
    assert response.status_code == 200
    body = response.json()
    assert body["kind"] == "market_index"
    assert "assets" in body


def test_unknown_history_is_404():
    client = TestClient(app)
    response = client.get("/api/market/history/NOTANINDEX")
    assert response.status_code in {404, 503}
