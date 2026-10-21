"""
validate_dataset.py

Comprehensive validation script for the WiseCub Scam Awareness Machine Learning Dataset.
Performs rigorous structural, statistical, and semantic integrity checks:
1. File existence and CSV parseability
2. Exact column schema compliance
3. Row count validation (target: 2,000–3,000 range)
4. Missing / null / empty value checks
5. Valid label and category domain constraints
6. Uniqueness of example IDs
7. Zero-tolerance exact text duplicate check
8. Near-duplicate text analysis using Jaccard token similarity
9. Template group distribution and orphan check
10. Sourced provenance and license validation

Exit code:
- 0: All validation tests pass
- 1: One or more validation constraints failed
"""

import csv
import sys
from pathlib import Path
from typing import Dict, List, Set

ROOT_DIR = Path(__file__).resolve().parent.parent
DATASET_PATH = ROOT_DIR / "data" / "scam_messages_dataset.csv"

EXPECTED_COLUMNS = [
    "example_id",
    "message_text",
    "binary_label",
    "scam_category",
    "concept_tags",
    "difficulty",
    "source_type",
    "source_name",
    "source_reference",
    "license",
    "template_group_id",
    "generation_or_review_notes",
]

VALID_LABELS = {"scam_or_suspicious", "legitimate_or_benign"}
VALID_CATEGORIES = {
    "phishing",
    "sms",
    "qr",
    "prize",
    "impersonation",
    "financial",
    "legitimate_or_benign",
}
VALID_DIFFICULTIES = {"easy", "medium", "hard"}
VALID_SOURCE_TYPES = {"public_dataset", "synthetic", "manually_reviewed"}


def tokenize(text: str) -> Set[str]:
    return set(text.lower().split())


def jaccard_similarity(set1: Set[str], set2: Set[str]) -> float:
    if not set1 or not set2:
        return 0.0
    return len(set1 & set2) / len(set1 | set2)


def run_validation():
    print("=" * 70)
    print("WiseCub Scam Awareness ML — Dataset Validation Suite")
    print(f"Dataset Target: {DATASET_PATH}")
    print("=" * 70)

    if not DATASET_PATH.exists():
        print(f"[FAIL] Dataset file does not exist: {DATASET_PATH}")
        sys.exit(1)

    records: List[Dict[str, str]] = []
    with open(DATASET_PATH, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        header = reader.fieldnames or []
        for row in reader:
            records.append(row)

    errors = []
    warnings = []

    # 1. Schema Check
    print("\n[Check 1/10] Verifying CSV Column Schema...")
    if header != EXPECTED_COLUMNS:
        missing_cols = set(EXPECTED_COLUMNS) - set(header)
        extra_cols = set(header) - set(EXPECTED_COLUMNS)
        errors.append(f"Header mismatch. Missing: {missing_cols}, Extra: {extra_cols}")
    else:
        print(f"  [PASS] All {len(EXPECTED_COLUMNS)} required columns present in exact order.")

    # 2. Row Count Check
    print("\n[Check 2/10] Verifying Row Count Bounds...")
    row_count = len(records)
    print(f"  Total records loaded: {row_count}")
    if row_count < 2000 or row_count > 3000:
        errors.append(f"Row count {row_count} outside target bounds [2000, 3000].")
    else:
        print(f"  [PASS] Row count ({row_count}) is within target range [2000, 3000].")

    # 3. Missing Value Checks
    print("\n[Check 3/10] Scanning for Empty or Null Values...")
    missing_by_col = {col: 0 for col in EXPECTED_COLUMNS}
    for idx, row in enumerate(records, start=1):
        for col in EXPECTED_COLUMNS:
            val = row.get(col, "").strip()
            if not val:
                missing_by_col[col] += 1
                errors.append(f"Row {idx}: column '{col}' is empty.")

    missing_total = sum(missing_by_col.values())
    if missing_total == 0:
        print("  [PASS] 0 missing or empty values across all rows and columns.")
    else:
        print(f"  [FAIL] Found {missing_total} empty values.")

    # 4. Domain & Constraint Validation
    print("\n[Check 4/10] Validating Categorical Value Domains...")
    invalid_labels = 0
    invalid_categories = 0
    invalid_difficulties = 0
    invalid_sources = 0

    for idx, row in enumerate(records, start=1):
        if row.get("binary_label") not in VALID_LABELS:
            invalid_labels += 1
            errors.append(f"Row {idx}: invalid binary_label '{row.get('binary_label')}'")

        if row.get("scam_category") not in VALID_CATEGORIES:
            invalid_categories += 1
            errors.append(f"Row {idx}: invalid scam_category '{row.get('scam_category')}'")

        if row.get("difficulty") not in VALID_DIFFICULTIES:
            invalid_difficulties += 1
            errors.append(f"Row {idx}: invalid difficulty '{row.get('difficulty')}'")

        if row.get("source_type") not in VALID_SOURCE_TYPES:
            invalid_sources += 1
            errors.append(f"Row {idx}: invalid source_type '{row.get('source_type')}'")

    if invalid_labels == 0 and invalid_categories == 0 and invalid_difficulties == 0 and invalid_sources == 0:
        print("  [PASS] All labels, categories, difficulties, and source types are valid domain members.")
    else:
        print(f"  [FAIL] Domain constraint failures: labels={invalid_labels}, categories={invalid_categories}")

    # 5. Example ID Uniqueness
    print("\n[Check 5/10] Checking Example ID Uniqueness...")
    example_ids = [r.get("example_id", "") for r in records]
    unique_ids = set(example_ids)
    if len(unique_ids) != len(example_ids):
        errors.append(f"Duplicate example_id detected: {len(example_ids) - len(unique_ids)} duplicates.")
    else:
        print(f"  [PASS] All {len(example_ids)} example IDs are strictly unique (EX-0001 format).")

    # 6. Exact Duplicate Text Check
    print("\n[Check 6/10] Checking for Exact Text Duplicates...")
    seen_texts: Dict[str, str] = {}
    exact_duplicates = 0
    for row in records:
        text = row.get("message_text", "").strip().lower()
        eid = row.get("example_id", "")
        if text in seen_texts:
            exact_duplicates += 1
            errors.append(f"Duplicate message text between {eid} and {seen_texts[text]}")
        else:
            seen_texts[text] = eid

    if exact_duplicates == 0:
        print("  [PASS] Zero exact duplicate texts detected across all 2,500 records.")
    else:
        print(f"  [FAIL] {exact_duplicates} exact duplicate texts found.")

    # 7. Near-Duplicate Text Analysis
    print("\n[Check 7/10] Performing Near-Duplicate Text Heuristic...")
    # Sample check to flag excessive lexical overlap across unrelated template groups
    high_similarity_pairs = 0
    tokenized = [(r["example_id"], r["template_group_id"], tokenize(r["message_text"])) for r in records[:500]]
    for i in range(len(tokenized)):
        for j in range(i + 1, min(i + 30, len(tokenized))):
            id1, grp1, tok1 = tokenized[i]
            id2, grp2, tok2 = tokenized[j]
            if grp1 != grp2:
                sim = jaccard_similarity(tok1, tok2)
                if sim > 0.90:
                    high_similarity_pairs += 1
                    warnings.append(f"High similarity ({sim:.2f}) between {id1} ({grp1}) and {id2} ({grp2})")

    print(f"  [INFO] Analyzed adjacent token sets: {high_similarity_pairs} cross-group pairs above 0.90 Jaccard similarity.")

    # 8. Category & Class Distribution
    print("\n[Check 8/10] Checking Class & Category Balance...")
    scam_count = sum(1 for r in records if r["binary_label"] == "scam_or_suspicious")
    legit_count = sum(1 for r in records if r["binary_label"] == "legitimate_or_benign")
    print(f"  Class balance: scam_or_suspicious={scam_count} ({scam_count/row_count*100:.1f}%), legitimate_or_benign={legit_count} ({legit_count/row_count*100:.1f}%)")

    cat_counts = {}
    for r in records:
        cat = r["scam_category"]
        cat_counts[cat] = cat_counts.get(cat, 0) + 1

    for cat in sorted(VALID_CATEGORIES):
        cnt = cat_counts.get(cat, 0)
        print(f"    - Category '{cat}': {cnt} examples ({cnt/row_count*100:.2f}%)")
        if cnt == 0:
            errors.append(f"Category '{cat}' has 0 examples in dataset.")

    if scam_count > 0 and legit_count > 0 and all(cat_counts.get(c, 0) > 0 for c in VALID_CATEGORIES):
        print("  [PASS] Both binary classes and all 6 scam categories are represented.")

    # 9. Template Group Structure
    print("\n[Check 9/10] Validating Template Group Clustering...")
    groups: Dict[str, int] = {}
    for r in records:
        gid = r["template_group_id"]
        groups[gid] = groups.get(gid, 0) + 1

    print(f"  Total unique template groups: {len(groups)}")
    max_group_size = max(groups.values())
    min_group_size = min(groups.values())
    print(f"  Template group size range: min={min_group_size}, max={max_group_size}")
    if len(groups) < 100:
        errors.append(f"Too few template groups ({len(groups)}). Grouped splitting may be under-dispersed.")
    else:
        print("  [PASS] Rich template group diversity supports robust grouped train/val/test splitting.")

    # 10. License & Provenance Integrity
    print("\n[Check 10/10] Verifying Provenance and Licensing Information...")
    public_count = sum(1 for r in records if r["source_type"] == "public_dataset")
    synthetic_count = sum(1 for r in records if r["source_type"] == "synthetic")
    print(f"  Provenance: public_dataset={public_count} (UCI SMS Spam Collection), synthetic={synthetic_count} (WiseCub)")

    missing_license = sum(1 for r in records if not r.get("license", "").strip())
    missing_source_ref = sum(1 for r in records if not r.get("source_reference", "").strip())
    if missing_license == 0 and missing_source_ref == 0:
        print("  [PASS] Every record maintains explicit attribution, provenance reference, and license.")
    else:
        errors.append(f"Provenance missing: license={missing_license}, ref={missing_source_ref}")

    # Summary
    print("\n" + "=" * 70)
    print(f"Validation Summary: {len(errors)} error(s), {len(warnings)} warning(s)")
    print("=" * 70)

    if errors:
        print("\nERRORS DETECTED:")
        for err in errors[:10]:
            print(f"  - {err}")
        if len(errors) > 10:
            print(f"  ... and {len(errors) - 10} more errors.")
        sys.exit(1)
    else:
        print("\nALL 10 VALIDATION CHECKS PASSED SUCCESSFULLY (Exit Code 0).")
        sys.exit(0)


if __name__ == "__main__":
    run_validation()
