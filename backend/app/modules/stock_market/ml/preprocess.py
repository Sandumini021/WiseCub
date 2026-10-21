"""Clean index CSVs and build leakage-safe features per symbol."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

from app.modules.stock_market.ml.config import (
    DOWN_THRESHOLD,
    FEATURE_COLUMNS,
    HORIZON_DAYS,
    UP_THRESHOLD,
)
from app.modules.stock_market.ml.paths import (
    ARTIFACTS_DIR,
    ASSETS_PATH,
    CLEANED_CSV_PATH,
    CLEANED_PATH,
    HISTORY_PATH,
    LATEST_PATH,
    PREPROCESS_NOTES_PATH,
    index_data_csv,
    index_info_csv,
    index_processed_csv,
)


def _label(future_ret: float) -> str:
    if future_ret >= UP_THRESHOLD:
        return "upward"
    if future_ret <= DOWN_THRESHOLD:
        return "downward"
    return "sideways"


def load_raw(data_path: Path | None = None, info_path: Path | None = None) -> tuple[pd.DataFrame, pd.DataFrame]:
    data_path = data_path or index_data_csv()
    info_path = info_path or index_info_csv()
    if not data_path.exists():
        raise FileNotFoundError(
            f"Missing {data_path}. Set WISECUB_MARKET_DATA_DIR or place indexData.csv in data/raw."
        )
    prices = pd.read_csv(data_path)
    info = pd.read_csv(info_path)
    prices.columns = [str(c).strip() for c in prices.columns]
    info.columns = [str(c).strip() for c in info.columns]
    return prices, info


def clean_prices(
    prices: pd.DataFrame,
    info: pd.DataFrame,
    processed_path: Path | None | bool = False,
) -> pd.DataFrame:
    frame = prices.rename(
        columns={
            "Index": "symbol",
            "Date": "date",
            "Open": "open",
            "High": "high",
            "Low": "low",
            "Close": "close",
            "Adj Close": "adj_close",
            "Volume": "volume",
        }
    )
    meta = info.rename(
        columns={"Index": "symbol", "Region": "region", "Exchange": "exchange", "Currency": "currency"}
    )
    frame["date"] = pd.to_datetime(frame["date"], errors="coerce")
    for col in ("open", "high", "low", "close", "adj_close", "volume"):
        if col in frame.columns:
            frame[col] = pd.to_numeric(frame[col], errors="coerce")
    frame = frame.dropna(subset=["symbol", "date", "close"])
    frame = frame[frame["close"] > 0]
    frame = frame.drop_duplicates(subset=["symbol", "date"])
    frame = frame.sort_values(["symbol", "date"])
    processed = index_processed_csv() if processed_path is False else processed_path
    if processed and Path(processed).exists():
        extra = pd.read_csv(processed)
        extra.columns = [str(c).strip() for c in extra.columns]
        if "CloseUSD" in extra.columns:
            usd = extra.rename(columns={"Index": "symbol", "Date": "date", "CloseUSD": "close_usd"})
            usd["date"] = pd.to_datetime(usd["date"], errors="coerce")
            usd = usd[["symbol", "date", "close_usd"]].drop_duplicates(subset=["symbol", "date"])
            frame = frame.merge(usd, on=["symbol", "date"], how="left")
    frame = frame.merge(meta[["symbol", "region", "exchange", "currency"]], on="symbol", how="left")
    frame["volume"] = frame["volume"].fillna(0).clip(lower=0)
    return frame.reset_index(drop=True)


def add_features(frame: pd.DataFrame) -> pd.DataFrame:
    parts = []
    for _symbol, group in frame.groupby("symbol", sort=False):
        g = group.sort_values("date").copy()
        g["ret_1"] = g["close"].pct_change(1)
        g["ret_5"] = g["close"].pct_change(5)
        g["ma5"] = g["close"].rolling(5, min_periods=5).mean()
        g["ma10"] = g["close"].rolling(10, min_periods=10).mean()
        g["ma20"] = g["close"].rolling(20, min_periods=20).mean()
        g["close_ma5"] = g["close"] / g["ma5"] - 1
        g["close_ma10"] = g["close"] / g["ma10"] - 1
        g["close_ma20"] = g["close"] / g["ma20"] - 1
        g["vol_20"] = g["ret_1"].rolling(20, min_periods=20).std()
        g["hl_range"] = (g["high"] - g["low"]) / g["close"]
        g["future_ret"] = g["close"].shift(-HORIZON_DAYS) / g["close"] - 1
        g["label"] = g["future_ret"].map(lambda value: _label(float(value)) if pd.notna(value) else None)
        parts.append(g)
    out = pd.concat(parts, ignore_index=True)
    needed = FEATURE_COLUMNS + ["label", "future_ret"]
    out = out.dropna(subset=needed)
    return out.reset_index(drop=True)


def build_history(frame: pd.DataFrame, last_n: int = 180) -> dict:
    history: dict[str, list[dict]] = {}
    for symbol, group in frame.groupby("symbol"):
        tail = group.sort_values("date").tail(last_n)
        history[str(symbol)] = [
            {"date": row.date.strftime("%Y-%m-%d"), "close": round(float(row.close), 4)}
            for row in tail.itertuples()
        ]
    return history


def run(data_path: Path | None = None, info_path: Path | None = None) -> pd.DataFrame:
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    prices, info = load_raw(data_path, info_path)
    cleaned = clean_prices(prices, info)
    featured = add_features(cleaned)
    assets = (
        cleaned.groupby("symbol")
        .agg(
            name=("exchange", "first"),
            region=("region", "first"),
            currency=("currency", "first"),
            start=("date", "min"),
            end=("date", "max"),
            rows=("date", "count"),
        )
        .reset_index()
    )
    asset_docs = []
    for row in assets.itertuples():
        asset_docs.append(
            {
                "symbol": row.symbol,
                "exchange": row.name,
                "region": row.region,
                "currency": row.currency,
                "start": pd.Timestamp(row.start).strftime("%Y-%m-%d"),
                "end": pd.Timestamp(row.end).strftime("%Y-%m-%d"),
                "rows": int(row.rows),
                "category": "market_index",
            }
        )
    try:
        featured.to_parquet(CLEANED_PATH, index=False)
    except Exception:
        pass
    featured.to_csv(CLEANED_CSV_PATH, index=False)
    ASSETS_PATH.write_text(json.dumps(asset_docs, indent=2), encoding="utf-8")
    HISTORY_PATH.write_text(json.dumps(build_history(cleaned)), encoding="utf-8")
    latest = {}
    for symbol, group in featured.groupby("symbol"):
        last = group.sort_values("date").iloc[-1]
        latest[str(symbol)] = {col: (None if pd.isna(last[col]) else last[col]) for col in FEATURE_COLUMNS}
        latest[str(symbol)]["date"] = pd.Timestamp(last["date"]).strftime("%Y-%m-%d")
        latest[str(symbol)]["close"] = float(last["close"])
        latest[str(symbol)]["symbol"] = str(symbol)
    LATEST_PATH.write_text(json.dumps(latest, default=str), encoding="utf-8")
    notes = {
        "source_data": str(index_data_csv()),
        "source_info": str(index_info_csv()),
        "raw_rows": int(len(prices)),
        "clean_price_rows": int(len(cleaned)),
        "feature_rows": int(len(featured)),
        "symbols": sorted(featured["symbol"].astype(str).unique().tolist()),
        "date_min": featured["date"].min().strftime("%Y-%m-%d"),
        "date_max": featured["date"].max().strftime("%Y-%m-%d"),
        "dropped_missing_ohlc": "Rows missing close/open/high/low were dropped.",
        "duplicates": "Dropped duplicate symbol+date.",
        "volume": "Zeros kept; many early index days have no volume.",
        "category": "All symbols in this Kaggle set are market indices, not single company stocks.",
        "ks11": "KS11 is in indexData but not indexProcessed (no CloseUSD).",
        "leakage": f"Labels use close[t+{HORIZON_DAYS}]/close[t]-1. Features use only data through t.",
        "label_rule": {
            "horizon_days": HORIZON_DAYS,
            "upward": f"future_ret >= {UP_THRESHOLD}",
            "downward": f"future_ret <= {DOWN_THRESHOLD}",
            "sideways": "otherwise",
        },
        "class_counts": featured["label"].value_counts().to_dict(),
    }
    PREPROCESS_NOTES_PATH.write_text(json.dumps(notes, indent=2, default=str), encoding="utf-8")
    return featured


def main() -> None:
    table = run()
    print(f"feature rows {len(table)} symbols {table['symbol'].nunique()}")
    print(table["label"].value_counts().to_string())


if __name__ == "__main__":
    main()
