"""
WiseCub — CDEMF Synthetic Dataset Test Suite (Checkpoint A2)
===========================================================
Validates the generated 2,500 synthetic gameplay decision records across
300 simulated student profiles for machine learning training in Phase 3.

Test Scenarios:
  1. test_documentation_and_reports_exist: Data dictionary, methodology, validation report.
  2. test_exact_dataset_size_and_schema: Exactly 2500 records, all 44 fields present and typed.
  3. test_student_count_and_archetype_representation: 300 unique students across 4 archetypes.
  4. test_mission_and_level_coverage: All 3 missions and all 20 levels represented.
  5. test_reproducibility_with_seed: Deterministic output verification with seed 42.
  6. test_financial_and_decision_consistency: Valid budgets, costs, spending & reserve allocations.
  7. test_chronological_ordering_and_history: Monotonic timestamps, step index, attempt counting.
  8. test_target_label_integrity_and_no_leakage: Valid multi-class targets, balanced distribution, not simple score threshold.
  9. test_cdemf_pipeline_compatibility: Valid CDEMF emotional states and competency score bounds.
"""
from __future__ import annotations

import csv
import json
from collections import defaultdict
from pathlib import Path
import pytest

from app.modules.gamified_learning.ml.paths import (
    SYNTHETIC_DATASET_CSV,
    SYNTHETIC_DATASET_JSONL,
    VALIDATION_REPORT_JSON,
    DATA_DICTIONARY_MD,
    METHODOLOGY_MD,
)
from app.modules.gamified_learning.ml.schemas import (
    SyntheticGameplayRecord,
)
from app.modules.gamified_learning.ml.generate_dataset import generate_dataset


@pytest.fixture(scope="module")
def loaded_records() -> list[SyntheticGameplayRecord]:
    """Load and parse the JSONL dataset records once for the test module."""
    assert SYNTHETIC_DATASET_JSONL.exists(), f"Missing dataset file: {SYNTHETIC_DATASET_JSONL}"
    records: list[SyntheticGameplayRecord] = []
    with open(SYNTHETIC_DATASET_JSONL, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            data = json.loads(line)
            records.append(SyntheticGameplayRecord(**data))
    return records


@pytest.fixture(scope="module")
def csv_rows() -> list[dict[str, str]]:
    """Load the CSV dataset rows once for the test module."""
    assert SYNTHETIC_DATASET_CSV.exists(), f"Missing CSV file: {SYNTHETIC_DATASET_CSV}"
    with open(SYNTHETIC_DATASET_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)


def test_documentation_and_reports_exist():
    """Verify that all required Phase 3 A2 documentation and reports exist."""
    assert DATA_DICTIONARY_MD.exists(), "Missing data_dictionary.md"
    assert METHODOLOGY_MD.exists(), "Missing dataset_generation_methodology.md"
    assert VALIDATION_REPORT_JSON.exists(), "Missing dataset_validation_report.json"

    with open(VALIDATION_REPORT_JSON, "r", encoding="utf-8") as f:
        report = json.load(f)
    assert report.get("validation_passed") is True
    assert report.get("total_records") == 2500
    assert report.get("total_unique_students") == 300
    assert len(report.get("errors", [])) == 0


def test_exact_dataset_size_and_schema(
    loaded_records: list[SyntheticGameplayRecord], csv_rows: list[dict[str, str]]
):
    """Scenario 1: Exactly 2500 records and all 44 fields present and typed."""
    assert len(loaded_records) == 2500, f"Expected exactly 2500 records, got {len(loaded_records)}"
    assert len(csv_rows) == 2500, f"Expected exactly 2500 CSV rows, got {len(csv_rows)}"

    schema_fields = set(SyntheticGameplayRecord.model_fields.keys())
    assert len(schema_fields) == 44

    # Verify CSV headers match schema fields exactly
    csv_fields = set(csv_rows[0].keys())
    assert csv_fields == schema_fields, f"Header mismatch: {csv_fields ^ schema_fields}"

    # Verify matching IDs in order
    for idx in range(2500):
        assert loaded_records[idx].record_id == csv_rows[idx]["record_id"]


def test_student_count_and_archetype_representation(
    loaded_records: list[SyntheticGameplayRecord],
):
    """Scenario 2: Exactly 300 unique synthetic students across all 4 archetypes."""
    student_ids = {r.synthetic_student_id for r in loaded_records}
    assert len(student_ids) == 300, f"Expected 300 unique students, got {len(student_ids)}"

    for s_id in student_ids:
        assert s_id.startswith("SYNTH_"), f"Invalid student ID format: {s_id}"

    # Verify all 4 archetypes are present and populated
    archetype_counts: dict[str, int] = {}
    student_archetype_map: dict[str, str] = {}
    for r in loaded_records:
        archetype_counts[r.archetype] = archetype_counts.get(r.archetype, 0) + 1
        if r.synthetic_student_id not in student_archetype_map:
            student_archetype_map[r.synthetic_student_id] = r.archetype
        else:
            assert student_archetype_map[r.synthetic_student_id] == r.archetype

    assert len(student_archetype_map) == 300
    expected_archetypes = {
        "STRUGGLING_LEARNER",
        "IMPULSIVE_SPENDER",
        "CAUTIOUS_IMPROVER",
        "ADVANCED_ACHIEVER",
    }
    assert set(archetype_counts.keys()) == expected_archetypes
    for arch in expected_archetypes:
        assert archetype_counts[arch] >= 350, f"Archetype {arch} under-represented"


def test_mission_and_level_coverage(loaded_records: list[SyntheticGameplayRecord]):
    """Scenario 3: All 3 missions and all 20 levels represented."""
    missions = {r.mission_id for r in loaded_records}
    expected_missions = {"mission_rescue_puppy", "mission_squirrel_savings", "mission_panda_fair"}
    assert missions == expected_missions

    puppy_levels = {r.level_number for r in loaded_records if r.mission_id == "mission_rescue_puppy"}
    squirrel_levels = {r.level_number for r in loaded_records if r.mission_id == "mission_squirrel_savings"}
    panda_levels = {r.level_number for r in loaded_records if r.mission_id == "mission_panda_fair"}

    assert puppy_levels == set(range(1, 9)), f"Puppy levels missing: {set(range(1, 9)) - puppy_levels}"
    assert squirrel_levels == set(range(1, 7)), f"Squirrel levels missing: {set(range(1, 7)) - squirrel_levels}"
    assert panda_levels == set(range(1, 7)), f"Panda levels missing: {set(range(1, 7)) - panda_levels}"


def test_reproducibility_with_seed(loaded_records: list[SyntheticGameplayRecord]):
    """Scenario 4: Deterministic generation with seed 42 produces identical first 30 records."""
    regenerated = generate_dataset(seed=42)
    assert len(regenerated) == 2500
    for idx in range(30):
        assert regenerated[idx].record_id == loaded_records[idx].record_id
        assert regenerated[idx].synthetic_student_id == loaded_records[idx].synthetic_student_id
        assert regenerated[idx].mission_id == loaded_records[idx].mission_id
        assert regenerated[idx].level_number == loaded_records[idx].level_number
        assert regenerated[idx].next_activity_support_need == loaded_records[idx].next_activity_support_need


def test_financial_and_decision_consistency(loaded_records: list[SyntheticGameplayRecord]):
    """Scenario 5: Valid budgets, costs, spending & reserve allocations."""
    for r in loaded_records:
        assert r.starting_budget_lkr > 0, f"Budget must be > 0: {r.record_id}"
        assert r.allocated_amount_lkr >= 0, f"Allocated must be >= 0: {r.record_id}"
        assert r.reserve_preserved_lkr >= 0, f"Reserve must be >= 0: {r.record_id}"
        assert r.discretionary_spent_lkr >= 0, f"Discretionary must be >= 0: {r.record_id}"


def test_chronological_ordering_and_history(loaded_records: list[SyntheticGameplayRecord]):
    """Scenario 6: Monotonic timestamps, step index, and attempt counting per student."""
    student_records = defaultdict(list)
    for r in loaded_records:
        student_records[r.synthetic_student_id].append(r)

    for s_id, records in student_records.items():
        steps = [r.step_index for r in records]
        assert steps == sorted(steps), f"Steps not sorted for student {s_id}: {steps}"
        assert len(steps) == len(set(steps)), f"Duplicate steps for student {s_id}: {steps}"

        timestamps = [r.simulated_timestamp_iso for r in records]
        assert timestamps == sorted(timestamps), f"Timestamps not chronological for student {s_id}"

        # Level attempt counts check
        level_counts: dict[tuple[str, int], int] = defaultdict(int)
        for r in records:
            key = (r.mission_id, r.level_number)
            level_counts[key] += 1
            assert r.attempt_number == level_counts[key]


def test_target_label_integrity_and_no_leakage(loaded_records: list[SyntheticGameplayRecord]):
    """Scenario 7: Target labels are valid, balanced, and not trivial copies of current score."""
    valid_labels = {"NEEDS_FOUNDATION_SUPPORT", "READY_FOR_STANDARD", "READY_FOR_ADVANCED"}
    label_counts: dict[str, int] = defaultdict(int)
    for r in loaded_records:
        assert r.next_activity_support_need in valid_labels
        label_counts[r.next_activity_support_need] += 1

    # Balanced 3-class distribution: each between 25% and 40%
    for label in valid_labels:
        fraction = label_counts[label] / len(loaded_records)
        assert 0.25 <= fraction <= 0.40, (
            f"Class {label} proportion {fraction:.3f} outside balanced range [0.25, 0.40]"
        )

    # Prove target is NOT a trivial 1:1 copy of (passed == True) or high score
    # Learners who passed or scored >= 80 can still need foundation support due to
    # subsequent struggle, repeated retries, or low latent proficiency.
    passed_but_needs_support = [
        r for r in loaded_records
        if r.passed and r.next_activity_support_need == "NEEDS_FOUNDATION_SUPPORT"
    ]
    assert len(passed_but_needs_support) > 0, "Target label must not be a trivial copy of pass status"

    high_score_but_needs_support = [
        r for r in loaded_records
        if r.overall_score >= 80 and r.next_activity_support_need == "NEEDS_FOUNDATION_SUPPORT"
    ]
    assert len(high_score_but_needs_support) > 0, "High score can still need support due to forward observation"

    # Verify all classes have healthy representation
    assert label_counts["NEEDS_FOUNDATION_SUPPORT"] > 500
    assert label_counts["READY_FOR_STANDARD"] > 500
    assert label_counts["READY_FOR_ADVANCED"] > 500


def test_cdemf_pipeline_compatibility(loaded_records: list[SyntheticGameplayRecord]):
    """Scenario 8: Record emotional states and competency scores conform to CDEMF."""
    for r in loaded_records:
        assert 0 <= r.overall_score <= 100
        assert 0 <= r.score_budgeting <= 100
        assert 0 <= r.score_spending <= 100
        assert 0 <= r.score_saving <= 100
        assert 0.0 <= r.hist_overall_score_avg <= 100.0

        assert bool(r.character_condition.strip())
        assert bool(r.character_emotion.strip())
        assert r.transition_direction in {"IMPROVEMENT", "SETBACK", "MAINTAINED", "RECOVERY"}
