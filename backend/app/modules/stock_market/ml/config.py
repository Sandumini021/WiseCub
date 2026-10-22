"""Label and split settings for the classroom market-trend model.

Future returns are used only to make labels, never as input features.
Predictions are for education, not advice or guaranteed profit.
"""

from __future__ import annotations

HORIZON_DAYS = 5
UP_THRESHOLD = 0.012
DOWN_THRESHOLD = -0.012

# Chronological shares of unique calendar dates (not shuffled rows).
TRAIN_DATE_FRAC = 0.70
VAL_DATE_FRAC = 0.15

RANDOM_STATE = 42
N_ESTIMATORS = 120
MAX_DEPTH = 10

LABELS = ("downward", "sideways", "upward")

FEATURE_COLUMNS = [
    "open",
    "high",
    "low",
    "close",
    "volume",
    "ret_1",
    "ret_5",
    "ma5",
    "ma10",
    "ma20",
    "close_ma5",
    "close_ma10",
    "close_ma20",
    "vol_20",
    "hl_range",
]

# Classroom demo companies mapped to a real index chart (not the same as a share).
DEMO_INDEX_MAP = {
    "SUNTEA": "NSEI",
    "LNKBNK": "NYA",
    "CEYPOW": "IXIC",
    "HARBOR": "HSI",
    "GRNNRG": "GDAXI",
}

DISCLAIMER = (
    "This classroom model looks at old prices. It can be wrong. "
    "It is not a tip to buy or sell, and no real money is involved."
)
