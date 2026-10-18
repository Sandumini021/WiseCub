from app.modules.cub_intent.dataset import grouped_split, load_rows, split_has_group_leak


def test_grouped_split_keeps_paraphrases_together():
    rows = load_rows()
    split = grouped_split(rows, seed=42)
    assert split_has_group_leak(rows, split) == 0
    used = set(split["train"]) | set(split["validation"]) | set(split["test"])
    assert used == set(range(len(rows)))
    assert len(split["train"]) > len(split["test"])
