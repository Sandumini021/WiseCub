"""Compass folders: dotted collection names so each module groups in wisecub.

Virtual Stock Market already uses Virtual_Stock_Market.*. Other modules follow
the same pattern. Test fakes keep legacy attribute names (they have .docs).
"""

from __future__ import annotations

from typing import Any

from pymongo.errors import PyMongoError

# Choice Town
CT_SCENARIOS = "Choice_Town.scenarios"
CT_PROGRESS = "Choice_Town.progress"
CT_ATTEMPTS = "Choice_Town.attempts"
CT_STATE = "Choice_Town.browser_state"

# Missions
GL_PROGRESS = "Gamified_Learning.progress"
GL_DECISIONS = "Gamified_Learning.decisions"
GL_ATTEMPTS = "Gamified_Learning.attempts"
GL_COMPETENCY = "Gamified_Learning.competency"
GL_CHARACTER = "Gamified_Learning.character_history"
GL_STATE = "Gamified_Learning.browser_state"

# Scam Safety
SS_CONSENT = "Scam_Safety.consent"
SS_SIMULATIONS = "Scam_Safety.simulations"
SS_STATE = "Scam_Safety.progress"

# Tax Lab
TAX_STATE = "Tax_Lab.state"

# Cub
CUB_STATE = "Cub_Assistant.notes"

# Extra Virtual Stock Market rows from shared module_state
VSM_BAG = "Virtual_Stock_Market.bag"
VSM_LESSON_STATE = "Virtual_Stock_Market.lesson_state"

# Shared module_state rows also copied into these folders
MODULE_STATE_FOLDER = {
    "tax_learning": TAX_STATE,
    "safety": SS_STATE,
    "choices": CT_STATE,
    "missions": GL_STATE,
    "progress": CUB_STATE,
    "market": VSM_BAG,
    "market_lessons": VSM_LESSON_STATE,
}

LEGACY_PAIRS: tuple[tuple[str, str], ...] = (
    (CT_SCENARIOS, "decision_making_scenarios"),
    (CT_PROGRESS, "decision_making_progress"),
    (CT_ATTEMPTS, "decision_making_attempts"),
    (GL_PROGRESS, "gamified_progress"),
    (GL_DECISIONS, "financial_decisions"),
    (GL_ATTEMPTS, "mission_attempts"),
    (GL_COMPETENCY, "competency_assessments"),
    (GL_CHARACTER, "character_state_history"),
    (SS_CONSENT, "guardian_consent"),
    (SS_SIMULATIONS, "safety_simulations"),
)

ALL_FOLDERS: tuple[str, ...] = tuple(dotted for dotted, _legacy in LEGACY_PAIRS) + (
    CT_STATE,
    GL_STATE,
    SS_STATE,
    TAX_STATE,
    CUB_STATE,
    VSM_BAG,
    VSM_LESSON_STATE,
)


def coll(db: Any, dotted: str, legacy: str) -> Any:
    """Motor uses dotted names; in-memory test DBs keep the old attribute."""
    fake = getattr(db, legacy, None)
    if fake is not None and hasattr(fake, "docs"):
        return fake
    return db[dotted]


def choice_scenarios(db: Any) -> Any:
    return coll(db, CT_SCENARIOS, "decision_making_scenarios")


def choice_progress(db: Any) -> Any:
    return coll(db, CT_PROGRESS, "decision_making_progress")


def choice_attempts(db: Any) -> Any:
    return coll(db, CT_ATTEMPTS, "decision_making_attempts")


def missions_progress(db: Any) -> Any:
    return coll(db, GL_PROGRESS, "gamified_progress")


def missions_decisions(db: Any) -> Any:
    return coll(db, GL_DECISIONS, "financial_decisions")


def missions_attempts(db: Any) -> Any:
    return coll(db, GL_ATTEMPTS, "mission_attempts")


def missions_competency(db: Any) -> Any:
    return coll(db, GL_COMPETENCY, "competency_assessments")


def missions_character(db: Any) -> Any:
    return coll(db, GL_CHARACTER, "character_state_history")


def safety_consent(db: Any) -> Any:
    return coll(db, SS_CONSENT, "guardian_consent")


def safety_simulations(db: Any) -> Any:
    return coll(db, SS_SIMULATIONS, "safety_simulations")


def module_state_coll(db: Any) -> Any:
    fake = getattr(db, "module_state", None)
    if fake is not None and hasattr(fake, "docs"):
        return fake
    extra = getattr(db, "module_states", None)
    if extra is not None and hasattr(extra, "docs"):
        return extra
    return db["module_state"]


async def ensure_module_folders(db: Any) -> None:
    """Create Compass folders and copy any rows still sitting on legacy names."""
    try:
        existing = set(await db.list_collection_names())
    except Exception:
        return
    for name in ALL_FOLDERS:
        if name not in existing:
            try:
                await db.create_collection(name)
            except PyMongoError:
                pass
    existing = set(await db.list_collection_names())
    for dotted, legacy in LEGACY_PAIRS:
        if legacy not in existing:
            continue
        try:
            if await db[dotted].estimated_document_count() > 0:
                continue
            old_count = await db[legacy].estimated_document_count()
            if not old_count:
                continue
            docs = await db[legacy].find().to_list(5000)
            if docs:
                await db[dotted].insert_many(docs)
        except PyMongoError:
            continue
    if "module_state" not in existing:
        return
    try:
        rows = await db["module_state"].find().to_list(2000)
    except PyMongoError:
        return
    for row in rows:
        folder = MODULE_STATE_FOLDER.get(str(row.get("module") or ""))
        if not folder:
            continue
        try:
            query = {"child_id": row.get("child_id"), "module": row.get("module")}
            await db[folder].update_one(query, {"$set": row}, upsert=True)
        except PyMongoError:
            continue
