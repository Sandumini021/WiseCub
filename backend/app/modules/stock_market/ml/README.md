# Classroom market-trend model

Historical **indexes** (NYA, NSEI, HSI, …) from the Kaggle global financial markets archive (1965–2021).  
This set has **no individual company stocks**. WiseCub practice names (SUNTEA, …) stay fictional and still trade with virtual rupees.

Child **trading behaviour** stays in the rule-based engine (`engine.py`). Those records are not labels for a clinical model.

## Data

Place `indexData.csv`, `indexInfo.csv`, and optionally `indexProcessed.csv` in one of:

1. `WISECUB_MARKET_DATA_DIR`
2. `backend/app/modules/stock_market/data/raw/`
3. `%USERPROFILE%\Downloads\archive\`

## Train (from `backend/`)

```bash
python -m app.modules.stock_market.ml.preprocess
python -m app.modules.stock_market.ml.train
```

## API

- `GET /api/market/assets`
- `GET /api/market/history/{symbol}`
- `GET /api/market/analysis/{symbol}`

Demo tickers map to indexes (SUNTEA→NSEI, LNKBNK→NYA, …). Predictions are uncertain classroom labels, not advice.

## Behaviour model

Not trained here. `GET /api/market/behaviour/{child_id}` remains rule-based. There is no validated child-behaviour dataset.
