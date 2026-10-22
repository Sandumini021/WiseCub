"""
router.py

FastAPI router for WiseCub Scam Safety:
- Parent/Guardian contact details, consent management, and verification.
- Safe educational scam email simulation triggers for all 6 levels.
- Simulation feedback and learning event tracking.
"""

from datetime import datetime, timezone
import re
from typing import Any
import uuid

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field

from app.core.config import settings
from app.database.folders import module_state_coll, safety_consent, safety_simulations
from app.database.mongo import get_db
from app.modules.accounts.security import COOKIE_NAME, read_token
from app.modules.safety.email_service import LEVEL_TEMPLATES, send_simulation_email

router = APIRouter(prefix="/api/safety", tags=["scam-safety"])

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def require_db():
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=503,
            detail="MongoDB is not connected. Start MongoDB to manage guardian consent.",
        )
    return db


def check_student_authorization(request: Request, owner_child_id: str) -> None:
    """
    Ensures a student cannot view or modify another student's simulation record.
    If authenticated via wisecub_session cookie or Authorization Bearer header,
    verifies role and ownership.
    """
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        auth_header = request.headers.get("authorization", "")
        if auth_header.lower().startswith("bearer "):
            token = auth_header[7:].strip()

    if token:
        payload = read_token(token)
        if payload and payload.get("sub"):
            user_id = str(payload["sub"])
            user_role = payload.get("role", "student")
            if user_role == "student" and user_id != str(owner_child_id):
                raise HTTPException(
                    status_code=403,
                    detail="Unauthorized: Access to another student's simulation is forbidden.",
                )


def is_scanner_request(request: Request) -> bool:
    """
    Detects automated email security bots and preview scanners (e.g., GoogleImageProxy,
    Proofpoint, Barracuda, Slackbot) to prevent false-positive link clicks.
    """
    user_agent = (request.headers.get("user-agent") or "").lower()
    scanner_patterns = (
        "googleimageproxy", "bingbot", "slackbot", "twitterbot", "facebookexternalhit",
        "whatsapp", "linkedinbot", "crawler", "spider", "preview", "bot", "virus", "scan",
        "barracuda", "proofpoint", "mimecast"
    )
    return any(p in user_agent for p in scanner_patterns)



# ─────────────────────────────────────────────────────────────────────────────
#  PYDANTIC SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────


class GuardianIn(BaseModel):
    parent_name: str = Field(min_length=2, max_length=80)
    email: str = Field(min_length=5, max_length=120)
    relationship: str = Field(default="Parent", max_length=40)
    consent_confirmed: bool = Field(default=False)
    simulation_enabled: bool = Field(default=True)


class ConsentUpdateIn(BaseModel):
    consent_confirmed: bool
    simulation_enabled: bool


class VerifyIn(BaseModel):
    token: str = Field(default="", max_length=120)
    is_simulated_dev_verification: bool = Field(default=False)


class SimulationTriggerIn(BaseModel):
    category_id: str = Field(min_length=2, max_length=30)
    score: int = Field(ge=0, le=100)
    attempt_id: str = Field(min_length=1, max_length=100)
    red_flags_identified: list[str] = Field(default_factory=list)
    force_retry: bool = Field(default=False)


class SimulationEventIn(BaseModel):
    event_type: str = Field(..., description="'open', 'link_clicked', 'reported_suspicious', 'marked_safe'")
    child_id: str = Field(default="")
    selected_classification: str | None = Field(default=None)


class FollowUpIn(BaseModel):
    selected_index: int = Field(ge=0, le=5)
    child_id: str = Field(default="")


# ─────────────────────────────────────────────────────────────────────────────
#  GUARDIAN CONTACT & CONSENT ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────


@router.get("/guardian/{child_id}")
async def get_guardian_details(child_id: str, request: Request) -> dict[str, Any]:
    """
    Returns the saved guardian details and consent status for the given child.
    """
    check_student_authorization(request, child_id)
    db = require_db()
    doc = await safety_consent(db).find_one({"child_id": child_id}, {"_id": 0})
    if not doc:
        return {
            "child_id": child_id,
            "configured": False,
            "parent_name": "",
            "email": "",
            "relationship": "Parent",
            "consent_confirmed": False,
            "simulation_enabled": True,
            "verification_status": "unconfigured",
            "verification_method": "unconfigured",
            "verified_at": None,
            "smtp_configured": settings.is_smtp_configured,
            "smtp_summary": settings.smtp_status_summary,
        }

    return {
        "child_id": child_id,
        "configured": True,
        "parent_name": doc.get("parent_name", ""),
        "email": doc.get("email", ""),
        "relationship": doc.get("relationship", "Parent"),
        "consent_confirmed": doc.get("consent_confirmed", False),
        "simulation_enabled": doc.get("simulation_enabled", True),
        "verification_status": doc.get("verification_status", "pending"),
        "verification_method": doc.get("verification_method", "simulated_dev_assist" if not settings.is_smtp_configured else "email_link"),
        "verified_at": doc.get("verified_at"),
        "updated_at": doc.get("updated_at"),
        "smtp_configured": settings.is_smtp_configured,
        "smtp_summary": settings.smtp_status_summary,
    }


@router.put("/guardian/{child_id}")
async def save_guardian_details(child_id: str, body: GuardianIn, request: Request) -> dict[str, Any]:
    """
    Saves or updates parent/guardian contact details and consent for a child.
    Validates name and email address format.
    Generates a secure verification token for pending email verification.
    """
    check_student_authorization(request, child_id)
    name = body.parent_name.strip()
    email = body.email.strip().lower()

    if not name or len(name) < 2:
        raise HTTPException(status_code=400, detail="Please provide the parent or guardian's full name.")

    if not EMAIL_REGEX.match(email):
        raise HTTPException(status_code=400, detail="Please enter a valid parent/guardian email address.")

    db = require_db()
    existing = await safety_consent(db).find_one({"child_id": child_id})

    # If email changed or not previously verified, set to pending
    previous_email = (existing.get("email") or "").lower() if existing else ""
    was_verified = existing.get("verification_status") == "verified" if existing else False

    if existing and previous_email == email and was_verified:
        verification_status = "verified"
        verification_token = existing.get("verification_token", str(uuid.uuid4()))
        verified_at = existing.get("verified_at")
    else:
        verification_status = "pending"
        verification_token = str(uuid.uuid4())
        verified_at = None

    now = datetime.now(timezone.utc).isoformat()
    record = {
        "child_id": child_id,
        "parent_name": name,
        "email": email,
        "relationship": body.relationship.strip() or "Parent",
        "consent_confirmed": bool(body.consent_confirmed),
        "simulation_enabled": bool(body.simulation_enabled),
        "verification_status": verification_status,
        "verification_token": verification_token,
        "verified_at": verified_at,
        "updated_at": now,
    }

    await safety_consent(db).update_one(
        {"child_id": child_id},
        {"$set": record},
        upsert=True,
    )

    return {
        "ok": True,
        "child_id": child_id,
        "parent_name": name,
        "email": email,
        "relationship": record["relationship"],
        "consent_confirmed": record["consent_confirmed"],
        "simulation_enabled": record["simulation_enabled"],
        "verification_status": verification_status,
        "verified_at": verified_at,
        "verification_token_dev": verification_token,  # For easy local verification in dev
        "smtp_configured": settings.is_smtp_configured,
        "updated_at": now,
    }


@router.post("/guardian/{child_id}/verify")
async def verify_guardian_email(child_id: str, body: VerifyIn) -> dict[str, Any]:
    """
    Verifies the parent/guardian email address using a verification token or manual confirmation.
    """
    db = require_db()
    doc = await safety_consent(db).find_one({"child_id": child_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Guardian details not found for this child.")

    provided_token = body.token.strip()
    stored_token = doc.get("verification_token")

    # If a token was provided, ensure it matches
    if provided_token and stored_token and provided_token != stored_token:
        raise HTTPException(status_code=400, detail="Invalid verification token.")

    now = datetime.now(timezone.utc).isoformat()
    method = (
        "simulated_dev_assist"
        if (body.is_simulated_dev_verification or not settings.is_smtp_configured)
        else "email_link"
    )
    await safety_consent(db).update_one(
        {"child_id": child_id},
        {
            "$set": {
                "verification_status": "verified",
                "verification_method": method,
                "verified_at": now,
                "updated_at": now,
            }
        },
    )

    return {
        "ok": True,
        "child_id": child_id,
        "verification_status": "verified",
        "verification_method": method,
        "verified_at": now,
    }


@router.post("/guardian/{child_id}/consent")
async def update_guardian_consent(child_id: str, body: ConsentUpdateIn, request: Request) -> dict[str, Any]:
    """
    Updates or withdraws consent, or toggles future simulation emails.
    """
    check_student_authorization(request, child_id)
    db = require_db()
    doc = await safety_consent(db).find_one({"child_id": child_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Guardian details not found for this child.")

    now = datetime.now(timezone.utc).isoformat()
    await safety_consent(db).update_one(
        {"child_id": child_id},
        {
            "$set": {
                "consent_confirmed": body.consent_confirmed,
                "simulation_enabled": body.simulation_enabled,
                "updated_at": now,
            }
        },
    )

    return {
        "ok": True,
        "child_id": child_id,
        "consent_confirmed": body.consent_confirmed,
        "simulation_enabled": body.simulation_enabled,
        "updated_at": now,
    }


# ─────────────────────────────────────────────────────────────────────────────
#  SIMULATION TRIGGER & EDUCATIONAL DEBRIEF ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────


@router.post("/simulation/trigger/{child_id}")
async def trigger_level_simulation(child_id: str, body: SimulationTriggerIn, request: Request) -> dict[str, Any]:
    """
    Triggers an educational scam simulation email for one of the six completed levels.
    Enforces all strict safety and consent requirements:
    1. Category must be one of the six approved Scam Safety categories.
    2. Score must be >= 80% (must pass).
    3. Guardian must be registered, verified, and consent active.
    4. Server-side idempotency: prevents duplicate sends for the same attempt.
    """
    check_student_authorization(request, child_id)
    category_id = body.category_id.strip().lower()
    if category_id not in LEVEL_TEMPLATES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category '{category_id}'. Must be one of: {list(LEVEL_TEMPLATES.keys())}",
        )

    # Must pass with >= 80%
    if body.score < 80:
        return {
            "eligible": False,
            "status": "not_passed",
            "category_id": category_id,
            "score": body.score,
            "detail": f"Score {body.score}% is below passing threshold (80%). No simulation triggered.",
        }

    db = require_db()

    # 1. Check guardian consent and verification
    guardian = await safety_consent(db).find_one({"child_id": child_id})
    if not guardian:
        return {
            "eligible": False,
            "status": "no_guardian",
            "category_id": category_id,
            "detail": "Parent/Guardian details have not been registered yet.",
        }

    if not guardian.get("consent_confirmed"):
        return {
            "eligible": False,
            "status": "consent_required",
            "category_id": category_id,
            "detail": "Parent/Guardian consent checkbox was not confirmed.",
        }

    if not guardian.get("simulation_enabled", True):
        return {
            "eligible": False,
            "status": "disabled",
            "category_id": category_id,
            "detail": "Simulations are disabled by the parent/guardian.",
        }

    if guardian.get("verification_status") != "verified":
        return {
            "eligible": False,
            "status": "unverified",
            "category_id": category_id,
            "detail": "Parent/Guardian email address is awaiting verification.",
        }

    # 2. Server-Side Idempotency & Safe Retry Check
    attempt_id = body.attempt_id.strip()
    existing_attempt = await safety_simulations(db).find_one(
        {"child_id": child_id, "category_id": category_id, "attempt_id": attempt_id},
        {"_id": 0},
    )
    if existing_attempt:
        # If successfully sent previously, prevent duplicate sending
        if existing_attempt.get("status") == "sent":
            return {
                "eligible": True,
                "duplicate": True,
                "retried": False,
                "status": "sent",
                "category_id": category_id,
                "simulation_id": existing_attempt.get("simulation_id"),
                "detail": "Educational simulation email was already successfully accepted by the mail provider.",
                "feedback_url": existing_attempt.get("feedback_url"),
            }

        # If previous delivery was unconfigured or failed, or explicit retry requested, safely retry
        simulation_id = existing_attempt.get("simulation_id") or str(uuid.uuid4())
        feedback_url = existing_attempt.get("feedback_url") or f"{settings.frontend_origin}/safety/simulation-feedback?id={simulation_id}"
        parent_email = guardian.get("email", "")
        parent_name = guardian.get("parent_name", "Parent / Guardian")
        child_doc = await db.children.find_one({"child_id": child_id})
        child_name = child_doc.get("name") if child_doc else "your child"

        send_result = send_simulation_email(
            to_email=parent_email,
            parent_name=parent_name,
            category_id=category_id,
            simulation_id=simulation_id,
            feedback_url=feedback_url,
            child_name=child_name,
        )

        now = datetime.now(timezone.utc).isoformat()
        template = LEVEL_TEMPLATES.get(category_id, LEVEL_TEMPLATES["phishing"])
        update_fields = {
            "status": send_result["status"],
            "detail": send_result["detail"],
            "subject": send_result.get("subject", ""),
            "parent_email": parent_email,
            "parent_name": parent_name,
            "score": body.score,
            "scenario_id": template.get("scenario_id", f"{category_id}_scenario"),
            "sender_name": template.get("fictional_sender_name", "WiseCub Safety Lab"),
            "sender_email": template.get("fictional_sender_email", "alerts@wisecub-safety.org"),
            "call_to_action": template.get("call_to_action", "View Link"),
            "display_link_text": template.get("display_link_text", "http://safety-check.wisecub.org"),
            "preview": template.get("preview", ""),
            "simulated_body": template.get("simulated_body", ""),
            "updated_at": now,
        }
        await safety_simulations(db).update_one(
            {"child_id": child_id, "category_id": category_id, "attempt_id": attempt_id},
            {"$set": update_fields},
        )

        return {
            "eligible": True,
            "duplicate": False,
            "retried": True,
            "simulation_id": simulation_id,
            "category_id": category_id,
            "level_number": existing_attempt.get("level_number", template["level_number"]),
            "status": send_result.get("status", "sent"),
            "parent_email": parent_email,
            "detail": send_result.get("detail", ""),
            "feedback_url": feedback_url,
        }

    # 3. Create unique simulation record for new completion attempt
    simulation_id = str(uuid.uuid4())
    feedback_url = f"{settings.frontend_origin}/safety/simulation-feedback?id={simulation_id}"
    parent_email = guardian.get("email", "")
    parent_name = guardian.get("parent_name", "Parent / Guardian")

    # Get child name if available
    child_doc = await db.children.find_one({"child_id": child_id})
    child_name = child_doc.get("name") if child_doc else "your child"

    # 4. Attempt educational email delivery
    send_result = send_simulation_email(
        to_email=parent_email,
        parent_name=parent_name,
        category_id=category_id,
        simulation_id=simulation_id,
        feedback_url=feedback_url,
        child_name=child_name,
    )

    now = datetime.now(timezone.utc).isoformat()
    template = LEVEL_TEMPLATES.get(category_id, LEVEL_TEMPLATES["phishing"])
    sim_doc = {
        "simulation_id": simulation_id,
        "child_id": child_id,
        "category_id": category_id,
        "scenario_id": template.get("scenario_id", f"{category_id}_scenario"),
        "level_number": template["level_number"],
        "attempt_id": attempt_id,
        "score": body.score,
        "passed": True,
        "parent_email": parent_email,
        "parent_name": parent_name,
        "status": send_result.get("status", "sent"),  # "sent", "not_configured", or "failed"
        "detail": send_result.get("detail", ""),
        "subject": send_result.get("subject", ""),
        "sender_name": template.get("fictional_sender_name", "WiseCub Safety Lab"),
        "sender_email": template.get("fictional_sender_email", "alerts@wisecub-safety.org"),
        "call_to_action": template.get("call_to_action", "View Link"),
        "display_link_text": template.get("display_link_text", "http://safety-check.wisecub.org"),
        "preview": template.get("preview", ""),
        "simulated_body": template.get("simulated_body", ""),
        "feedback_url": feedback_url,
        "red_flags_identified": body.red_flags_identified,
        "inbox_opened": False,
        "inbox_opened_at": None,
        "initial_classification": "unanswered",
        "classification_submitted_at": None,
        "link_clicked": False,
        "link_clicked_at": None,
        "reported_as_suspicious": False,
        "reported_at": None,
        "debrief_viewed": False,
        "debrief_viewed_at": None,
        "follow_up_completed": False,
        "follow_up_selected_index": None,
        "follow_up_correct": None,
        "follow_up_completed_at": None,
        "outcome": "pending_decision",
        "educational_link_clicked": False,
        "feedback_viewed_at": None,
        "created_at": now,
        "updated_at": now,
    }

    await safety_simulations(db).insert_one(sim_doc)

    return {
        "eligible": True,
        "duplicate": False,
        "retried": False,
        "simulation_id": simulation_id,
        "category_id": category_id,
        "level_number": sim_doc["level_number"],
        "status": send_result.get("status", "sent"),
        "parent_email": parent_email,
        "detail": send_result.get("detail", ""),
        "feedback_url": feedback_url,
    }


@router.post("/simulation/trigger-passed/{child_id}/{category_id}")
async def trigger_passed_level_simulation(child_id: str, category_id: str, request: Request) -> dict[str, Any]:
    """
    Triggers an educational simulation email for a level that was previously completed with >= 80%
    (e.g., passed before guardian email was verified or before SMTP was configured).
    Reuses the real recorded passing score and completion record.
    """
    check_student_authorization(request, child_id)
    category_id = category_id.strip().lower()
    if category_id not in LEVEL_TEMPLATES:
        raise HTTPException(status_code=400, detail=f"Invalid category '{category_id}'.")

    db = require_db()
    # Check recorded module state (collection in routes.py is module_state, payload in 'data')
    mod_doc = await module_state_coll(db).find_one({"module": "safety", "child_id": child_id})
    if not mod_doc and hasattr(db, "module_states"):
        mod_doc = await db.module_states.find_one({"module": "safety", "child_id": child_id})
    state_payload = (mod_doc.get("data") or mod_doc.get("state") or {}) if mod_doc else {}
    completed_cats = state_payload.get("completedCategories", [])
    scores = state_payload.get("categoryScores", {})
    recorded_score = scores.get(category_id)

    # Check existing simulation record
    existing_sim = await safety_simulations(db).find_one(
        {"child_id": child_id, "category_id": category_id}
    )

    if recorded_score is None and existing_sim:
        recorded_score = existing_sim.get("score")

    # If already marked as passed in completed_cats but score was not stored, default to passing 80%
    if recorded_score is None and category_id in completed_cats:
        recorded_score = 80

    if recorded_score is None:
        raise HTTPException(
            status_code=400,
            detail=f"Category '{category_id}' has not been completed with a verified score yet.",
        )

    if int(recorded_score) < 80:
        raise HTTPException(
            status_code=400,
            detail=f"Score {recorded_score}% is below the 80% passing threshold.",
        )

    # Reuse existing attempt_id if one already exists for this category, so we update it in-place
    attempt_id = existing_sim.get("attempt_id") if existing_sim else f"passed-{category_id}"

    trigger_in = SimulationTriggerIn(
        category_id=category_id,
        score=int(recorded_score),
        attempt_id=attempt_id,
        force_retry=True,
    )
    return await trigger_level_simulation(child_id, trigger_in, request)


@router.get("/simulation/status/{child_id}")
async def get_simulation_status(child_id: str, request: Request) -> dict[str, Any]:
    """
    Returns the simulation history and status for each of the six Scam Safety levels.
    """
    check_student_authorization(request, child_id)
    db = require_db()
    cursor = safety_simulations(db).find({"child_id": child_id}, {"_id": 0}).sort("created_at", -1)
    simulations = await cursor.to_list(length=100)

    # Group by category (keep latest attempt for each category)
    by_category: dict[str, Any] = {}
    for cat in LEVEL_TEMPLATES.keys():
        by_category[cat] = None

    for sim in simulations:
        cat = sim.get("category_id")
        if cat in by_category and by_category[cat] is None:
            by_category[cat] = sim

    return {
        "child_id": child_id,
        "by_category": by_category,
        "total_simulations": len(simulations),
        "history": simulations[:10],
        "smtp_configured": settings.is_smtp_configured,
        "smtp_summary": settings.smtp_status_summary,
    }


@router.get("/simulation/inbox/{child_id}")
async def get_simulated_inbox(child_id: str, request: Request) -> dict[str, Any]:
    """
    Returns the list of simulated scam and educational emails dispatched
    for the child to practice inspecting in the child-facing simulated inbox.
    """
    check_student_authorization(request, child_id)
    db = require_db()
    cursor = safety_simulations(db).find({"child_id": child_id}, {"_id": 0}).sort("created_at", -1)
    simulations = await cursor.to_list(length=100)

    inbox_items: list[dict[str, Any]] = []
    for sim in simulations:
        cat = sim.get("category_id", "phishing")
        tpl = LEVEL_TEMPLATES.get(cat, LEVEL_TEMPLATES["phishing"])

        sim_id = sim.get("simulation_id")
        feedback_url = f"{settings.frontend_origin}/safety/simulation-feedback?id={sim_id}"

        inbox_items.append({
            "simulation_id": sim_id,
            "category_id": cat,
            "level_number": sim.get("level_number", tpl["level_number"]),
            "level_title": tpl["title"],
            "title": tpl["title"],
            "scenario_id": sim.get("scenario_id", tpl.get("scenario_id")),
            "scenario_name": tpl.get("scenario_name", ""),
            "sender_name": sim.get("sender_name") or tpl.get("fictional_sender_name", "WiseCub Safety Lab"),
            "sender_email": sim.get("sender_email") or tpl.get("fictional_sender_email", "alerts@wisecub-safety.org"),
            "subject": sim.get("subject") or tpl["email_subject"],
            "preview": sim.get("preview") or tpl.get("preview", ""),
            "body": sim.get("simulated_body") or tpl["simulated_body"],
            "simulated_body": sim.get("simulated_body") or tpl["simulated_body"],
            "call_to_action": sim.get("call_to_action") or tpl.get("call_to_action", "View Link"),
            "display_link_text": sim.get("display_link_text") or tpl.get("display_link_text", "http://safety-check.wisecub.org"),
            "created_at": sim.get("created_at"),
            "inbox_opened": bool(sim.get("inbox_opened")),
            "initial_classification": sim.get("initial_classification", "unanswered"),
            "link_clicked": bool(sim.get("link_clicked") or sim.get("educational_link_clicked")),
            "reported_as_suspicious": bool(sim.get("reported_as_suspicious")),
            "debrief_viewed": bool(sim.get("debrief_viewed")),
            "follow_up_completed": bool(sim.get("follow_up_completed")),
            "follow_up_correct": sim.get("follow_up_correct"),
            "outcome": sim.get("outcome", "pending_decision"),
            "feedback_url": feedback_url,
        })

    unanswered = sum(1 for m in inbox_items if m["initial_classification"] == "unanswered")
    return {
        "child_id": child_id,
        "total": len(inbox_items),
        "total_messages": len(inbox_items),
        "unread_count": unanswered,
        "unanswered_count": unanswered,
        "items": inbox_items,
        "messages": inbox_items,
    }


@router.post("/simulation/event/{simulation_id}")
async def record_simulation_event(simulation_id: str, body: SimulationEventIn, request: Request) -> dict[str, Any]:
    """
    Records a granular decision event by the child:
    - 'open' / 'inbox_opened': Message was opened in simulated inbox.
    - 'link_clicked': Unsafe click on the simulated link. Navigates to debrief.
    - 'reported_suspicious': Child correctly identified and reported the email without clicking link.
    - 'marked_safe': Child classified the email as safe without clicking link.
    """
    db = require_db()
    sim = await safety_simulations(db).find_one({"simulation_id": simulation_id})
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation session not found.")

    sim_child_id = sim.get("child_id", "")
    if body.child_id and body.child_id != sim_child_id:
        raise HTTPException(status_code=403, detail="Child ID does not match simulation owner.")
    check_student_authorization(request, sim_child_id)

    now = datetime.now(timezone.utc).isoformat()
    event_type = body.event_type.strip().lower()

    if event_type in ("open", "inbox_opened"):
        if not sim.get("inbox_opened"):
            await safety_simulations(db).update_one(
                {"simulation_id": simulation_id},
                {"$set": {"inbox_opened": True, "inbox_opened_at": now, "updated_at": now}},
            )
        return {
            "ok": True,
            "simulation_id": simulation_id,
            "event": "inbox_opened",
            "event_type": "inbox_opened",
            "outcome": sim.get("outcome", "pending_decision"),
            "initial_classification": sim.get("initial_classification", "unanswered"),
            "link_clicked": bool(sim.get("link_clicked")),
            "reported_as_suspicious": bool(sim.get("reported_as_suspicious")),
        }

    elif event_type == "link_clicked":
        # Unsafe link click
        update_set: dict[str, Any] = {
            "link_clicked": True,
            "link_clicked_at": now,
            "educational_link_clicked": True,
            "feedback_viewed_at": now,
            "outcome": "unsafe_link_clicked",
            "updated_at": now,
        }
        initial_classification = sim.get("initial_classification")
        if not initial_classification or initial_classification == "unanswered":
            update_set["initial_classification"] = "clicked_unsafe_link"
            update_set["classification_submitted_at"] = now
            initial_classification = "clicked_unsafe_link"

        await safety_simulations(db).update_one(
            {"simulation_id": simulation_id},
            {"$set": update_set},
        )
        return {
            "ok": True,
            "simulation_id": simulation_id,
            "event": "link_clicked",
            "event_type": "link_clicked",
            "outcome": "unsafe_link_clicked",
            "initial_classification": initial_classification,
            "link_clicked": True,
            "reported_as_suspicious": bool(sim.get("reported_as_suspicious")),
            "redirect_url": f"/safety/simulation-feedback?id={simulation_id}",
            "feedback_url": f"{settings.frontend_origin}/safety/simulation-feedback?id={simulation_id}&decision=clicked",
        }

    elif event_type == "reported_suspicious":
        # Safe identification: child reported suspicious without clicking
        has_clicked = sim.get("link_clicked") or sim.get("educational_link_clicked")
        outcome = "unsafe_link_clicked" if has_clicked else "safely_reported"
        update_set = {
            "reported_as_suspicious": True,
            "reported_at": now,
            "initial_classification": "suspicious",
            "classification_submitted_at": now,
            "outcome": outcome,
            "updated_at": now,
        }
        await safety_simulations(db).update_one(
            {"simulation_id": simulation_id},
            {"$set": update_set},
        )
        return {
            "ok": True,
            "simulation_id": simulation_id,
            "event": "reported_suspicious",
            "event_type": "reported_suspicious",
            "outcome": outcome,
            "initial_classification": "suspicious",
            "link_clicked": bool(has_clicked),
            "reported_as_suspicious": True,
            "redirect_url": f"/safety/simulation-feedback?id={simulation_id}&action=reported",
            "feedback_url": f"{settings.frontend_origin}/safety/simulation-feedback?id={simulation_id}&decision=reported",
        }

    elif event_type == "marked_safe":
        # Child explicitly marked message as safe
        has_clicked = sim.get("link_clicked") or sim.get("educational_link_clicked")
        outcome = "unsafe_link_clicked" if has_clicked else "marked_safe"
        update_set = {
            "initial_classification": "safe",
            "classification_submitted_at": now,
            "outcome": outcome,
            "updated_at": now,
        }
        await safety_simulations(db).update_one(
            {"simulation_id": simulation_id},
            {"$set": update_set},
        )
        return {
            "ok": True,
            "simulation_id": simulation_id,
            "event": "marked_safe",
            "event_type": "marked_safe",
            "outcome": outcome,
            "initial_classification": "safe",
            "link_clicked": bool(has_clicked),
            "reported_as_suspicious": bool(sim.get("reported_as_suspicious")),
            "redirect_url": f"/safety/simulation-feedback?id={simulation_id}&action=marked_safe",
            "feedback_url": f"{settings.frontend_origin}/safety/simulation-feedback?id={simulation_id}&decision=safe",
        }

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported event type: '{event_type}'")


@router.post("/simulation/follow-up/{simulation_id}")
async def submit_simulation_follow_up(simulation_id: str, body: FollowUpIn, request: Request) -> dict[str, Any]:
    """
    Evaluates and records the child's response to the follow-up understanding check question.
    """
    db = require_db()
    sim = await safety_simulations(db).find_one({"simulation_id": simulation_id})
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation session not found.")

    sim_child_id = sim.get("child_id", "")
    if body.child_id and body.child_id != sim_child_id:
        raise HTTPException(status_code=403, detail="Child ID does not match simulation owner.")
    check_student_authorization(request, sim_child_id)

    cat = sim.get("category_id", "phishing")
    tpl = LEVEL_TEMPLATES.get(cat, LEVEL_TEMPLATES["phishing"])
    follow_up_data = tpl.get("follow_up")
    if not follow_up_data:
        raise HTTPException(status_code=400, detail="No follow-up check configured for this scenario.")

    correct_index = follow_up_data["correct_index"]
    is_correct = (body.selected_index == correct_index)
    now = datetime.now(timezone.utc).isoformat()

    await safety_simulations(db).update_one(
        {"simulation_id": simulation_id},
        {
            "$set": {
                "follow_up_completed": True,
                "follow_up_selected_index": body.selected_index,
                "follow_up_correct": is_correct,
                "follow_up_completed_at": now,
                "debrief_viewed": True,
                "debrief_viewed_at": sim.get("debrief_viewed_at") or now,
                "updated_at": now,
            }
        },
    )

    return {
        "ok": True,
        "simulation_id": simulation_id,
        "selected_index": body.selected_index,
        "correct_index": correct_index,
        "is_correct": is_correct,
        "explanation": follow_up_data["explanation"],
        "learning_goal": tpl["learning_goal"],
    }


@router.get("/simulation/feedback/{simulation_id}")
async def get_simulation_feedback(simulation_id: str, request: Request) -> dict[str, Any]:
    """
    Safe educational destination for parents/children clicking the simulation email link or debrief.
    Records debrief viewing and returns the scenario breakdown, red flags, and follow-up question.
    Does NOT collect credentials, passwords, or personal financial details.
    """
    db = require_db()
    doc = await safety_simulations(db).find_one({"simulation_id": simulation_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Educational simulation session not found.")

    check_student_authorization(request, doc.get("child_id", ""))

    is_scanner = is_scanner_request(request)
    now = datetime.now(timezone.utc).isoformat()
    update_fields: dict[str, Any] = {}

    if not is_scanner:
        if not doc.get("debrief_viewed"):
            update_fields["debrief_viewed"] = True
            update_fields["debrief_viewed_at"] = now
            doc["debrief_viewed"] = True
            doc["debrief_viewed_at"] = now

        # When arriving directly at the feedback link (e.g. from real email link) without prior report:
        if not doc.get("reported_as_suspicious") and not doc.get("link_clicked"):
            update_fields["educational_link_clicked"] = True
            update_fields["link_clicked"] = True
            update_fields["link_clicked_at"] = now
            update_fields["clicked_at"] = now
            if not doc.get("initial_classification") or doc.get("initial_classification") == "unanswered":
                update_fields["initial_classification"] = "clicked_unsafe_link"
            update_fields["outcome"] = "unsafe_link_clicked"
            doc["educational_link_clicked"] = True
            doc["link_clicked"] = True
            doc["outcome"] = "unsafe_link_clicked"

        if update_fields:
            update_fields["updated_at"] = now
            await safety_simulations(db).update_one(
                {"simulation_id": simulation_id},
                {"$set": update_fields},
            )

    category_id = doc.get("category_id", "phishing")
    template = LEVEL_TEMPLATES.get(category_id, LEVEL_TEMPLATES["phishing"])

    return {
        "simulation_id": simulation_id,
        "category_id": category_id,
        "level_title": template["title"],
        "scenario_name": template["scenario_name"],
        "sender_name": doc.get("sender_name") or template.get("fictional_sender_name", "WiseCub Safety Lab"),
        "sender_email": doc.get("sender_email") or template.get("fictional_sender_email", "alerts@wisecub-safety.org"),
        "call_to_action": doc.get("call_to_action") or template.get("call_to_action", "View Link"),
        "display_link_text": doc.get("display_link_text") or template.get("display_link_text", "http://safety-check.wisecub.org"),
        "simulated_body": doc.get("simulated_body") or template["simulated_body"],
        "red_flags": template["red_flags"],
        "learning_goal": template["learning_goal"],
        "score": doc.get("score"),
        "created_at": doc.get("created_at"),
        "link_clicked": bool(doc.get("link_clicked") or doc.get("educational_link_clicked")),
        "educational_link_clicked": bool(doc.get("educational_link_clicked") or doc.get("link_clicked")),
        "reported_as_suspicious": bool(doc.get("reported_as_suspicious")),
        "initial_classification": doc.get("initial_classification", "unanswered"),
        "outcome": doc.get("outcome", "pending_decision"),
        "follow_up": template.get("follow_up"),
        "follow_up_completed": bool(doc.get("follow_up_completed")),
        "follow_up_correct": doc.get("follow_up_correct"),
        "follow_up_selected_index": doc.get("follow_up_selected_index"),
    }


@router.get("/simulation/metrics/{child_id}")
async def get_simulation_learning_metrics(child_id: str, request: Request) -> dict[str, Any]:
    """
    Returns aggregated learning metrics for the parent/guardian dashboard:
    - Total attempts, correctly reported, unsafe link clicks, safe classifications
    - Debrief completion rate, follow-up accuracy
    - Per-level breakdown across the six curriculum levels
    """
    check_student_authorization(request, child_id)
    db = require_db()
    cursor = safety_simulations(db).find({"child_id": child_id}, {"_id": 0}).sort("created_at", -1)
    simulations = await cursor.to_list(length=200)

    total = len(simulations)
    unsafe_clicks = 0
    correctly_reported = 0
    marked_safe = 0
    debrief_completed = 0
    follow_up_completed = 0
    follow_up_correct = 0

    by_level: dict[str, dict[str, Any]] = {}
    for cat in LEVEL_TEMPLATES.keys():
        by_level[cat] = {
            "category_id": cat,
            "title": LEVEL_TEMPLATES[cat]["title"],
            "level_number": LEVEL_TEMPLATES[cat]["level_number"],
            "attempts": 0,
            "correctly_reported": 0,
            "unsafe_clicks": 0,
            "debrief_completed": 0,
            "latest_outcome": None,
        }

    for s in simulations:
        cat = s.get("category_id")
        if cat in by_level:
            by_level[cat]["attempts"] += 1
            if by_level[cat]["latest_outcome"] is None:
                by_level[cat]["latest_outcome"] = s.get("outcome", "pending_decision")

        if s.get("link_clicked") or s.get("educational_link_clicked"):
            unsafe_clicks += 1
            if cat in by_level:
                by_level[cat]["unsafe_clicks"] += 1

        if s.get("reported_as_suspicious") and not (s.get("link_clicked") or s.get("educational_link_clicked")):
            correctly_reported += 1
            if cat in by_level:
                by_level[cat]["correctly_reported"] += 1

        if s.get("initial_classification") == "safe" and not s.get("reported_as_suspicious"):
            marked_safe += 1

        if s.get("debrief_viewed") or s.get("educational_link_clicked"):
            debrief_completed += 1
            if cat in by_level:
                by_level[cat]["debrief_completed"] += 1

        if s.get("follow_up_completed"):
            follow_up_completed += 1
            if s.get("follow_up_correct"):
                follow_up_correct += 1

    decided = correctly_reported + unsafe_clicks + marked_safe
    recognition_rate = round((correctly_reported / max(1, decided)) * 100, 1) if decided > 0 else 0.0
    avoidance_rate = round(((total - unsafe_clicks) / max(1, total)) * 100, 1) if total > 0 else 100.0
    follow_up_accuracy = round((follow_up_correct / max(1, follow_up_completed)) * 100, 1) if follow_up_completed > 0 else 0.0
    debrief_rate = round((debrief_completed / max(1, total)) * 100, 1) if total > 0 else 0.0

    return {
        "child_id": child_id,
        "total_simulations": total,
        "completed_decisions": decided,
        "pending_decisions": total - decided,
        "correctly_reported_count": correctly_reported,
        "unsafe_clicks_count": unsafe_clicks,
        "marked_safe_count": marked_safe,
        "suspicious_recognition_rate": recognition_rate,
        "safe_avoidance_rate": avoidance_rate,
        "debrief_completion_count": debrief_completed,
        "debrief_completion_rate": debrief_rate,
        "follow_up_completed_count": follow_up_completed,
        "follow_up_correct_count": follow_up_correct,
        "follow_up_accuracy": follow_up_accuracy,
        "by_level": by_level,
        "recent_attempts": simulations[:15],
    }
