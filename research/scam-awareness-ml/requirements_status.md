# Environment and Dependencies Status

**Project:** WiseCub Member 4 — Advanced Scam Awareness ML Research  
**Investigation Date:** 2026-10-21  
**Environment Location:** `WiseCub/backend/.venv` (Python 3.13)  
**Execution Policy:** Isolated research execution — no application changes, no package installations, no database modifications.

---

## 1. Verified Installed Libraries

The research pipeline uses the existing, already-installed Python virtual environment located in `WiseCub/backend/.venv`. The following packages and versions were verified:

| Package | Installed Version | Role in Research Pipeline |
| :--- | :--- | :--- |
| **Python** | `3.13.5` | Base execution runtime |
| **scikit-learn** | `1.6.1` / `1.9.x` | Vectorization (TfidfVectorizer), Model Training (LogisticRegression, MultinomialNB, LinearSVC, DummyClassifier), Cross-Validation (GroupKFold, GroupShuffleSplit), Metrics Evaluation |
| **pandas** | `3.0.x` | Dataset loading, validation, grouping, manifest generation, CSV export |
| **numpy** | `2.x` | Numeric array operations, matrix computations, metrics aggregation |
| **joblib** | `1.6.x` | Reproducible model artifact persistence (`.joblib` models and vectorizers) |
| **pytest** | `9.1.x` | Unit testing verification for dataset integrity and scoring logic |

---

## 2. Policy on External Packages

- **No new pip installations were performed.**
- All ML models (Dummy baseline, TF-IDF + Logistic Regression, TF-IDF + Multinomial Naive Bayes, TF-IDF + Linear Support Vector Machine) use native standard modules from `scikit-learn`.
- Standard library modules utilized: `csv`, `json`, `math`, `os`, `re`, `random`, `pathlib`, `typing`, `hashlib`, `urllib.request`.

---

## 3. Python Execution Command

To run the pipeline reproducibly from the workspace root (`WiseCub`):

```bash
# Using the existing project backend virtual environment
./backend/.venv/bin/python research/scam-awareness-ml/src/validate_dataset.py
./backend/.venv/bin/python research/scam-awareness-ml/src/train_and_evaluate.py
./backend/.venv/bin/python research/scam-awareness-ml/src/error_analysis.py
```
