from fastapi import APIRouter, HTTPException

from app.modules.decision_making.analysis import analyze_reasoning
from app.modules.decision_making.recommendations import recommend
from app.modules.decision_making.schemas import (
    ChoiceTownProgress,
    DecisionIn,
    LevelSession,
    ReasoningIn,
    ReasoningOut,
)
from app.modules.decision_making.store import complete_level, get_progress, save_decision, save_reasoning

router = APIRouter(prefix="/api/decision-making", tags=["decision-making"])


def _check_level(level_id: int) -> None:
    if level_id < 1 or level_id > 10:
        raise HTTPException(status_code=404, detail="Level not found")


@router.get("/progress", response_model=ChoiceTownProgress)
def read_progress() -> ChoiceTownProgress:
    """Demo-child progress for Choice Town. Stored in a local file, not MongoDB."""
    return get_progress()


@router.put("/sessions/{level_id}/decision", response_model=ChoiceTownProgress)
def put_decision(level_id: int, body: DecisionIn) -> ChoiceTownProgress:
    _check_level(level_id)
    return save_decision(level_id, body.option_id)


@router.post("/sessions/{level_id}/reasoning", response_model=ReasoningOut)
def post_reasoning(level_id: int, body: ReasoningIn) -> ReasoningOut:
    _check_level(level_id)
    analysis = analyze_reasoning(body.option_id, body.option, body.reasoning)
    current = get_progress()
    key = str(level_id)
    preview = dict(current.sessions)
    existing = preview.get(key, LevelSession())
    preview[key] = existing.model_copy(
        update={
            "option_id": body.option_id,
            "reasoning": body.reasoning.strip(),
            "analysis": analysis,
        }
    )
    recommendations = recommend(analysis, preview)
    progress = save_reasoning(
        level_id,
        body.option_id,
        body.reasoning.strip(),
        analysis,
        recommendations,
    )
    return ReasoningOut(progress=progress, analysis=analysis, recommendations=recommendations)


@router.post("/sessions/{level_id}/complete", response_model=ChoiceTownProgress)
def post_complete(level_id: int) -> ChoiceTownProgress:
    _check_level(level_id)
    progress = get_progress()
    session = progress.sessions.get(str(level_id))
    if session is None or session.analysis is None:
        raise HTTPException(
            status_code=400,
            detail="Submit a decision and an explanation before completing this level.",
        )
    return complete_level(level_id)
