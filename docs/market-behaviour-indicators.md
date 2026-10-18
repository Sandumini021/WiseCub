# Market behaviour indicators (rule-based v1)

Engine: `backend/app/modules/stock_market/engine.py`.  
Thresholds: `backend/app/modules/stock_market/thresholds.py`.  
This is **not** a trained AI model and **not** a validated psychological test.

Wallet: practice cash stays **Rs 100,000** (`PRACTICE_CASH_LKR`). Allocation uses **cash + holdings**.

## Events recorded in-app only

`company_viewed`, `market_trend_viewed`, `risk_explanation_viewed`, `price_drop_observed`, `buy_order_placed`, `sell_order_placed`, `order_modified`, `portfolio_reviewed`, `trade_reason_submitted`, `coaching_shown`.

Ids: demo `child_id` UUID, tab `session_id`. No passwords, no voice, no real accounts.

## Indicators

| Behaviour | Evidence required | Threshold rationale | False positives |
|---|---|---|---|
| Herd | Explicit crowd **banner** then trade on that ticker without `company_viewed` (or reason = crowd) inside 180s | Banner is a labelled drill, not “SUNTEA is popular” | Slow trades after the banner; reading the note |
| Panic selling | Labelled **drop drill** (≥8%) then sell ≥50% of that holding within 120s with no note | Chart red days are ignored | Small trims; sells after opening Cub/company text; size reduced after warning |
| Overconfidence | After a gain, next notional ≥1.5× and concentration ≥40% without risk note | One win is ignored | Spreading after a win; opening the warning |
| Impulsive | 3 fills in 90s, or two fills &lt;15s apart without a note, or quick reverse | Demo click speed, not brokerage | Two slow orders with a company tap between |
| Poor diversification | Largest name ≥40% of **cash+holdings** | Same 40% as Cub’s confirm warning | Empty/zero bag → insufficient, not “well spread” |
| Insufficient research | ≥2 orders and ≥2 without in-app note in 120s before fill | Describes WiseCub taps only | Research outside the app is never inferred |

Levels: `insufficient_evidence`, `not_observed`, `worth_reviewing`. Missing taps are not “good character”.

## Evaluation (later, supervisor-approved)

Keep synthetic pytest fixtures separate from any real participant export. Do not claim literacy gains without a protocol. Cub copy is English-first and keyed for later Sinhala/Tamil.
