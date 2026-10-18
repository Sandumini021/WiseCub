from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.config import settings
from app.database.mongo import get_db, ping_db

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
    email: str = Field(min_length=3, max_length=120)
    age: str = Field(min_length=1, max_length=8)
    gender: str = Field(min_length=1, max_length=24)
    avatar_id: str = Field(default="kid-sky", max_length=40)
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


@router.put("/api/accounts/{child_id}")
async def save_account(child_id: str, body: AccountIn) -> dict[str, Any]:
    db = require_db()
    doc = {
        "child_id": child_id,
        "name": body.name.strip(),
        "email": body.email.strip().lower(),
        "age": body.age.strip(),
        "gender": body.gender.strip(),
        "avatar_id": body.avatar_id.strip() or "kid-sky",
        "entered_at": body.entered_at or datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.accounts.update_one({"child_id": child_id}, {"$set": doc}, upsert=True)
    return doc


@router.get("/api/accounts/search")
async def search_account(email: str) -> dict[str, Any]:
    db = require_db()
    doc = await db.accounts.find_one({"email": email.strip().lower()}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Account not found.")
    return doc


@router.get("/api/accounts/{child_id}")
async def read_account(child_id: str) -> dict[str, Any]:
    db = require_db()
    doc = await db.accounts.find_one({"child_id": child_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Account not found.")
    return doc


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
