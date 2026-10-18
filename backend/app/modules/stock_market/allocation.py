"""Portfolio mix using cash + holdings as the denominator."""

from __future__ import annotations

from typing import Any


def _num(value: Any, default: float = 0.0) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    if number != number:  # NaN
        return default
    return number


def portfolio_allocation(
    cash: float,
    holdings: list[dict[str, Any]],
    prices: dict[str, float] | None = None,
) -> dict[str, Any]:
    """Return company, sector and cash percentages.

    Invalid or zero totals yield empty slices and `usable=False` so callers
    do not treat missing money as 0% concentration (which would look 'good').
    """
    cash_value = max(0.0, _num(cash))
    prices = prices or {}
    companies: list[dict[str, Any]] = []
    sectors: dict[str, float] = {}

    for row in holdings or []:
        ticker = str(row.get("ticker") or "")
        shares = max(0.0, _num(row.get("shares")))
        if "value" in row and row.get("value") is not None:
            value = max(0.0, _num(row.get("value")))
        else:
            price = _num(prices.get(ticker, row.get("avgPrice") or row.get("price") or 0))
            value = shares * price
        sector = str(row.get("sector") or "Unknown")
        companies.append(
            {
                "ticker": ticker,
                "shares": shares,
                "value": round(value, 2),
                "sector": sector,
            }
        )
        sectors[sector] = sectors.get(sector, 0.0) + value

    holdings_value = sum(item["value"] for item in companies)
    total = cash_value + holdings_value
    if total <= 0:
        return {
            "usable": False,
            "total": 0.0,
            "cash": round(cash_value, 2),
            "cash_pct": None,
            "companies": [],
            "sectors": [],
            "largest_company_pct": None,
            "largest_ticker": None,
        }

    for item in companies:
        item["pct"] = round(100.0 * item["value"] / total, 2)

    sector_rows = [
        {"sector": name, "value": round(value, 2), "pct": round(100.0 * value / total, 2)}
        for name, value in sorted(sectors.items(), key=lambda pair: pair[1], reverse=True)
    ]
    largest = max(companies, key=lambda item: item["value"], default=None)
    return {
        "usable": True,
        "total": round(total, 2),
        "cash": round(cash_value, 2),
        "cash_pct": round(100.0 * cash_value / total, 2),
        "companies": companies,
        "sectors": sector_rows,
        "largest_company_pct": largest["pct"] if largest else 0.0,
        "largest_ticker": largest["ticker"] if largest else None,
    }
