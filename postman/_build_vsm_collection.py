"""Build importable Postman v2.1 files for Virtual Stock Market."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SCHEMA = "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"

EVENT_CASES = [
    ("company_viewed", "Virtual_Stock_Market.market_views", {"ticker": "SUNTEA"}),
    ("market_trend_viewed", "Virtual_Stock_Market.market_views", {"ticker": "LNKBNK"}),
    ("risk_explanation_viewed", "Virtual_Stock_Market.market_views", {"ticker": "CEYPOW"}),
    ("price_drop_observed", "Virtual_Stock_Market.market_views", {"ticker": "SUNTEA", "change_pct": -8}),
    ("portfolio_reviewed", "Virtual_Stock_Market.market_views", {"cash": 700}),
    ("buy_order_placed", "Virtual_Stock_Market.market_orders", {
        "ticker": "SUNTEA", "side": "buy", "shares": 10, "price": 12.5, "cash": 875, "order_id": "ord-buy-1",
    }),
    ("sell_order_placed", "Virtual_Stock_Market.market_orders", {
        "ticker": "SUNTEA", "side": "sell", "shares": 4, "price": 13.1, "sold_fraction": 0.4, "order_id": "ord-sell-1",
    }),
    ("order_modified", "Virtual_Stock_Market.market_orders", {
        "ticker": "SUNTEA", "order_id": "ord-buy-1", "modified": True, "shares": 8,
    }),
    ("order_cancelled", "Virtual_Stock_Market.market_orders", {
        "ticker": "HARBOR", "order_id": "ord-buy-2",
    }),
    ("trade_reason_submitted", "Virtual_Stock_Market.market_habits", {
        "ticker": "SUNTEA", "reason": "I like tea companies",
    }),
    ("coaching_shown", "Virtual_Stock_Market.market_habits", {"scenario_id": "habit-herd"}),
    ("coaching_response", "Virtual_Stock_Market.market_habits", {"scenario_id": "habit-herd", "reason": "I will wait"}),
    ("habit_popup_opened", "Virtual_Stock_Market.market_habits", {}),
    ("habit_card_tapped", "Virtual_Stock_Market.market_habits", {"scenario_id": "habit-fomo"}),
    ("lesson_completed", "Virtual_Stock_Market.market_lessons", {"scenario_id": "lesson-diversify"}),
]


def hdr() -> list[dict]:
    return [{"key": "Content-Type", "value": "application/json"}]


def tests(*lines: str) -> dict:
    return {
        "listen": "test",
        "script": {"type": "text/javascript", "exec": list(lines)},
    }


def req(method: str, path: str, body: dict | None = None, query: list | None = None) -> dict:
    url = {
        "raw": "{{base_url}}" + path,
        "host": ["{{base_url}}"],
        "path": [p for p in path.strip("/").split("/") if p],
    }
    if query:
        url["query"] = query
        raw_q = "&".join(f"{q['key']}={q.get('value','')}" for q in query if not q.get("disabled"))
        if raw_q:
            url["raw"] = "{{base_url}}" + path + "?" + raw_q
    out: dict = {"method": method, "header": hdr() if body is not None else [], "url": url}
    if body is not None:
        out["body"] = {"mode": "raw", "raw": json.dumps(body, indent=2), "options": {"raw": {"language": "json"}}}
    return out


def item(name: str, method: str, path: str, script: list[str], body: dict | None = None, query: list | None = None, desc: str = "") -> dict:
    return {
        "name": name,
        "request": {**req(method, path, body, query), "description": desc},
        "event": [tests(*script)],
    }


def event_body(event_type: str, extra: dict) -> dict:
    payload = {
        "child_id": "{{child_id}}",
        "session_id": "{{session_id}}",
        "type": event_type,
        **extra,
    }
    return payload


STATUS_OK = [
    "pm.test('status 200', function () { pm.response.to.have.status(200); });",
]
JSON = [
    "pm.test('json body', function () { pm.response.to.be.json; });",
]


def main() -> None:
    event_items = []
    for idx, (etype, folder, extra) in enumerate(EVENT_CASES, start=1):
        body = event_body(etype, extra)
        event_items.append(item(
            f"{idx:02d} {etype}",
            "POST",
            "/api/market/events",
            [
                *STATUS_OK,
                *JSON,
                "const j = pm.response.json();",
                "pm.test('event stored', function () { pm.expect(j.ok).to.eql(true); pm.expect(j.type).to.eql('" + etype + "'); });",
                "pm.test('Compass folder', function () { pm.expect(j.folder).to.eql('" + folder + "'); });",
            ],
            body,
            desc=f"Logs {etype} into {folder} (and Virtual_Stock_Market.market_events).",
        ))

    driven = item(
        "Data-driven event (Collection Runner)",
        "POST",
        "/api/market/events",
        [
            *STATUS_OK,
            "const j = pm.response.json();",
            "pm.test('matches iteration type', function () {",
            "  pm.expect(j.type).to.eql(pm.iterationData.get('event_type') || j.type);",
            "});",
            "if (pm.iterationData.get('expected_folder')) {",
            "  pm.test('matches iteration folder', function () {",
            "    pm.expect(j.folder).to.eql(pm.iterationData.get('expected_folder'));",
            "  });",
            "}",
        ],
        {
            "child_id": "{{child_id}}",
            "session_id": "{{session_id}}",
            "type": "{{event_type}}",
            "ticker": "{{ticker}}",
        },
        desc="Run the collection with postman/data/vsm-event-types.json selected as data file.",
    )

    collection = {
        "info": {
            "name": "WiseCub Virtual Stock Market",
            "description": (
                "Scenarios for the Virtual Stock Market API on http://127.0.0.1:8000.\n\n"
                "Import this file + WiseCub Local environment. Keep FastAPI running.\n"
                "For all 15 event types at once: Runner → this collection → "
                "select postman/data/vsm-event-types.json on the data-driven request, or run the Events folder."
            ),
            "schema": SCHEMA,
        },
        "variable": [
            {"key": "base_url", "value": "http://127.0.0.1:8000"},
            {"key": "child_id", "value": "postman-vsm-child"},
            {"key": "session_id", "value": "postman-vsm-session-1"},
            {"key": "symbol", "value": "N225"},
            {"key": "event_type", "value": "company_viewed"},
            {"key": "ticker", "value": "SUNTEA"},
        ],
        "item": [
            {
                "name": "00 Health",
                "item": [
                    item(
                        "API health + Mongo",
                        "GET",
                        "/health",
                        [
                            *STATUS_OK,
                            *JSON,
                            "const j = pm.response.json();",
                            "pm.test('service wisecub', function () { pm.expect(j.service).to.eql('wisecub'); });",
                            "pm.test('database connected', function () { pm.expect(j.database).to.eql('connected'); });",
                            "pm.test('db name wisecub', function () { pm.expect(j.db_name).to.eql('wisecub'); });",
                        ],
                    ),
                ],
            },
            {
                "name": "01 Classroom indexes",
                "item": [
                    item(
                        "List assets",
                        "GET",
                        "/api/market/assets",
                        [
                            *STATUS_OK,
                            "const j = pm.response.json();",
                            "pm.test('indexes not companies', function () {",
                            "  pm.expect(j.kind).to.eql('market_index');",
                            "  pm.expect(j.assets.length).to.be.above(5);",
                            "});",
                            "pm.test('includes N225', function () {",
                            "  pm.expect(j.assets.map(a => a.symbol)).to.include('N225');",
                            "});",
                        ],
                    ),
                    item(
                        "History N225 default limit",
                        "GET",
                        "/api/market/history/{{symbol}}",
                        [
                            *STATUS_OK,
                            "const j = pm.response.json();",
                            "pm.test('points', function () {",
                            "  pm.expect(j.symbol).to.eql(pm.variables.get('symbol') || 'N225');",
                            "  pm.expect(j.points.length).to.be.at.most(180);",
                            "  pm.expect(j.points.length).to.be.at.least(20);",
                            "});",
                        ],
                    ),
                    item(
                        "History IXIC min limit 20",
                        "GET",
                        "/api/market/history/IXIC",
                        [
                            *STATUS_OK,
                            "const j = pm.response.json();",
                            "pm.test('limit applied', function () { pm.expect(j.points.length).to.eql(20); });",
                        ],
                        query=[{"key": "limit", "value": "20"}],
                    ),
                    item(
                        "History NYA max limit 500",
                        "GET",
                        "/api/market/history/NYA",
                        [
                            *STATUS_OK,
                            "const j = pm.response.json();",
                            "pm.test('capped', function () { pm.expect(j.points.length).to.be.at.most(500); });",
                        ],
                        query=[{"key": "limit", "value": "500"}],
                    ),
                    item(
                        "History HSI",
                        "GET",
                        "/api/market/history/HSI",
                        [
                            *STATUS_OK,
                            "const j = pm.response.json();",
                            "pm.test('HSI history', function () { pm.expect(j.symbol).to.eql('HSI'); });",
                        ],
                    ),
                    item(
                        "History SUNTEA maps to NSEI",
                        "GET",
                        "/api/market/history/SUNTEA",
                        [
                            *STATUS_OK,
                            "const j = pm.response.json();",
                            "pm.test('demo company uses index', function () { pm.expect(j.symbol).to.eql('NSEI'); });",
                        ],
                    ),
                    item(
                        "Analysis N225",
                        "GET",
                        "/api/market/analysis/N225",
                        [
                            *STATUS_OK,
                            "const j = pm.response.json();",
                            "pm.test('has trend fields', function () {",
                            "  pm.expect(j).to.have.property('symbol');",
                            "});",
                        ],
                    ),
                    item(
                        "Analysis IXIC",
                        "GET",
                        "/api/market/analysis/IXIC",
                        [*STATUS_OK, *JSON],
                    ),
                ],
            },
            {
                "name": "02 Practice bag (module_state)",
                "item": [
                    item(
                        "Save concentrated tea bag",
                        "PUT",
                        "/api/state/{{child_id}}/market",
                        [
                            *STATUS_OK,
                            "const j = pm.response.json();",
                            "pm.test('saved market', function () {",
                            "  pm.expect(j.ok).to.eql(true);",
                            "  pm.expect(j.module).to.eql('market');",
                            "});",
                        ],
                        {
                            "data": {
                                "cash": 400,
                                "holdings": [
                                    {"ticker": "SUNTEA", "shares": 40, "avgPrice": 10},
                                    {"ticker": "LNKBNK", "shares": 2, "avgPrice": 20},
                                ],
                            }
                        },
                    ),
                    item(
                        "Read bag",
                        "GET",
                        "/api/state/{{child_id}}/market",
                        [
                            *STATUS_OK,
                            "const j = pm.response.json();",
                            "pm.test('holdings persisted', function () {",
                            "  pm.expect(j.module).to.eql('market');",
                            "  pm.expect(j.data.holdings[0].ticker).to.eql('SUNTEA');",
                            "});",
                        ],
                    ),
                    item(
                        "Save lessons state",
                        "PUT",
                        "/api/state/{{child_id}}/market_lessons",
                        [
                            *STATUS_OK,
                            "pm.test('module', function () { pm.expect(pm.response.json().module).to.eql('market_lessons'); });",
                        ],
                        {"data": {"completed": ["lesson-diversify"]}},
                    ),
                ],
            },
            {
                "name": "03 Market events (all types)",
                "item": event_items + [driven],
            },
            {
                "name": "04 Behaviour engine",
                "item": [
                    item(
                        "Behaviour for this child",
                        "GET",
                        "/api/market/behaviour/{{child_id}}",
                        [
                            *STATUS_OK,
                            "const j = pm.response.json();",
                            "pm.test('child echoed', function () { pm.expect(j.child_id).to.eql(pm.variables.get('child_id')); });",
                            "pm.test('has indicators', function () { pm.expect(j).to.have.property('indicators'); });",
                            "pm.test('has coaching', function () { pm.expect(j).to.have.property('coaching'); });",
                            "pm.test('allocation from bag', function () {",
                            "  pm.expect(j.allocation).to.be.an('object');",
                            "});",
                        ],
                    ),
                    item(
                        "Behaviour filtered by session",
                        "GET",
                        "/api/market/behaviour/{{child_id}}",
                        [
                            *STATUS_OK,
                            "const j = pm.response.json();",
                            "pm.test('session echoed', function () { pm.expect(j.session_id).to.eql(pm.variables.get('session_id')); });",
                        ],
                        query=[{"key": "session_id", "value": "{{session_id}}"}],
                    ),
                    item(
                        "Behaviour unknown child still 200 empty-ish",
                        "GET",
                        "/api/market/behaviour/unknown-child-xx",
                        [
                            *STATUS_OK,
                            "const j = pm.response.json();",
                            "pm.test('child echoed', function () { pm.expect(j.child_id).to.eql('unknown-child-xx'); });",
                        ],
                    ),
                ],
            },
            {
                "name": "05 Errors and validation",
                "item": [
                    item(
                        "History unknown symbol → 404",
                        "GET",
                        "/api/market/history/NOTANINDEX",
                        [
                            "pm.test('404 or 503', function () { pm.expect([404, 503]).to.include(pm.response.code); });",
                        ],
                    ),
                    item(
                        "History limit too small → 422",
                        "GET",
                        "/api/market/history/N225",
                        [
                            "pm.test('422', function () { pm.response.to.have.status(422); });",
                        ],
                        query=[{"key": "limit", "value": "5"}],
                    ),
                    item(
                        "History limit too large → 422",
                        "GET",
                        "/api/market/history/N225",
                        [
                            "pm.test('422', function () { pm.response.to.have.status(422); });",
                        ],
                        query=[{"key": "limit", "value": "9999"}],
                    ),
                    item(
                        "Analysis unknown symbol → 404",
                        "GET",
                        "/api/market/analysis/NOTANINDEX",
                        [
                            "pm.test('404 or 503', function () { pm.expect([404, 503]).to.include(pm.response.code); });",
                        ],
                    ),
                    item(
                        "Event child_id too short → 422",
                        "POST",
                        "/api/market/events",
                        ["pm.test('422', function () { pm.response.to.have.status(422); });"],
                        {"child_id": "short", "session_id": "postman-vsm-session-1", "type": "company_viewed", "ticker": "SUNTEA"},
                    ),
                    item(
                        "Event session_id too short → 422",
                        "POST",
                        "/api/market/events",
                        ["pm.test('422', function () { pm.response.to.have.status(422); });"],
                        {"child_id": "postman-vsm-child", "session_id": "x", "type": "company_viewed"},
                    ),
                    item(
                        "Event unknown type → 422",
                        "POST",
                        "/api/market/events",
                        ["pm.test('422', function () { pm.response.to.have.status(422); });"],
                        {"child_id": "postman-vsm-child", "session_id": "postman-vsm-session-1", "type": "not_a_real_event"},
                    ),
                    item(
                        "Event missing type → 422",
                        "POST",
                        "/api/market/events",
                        ["pm.test('422', function () { pm.response.to.have.status(422); });"],
                        {"child_id": "postman-vsm-child", "session_id": "postman-vsm-session-1"},
                    ),
                    item(
                        "Event sold_fraction out of range → 422",
                        "POST",
                        "/api/market/events",
                        ["pm.test('422', function () { pm.response.to.have.status(422); });"],
                        {
                            "child_id": "postman-vsm-child",
                            "session_id": "postman-vsm-session-1",
                            "type": "sell_order_placed",
                            "sold_fraction": 1.5,
                        },
                    ),
                    item(
                        "Unknown module state → 400",
                        "PUT",
                        "/api/state/{{child_id}}/not_a_module",
                        ["pm.test('400', function () { pm.response.to.have.status(400); });"],
                        {"data": {}},
                    ),
                ],
            },
        ],
    }

    (ROOT / "WiseCub-Virtual-Stock-Market.postman_collection.json").write_text(
        json.dumps(collection, indent=2), encoding="utf-8"
    )
    env = {
        "id": "wisecub-local",
        "name": "WiseCub Local",
        "values": [
            {"key": "base_url", "value": "http://127.0.0.1:8000", "enabled": True, "type": "default"},
            {"key": "child_id", "value": "postman-vsm-child", "enabled": True, "type": "default"},
            {"key": "session_id", "value": "postman-vsm-session-1", "enabled": True, "type": "default"},
            {"key": "symbol", "value": "N225", "enabled": True, "type": "default"},
        ],
        "_postman_variable_scope": "environment",
    }
    (ROOT / "WiseCub-Local.postman_environment.json").write_text(
        json.dumps(env, indent=2), encoding="utf-8"
    )
    data = []
    for etype, folder, extra in EVENT_CASES:
        data.append({
            "event_type": etype,
            "expected_folder": folder,
            "ticker": extra.get("ticker", "SUNTEA"),
            "child_id": "postman-vsm-child",
            "session_id": "postman-vsm-session-1",
        })
    (ROOT / "data").mkdir(exist_ok=True)
    (ROOT / "data" / "vsm-event-types.json").write_text(json.dumps(data, indent=2), encoding="utf-8")
    print("wrote collection, environment, iteration data")


if __name__ == "__main__":
    main()
