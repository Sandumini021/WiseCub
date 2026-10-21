"""Create Compass dotted folders in wisecub without starting FastAPI."""

from __future__ import annotations

from pymongo import MongoClient

ALL_FOLDERS = (
    "Choice_Town.scenarios",
    "Choice_Town.progress",
    "Choice_Town.attempts",
    "Choice_Town.browser_state",
    "Gamified_Learning.progress",
    "Gamified_Learning.decisions",
    "Gamified_Learning.attempts",
    "Gamified_Learning.competency",
    "Gamified_Learning.character_history",
    "Gamified_Learning.browser_state",
    "Scam_Safety.consent",
    "Scam_Safety.simulations",
    "Scam_Safety.progress",
    "Tax_Lab.state",
    "Cub_Assistant.notes",
    "Virtual_Stock_Market.bag",
    "Virtual_Stock_Market.lesson_state",
)

LEGACY_PAIRS = (
    ("Choice_Town.scenarios", "decision_making_scenarios"),
    ("Choice_Town.progress", "decision_making_progress"),
    ("Choice_Town.attempts", "decision_making_attempts"),
    ("Gamified_Learning.progress", "gamified_progress"),
    ("Gamified_Learning.decisions", "financial_decisions"),
    ("Gamified_Learning.attempts", "mission_attempts"),
    ("Gamified_Learning.competency", "competency_assessments"),
    ("Gamified_Learning.character_history", "character_state_history"),
    ("Scam_Safety.consent", "guardian_consent"),
    ("Scam_Safety.simulations", "safety_simulations"),
)

MODULE_STATE_FOLDER = {
    "tax_learning": "Tax_Lab.state",
    "safety": "Scam_Safety.progress",
    "choices": "Choice_Town.browser_state",
    "missions": "Gamified_Learning.browser_state",
    "progress": "Cub_Assistant.notes",
    "market": "Virtual_Stock_Market.bag",
    "market_lessons": "Virtual_Stock_Market.lesson_state",
}


def main() -> None:
    client = MongoClient(
        "mongodb://127.0.0.1:27017",
        serverSelectionTimeoutMS=4000,
        connectTimeoutMS=4000,
    )
    print("ping", client.admin.command("ping"))
    db = client["wisecub"]
    existing = set(db.list_collection_names())
    print("before", sorted(existing))
    for name in ALL_FOLDERS:
        if name not in existing:
            db.create_collection(name)
            print("created", name)
        else:
            print("exists", name)
    existing = set(db.list_collection_names())
    for dotted, legacy in LEGACY_PAIRS:
        if legacy not in existing:
            continue
        if db[dotted].estimated_document_count() > 0:
            continue
        docs = list(db[legacy].find().limit(5000))
        if docs:
            db[dotted].insert_many(docs)
            print("copied", legacy, "->", dotted, len(docs))
    for row in db["module_state"].find():
        folder = MODULE_STATE_FOLDER.get(str(row.get("module") or ""))
        if not folder:
            continue
        q = {"child_id": row.get("child_id"), "module": row.get("module")}
        db[folder].update_one(q, {"$set": row}, upsert=True)
    print("after", sorted(db.list_collection_names()))
    client.close()


if __name__ == "__main__":
    main()
