import json
import threading
from datetime import datetime, timezone
from pathlib import Path

from app.modules.decision_making.schemas import (
    AdaptiveRecommendation,
    AnalysisResult,
    ChoiceTownProgress,
    LevelSession,
    OptionId,
)

DATA_PATH = Path(__file__).resolve().parents[3] / "data" / "decision_making_demo.json"
_LOCK = threading.Lock()
DEMO_LEARNER = "demo-child"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _seed() -> ChoiceTownProgress:
    return ChoiceTownProgress(
        completed_level_ids=[1, 2, 3, 4],
        current_level_id=5,
        sessions={},
        updated_at=_now(),
    )


def _read() -> dict[str, ChoiceTownProgress]:
    if not DATA_PATH.exists():
        return {DEMO_LEARNER: _seed()}
    raw = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    learners = raw.get("learners", {})
    parsed: dict[str, ChoiceTownProgress] = {}
    for learner_id, payload in learners.items():
        parsed[learner_id] = ChoiceTownProgress.model_validate(payload)
    if DEMO_LEARNER not in parsed:
        parsed[DEMO_LEARNER] = _seed()
    return parsed


def _write(learners: dict[str, ChoiceTownProgress]) -> None:
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "note": "Demo learner only. Not a record of real children. Replace this file store with MongoDB later.",
        "learners": {
            learner_id: progress.model_dump(by_alias=True)
            for learner_id, progress in learners.items()
        },
    }
    DATA_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def get_progress() -> ChoiceTownProgress:
    with _LOCK:
        return _read()[DEMO_LEARNER]


def _save(progress: ChoiceTownProgress) -> ChoiceTownProgress:
    learners = _read()
    stored = progress.model_copy(update={"updated_at": _now()})
    learners[DEMO_LEARNER] = stored
    _write(learners)
    return stored


def save_decision(level_id: int, option_id: OptionId) -> ChoiceTownProgress:
    with _LOCK:
        progress = _read()[DEMO_LEARNER]
        key = str(level_id)
        current = progress.sessions.get(key, LevelSession())
        sessions = dict(progress.sessions)
        sessions[key] = current.model_copy(update={"option_id": option_id})
        return _save(progress.model_copy(update={"sessions": sessions}))


def save_reasoning(
    level_id: int,
    option_id: OptionId,
    reasoning: str,
    analysis: AnalysisResult,
    recommendations: list[AdaptiveRecommendation],
) -> ChoiceTownProgress:
    with _LOCK:
        progress = _read()[DEMO_LEARNER]
        key = str(level_id)
        current = progress.sessions.get(key, LevelSession())
        sessions = dict(progress.sessions)
        sessions[key] = current.model_copy(
            update={
                "option_id": option_id,
                "reasoning": reasoning,
                "analysis": analysis,
                "recommendations": recommendations,
            }
        )
        updated = progress.model_copy(update={"sessions": sessions})
        # Recommendations need the analysis that was just saved.
        return _save(updated)


def complete_level(level_id: int) -> ChoiceTownProgress:
    with _LOCK:
        progress = _read()[DEMO_LEARNER]
        completed = sorted(set(progress.completed_level_ids) | {level_id})
        remaining = [level for level in range(1, 11) if level not in completed]
        current_level = remaining[0] if remaining else 10
        key = str(level_id)
        current = progress.sessions.get(key, LevelSession())
        sessions = dict(progress.sessions)
        sessions[key] = current.model_copy(update={"completed": True})
        return _save(
            progress.model_copy(
                update={
                    "completed_level_ids": completed,
                    "current_level_id": current_level,
                    "sessions": sessions,
                }
            )
        )
