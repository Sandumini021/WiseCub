"""Inspect and clean S&P 500 CSVs without changing the originals in data/raw/."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

from app.modules.stock_market.ml.config import FEATURE_COLUMNS
from app.modules.stock_market.ml.paths import (
    PROCESSED_DIR,
    SP500_ARTIFACTS_DIR,
    SP500_ASSETS_PATH,
    SP500_COMPANIES_CLEAN_PATH,
    SP500_COMPANIES_CSV,
    SP500_FEATURES_CSV_PATH,
    SP500_FEATURES_PATH,
    SP500_HISTORY_PATH,
    SP500_INSPECT_PATH,
    SP500_LATEST_PATH,
    SP500_PRICES_CLEAN_PATH,
    SP500_STOCKS_CSV,
)
from app.modules.stock_market.ml.preprocess import add_features, build_history


def inspect_raw(
    stocks_path: Path | None = None,
    companies_path: Path | None = None,
) -> dict:
    stocks_path = stocks_path or SP500_STOCKS_CSV
    companies_path = companies_path or SP500_COMPANIES_CSV
    if not stocks_path.exists() or not companies_path.exists():
        raise FileNotFoundError(
            f"Need {stocks_path} and {companies_path}. Copy the two S&P CSVs into data/raw/."
        )
    stocks = pd.read_csv(stocks_path, parse_dates=["date"])
    companies = pd.read_csv(companies_path)
    stocks.columns = [str(c).strip().lower() for c in stocks.columns]
    companies.columns = [str(c).strip().lower() for c in companies.columns]
    px_symbols = set(stocks["symbol"].astype(str).unique())
    co_symbols = set(companies["symbol"].astype(str).unique())
    report = {
        "stocks_file": str(stocks_path),
        "companies_file": str(companies_path),
        "stocks_rows": int(len(stocks)),
        "stocks_columns": list(stocks.columns),
        "stocks_dtypes": {k: str(v) for k, v in stocks.dtypes.items()},
        "stocks_missing": {k: int(v) for k, v in stocks.isna().sum().items()},
        "stocks_duplicate_rows": int(stocks.duplicated().sum()),
        "stocks_duplicate_symbol_date": int(stocks.duplicated(["symbol", "date"]).sum()),
        "symbol_count": int(stocks["symbol"].nunique()),
        "date_min": pd.Timestamp(stocks["date"].min()).strftime("%Y-%m-%d"),
        "date_max": pd.Timestamp(stocks["date"].max()).strftime("%Y-%m-%d"),
        "close_nonpositive": int((pd.to_numeric(stocks["close"], errors="coerce") <= 0).sum()),
        "companies_rows": int(len(companies)),
        "companies_columns": list(companies.columns),
        "companies_dtypes": {k: str(v) for k, v in companies.dtypes.items()},
        "companies_missing": {k: int(v) for k, v in companies.isna().sum().items()},
        "companies_duplicate_symbol": int(companies.duplicated("symbol").sum()),
        "sectors": companies["sector"].value_counts().to_dict() if "sector" in companies else {},
        "symbols_in_prices_not_companies": sorted(px_symbols - co_symbols)[:50],
        "symbols_in_companies_not_prices": sorted(co_symbols - px_symbols)[:50],
        "originals_unchanged": True,
        "note": "S&P 500 company daily bars. Not WiseCub fictional tickers (SUNTEA, …). Education only.",
    }
    return report, stocks, companies


def clean_companies(companies: pd.DataFrame) -> pd.DataFrame:
    frame = companies.copy()
    frame.columns = [str(c).strip().lower() for c in frame.columns]
    frame["symbol"] = frame["symbol"].astype(str).str.strip().str.upper()
    for col in ("company", "sector", "sub_industry", "headquarters", "date_added", "founded"):
        if col in frame.columns:
            frame[col] = frame[col].astype(str).str.strip()
    frame = frame.drop_duplicates(subset=["symbol"])
    return frame.reset_index(drop=True)


def clean_prices(stocks: pd.DataFrame, companies: pd.DataFrame) -> pd.DataFrame:
    frame = stocks.copy()
    frame.columns = [str(c).strip().lower() for c in frame.columns]
    frame["symbol"] = frame["symbol"].astype(str).str.strip().str.upper()
    frame["date"] = pd.to_datetime(frame["date"], errors="coerce")
    for col in ("open", "high", "low", "close", "volume"):
        frame[col] = pd.to_numeric(frame[col], errors="coerce")
    frame = frame.dropna(subset=["symbol", "date", "close"])
    frame = frame[frame["close"] > 0]
    frame = frame.drop_duplicates(subset=["symbol", "date"])
    frame["volume"] = frame["volume"].fillna(0).clip(lower=0)
    meta = companies[["symbol", "company", "sector", "sub_industry", "headquarters"]].copy()
    frame = frame.merge(meta, on="symbol", how="left")
    frame["region"] = "United States"
    frame["exchange"] = "NYSE/Nasdaq (S&P 500 universe)"
    frame["currency"] = "USD"
    return frame.sort_values(["symbol", "date"]).reset_index(drop=True)


def write_serving_artifacts(cleaned: pd.DataFrame, featured: pd.DataFrame) -> None:
    SP500_ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    assets = (
        cleaned.groupby("symbol")
        .agg(
            company=("company", "first"),
            sector=("sector", "first"),
            sub_industry=("sub_industry", "first"),
            headquarters=("headquarters", "first"),
            start=("date", "min"),
            end=("date", "max"),
            rows=("date", "count"),
        )
        .reset_index()
    )
    docs = []
    for row in assets.itertuples():
        docs.append(
            {
                "symbol": row.symbol,
                "name": row.company,
                "exchange": "S&P 500 constituent (historical file)",
                "region": "United States",
                "currency": "USD",
                "sector": row.sector,
                "sub_industry": row.sub_industry,
                "headquarters": row.headquarters,
                "start": pd.Timestamp(row.start).strftime("%Y-%m-%d"),
                "end": pd.Timestamp(row.end).strftime("%Y-%m-%d"),
                "rows": int(row.rows),
                "category": "sp500_company",
            }
        )
    SP500_ASSETS_PATH.write_text(json.dumps(docs, indent=2), encoding="utf-8")
    SP500_HISTORY_PATH.write_text(json.dumps(build_history(cleaned)), encoding="utf-8")
    latest = {}
    for symbol, group in featured.groupby("symbol"):
        last = group.sort_values("date").iloc[-1]
        latest[str(symbol)] = {col: (None if pd.isna(last[col]) else last[col]) for col in FEATURE_COLUMNS}
        latest[str(symbol)]["date"] = pd.Timestamp(last["date"]).strftime("%Y-%m-%d")
        latest[str(symbol)]["close"] = float(last["close"])
        latest[str(symbol)]["symbol"] = str(symbol)
    SP500_LATEST_PATH.write_text(json.dumps(latest, default=str), encoding="utf-8")


def run(
    stocks_path: Path | None = None,
    companies_path: Path | None = None,
) -> pd.DataFrame:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    report, stocks, companies = inspect_raw(stocks_path, companies_path)
    companies_clean = clean_companies(companies)
    prices_clean = clean_prices(stocks, companies_clean)
    featured = add_features(prices_clean)
    companies_clean.to_csv(SP500_COMPANIES_CLEAN_PATH, index=False)
    try:
        prices_clean.to_parquet(SP500_PRICES_CLEAN_PATH, index=False)
        featured.to_parquet(SP500_FEATURES_PATH, index=False)
    except Exception:
        pass
    featured.head(4000).to_csv(SP500_FEATURES_CSV_PATH, index=False)
    report["clean_price_rows"] = int(len(prices_clean))
    report["feature_rows"] = int(len(featured))
    report["feature_date_min"] = featured["date"].min().strftime("%Y-%m-%d")
    report["feature_date_max"] = featured["date"].max().strftime("%Y-%m-%d")
    report["class_counts"] = featured["label"].value_counts().to_dict()
    report["processed_companies"] = str(SP500_COMPANIES_CLEAN_PATH)
    report["processed_prices"] = str(SP500_PRICES_CLEAN_PATH)
    SP500_INSPECT_PATH.write_text(json.dumps(report, indent=2, default=str), encoding="utf-8")
    write_serving_artifacts(prices_clean, featured)
    return featured


def main() -> None:
    table = run()
    print(f"S&P feature rows {len(table)} symbols {table['symbol'].nunique()}")
    print(table["label"].value_counts().to_string())


if __name__ == "__main__":
    main()
