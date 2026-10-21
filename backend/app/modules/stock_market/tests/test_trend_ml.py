import json
from pathlib import Path

import pandas as pd

from app.modules.stock_market.ml.config import FEATURE_COLUMNS, HORIZON_DAYS
from app.modules.stock_market.ml.preprocess import add_features, clean_prices, load_raw
from app.modules.stock_market.ml.train import chrono_masks

FIXTURE = Path(__file__).resolve().parent / "data"


def test_fixture_is_indexes_not_companies():
    prices, info = load_raw(FIXTURE / "indexData.csv", FIXTURE / "indexInfo.csv")
    assert set(info["Index"]) <= {"NYA", "NSEI"}
    assert "SUNTEA" not in set(prices["Index"])


def test_features_do_not_use_future_close_as_inputs():
    prices, info = load_raw(FIXTURE / "indexData.csv", FIXTURE / "indexInfo.csv")
    cleaned = clean_prices(prices, info, processed_path=None)
    featured = add_features(cleaned)
    assert set(FEATURE_COLUMNS).issubset(featured.columns)
    assert featured["label"].isin(["upward", "downward", "sideways"]).all()
    one = featured[featured["symbol"] == "NYA"].sort_values("date")
    row = one.iloc[20]
    raw = cleaned[cleaned["symbol"] == "NYA"].sort_values("date")
    today = raw[raw["date"] == row["date"]].iloc[0]
    later = raw[raw["date"] > row["date"]].head(HORIZON_DAYS)
    assert float(row["close"]) == float(today["close"])
    future = later.iloc[-1]["close"] / today["close"] - 1
    assert abs(float(row["future_ret"]) - float(future)) < 1e-6


def test_chrono_split_keeps_test_after_train():
    dates = pd.Series(pd.date_range("2010-01-01", periods=100, freq="D"))
    train, _val, test, meta = chrono_masks(dates)
    assert dates[train].max() < dates[test].min()
    assert meta["shuffle"] is False
