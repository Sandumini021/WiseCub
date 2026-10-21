from pathlib import Path

import pandas as pd

from app.modules.stock_market.ml.config import FEATURE_COLUMNS, HORIZON_DAYS
from app.modules.stock_market.ml.sp500_preprocess import clean_companies, clean_prices
from app.modules.stock_market.ml.preprocess import add_features
from app.modules.stock_market.ml.train import chrono_masks

FIXTURE = Path(__file__).resolve().parent / "data"


def _tiny_prices() -> pd.DataFrame:
    rows = []
    start = pd.Timestamp("2018-01-02")
    for symbol, base in (("AAA", 10.0), ("BBB", 20.0)):
        price = base
        for i in range(40):
            price = price * (1.01 if i % 7 else 0.99)
            rows.append(
                {
                    "date": start + pd.Timedelta(days=i),
                    "open": price,
                    "high": price * 1.01,
                    "low": price * 0.99,
                    "close": price,
                    "volume": 1000 + i,
                    "symbol": symbol,
                }
            )
    return pd.DataFrame(rows)


def test_inspect_fixture_companies():
    companies = pd.read_csv(FIXTURE / "sp500_companies.csv")
    cleaned = clean_companies(companies)
    assert set(cleaned["symbol"]) == {"AAA", "BBB"}
    assert int(cleaned.duplicated("symbol").sum()) == 0


def test_sp500_clean_and_features_no_future_leak():
    companies = clean_companies(pd.read_csv(FIXTURE / "sp500_companies.csv"))
    prices = _tiny_prices()
    cleaned = clean_prices(prices, companies)
    featured = add_features(cleaned)
    assert set(FEATURE_COLUMNS).issubset(featured.columns)
    assert featured["label"].isin(["upward", "downward", "sideways"]).all()
    one = featured[featured["symbol"] == "AAA"].sort_values("date")
    row = one.iloc[5]
    raw = cleaned[cleaned["symbol"] == "AAA"].sort_values("date")
    today = raw[raw["date"] == row["date"]].iloc[0]
    later = raw[raw["date"] > row["date"]].head(HORIZON_DAYS)
    assert float(row["close"]) == float(today["close"])
    future = later.iloc[-1]["close"] / today["close"] - 1
    assert abs(float(row["future_ret"]) - float(future)) < 1e-6


def test_sp500_chrono_split_order():
    dates = pd.Series(pd.date_range("2015-01-01", periods=200, freq="D"))
    train, _val, test, meta = chrono_masks(dates)
    assert dates[train].max() < dates[test].min()
    assert meta["shuffle"] is False
