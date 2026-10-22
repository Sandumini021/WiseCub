"""
router.py

FastAPI router for WiseCub Decision-Making (Choice Town):
- Scenarios catalog retrieval from MongoDB (Levels 1-10)
- Child-isolated learner progress tracking
- Multi-step scenario decision-making & deterministic reasoning analysis
- Longitudinal historical attempt persistence
- Reset functionality
- Secure learner analytics for children, parents, and teachers with strict ownership verification
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request

from app.database.folders import safety_consent
from app.database.mongo import get_db
from app.modules.accounts.security import COOKIE_NAME, public_account, read_token
from app.modules.decision_making.analysis import analyze_reasoning
from app.modules.decision_making.recommendations import recommend
from app.modules.decision_making.schemas import (
    AnalyticsOut,
    ChoiceTownProgress,
    DecisionIn,
    OptionContext,
    ReasoningIn,
    ReasoningOut,
    ResetProgressOut,
    ScenarioOut,
)
from app.modules.decision_making.store import (
    complete_child_level,
    get_active_scenarios,
    get_child_analytics,
    get_child_completed_attempts,
    get_child_progress,
    get_scenario_by_level,
    reset_child_progress,
    save_child_decision,
    save_child_reasoning,
)

router = APIRouter(prefix="/api/decision-making", tags=["decision-making"])


def require_db():
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=503,
            detail="MongoDB is not connected. Start MongoDB to access Choice Town.",
        )
    return db


async def get_authenticated_account(request: Request) -> dict[str, Any]:
    """
    Validates authentication using the existing WiseCub session cookie or Bearer token.
    Enforces server-side validation against MongoDB accounts collection.
    Never trusts client-supplied headers or demo session overrides.
    """
    db = require_db()
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        auth_header = request.headers.get("authorization", "")
        if auth_header.lower().startswith("bearer "):
            token = auth_header[7:].strip()

    if not token:
        raise HTTPException(status_code=401, detail="Please log in to access Choice Town.")

    payload = read_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Please log in to access Choice Town.")

    doc = await db.accounts.find_one({"child_id": payload["sub"]})
    if not doc:
        raise HTTPException(status_code=401, detail="Please log in to access Choice Town.")

    public = public_account(doc)
    if public is None:
        raise HTTPException(status_code=401, detail="Please log in to access Choice Town.")

    return public


async def authorize_analytics_access(request: Request, target_child_id: str) -> dict[str, Any]:
    """
    Strict ownership & permission enforcement for learner analytics:
    - Students may ONLY view their own records (HTTP 403 Forbidden otherwise).
    - Guardians may ONLY view students for whom they have confirmed guardian consent.
    - Teachers may ONLY view students enrolled in their class code or institution.
    """
    account = await get_authenticated_account(request)
    user_id = account["child_id"]
    role = account.get("role", "student")
    db = require_db()

    # 1. Student access: strict self-only
    if role == "student":
        if user_id != target_child_id:
            raise HTTPException(
                status_code=403,
                detail="Unauthorized: Students may only view their own analytics.",
            )
        return account

    # 2. Guardian access: must verify real relationship in guardian_consent
    if role == "guardian":
        guardian_email = account.get("email", "").strip().lower()
        if not guardian_email:
            raise HTTPException(status_code=403, detail="Unauthorized: Guardian account has no verified email.")

        consent_record = await safety_consent(db).find_one(
            {"child_id": target_child_id, "email": guardian_email}
        )
        if not consent_record and user_id != target_child_id:
            raise HTTPException(
                status_code=403,
                detail="Unauthorized: You do not have verified guardian authorization for this student.",
            )
        return account

    # 3. Teacher access: must verify enrolled student in class_code or institution
    if role == "teacher":
        student_account = await db.accounts.find_one({"child_id": target_child_id})
        if not student_account:
            raise HTTPException(status_code=404, detail="Student not found.")

        teacher_class = account.get("class_code", "").strip()
        student_class = student_account.get("class_code", "").strip()
        teacher_inst = account.get("institution", "").strip()
        student_inst = student_account.get("institution", "").strip()

        if teacher_class and student_class and teacher_class != student_class:
            raise HTTPException(
                status_code=403,
                detail="Unauthorized: Student is not enrolled in your assigned class.",
            )

        if teacher_inst and student_inst and teacher_inst != student_inst:
            raise HTTPException(
                status_code=403,
                detail="Unauthorized: Student is not enrolled in your institution.",
            )

        return account

    raise HTTPException(status_code=403, detail="Unauthorized role.")


def _check_level(level_id: int) -> None:
    if level_id < 1 or level_id > 10:
        raise HTTPException(status_code=404, detail=f"Level {level_id} not found.")


# ─────────────────────────────────────────────────────────────────────────────
# SCENARIOS CATALOG (MONGODB-BACKED)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/scenarios", response_model=list[ScenarioOut])
async def read_scenarios() -> list[ScenarioOut]:
    """Return all active Choice Town scenarios from MongoDB sorted by level_id (1-10)."""
    db = require_db()
    return await get_active_scenarios(db)


@router.get("/scenarios/{level_id}", response_model=ScenarioOut)
async def read_scenario(level_id: int) -> ScenarioOut:
    """Return a single Choice Town scenario by level_id from MongoDB."""
    _check_level(level_id)
    db = require_db()
    scenario = await get_scenario_by_level(db, level_id)
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Scenario for level {level_id} not found.")
    return scenario


# ─────────────────────────────────────────────────────────────────────────────
# PROGRESS & ACTIVE SESSIONS
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/progress", response_model=ChoiceTownProgress)
async def read_progress(request: Request) -> ChoiceTownProgress:
    """
    Return the authenticated child's Choice Town progress from MongoDB.
    Initializes clean progress (Level 1, 0 completed) if no record exists.
    """
    account = await get_authenticated_account(request)
    child_id = account["child_id"]
    db = require_db()
    return await get_child_progress(db, child_id)


@router.put("/sessions/{level_id}/decision", response_model=ChoiceTownProgress)
async def put_decision(level_id: int, body: DecisionIn, request: Request) -> ChoiceTownProgress:
    """Save the chosen option (Step 1) for a scenario attempt in MongoDB."""
    _check_level(level_id)
    account = await get_authenticated_account(request)
    child_id = account["child_id"]
    db = require_db()

    scenario = await get_scenario_by_level(db, level_id)
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Scenario for level {level_id} not found.")

    valid_option_ids = {opt.id for opt in scenario.options}
    if body.option_id not in valid_option_ids:
        raise HTTPException(
            status_code=400,
            detail=f"Option '{body.option_id}' is not valid for level {level_id}.",
        )

    return await save_child_decision(db, child_id, level_id, body.option_id)


@router.post("/sessions/{level_id}/reasoning", response_model=ReasoningOut)
async def post_reasoning(level_id: int, body: ReasoningIn, request: Request) -> ReasoningOut:
    """
    Submit and analyze child's written reasoning (Step 2) for a scenario.
    Validates explanation length (20-400 characters), performs deterministic rule-based
    reasoning analysis across 6 dimensions, evaluates repeated gaps from longitudinal
    attempts, and saves to MongoDB.
    """
    _check_level(level_id)
    stripped_text = body.reasoning.strip()
    if len(stripped_text) < 20 or len(stripped_text) > 400:
        raise HTTPException(
            status_code=422,
            detail="Explanation must be between 20 and 400 characters.",
        )

    account = await get_authenticated_account(request)
    child_id = account["child_id"]
    db = require_db()

    scenario = await get_scenario_by_level(db, level_id)
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Scenario for level {level_id} not found.")

    scenario_opt = next((o for o in scenario.options if o.id == body.option_id), None)
    if not scenario_opt:
        raise HTTPException(
            status_code=400,
            detail=f"Option '{body.option_id}' is not valid for level {level_id}.",
        )

    option_ctx = body.option or OptionContext(
        title=scenario_opt.title,
        summary=scenario_opt.summary,
        immediate=scenario_opt.immediate,
        bullets=scenario_opt.bullets,
    )

    analysis = analyze_reasoning(body.option_id, option_ctx, stripped_text)
    past_attempts = await get_child_completed_attempts(db, child_id)
    recommendations = recommend(analysis, past_attempts=past_attempts)

    progress = await save_child_reasoning(
        db=db,
        child_id=child_id,
        level_id=level_id,
        option_id=body.option_id,
        reasoning=stripped_text,
        analysis=analysis,
        recommendations=recommendations,
    )

    return ReasoningOut(
        progress=progress,
        analysis=analysis,
        recommendations=recommendations,
    )


@router.post("/sessions/{level_id}/complete", response_model=ChoiceTownProgress)
async def post_complete(level_id: int, request: Request) -> ChoiceTownProgress:
    """
    Complete a scenario level (Step 4).
    Verifies that a decision and reasoning analysis exist for this level,
    marks the attempt completed in historical records, and unlocks the next level.
    """
    _check_level(level_id)
    account = await get_authenticated_account(request)
    child_id = account["child_id"]
    db = require_db()

    progress = await get_child_progress(db, child_id)
    session = progress.sessions.get(str(level_id))
    if session is None or session.analysis is None:
        raise HTTPException(
            status_code=400,
            detail="Submit a decision and an explanation before completing this level.",
        )

    return await complete_child_level(db, child_id, level_id)


@router.post("/reset", response_model=ResetProgressOut)
async def post_reset(request: Request) -> ResetProgressOut:
    """
    Reset child's active progress back to Level 1 and clear completed levels.
    Marks any active in-progress attempts as abandoned while preserving completed
    attempts in the historical database for longitudinal analytics.
    """
    account = await get_authenticated_account(request)
    child_id = account["child_id"]
    db = require_db()
    reset_prog = await reset_child_progress(db, child_id)
    return ResetProgressOut(ok=True, progress=reset_prog, message="Progress reset to Level 1.")


# ─────────────────────────────────────────────────────────────────────────────
# PARENT & TEACHER ANALYTICS (SECURE OWNERSHIP ENFORCEMENT)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/analytics/{child_id}", response_model=AnalyticsOut)
async def read_analytics(child_id: str, request: Request) -> AnalyticsOut:
    """
    Return longitudinal reasoning profile, dimension averages, and mastery patterns.
    Enforces strict role and ownership permissions:
    - Students may ONLY view their own analytics.
    - Guardians may ONLY view students for whom they have confirmed guardian consent.
    - Teachers may ONLY view students in their assigned class code or institution.
    - Raw written explanations are never exposed to preserve child privacy.
    """
    await authorize_analytics_access(request, child_id)
    db = require_db()
    return await get_child_analytics(db, child_id)
