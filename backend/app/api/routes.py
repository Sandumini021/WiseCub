from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.core.config import settings
from app.database.mongo import get_db, ping_db
from app.modules.accounts.router import current_account
from app.modules.accounts.security import public_account

router = APIRouter()

ALLOWED_MODULES = {
    "child",
    "market",
    "choices",
    "missions",
    "safety",
    "progress",
}


class ChildIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    entered_at: str | None = None


class AccountIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: str = Field(default="", max_length=120)
    username: str = Field(default="", max_length=32)
    role: str = Field(default="student", max_length=24)
    age: str = Field(default="", max_length=8)
    gender: str = Field(default="", max_length=24)
    avatar_id: str = Field(default="", max_length=40)
    language: str = Field(default="en", max_length=8)
    class_code: str = Field(default="", max_length=24)
    institution: str = Field(default="", max_length=120)
    entered_at: str | None = None


class StateIn(BaseModel):
    data: dict[str, Any]


def require_db():
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="MongoDB is not connected.")
    return db


@router.get("/health")
async def health() -> dict[str, str]:
    connected = await ping_db()
    return {
        "status": "ok",
        "service": "wisecub",
        "database": "connected" if connected else "down",
        "db_name": settings.mongodb_db,
    }


@router.put("/api/children/{child_id}")
async def save_child(child_id: str, body: ChildIn) -> dict[str, Any]:
    db = require_db()
    doc = {
        "child_id": child_id,
        "name": body.name.strip(),
        "entered_at": body.entered_at or datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.children.update_one({"child_id": child_id}, {"$set": doc}, upsert=True)
    return doc


def _username_suggestions(base: str) -> list[str]:
    clean = "".join(ch for ch in base.lower() if ch.isalnum() or ch == "_")[:16] or "cub"
    return [f"{clean}{n}" for n in (2, 12, 16, 24)]


@router.get("/api/accounts/username-check")
async def username_check(username: str) -> dict[str, Any]:
    db = require_db()
    key = username.strip().lower()
    if len(key) < 3:
        return {"taken": False, "valid": False, "suggestions": []}
    existing = await db.accounts.find_one({"username": key}, {"_id": 1})
    if not existing:
        return {"taken": False, "valid": True, "suggestions": []}
    return {"taken": True, "valid": True, "suggestions": _username_suggestions(key)}


@router.put("/api/accounts/{child_id}")
async def save_account(request: Request, child_id: str, body: AccountIn) -> dict[str, Any]:
    db = require_db()
    account = await current_account(request)
    if account["child_id"] != child_id:
        raise HTTPException(status_code=403, detail="You can only update your own account.")
    role = account.get("role") or "student"
    updates = {
        "name": body.name.strip(),
        "age": body.age.strip() if role == "student" else account.get("age", ""),
        "gender": body.gender.strip(),
        "avatar_id": body.avatar_id.strip() if role == "student" else account.get("avatar_id", ""),
        "language": body.language.strip() or "en",
        "class_code": body.class_code.strip() if role == "student" else account.get("class_code", ""),
        "institution": body.institution.strip() if role == "teacher" else account.get("institution", ""),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.accounts.update_one({"child_id": child_id}, {"$set": updates})
    fresh = await db.accounts.find_one({"child_id": child_id})
    return public_account(fresh) or {}


@router.get("/api/accounts/search")
async def search_account() -> dict[str, Any]:
    raise HTTPException(status_code=401, detail="Use /api/login instead of searching accounts.")


@router.get("/api/accounts/{child_id}")
async def read_account(request: Request, child_id: str) -> dict[str, Any]:
    account = await current_account(request)
    if account["child_id"] != child_id:
        raise HTTPException(status_code=403, detail="You can only open your own account.")
    return account


@router.get("/api/children/{child_id}")
async def read_child(child_id: str) -> dict[str, Any]:
    db = require_db()
    doc = await db.children.find_one({"child_id": child_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Child not found.")
    return doc


@router.put("/api/state/{child_id}/{module}")
async def save_state(child_id: str, module: str, body: StateIn) -> dict[str, Any]:
    if module not in ALLOWED_MODULES:
        raise HTTPException(status_code=400, detail="Unknown module.")
    db = require_db()
    doc = {
        "child_id": child_id,
        "module": module,
        "data": body.data,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.module_state.update_one(
        {"child_id": child_id, "module": module},
        {"$set": doc},
        upsert=True,
    )
    return {"ok": True, "child_id": child_id, "module": module}


@router.get("/api/state/{child_id}/{module}")
async def read_state(child_id: str, module: str) -> dict[str, Any]:
    if module not in ALLOWED_MODULES:
        raise HTTPException(status_code=400, detail="Unknown module.")
    db = require_db()
    doc = await db.module_state.find_one(
        {"child_id": child_id, "module": module},
        {"_id": 0},
    )
    if not doc:
        raise HTTPException(status_code=404, detail="No saved state yet.")
    return doc
