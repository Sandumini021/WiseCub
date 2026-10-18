from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, Field

from app.database.mongo import get_db
from app.modules.accounts.security import (
    ALLOWED_ROLES,
    COOKIE_NAME,
    GENERIC_LOGIN_ERROR,
    cookie_max_age,
    hash_password,
    issue_token,
    public_account,
    read_token,
    verify_password,
)

router = APIRouter()


class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=6, max_length=128)
    role: str = Field(default="student", max_length=24)
    email: str = Field(default="", max_length=120)
    age: str = Field(default="", max_length=8)
    gender: str = Field(default="", max_length=24)
    avatar_id: str = Field(default="", max_length=40)
    language: str = Field(default="en", max_length=8)
    class_code: str = Field(default="", max_length=24)
    institution: str = Field(default="", max_length=120)


class LoginIn(BaseModel):
    identifier: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=1, max_length=128)
    remember: bool = False


class MePatch(BaseModel):
    name: str | None = Field(default=None, max_length=80)
    avatar_id: str | None = Field(default=None, max_length=40)
    language: str | None = Field(default=None, max_length=8)
    class_code: str | None = Field(default=None, max_length=24)
    institution: str | None = Field(default=None, max_length=120)
    age: str | None = Field(default=None, max_length=8)


def require_db():
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="MongoDB is not connected.")
    return db


def _username_suggestions(base: str) -> list[str]:
    clean = "".join(ch for ch in base.lower() if ch.isalnum() or ch == "_")[:16] or "cub"
    return [f"{clean}{n}" for n in (2, 12, 16, 24)]


def _normalize_username(value: str) -> str:
    return "".join(ch for ch in value.strip().lower() if ch.isalnum() or ch == "_")


def _set_session(response: Response, child_id: str, role: str, remember: bool) -> None:
    token = issue_token(child_id, role, remember)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=cookie_max_age(remember),
        path="/",
    )


async def current_account(request: Request) -> dict[str, Any]:
    db = require_db()
    token = request.cookies.get(COOKIE_NAME)
    payload = read_token(token or "")
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Please log in.")
    doc = await db.accounts.find_one({"child_id": payload["sub"]})
    if not doc:
        raise HTTPException(status_code=401, detail="Please log in.")
    public = public_account(doc)
    if public is None:
        raise HTTPException(status_code=401, detail="Please log in.")
    return public


@router.post("/api/register")
async def register(body: RegisterIn, response: Response) -> dict[str, Any]:
    db = require_db()
    role = body.role.strip().lower() or "student"
    if role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Unknown role.")
    username = _normalize_username(body.username)
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Choose a username with at least 3 letters or numbers.")
    email = body.email.strip().lower() if role != "student" else ""
    if role != "student" and ("@" not in email or len(email) < 5):
        raise HTTPException(status_code=400, detail="Teachers and guardians need an email.")
    if await db.accounts.find_one({"username": username}, {"_id": 1}):
        raise HTTPException(
            status_code=409,
            detail={
                "message": "That username is already in use.",
                "suggestions": _username_suggestions(username),
            },
        )
    if email and await db.accounts.find_one({"email": email}, {"_id": 1}):
        raise HTTPException(status_code=409, detail="That email is already in use.")
    now = datetime.now(timezone.utc).isoformat()
    child_id = str(uuid4())
    doc = {
        "child_id": child_id,
        "name": body.name.strip(),
        "email": email,
        "username": username,
        "role": role,
        "age": body.age.strip() if role == "student" else "",
        "gender": body.gender.strip(),
        "avatar_id": body.avatar_id.strip() if role == "student" else "",
        "language": body.language.strip() or "en",
        "class_code": body.class_code.strip() if role == "student" else "",
        "institution": body.institution.strip() if role == "teacher" else "",
        "password_hash": hash_password(body.password),
        "demo": True,
        "entered_at": now,
        "updated_at": now,
    }
    await db.accounts.insert_one(doc)
    await db.children.update_one(
        {"child_id": child_id},
        {
            "$set": {
                "child_id": child_id,
                "name": doc["name"],
                "entered_at": now,
                "updated_at": now,
            }
        },
        upsert=True,
    )
    _set_session(response, child_id, role, remember=False)
    return public_account(doc) or {}


@router.post("/api/login")
async def login(body: LoginIn, response: Response) -> dict[str, Any]:
    db = require_db()
    raw = body.identifier.strip()
    if "@" in raw:
        query: dict[str, Any] = {"email": raw.lower()}
    else:
        query = {"username": _normalize_username(raw)}
    doc = await db.accounts.find_one(query)
    hashed = (doc or {}).get("password_hash") or ""
    if not doc or not verify_password(body.password, hashed):
        raise HTTPException(status_code=401, detail=GENERIC_LOGIN_ERROR)
    public = public_account(doc) or {}
    _set_session(response, public["child_id"], public.get("role") or "student", body.remember)
    return public


@router.post("/api/logout")
async def logout(response: Response) -> dict[str, bool]:
    response.delete_cookie(COOKIE_NAME, path="/")
    return {"ok": True}


@router.get("/api/me")
async def me(request: Request) -> dict[str, Any]:
    return await current_account(request)


@router.patch("/api/me")
async def patch_me(request: Request, body: MePatch) -> dict[str, Any]:
    db = require_db()
    account = await current_account(request)
    updates: dict[str, Any] = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if body.name is not None and body.name.strip():
        updates["name"] = body.name.strip()
    if body.avatar_id is not None and account.get("role") == "student":
        updates["avatar_id"] = body.avatar_id.strip()
    if body.language is not None:
        updates["language"] = body.language.strip() or "en"
    if body.class_code is not None and account.get("role") == "student":
        updates["class_code"] = body.class_code.strip()
    if body.institution is not None and account.get("role") == "teacher":
        updates["institution"] = body.institution.strip()
    if body.age is not None and account.get("role") == "student":
        updates["age"] = body.age.strip()
    await db.accounts.update_one({"child_id": account["child_id"]}, {"$set": updates})
    if "name" in updates:
        await db.children.update_one(
            {"child_id": account["child_id"]},
            {"$set": {"name": updates["name"], "updated_at": updates["updated_at"]}},
        )
    fresh = await db.accounts.find_one({"child_id": account["child_id"]})
    return public_account(fresh) or {}
