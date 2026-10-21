# S&P 500 classroom-trend evaluation

- Data: daily bars in `data/raw/sp500_stocks.csv` (originals not edited)
- Horizon: 5 trading days
- Upward if future return ≥ 1.2%; downward if ≤ -1.2%
- Chrono split: train through 2018-10-04; test after 2022-10-05
- Train rows 1949054; test rows 501080
- Selected model: random_forest
- random_forest fit on 249999 train-only rows (cap 250000); metrics use the full chrono test split

## Test metrics (later dates only)

| model | accuracy | macro F1 |
|---|---:|---:|
| dummy most_frequent | 0.399 | 0.190 |
| logistic baseline | 0.350 | 0.336 |
| random forest | 0.356 | 0.350 |

Selected-model test classification report:

```
              precision    recall  f1-score   support

    downward       0.35      0.32      0.33    163577
    sideways       0.33      0.58      0.42    137376
      upward       0.43      0.23      0.30    200127

    accuracy                           0.36    501080
   macro avg       0.37      0.38      0.35    501080
weighted avg       0.38      0.36      0.34    501080

```

This is a classroom label on old US large-cap prices. It is often wrong. WiseCub still uses pretend rupees. It is not a tip to buy or sell.
