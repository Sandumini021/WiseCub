from __future__ import annotations

import re

ALLOWED_ROLES = ("student", "teacher", "guardian")

CUB_ROUTE_ALLOWLIST = frozenset(
    {
        "/student/dashboard",
        "/home",
        "/market",
        "/market/lessons/1",
        "/market/lessons/2",
        "/market/lessons/3",
        "/market/lessons/4",
        "/market/terminal",
        "/market/confirm",
        "/market/portfolio",
        "/choices",
        "/missions",
        "/safety",
        "/progress",
        "/profile",
        "/teacher/dashboard",
        "/teacher/classes",
        "/teacher/students",
        "/teacher/quizzes",
        "/teacher/assignments",
        "/teacher/reports",
        "/guardian/dashboard",
        "/guardian/children",
        "/guardian/progress",
        "/guardian/quizzes",
        "/guardian/tips",
    }
)

# Dataset routes that must never be used as-is.
DATASET_ROUTE_CORRECTIONS = {
    "/": None,
    "/portfolio": "/market/portfolio",
    "/quizzes": None,
}

INTENT_APP_ROUTES: dict[str, str | None] = {
    "ASK_ABOUT_NEEDS_WANTS": None,
    "ASK_ABOUT_SAVING": None,
    "ASK_FOR_HELP": None,
    "CHANGE_LANGUAGE_ENGLISH": None,
    "CHANGE_LANGUAGE_SINHALA": None,
    "EXPLAIN_BUDGETING": None,
    "EXPLAIN_CURRENT_PAGE": None,
    "EXPLAIN_DIVERSIFICATION": None,
    "EXPLAIN_RISK": None,
    "EXPLAIN_SHARE": None,
    "OPEN_DECISION_MAKING": "/choices",
    "OPEN_GAMIFIED_LEARNING": "/missions",
    "OPEN_GUARDIAN_PROGRESS": "/guardian/progress",
    "OPEN_HOME": None,
    "OPEN_PORTFOLIO": "/market/portfolio",
    "OPEN_QUIZZES": None,
    "OPEN_SCAM_SAFETY": "/safety",
    "OPEN_STOCK_MARKET": "/market",
    "OPEN_TEACHER_CLASSES": "/teacher/classes",
    "OUT_OF_SCOPE": None,
}


def is_allowed_cub_route(path: str) -> bool:
    if path in CUB_ROUTE_ALLOWLIST:
        return True
    return bool(re.fullmatch(r"/market/lessons/\d+", path))


def home_path_for_role(role: str | None) -> str:
    if role == "teacher":
        return "/teacher/dashboard"
    if role == "guardian":
        return "/guardian/dashboard"
    return "/student/dashboard"


def can_open_route(role: str | None, path: str) -> bool:
    if not is_allowed_cub_route(path):
        return False
    current = role if role in ALLOWED_ROLES else "student"
    if path.startswith("/teacher") and current != "teacher":
        return False
    if path.startswith("/guardian") and current != "guardian":
        return False
    if path in {"/student/dashboard", "/home"} and current != "student":
        return False
    return True


def should_warn_before_leave(from_path: str, to_path: str) -> bool:
    return from_path == "/market/confirm" and to_path != "/market/confirm"


def quizzes_path_for_role(role: str | None) -> str | None:
    if role == "teacher":
        return "/teacher/quizzes"
    if role == "guardian":
        return "/guardian/quizzes"
    return None


def resolve_intent_route(intent: str, role: str | None, from_path: str = "") -> dict[str, object]:
    if intent == "OPEN_HOME":
        path = home_path_for_role(role)
    elif intent == "OPEN_QUIZZES":
        path = quizzes_path_for_role(role)
    else:
        path = INTENT_APP_ROUTES.get(intent)

    if path is None:
        return {
            "suggested_route": None,
            "navigation_blocked": False,
            "blocked_reason": None,
            "needs_confirm": False,
        }

    if not can_open_route(role, path):
        return {
            "suggested_route": home_path_for_role(role),
            "navigation_blocked": True,
            "blocked_reason": "role_or_allowlist",
            "needs_confirm": False,
        }

    warn = should_warn_before_leave(from_path, path)
    return {
        "suggested_route": path,
        "navigation_blocked": False,
        "blocked_reason": None,
        "needs_confirm": warn,
    }
