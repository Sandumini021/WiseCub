from app.modules.cub_intent.routes import can_open_route, resolve_intent_route


def test_dataset_home_is_not_splash():
    result = resolve_intent_route("OPEN_HOME", "student")
    assert result["suggested_route"] == "/student/dashboard"


def test_dataset_portfolio_is_market_portfolio():
    result = resolve_intent_route("OPEN_PORTFOLIO", "student")
    assert result["suggested_route"] == "/market/portfolio"


def test_student_cannot_open_teacher_or_guardian_pages():
    blocked = resolve_intent_route("OPEN_TEACHER_CLASSES", "student")
    assert blocked["navigation_blocked"] is True
    assert blocked["suggested_route"] == "/student/dashboard"
    quizzes = resolve_intent_route("OPEN_QUIZZES", "student")
    assert quizzes["suggested_route"] is None
    guardian = resolve_intent_route("OPEN_GUARDIAN_PROGRESS", "student")
    assert guardian["navigation_blocked"] is True


def test_teacher_quizzes_use_existing_route():
    result = resolve_intent_route("OPEN_QUIZZES", "teacher")
    assert result["suggested_route"] == "/teacher/quizzes"
    assert can_open_route("teacher", "/teacher/quizzes") is True


def test_explain_intents_do_not_navigate():
    result = resolve_intent_route("EXPLAIN_SHARE", "student")
    assert result["suggested_route"] is None


def test_buy_how_to_opens_terminal():
    result = resolve_intent_route("HOW_TO_BUY", "student")
    assert result["suggested_route"] == "/market/terminal"
    assert result["navigation_blocked"] is False
