from app.database.folders import ALL_FOLDERS, coll, missions_progress


def test_compass_folders_use_dots():
    assert "Choice_Town.progress" in ALL_FOLDERS
    assert "Gamified_Learning.progress" in ALL_FOLDERS
    assert "Scam_Safety.consent" in ALL_FOLDERS
    assert "Tax_Lab.state" in ALL_FOLDERS
    assert "Cub_Assistant.notes" in ALL_FOLDERS


class _Fake:
    def __init__(self):
        self.gamified_progress = type("C", (), {"docs": []})()


def test_coll_uses_legacy_on_test_fakes():
    db = _Fake()
    assert missions_progress(db) is db.gamified_progress
    assert coll(db, "Gamified_Learning.progress", "gamified_progress") is db.gamified_progress
