"""
Filesystem path definitions for the CDEMF ML module.
"""
from __future__ import annotations

from pathlib import Path

# Base directory for this ML module
ML_DIR = Path(__file__).resolve().parent

# Data directory storing datasets and reports
DATA_DIR = ML_DIR / "data"

# Artifacts directory for trained pipelines and metrics (created for Phase 3)
ARTIFACTS_DIR = ML_DIR / "artifacts"

# Standard file paths
CSV_DATASET_PATH = DATA_DIR / "cdemf_synthetic_gameplay_2500.csv"
JSONL_DATASET_PATH = DATA_DIR / "cdemf_synthetic_gameplay_2500.jsonl"
DATA_DICTIONARY_PATH = ML_DIR / "data_dictionary.md"
METHODOLOGY_PATH = ML_DIR / "dataset_generation_methodology.md"
VALIDATION_REPORT_PATH = ML_DIR / "dataset_validation_report.json"

# Aliases
SYNTHETIC_DATASET_CSV = CSV_DATASET_PATH
SYNTHETIC_DATASET_JSONL = JSONL_DATASET_PATH
DATA_DICTIONARY_MD = DATA_DICTIONARY_PATH
METHODOLOGY_MD = METHODOLOGY_PATH
VALIDATION_REPORT_JSON = VALIDATION_REPORT_PATH
