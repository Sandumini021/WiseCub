from datetime import date
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.tax_learning.calculator import calculate
from app.modules.tax_learning.rules import LK_PIT_2025_2026, PRACTICE_SIMPLE, public_rule

client = TestClient(app)


def test_zero_income():
    result = calculate(PRACTICE_SIMPLE, 0)
    assert result["tax_payable"] == "0.00"
    assert result["taxable_income"] == "0.00"
    assert result["mode"] == "hypothetical"


def test_below_practice_relief():
    result = calculate(PRACTICE_SIMPLE, "40000")
    assert result["taxable_income"] == "0.00"
    assert result["tax_payable"] == "0.00"
    assert result["relief_used"] == "40000.00"


def test_exactly_at_practice_relief():
    result = calculate(PRACTICE_SIMPLE, "50000")
    assert result["taxable_income"] == "0.00"
    assert result["tax_payable"] == "0.00"


def test_just_above_practice_relief():
    result = calculate(PRACTICE_SIMPLE, "50001")
    assert result["taxable_income"] == "1.00"
    assert result["tax_payable"] == "0.06"
    assert result["crossed_relief_threshold"] is True
    assert result["crossed_first_band"] is False


def test_progressive_practice_bands():
    # 50k relief, then 50k @6% = 3000, then 20k @18% = 3600 → 6600
    result = calculate(PRACTICE_SIMPLE, "120000")
    assert result["taxable_income"] == "70000.00"
    assert result["tax_payable"] == "6600.00"
    assert Decimal(result["bands"][0]["amount_in_band"]) == Decimal("50000.00")
    assert Decimal(result["bands"][1]["amount_in_band"]) == Decimal("20000.00")


def test_verified_below_and_at_relief():
    below = calculate(LK_PIT_2025_2026, "1000000")
    assert below["taxable_income"] == "0.00"
    at = calculate(LK_PIT_2025_2026, "1800000")
    assert at["tax_payable"] == "0.00"


def test_verified_first_band_matches_act_schedule():
    # taxable 1,000,000 → 60,000 at 6%
    result = calculate(LK_PIT_2025_2026, "2800000")
    assert result["taxable_income"] == "1000000.00"
    assert result["tax_payable"] == "60000.00"
    assert result["mode"] == "verified"


def test_verified_second_band_schedule():
    # taxable 1,500,000 → 150,000
    result = calculate(LK_PIT_2025_2026, "3300000")
    assert result["tax_payable"] == "150000.00"


def test_verified_does_not_tax_whole_income_at_top_rate():
    result = calculate(LK_PIT_2025_2026, "4300000")
    assert result["taxable_income"] == "2500000.00"
    assert result["tax_payable"] == "420000.00"
    whole_at_36 = Decimal("4300000") * Decimal("0.36")
    assert Decimal(result["tax_payable"]) < whole_at_36


def test_savings_kind_explains_pile_is_not_tax():
    result = calculate(PRACTICE_SIMPLE, "2000", income_kind="savings_interest")
    assert any("savings pile" in step.lower() or "ගොඩ" in step or "account" in step.lower() for step in result["steps"])


def test_negative_rejected():
    with pytest.raises(ValueError):
        calculate(PRACTICE_SIMPLE, "-1")


def test_public_rule_marks_expired_after_ya():
    info = public_rule(LK_PIT_2025_2026, on=date(2026, 10, 21))
    assert info["year_of_assessment"] == "2025/2026"
    assert info["expired"] is True
    assert info["is_current"] is False
    assert info["sources"]


def test_api_unknown_rule():
    res = client.post("/api/tax/calculate", json={"rule_id": "nope", "income": "1"})
    assert res.status_code == 404


def test_api_expired_verified_without_flag():
    res = client.post(
        "/api/tax/calculate",
        json={"rule_id": "lk_pit_2025_2026", "income": "0", "allow_expired": False},
    )
    assert res.status_code == 409


def test_api_historical_verified_with_flag():
    res = client.post(
        "/api/tax/calculate",
        json={"rule_id": "lk_pit_2025_2026", "income": "2800000", "allow_expired": True},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["mode"] == "verified"
    assert body["tax_payable"] == "60000.00"
    assert body["rule"]["expired"] is True


def test_api_negative():
    res = client.post("/api/tax/calculate", json={"rule_id": "practice_simple", "income": "-10"})
    assert res.status_code == 422


def test_content_en_and_si():
    en = client.get("/api/tax/content", params={"lang": "en"}).json()
    si = client.get("/api/tax/content", params={"lang": "si"}).json()
    assert en["lessons"][0]["title"]
    assert si["lessons"][0]["title"]
    assert en["lessons"][0]["title"] != si["lessons"][0]["title"]
    assert en["quiz"]


def test_quiz_calc_below_relief():
    res = client.post("/api/tax/quiz/grade", json={"question_id": "q3", "amount": "0"})
    assert res.status_code == 200
    assert res.json()["ok"] is True
