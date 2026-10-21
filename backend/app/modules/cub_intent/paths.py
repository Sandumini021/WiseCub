from pathlib import Path

MODULE_DIR = Path(__file__).resolve().parent
ORIGINAL_CSV = MODULE_DIR / "data" / "wisecub_bilingual_singlish_intent_dataset_5000.csv"
EXPANDED_CSV = MODULE_DIR / "data" / "wisecub_bilingual_singlish_intent_dataset_expanded.csv"


def resolve_data_csv() -> Path:
    return EXPANDED_CSV if EXPANDED_CSV.exists() else ORIGINAL_CSV


DATA_CSV = EXPANDED_CSV
ARTIFACTS_DIR = MODULE_DIR / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "intent_model.joblib"
LABEL_MAPPING_PATH = ARTIFACTS_DIR / "label_mapping.json"
METRICS_PATH = ARTIFACTS_DIR / "metrics.json"
BASELINE_METRICS_PATH = ARTIFACTS_DIR / "metrics_baseline_5000.json"
COMPARISON_PATH = ARTIFACTS_DIR / "metrics_comparison.json"
SPLIT_PATH = ARTIFACTS_DIR / "grouped_split.json"
