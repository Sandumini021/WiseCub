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

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.config import settings
from app.database.mongo import get_db
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


# ─────────────────────────────────────────────────────────────────────────────
#  GUARDIAN CONTACT & CONSENT ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────


@router.get("/guardian/{child_id}")
async def get_guardian_details(child_id: str) -> dict[str, Any]:
    """
    Returns the saved guardian details and consent status for the given child.
    """
    db = require_db()
    doc = await db.guardian_consent.find_one({"child_id": child_id}, {"_id": 0})
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
async def save_guardian_details(child_id: str, body: GuardianIn) -> dict[str, Any]:
    """
    Saves or updates parent/guardian contact details and consent for a child.
    Validates name and email address format.
    Generates a secure verification token for pending email verification.
    """
    name = body.parent_name.strip()
    email = body.email.strip().lower()

    if not name or len(name) < 2:
        raise HTTPException(status_code=400, detail="Please provide the parent or guardian's full name.")

    if not EMAIL_REGEX.match(email):
        raise HTTPException(status_code=400, detail="Please enter a valid parent/guardian email address.")

    db = require_db()
    existing = await db.guardian_consent.find_one({"child_id": child_id})

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

    await db.guardian_consent.update_one(
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
    doc = await db.guardian_consent.find_one({"child_id": child_id})
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
    await db.guardian_consent.update_one(
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
async def update_guardian_consent(child_id: str, body: ConsentUpdateIn) -> dict[str, Any]:
    """
    Updates or withdraws consent, or toggles future simulation emails.
    """
    db = require_db()
    doc = await db.guardian_consent.find_one({"child_id": child_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Guardian details not found for this child.")

    now = datetime.now(timezone.utc).isoformat()
    await db.guardian_consent.update_one(
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
async def trigger_level_simulation(child_id: str, body: SimulationTriggerIn) -> dict[str, Any]:
    """
    Triggers an educational scam simulation email for one of the six completed levels.
    Enforces all strict safety and consent requirements:
    1. Category must be one of the six approved Scam Safety categories.
    2. Score must be >= 80% (must pass).
    3. Guardian must be registered, verified, and consent active.
    4. Server-side idempotency: prevents duplicate sends for the same attempt.
    """
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
    guardian = await db.guardian_consent.find_one({"child_id": child_id})
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
    existing_attempt = await db.safety_simulations.find_one(
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
        update_fields = {
            "status": send_result["status"],
            "detail": send_result["detail"],
            "subject": send_result.get("subject", ""),
            "parent_email": parent_email,
            "parent_name": parent_name,
            "score": body.score,
            "updated_at": now,
        }
        await db.safety_simulations.update_one(
            {"child_id": child_id, "category_id": category_id, "attempt_id": attempt_id},
            {"$set": update_fields},
        )

        return {
            "eligible": True,
            "duplicate": False,
            "retried": True,
            "simulation_id": simulation_id,
            "category_id": category_id,
            "level_number": existing_attempt.get("level_number", LEVEL_TEMPLATES[category_id]["level_number"]),
            "status": send_result["status"],
            "parent_email": parent_email,
            "detail": send_result["detail"],
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
    sim_doc = {
        "simulation_id": simulation_id,
        "child_id": child_id,
        "category_id": category_id,
        "level_number": LEVEL_TEMPLATES[category_id]["level_number"],
        "attempt_id": attempt_id,
        "score": body.score,
        "passed": True,
        "parent_email": parent_email,
        "parent_name": parent_name,
        "status": send_result["status"],  # "sent", "not_configured", or "failed"
        "detail": send_result["detail"],
        "subject": send_result.get("subject", ""),
        "feedback_url": feedback_url,
        "red_flags_identified": body.red_flags_identified,
        "educational_link_clicked": False,
        "feedback_viewed_at": None,
        "created_at": now,
        "updated_at": now,
    }

    await db.safety_simulations.insert_one(sim_doc)

    return {
        "eligible": True,
        "duplicate": False,
        "retried": False,
        "simulation_id": simulation_id,
        "category_id": category_id,
        "level_number": sim_doc["level_number"],
        "status": send_result["status"],
        "parent_email": parent_email,
        "detail": send_result["detail"],
        "feedback_url": feedback_url,
    }


@router.post("/simulation/trigger-passed/{child_id}/{category_id}")
async def trigger_passed_level_simulation(child_id: str, category_id: str) -> dict[str, Any]:
    """
    Triggers an educational simulation email for a level that was previously completed with >= 80%
    (e.g., passed before guardian email was verified or before SMTP was configured).
    Reuses the real recorded passing score and completion record.
    """
    category_id = category_id.strip().lower()
    if category_id not in LEVEL_TEMPLATES:
        raise HTTPException(status_code=400, detail=f"Invalid category '{category_id}'.")

    db = require_db()
    # Check recorded module state (collection in routes.py is module_state, payload in 'data')
    mod_doc = await db.module_state.find_one({"module": "safety", "child_id": child_id})
    if not mod_doc and hasattr(db, "module_states"):
        mod_doc = await db.module_states.find_one({"module": "safety", "child_id": child_id})
    state_payload = (mod_doc.get("data") or mod_doc.get("state") or {}) if mod_doc else {}
    completed_cats = state_payload.get("completedCategories", [])
    scores = state_payload.get("categoryScores", {})
    recorded_score = scores.get(category_id)

    # Check existing simulation record
    existing_sim = await db.safety_simulations.find_one(
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
    return await trigger_level_simulation(child_id, trigger_in)


@router.get("/simulation/status/{child_id}")
async def get_simulation_status(child_id: str) -> dict[str, Any]:
    """
    Returns the simulation history and status for each of the six Scam Safety levels.
    """
    db = require_db()
    cursor = db.safety_simulations.find({"child_id": child_id}, {"_id": 0}).sort("created_at", -1)
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


@router.get("/simulation/feedback/{simulation_id}")
async def get_simulation_feedback(simulation_id: str) -> dict[str, Any]:
    """
    Safe educational destination for parents/children clicking the simulation email link.
    Records that the educational link was clicked and returns the educational debrief.
    Does NOT collect credentials, passwords, or personal financial details.
    """
    db = require_db()
    doc = await db.safety_simulations.find_one({"simulation_id": simulation_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Educational simulation session not found.")

    now = datetime.now(timezone.utc).isoformat()
    if not doc.get("educational_link_clicked"):
        await db.safety_simulations.update_one(
            {"simulation_id": simulation_id},
            {
                "$set": {
                    "educational_link_clicked": True,
                    "feedback_viewed_at": now,
                    "updated_at": now,
                }
            },
        )
        doc["educational_link_clicked"] = True
        doc["feedback_viewed_at"] = now

    category_id = doc.get("category_id", "phishing")
    template = LEVEL_TEMPLATES.get(category_id, LEVEL_TEMPLATES["phishing"])

    return {
        "simulation_id": simulation_id,
        "category_id": category_id,
        "level_title": template["title"],
        "scenario_name": template["scenario_name"],
        "simulated_body": template["simulated_body"],
        "red_flags": template["red_flags"],
        "learning_goal": template["learning_goal"],
        "score": doc.get("score"),
        "created_at": doc.get("created_at"),
        "educational_link_clicked": doc.get("educational_link_clicked"),
    }
