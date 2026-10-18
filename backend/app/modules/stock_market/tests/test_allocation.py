from app.modules.stock_market.allocation import portfolio_allocation


def test_cash_plus_holdings_is_denominator():
    result = portfolio_allocation(
        50_000,
        [
            {"ticker": "SUNTEA", "shares": 100, "value": 50_000, "sector": "Tea"},
        ],
    )
    assert result["usable"] is True
    assert result["total"] == 100_000
    assert result["cash_pct"] == 50.0
    assert result["largest_company_pct"] == 50.0
    assert result["sectors"][0]["sector"] == "Tea"


def test_zero_total_is_not_treated_as_good_spread():
    result = portfolio_allocation(0, [])
    assert result["usable"] is False
    assert result["largest_company_pct"] is None
    assert result["companies"] == []


def test_invalid_numbers_are_safe():
    result = portfolio_allocation(
        "nope",
        [{"ticker": "X", "shares": None, "value": float("nan")}],
    )
    assert result["usable"] is False
