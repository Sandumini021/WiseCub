from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt

from app.core.config import settings

COOKIE_NAME = "wisecub_session"
GENERIC_LOGIN_ERROR = "Username or password is wrong."
ALLOWED_ROLES = {"student", "teacher", "guardian"}
HIDDEN_FIELDS = {"password_hash", "_id"}


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    if not hashed:
        return False
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def public_account(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    if not doc:
        return None
    return {key: value for key, value in doc.items() if key not in HIDDEN_FIELDS}


def issue_token(child_id: str, role: str, remember: bool) -> str:
    hours = 24 * 7 if remember else 12
    now = datetime.now(timezone.utc)
    payload = {
        "sub": child_id,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=hours)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def read_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def cookie_max_age(remember: bool) -> int:
    return 60 * 60 * 24 * 7 if remember else 60 * 60 * 12
