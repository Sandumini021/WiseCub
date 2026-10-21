# Market-trend evaluation (classroom indices)

- Horizon: 5 trading days
- Upward if future return ≥ 1.2%; downward if ≤ -1.2%
- Train dates through 2004-07-16; test after 2012-12-18
- Train rows 53984; test rows 29233
- Selected model: logistic_baseline

## Test metrics (later dates only)

| model | accuracy | macro F1 |
|---|---:|---:|
| dummy most_frequent | 0.460 | 0.210 |
| logistic baseline | 0.448 | 0.371 |
| random forest | 0.401 | 0.365 |

Random forest test classification report:

```
              precision    recall  f1-score   support

    downward       0.25      0.51      0.34      6568
    sideways       0.57      0.52      0.55     13436
      upward       0.35      0.15      0.21      9229

    accuracy                           0.40     29233
   macro avg       0.39      0.39      0.37     29233
weighted avg       0.43      0.40      0.39     29233

```

Confusion matrix rows/cols = downward, sideways, upward:

`[[3321, 2353, 894], [4771, 7005, 1660], [4997, 2837, 1395]]`

Limitations: indices only (not SUNTEA-style companies); volume often zero; macro F1 can stay modest. Do not treat this as investment advice.
