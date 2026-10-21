# Classroom market-trend models

Two historical price files. Child **taps / habits** stay in the rule engine (`engine.py`) and are not labels here.

## 1. Global indexes (already trained)

Kaggle index archive (NYA, NSEI, HSI, …). Practice names map to indexes (SUNTEA→NSEI).

```bash
python -m app.modules.stock_market.ml.preprocess
python -m app.modules.stock_market.ml.train
```

Artifacts: `ml/artifacts/trend_model.joblib`

## 2. S&P 500 companies (this folder’s new CSVs)

Originals (do not edit):

- `data/raw/sp500_stocks.csv`
- `data/raw/sp500_companies.csv`

Cleaned copies: `data/processed/`

```bash
python -m app.modules.stock_market.ml.sp500_preprocess
python -m app.modules.stock_market.ml.sp500_train
```

Artifacts: `ml/artifacts/sp500/trend_model.joblib` (loaded at request time, not retrained).

Labels: 5-day return ≥ 1.2% upward, ≤ −1.2% downward, else sideways. Split is chronological (no shuffle).

## API

- `GET /api/market/assets` — indexes + S&P names
- `GET /api/market/history/{symbol}` — `AAPL` or `N225` / `SUNTEA`
- `GET /api/market/analysis/{symbol}` — kid-facing trend + risk line

Predictions are classroom guesses. They can be wrong. Virtual rupees only.
