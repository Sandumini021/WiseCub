from __future__ import annotations

import csv
import hashlib
from collections import defaultdict
from pathlib import Path

from app.modules.cub_intent.paths import DATA_CSV
from app.modules.cub_intent.preprocess import canonical_stem, quality_flags


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_rows(path: Path | None = None) -> list[dict[str, str]]:
    csv_path = path or DATA_CSV
    if not csv_path.exists():
        raise FileNotFoundError(f"Intent dataset not found: {csv_path}")
    with csv_path.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    for index, row in enumerate(rows):
        row["row_index"] = str(index)
        row["group_id"] = f"{row['language']}|{row['intent']}|{canonical_stem(row['text'])}"
        row["quality_flags"] = ",".join(quality_flags(row["text"], row["language"]))
    return rows


def grouped_split(
    rows: list[dict[str, str]],
    seed: int = 42,
    train_frac: float = 0.70,
    val_frac: float = 0.15,
) -> dict[str, list[int]]:
    """Split paraphrase groups, stratified by intent and language."""
    buckets: dict[tuple[str, str], dict[str, list[int]]] = defaultdict(lambda: defaultdict(list))
    for index, row in enumerate(rows):
        buckets[(row["intent"], row["language"])][row["group_id"]].append(index)

    train: list[int] = []
    validation: list[int] = []
    test: list[int] = []

    for key in sorted(buckets):
        groups = list(buckets[key].items())
        groups.sort(key=lambda item: item[0])
        n_groups = len(groups)
        n_test = max(1, round(n_groups * (1.0 - train_frac - val_frac))) if n_groups >= 3 else 0
        n_val = max(1, round(n_groups * val_frac)) if n_groups >= 3 else 0
        if n_test + n_val >= n_groups:
            n_test = min(n_test, 1)
            n_val = min(n_val, 1)
            if n_test + n_val >= n_groups:
                n_val = 0
                n_test = 0
        rotated = _rotate(groups, seed + sum(ord(ch) for ch in "|".join(key)))
        test_groups = rotated[:n_test]
        val_groups = rotated[n_test : n_test + n_val]
        train_groups = rotated[n_test + n_val :]
        for _, indexes in train_groups:
            train.extend(indexes)
        for _, indexes in val_groups:
            validation.extend(indexes)
        for _, indexes in test_groups:
            test.extend(indexes)

    return {"train": sorted(train), "validation": sorted(validation), "test": sorted(test)}


def _rotate(items: list, seed: int) -> list:
    if not items:
        return items
    offset = seed % len(items)
    return items[offset:] + items[:offset]


def split_has_group_leak(rows: list[dict[str, str]], split: dict[str, list[int]]) -> int:
    membership: dict[str, set[str]] = defaultdict(set)
    for name, indexes in split.items():
        for index in indexes:
            membership[rows[index]["group_id"]].add(name)
    return sum(1 for names in membership.values() if len(names) > 1)
