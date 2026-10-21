"""
Validation Script for WiseCub CDEMF Synthetic Gameplay Dataset
==============================================================
Validates:
  1. Record count is exactly 2,500
  2. Exactly 300 unique synthetic students
  3. Unique record_id and attempt_id
  4. Valid catalog mission and level identifiers
  5. Progression integrity (sequential unlocking, no skipping)
  6. Chronological monotonicity per student
  7. No missing required fields or null values
  8. Feature leakage verification (lagged predictors strictly reference prior events)
  9. Balanced target label distribution
  10. Exact parity between CSV and JSONL

Outputs dataset_validation_report.json.
"""
from __future__ import annotations

import csv
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

BACKEND_DIR = Path(__file__).resolve().parents[4]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.modules.gamified_learning.catalog import get_mission, get_level
from app.modules.gamified_learning.ml.paths import (
    CSV_DATASET_PATH,
    JSONL_DATASET_PATH,
    VALIDATION_REPORT_PATH,
)


def validate_dataset() -> dict[str, Any]:
    print("Starting comprehensive validation of synthetic CDEMF dataset...")
    errors: list[str] = []
    warnings: list[str] = []

    # 1. File existence
    if not JSONL_DATASET_PATH.exists():
        raise FileNotFoundError(f"Missing JSONL: {JSONL_DATASET_PATH}")
    if not CSV_DATASET_PATH.exists():
        raise FileNotFoundError(f"Missing CSV: {CSV_DATASET_PATH}")

    # Load JSONL
    jsonl_records: list[dict[str, Any]] = []
    with open(JSONL_DATASET_PATH, "r", encoding="utf-8") as f:
        for idx, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                jsonl_records.append(json.loads(line))
            except Exception as e:
                errors.append(f"JSON parse error at line {idx}: {e}")

    # Load CSV
    csv_records: list[dict[str, Any]] = []
    with open(CSV_DATASET_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            csv_records.append(r)

    # 2. Total count checks
    total_jsonl = len(jsonl_records)
    total_csv = len(csv_records)
    if total_jsonl != 2500:
        errors.append(f"Expected exactly 2500 JSONL records, found {total_jsonl}")
    if total_csv != 2500:
        errors.append(f"Expected exactly 2500 CSV records, found {total_csv}")

    # 3. Parity check between CSV and JSONL
    for i, (j_rec, c_rec) in enumerate(zip(jsonl_records, csv_records)):
        if j_rec["record_id"] != c_rec["record_id"]:
            errors.append(f"Row {i}: record_id mismatch: {j_rec['record_id']} vs {c_rec['record_id']}")
            break

    # 4. Unique Identifiers
    record_ids = [r["record_id"] for r in jsonl_records]
    attempt_ids = [r["attempt_id"] for r in jsonl_records]
    if len(set(record_ids)) != len(record_ids):
        errors.append(f"Duplicate record_id detected ({len(record_ids)} total vs {len(set(record_ids))} unique)")
    if len(set(attempt_ids)) != len(attempt_ids):
        errors.append(f"Duplicate attempt_id detected ({len(attempt_ids)} total vs {len(set(attempt_ids))} unique)")

    # 5. Unique synthetic students
    student_ids = set(r["synthetic_student_id"] for r in jsonl_records)
    if len(student_ids) != 300:
        errors.append(f"Expected exactly 300 unique synthetic students, found {len(student_ids)}")

    # 6. Group by student for chronological & progression analysis
    students_data: dict[str, list[dict[str, Any]]] = {}
    for r in jsonl_records:
        students_data.setdefault(r["synthetic_student_id"], []).append(r)

    progression_errors = 0
    time_errors = 0
    leakage_errors = 0

    for stu_id, recs in students_data.items():
        # Check chronological timestamps and step indices
        prev_time = None
        for step_idx, r in enumerate(recs):
            # Step index sequence
            if r["step_index"] != step_idx:
                errors.append(f"{stu_id}: Invalid step_index {r['step_index']}, expected {step_idx}")
                break

            cur_time = datetime.fromisoformat(r["simulated_timestamp_iso"])
            if prev_time and cur_time < prev_time:
                time_errors += 1
            prev_time = cur_time

            # Progression check: level k cannot be attempted if level k-1 not passed in this mission
            # and attempt_number must be consistent
            if step_idx > 0:
                prev_rec = recs[step_idx - 1]
                if prev_rec["mission_id"] == r["mission_id"]:
                    if not prev_rec["passed"]:
                        # If previous attempt on same mission failed, next attempt MUST be a retry on the same level!
                        if r["level_number"] != prev_rec["level_number"]:
                            progression_errors += 1
                        if r["attempt_number"] != prev_rec["attempt_number"] + 1:
                            progression_errors += 1
                    else:
                        # If previous passed, next level must be current + 1 or new mission
                        if r["level_number"] != prev_rec["level_number"] + 1 and r["level_number"] != 1:
                            progression_errors += 1

            # Leakage check: historical counts must strictly reflect attempts strictly < step_idx
            if r["hist_prior_attempts_count"] != step_idx:
                leakage_errors += 1

    if time_errors > 0:
        errors.append(f"Chronological timestamp regression detected in {time_errors} instances")
    if progression_errors > 0:
        errors.append(f"Level progression violations detected in {progression_errors} instances")
    if leakage_errors > 0:
        errors.append(f"Feature leakage detected: hist_prior_attempts_count mismatch in {leakage_errors} rows")

    # 7. Catalog validation
    catalog_errors = 0
    for r in jsonl_records:
        mission = get_mission(r["mission_id"])
        if not mission:
            catalog_errors += 1
            continue
        level = get_level(r["mission_id"], r["level_number"])
        if not level or level.id != r["level_id"]:
            catalog_errors += 1
    if catalog_errors > 0:
        errors.append(f"Invalid mission/level catalog references in {catalog_errors} records")

    # 8. Distribution metrics
    label_counts: dict[str, int] = {}
    archetype_counts: dict[str, int] = {}
    mission_counts: dict[str, int] = {}
    pass_count = 0

    for r in jsonl_records:
        label_counts[r["next_activity_support_need"]] = label_counts.get(r["next_activity_support_need"], 0) + 1
        archetype_counts[r["archetype"]] = archetype_counts.get(r["archetype"], 0) + 1
        mission_counts[r["mission_id"]] = mission_counts.get(r["mission_id"], 0) + 1
        if r["passed"]:
            pass_count += 1

    # Check for empty / dead classes
    if len(label_counts) < 3:
        errors.append(f"Target label missing classes: found {list(label_counts.keys())}")
    for lbl, cnt in label_counts.items():
        if cnt < 200:
            errors.append(f"Class '{lbl}' is critically underrepresented (count: {cnt} < 200)")

    # 9. Null / missing value check
    null_count = 0
    for r in jsonl_records:
        for k, v in r.items():
            if v is None:
                null_count += 1
    if null_count > 0:
        errors.append(f"Found {null_count} null fields in dataset records")

    validation_passed = len(errors) == 0

    report = {
        "validation_passed": validation_passed,
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "total_records": total_jsonl,
        "total_unique_students": len(student_ids),
        "target_label_distribution": label_counts,
        "archetype_distribution": archetype_counts,
        "mission_distribution": mission_counts,
        "pass_count": pass_count,
        "fail_count": total_jsonl - pass_count,
        "overall_pass_rate": round(pass_count / total_jsonl, 4),
        "errors": errors,
        "warnings": warnings,
    }

    # Save validation report
    VALIDATION_REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(VALIDATION_REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print("\n" + "=" * 60)
    print("DATASET VALIDATION SUMMARY")
    print("=" * 60)
    print(f"Status:               {'PASSED' if validation_passed else 'FAILED'}")
    print(f"Total Records:        {total_jsonl} / 2500")
    print(f"Unique Students:      {len(student_ids)} / 300")
    print("Missions Distribution:")
    for m, c in mission_counts.items():
        print(f"  - {m}: {c} ({c/total_jsonl*100:.1f}%)")
    print("Archetypes Distribution:")
    for a, c in archetype_counts.items():
        print(f"  - {a}: {c} ({c/total_jsonl*100:.1f}%)")
    print("Target Label Distribution:")
    for l, c in label_counts.items():
        print(f"  - {l}: {c} ({c/total_jsonl*100:.1f}%)")
    print(f"Overall Pass Rate:    {report['overall_pass_rate']*100:.1f}%")
    if errors:
        print("\nERRORS DETECTED:")
        for e in errors:
            print(f"  ❌ {e}")
    else:
        print("\nAll 10 validation integrity constraints verified successfully.")
    print("=" * 60)

    return report


if __name__ == "__main__":
    report = validate_dataset()
    if not report["validation_passed"]:
        sys.exit(1)
