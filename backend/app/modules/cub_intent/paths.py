from pathlib import Path

MODULE_DIR = Path(__file__).resolve().parent
DATA_CSV = MODULE_DIR / "data" / "wisecub_bilingual_singlish_intent_dataset_5000.csv"
ARTIFACTS_DIR = MODULE_DIR / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "intent_model.joblib"
LABEL_MAPPING_PATH = ARTIFACTS_DIR / "label_mapping.json"
METRICS_PATH = ARTIFACTS_DIR / "metrics.json"
SPLIT_PATH = ARTIFACTS_DIR / "grouped_split.json"
