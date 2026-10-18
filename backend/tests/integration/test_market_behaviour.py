from fastapi.testclient import TestClient

from app.main import app
from app.modules.stock_market import router as market_router


class _Cursor:
    def __init__(self, docs):
        self._docs = docs

    def sort(self, *_args, **_kwargs):
        return self

    async def to_list(self, _n):
        return list(self._docs)


class _Coll:
    def __init__(self):
        self.docs: list[dict] = []

    async def insert_one(self, doc):
        self.docs.append(dict(doc))

    def find(self, query, _proj=None):
        matched = [row for row in self.docs if all(row.get(k) == v for k, v in query.items())]
        return _Cursor(matched)

    async def find_one(self, query, _proj=None):
        for row in self.docs:
            if all(row.get(k) == v for k, v in query.items()):
                return row
        return None


class _DB:
    def __init__(self):
        self.market_events = _Coll()
        self.module_state = _Coll()


def test_event_and_behaviour_endpoints(monkeypatch):
    fake = _DB()
    monkeypatch.setattr(market_router, "get_db", lambda: fake)
    client = TestClient(app)
    payload = {
        "child_id": "11111111-1111-1111-1111-111111111111",
        "session_id": "22222222-2222-2222-2222-222222222222",
        "type": "market_trend_viewed",
        "ticker": "SUNTEA",
        "scenario_id": "crowd-1",
        "at": "2026-01-01T10:00:00+00:00",
    }
    posted = client.post("/api/market/events", json=payload)
    assert posted.status_code == 200
    assert posted.json()["ok"] is True
    buy = {
        **payload,
        "type": "buy_order_placed",
        "shares": 10,
        "price": 480,
        "at": "2026-01-01T10:00:30+00:00",
    }
    assert client.post("/api/market/events", json=buy).status_code == 200
    report = client.get(
        f"/api/market/behaviour/{payload['child_id']}",
        params={"session_id": payload["session_id"]},
    )
    assert report.status_code == 200
    body = report.json()
    assert body["trained_model"] is False
    herd = next(i for i in body["indicators"] if i["behaviour"] == "herd_behaviour")
    assert herd["level"] == "worth_reviewing"
    assert body["coaching"]
