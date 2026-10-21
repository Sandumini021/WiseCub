"""Configurable tax rules. Verified IRD figures are labelled with year and source."""

from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal

# Inland Revenue Department of Sri Lanka — Year of Assessment 2025/2026
# Sources checked 2026-10-21:
# - https://www.ird.gov.lk/en/publications/SitePages/tax_chart_2526.aspx
# - https://www.ird.gov.lk/en/Lists/Latest%20News%20%20Notices/Attachments/666/PN_IT_2025-01_26032025_E.pdf
# Personal relief Rs 1,800,000 from YA 2025/2026. Progressive bands from 1 Apr 2025.
# These figures are NOT confirmed as current law after 31 Mar 2026.

LK_PIT_2025_2026 = {
    "id": "lk_pit_2025_2026",
    "mode": "verified",
    "title": "Sri Lanka personal income tax — YA 2025/2026",
    "year_of_assessment": "2025/2026",
    "currency": "LKR",
    "personal_relief": Decimal("1800000"),
    "bands": (
        {"width": Decimal("1000000"), "rate": Decimal("0.06")},
        {"width": Decimal("500000"), "rate": Decimal("0.18")},
        {"width": Decimal("500000"), "rate": Decimal("0.24")},
        {"width": Decimal("500000"), "rate": Decimal("0.30")},
        {"width": None, "rate": Decimal("0.36")},
    ),
    "interest_ait_rate": Decimal("0.10"),
    "valid_from": date(2025, 4, 1),
    "valid_to": date(2026, 3, 31),
    "verification_date": date(2026, 10, 21),
    "sources": (
        {
            "title": "IRD tax chart 2025/2026",
            "url": "https://www.ird.gov.lk/en/publications/SitePages/tax_chart_2526.aspx",
        },
        {
            "title": "IRD Public Notice PN/IT/2025-01 (26 Mar 2025)",
            "url": "https://www.ird.gov.lk/en/Lists/Latest%20News%20%20Notices/Attachments/666/PN_IT_2025-01_26032025_E.pdf",
        },
    ),
    "notes": (
        "Personal relief of Rs 1,800,000 applies to resident individuals and non-resident citizens.",
        "Bands apply to taxable income after reliefs, not to the whole amount at the top rate.",
        "Interest or discounts paid: Advance Income Tax / withholding 10% (public notice).",
        "Not a substitute for professional tax advice. Liability depends on income type, reliefs, and exemptions.",
    ),
}

# Child-scale practice numbers. NEVER labelled as Sri Lankan law.
PRACTICE_SIMPLE = {
    "id": "practice_simple",
    "mode": "hypothetical",
    "title": "Practice lab (made-up numbers)",
    "year_of_assessment": None,
    "currency": "LKR",
    "personal_relief": Decimal("50000"),
    "bands": (
        {"width": Decimal("50000"), "rate": Decimal("0.06")},
        {"width": Decimal("50000"), "rate": Decimal("0.18")},
        {"width": None, "rate": Decimal("0.24")},
    ),
    "interest_ait_rate": None,
    "valid_from": date(2000, 1, 1),
    "valid_to": date(2099, 12, 31),
    "verification_date": None,
    "sources": (),
    "notes": (
        "These amounts are invented for class so a tutoring job can cross a threshold.",
        "They are not Inland Revenue rates.",
    ),
}

RULES = {str(LK_PIT_2025_2026["id"]): LK_PIT_2025_2026, str(PRACTICE_SIMPLE["id"]): PRACTICE_SIMPLE}


def today_utc() -> date:
    return datetime.now(timezone.utc).date()


def rule_is_current(rule: dict, on: date | None = None) -> bool:
    day = on or today_utc()
    return rule["valid_from"] <= day <= rule["valid_to"]


def public_rule(rule: dict, on: date | None = None) -> dict:
    current = rule_is_current(rule, on)
    return {
        "id": rule["id"],
        "mode": rule["mode"],
        "title": rule["title"],
        "year_of_assessment": rule["year_of_assessment"],
        "currency": rule["currency"],
        "personal_relief": str(rule["personal_relief"]),
        "bands": [
            {
                "width": None if row["width"] is None else str(row["width"]),
                "rate": str(row["rate"]),
            }
            for row in rule["bands"]
        ],
        "interest_ait_rate": None if rule["interest_ait_rate"] is None else str(rule["interest_ait_rate"]),
        "valid_from": rule["valid_from"].isoformat(),
        "valid_to": rule["valid_to"].isoformat(),
        "is_current": current if rule["mode"] == "verified" else False,
        "verification_date": None
        if rule["verification_date"] is None
        else rule["verification_date"].isoformat(),
        "sources": list(rule["sources"]),
        "notes": list(rule["notes"]),
        "expired": rule["mode"] == "verified" and not current,
    }


def get_rule(rule_id: str) -> dict | None:
    return RULES.get(rule_id)
