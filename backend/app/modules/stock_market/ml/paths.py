from __future__ import annotations

import os
from pathlib import Path

MODULE_DIR = Path(__file__).resolve().parent
STOCK_DIR = MODULE_DIR.parent
DATA_DIR = STOCK_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
ARTIFACTS_DIR = MODULE_DIR / "artifacts"
FIXTURE_CSV = STOCK_DIR / "tests" / "data" / "tiny_indices.csv"

DEFAULT_DOWNLOADS = Path.home() / "Downloads" / "archive"


def source_dir() -> Path:
    override = os.environ.get("WISECUB_MARKET_DATA_DIR")
    if override:
        return Path(override)
    if (RAW_DIR / "indexData.csv").exists():
        return RAW_DIR
    if (DEFAULT_DOWNLOADS / "indexData.csv").exists():
        return DEFAULT_DOWNLOADS
    return RAW_DIR


def index_data_csv() -> Path:
    return source_dir() / "indexData.csv"


def index_info_csv() -> Path:
    info = source_dir() / "indexInfo.csv"
    if info.exists():
        return info
    bundled = DATA_DIR / "indexInfo.csv"
    return bundled


def index_processed_csv() -> Path:
    return source_dir() / "indexProcessed.csv"


CLEANED_PATH = ARTIFACTS_DIR / "cleaned_features.parquet"
CLEANED_CSV_PATH = ARTIFACTS_DIR / "cleaned_features.csv"
ASSETS_PATH = ARTIFACTS_DIR / "assets.json"
HISTORY_PATH = ARTIFACTS_DIR / "history_compact.json"
PREPROCESS_NOTES_PATH = ARTIFACTS_DIR / "preprocess_notes.json"
FEATURE_NAMES_PATH = ARTIFACTS_DIR / "feature_names.json"
LABEL_CONFIG_PATH = ARTIFACTS_DIR / "label_config.json"
SPLIT_PATH = ARTIFACTS_DIR / "chrono_split.json"
BASELINE_PATH = ARTIFACTS_DIR / "baseline.joblib"
MODEL_PATH = ARTIFACTS_DIR / "trend_model.joblib"
METRICS_PATH = ARTIFACTS_DIR / "metrics.json"
REPORT_PATH = ARTIFACTS_DIR / "evaluation_report.md"
LATEST_PATH = ARTIFACTS_DIR / "latest_rows.json"
