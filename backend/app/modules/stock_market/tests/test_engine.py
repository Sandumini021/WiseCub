from app.modules.stock_market.allocation import portfolio_allocation
from app.modules.stock_market.engine import (
    LEVEL_INSUFFICIENT,
    LEVEL_NOT_OBSERVED,
    LEVEL_REVIEW,
    analyse_events,
)


def _ev(kind, at, **extra):
    row = {"type": kind, "at": at, "session_id": "s1", "child_id": "child-demo-0001"}
    row.update(extra)
    return row


def test_no_events_is_insufficient_not_good():
    result = analyse_events([])
    assert result["trained_model"] is False
    by_name = {item["behaviour"]: item for item in result["indicators"]}
    assert by_name["herd_behaviour"]["level"] == LEVEL_INSUFFICIENT
    assert by_name["panic_selling"]["level"] == LEVEL_INSUFFICIENT
    assert by_name["poor_diversification"]["level"] == LEVEL_INSUFFICIENT


def test_popular_name_alone_is_not_herd():
    events = [
        _ev("buy_order_placed", "2026-01-01T10:00:00+00:00", ticker="SUNTEA", shares=10, price=480),
    ]
    herd = next(i for i in analyse_events(events)["indicators"] if i["behaviour"] == "herd_behaviour")
    assert herd["level"] == LEVEL_INSUFFICIENT


def test_herd_after_cue_without_company_view():
    events = [
        _ev("market_trend_viewed", "2026-01-01T10:00:00+00:00", ticker="SUNTEA", scenario_id="crowd-1"),
        _ev("buy_order_placed", "2026-01-01T10:01:00+00:00", ticker="SUNTEA", shares=10, price=480),
    ]
    herd = next(i for i in analyse_events(events)["indicators"] if i["behaviour"] == "herd_behaviour")
    assert herd["level"] == LEVEL_REVIEW
    assert herd["occurrences"] == 1


def test_herd_not_observed_if_company_viewed():
    events = [
        _ev("market_trend_viewed", "2026-01-01T10:00:00+00:00", ticker="SUNTEA", scenario_id="crowd-1"),
        _ev("company_viewed", "2026-01-01T10:00:20+00:00", ticker="SUNTEA"),
        _ev("buy_order_placed", "2026-01-01T10:01:00+00:00", ticker="SUNTEA", shares=10, price=480),
    ]
    herd = next(i for i in analyse_events(events)["indicators"] if i["behaviour"] == "herd_behaviour")
    assert herd["level"] == LEVEL_NOT_OBSERVED


def test_panic_requires_labelled_drop_and_large_fast_sell():
    events = [
        _ev("price_drop_observed", "2026-01-01T11:00:00+00:00", ticker="SUNTEA", change_pct=-9, scenario_id="drop-1"),
        _ev(
            "sell_order_placed",
            "2026-01-01T11:00:30+00:00",
            ticker="SUNTEA",
            shares=8,
            sold_fraction=0.8,
            price=400,
        ),
    ]
    panic = next(i for i in analyse_events(events)["indicators"] if i["behaviour"] == "panic_selling")
    assert panic["level"] == LEVEL_REVIEW


def test_small_sell_after_drop_is_not_panic():
    events = [
        _ev("price_drop_observed", "2026-01-01T11:00:00+00:00", ticker="SUNTEA", change_pct=-9, scenario_id="drop-1"),
        _ev(
            "sell_order_placed",
            "2026-01-01T11:00:30+00:00",
            ticker="SUNTEA",
            shares=1,
            sold_fraction=0.1,
            price=400,
        ),
    ]
    panic = next(i for i in analyse_events(events)["indicators"] if i["behaviour"] == "panic_selling")
    assert panic["level"] == LEVEL_NOT_OBSERVED


def test_diversification_uses_equity_including_cash():
    snap = portfolio_allocation(
        10_000,
        [{"ticker": "SUNTEA", "value": 90_000, "shares": 100, "sector": "Tea"}],
    )
    poor = next(
        i
        for i in analyse_events([], snap)["indicators"]
        if i["behaviour"] == "poor_diversification"
    )
    assert poor["level"] == LEVEL_REVIEW
    assert "SUNTEA" in poor["explanation"]


def test_impulsive_burst():
    events = [
        _ev("buy_order_placed", "2026-01-01T12:00:00+00:00", ticker="SUNTEA", shares=1, price=100),
        _ev("buy_order_placed", "2026-01-01T12:00:10+00:00", ticker="LNKBNK", shares=1, price=100),
        _ev("buy_order_placed", "2026-01-01T12:00:20+00:00", ticker="HARBOR", shares=1, price=100),
    ]
    item = next(i for i in analyse_events(events)["indicators"] if i["behaviour"] == "impulsive_investing")
    assert item["level"] == LEVEL_REVIEW
