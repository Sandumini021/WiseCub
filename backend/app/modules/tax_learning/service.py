from __future__ import annotations

from decimal import Decimal

from fastapi import HTTPException

from app.modules.tax_learning.calculator import calculate, money
from app.modules.tax_learning.content import QUIZ
from app.modules.tax_learning.rules import get_rule, public_rule, rule_is_current


ALLOWED_KINDS = {"tutoring", "employment", "business", "savings_interest"}


def run_calculate(rule_id: str, income: str, income_kind: str, allow_expired: bool) -> dict:
    rule = get_rule(rule_id)
    if rule is None:
        raise HTTPException(status_code=404, detail="Unknown tax-rule configuration.")
    kind = income_kind if income_kind in ALLOWED_KINDS else "employment"
    if rule["mode"] == "verified" and not rule_is_current(rule) and not allow_expired:
        raise HTTPException(
            status_code=409,
            detail=(
                "This official configuration is for YA 2025/2026 only (ended 31 Mar 2026). "
                "Turn on ‘show historical YA 2025/2026’ or use the hypothetical practice rule."
            ),
        )
    try:
        result = calculate(rule, income, income_kind=kind)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    result["rule"] = public_rule(rule)
    return result


def grade_question(question_id: str, choice: str | None, amount: str | None) -> dict:
    item = next((row for row in QUIZ if row["id"] == question_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail="Unknown question.")
    if item["kind"] == "mcq":
        ok = choice == item["correct"]
        return {
            "ok": ok,
            "correct": item["correct"],
            "points": item["points"] if ok else 0,
            "hint": "Try another yellow card." if not ok else "Cub: nice noticing.",
        }
    rule = get_rule(str(item["rule_id"]))
    if rule is None:
        raise HTTPException(status_code=404, detail="Missing tax-rule configuration.")
    expected = Decimal(calculate(rule, str(item["income"]), income_kind=str(item["income_kind"]))["tax_payable"])
    try:
        given = money(amount or "")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    ok = given == expected
    return {
        "ok": ok,
        "correct_amount": str(expected),
        "points": item["points"] if ok else 0,
        "hint": f"Estimated tax is Rs {expected} with the practice rule." if not ok else "Cub: the relief ate the whole amount.",
    }
