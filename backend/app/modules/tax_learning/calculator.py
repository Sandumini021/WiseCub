"""Progressive tax on taxable income after relief. Decimal arithmetic only."""

from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal, InvalidOperation
from typing import Any

TWO = Decimal("0.01")


def money(value: Decimal | str | int | float) -> Decimal:
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, ValueError) as exc:
        raise ValueError("Income must be a number.") from exc
    if not amount.is_finite():
        raise ValueError("Income must be a number.")
    return amount.quantize(TWO, rounding=ROUND_HALF_UP)


def apply_bands(taxable: Decimal, bands: tuple[dict, ...]) -> tuple[Decimal, list[dict[str, Any]]]:
    remaining = taxable
    total = Decimal("0.00")
    slices: list[dict[str, Any]] = []
    for index, band in enumerate(bands):
        width = band["width"]
        rate = band["rate"]
        if remaining <= 0:
            slices.append(
                {
                    "index": index,
                    "rate": str(rate),
                    "amount_in_band": "0.00",
                    "tax": "0.00",
                }
            )
            continue
        chunk = remaining if width is None else min(remaining, width)
        tax = (chunk * rate).quantize(TWO, rounding=ROUND_HALF_UP)
        total += tax
        remaining -= chunk
        slices.append(
            {
                "index": index,
                "rate": str(rate),
                "amount_in_band": str(chunk.quantize(TWO)),
                "tax": str(tax),
            }
        )
    return total.quantize(TWO, rounding=ROUND_HALF_UP), slices


def calculate(
    rule: dict,
    gross_income: Decimal | str | int | float,
    *,
    income_kind: str = "employment",
) -> dict[str, Any]:
    gross = money(gross_income)
    if gross < 0:
        raise ValueError("Income cannot be negative.")

    relief_cap = rule["personal_relief"]
    relief_used = min(gross, relief_cap).quantize(TWO, rounding=ROUND_HALF_UP)
    taxable = (gross - relief_used).quantize(TWO, rounding=ROUND_HALF_UP)
    tax, slices = apply_bands(taxable, rule["bands"])
    net = (gross - tax).quantize(TWO, rounding=ROUND_HALF_UP)

    crossed = taxable > 0
    first_width = rule["bands"][0]["width"]
    crossed_first_band = bool(first_width is not None and taxable > first_width)

    steps = [
        f"Money received (gross): Rs {gross}.",
        f"Personal relief used: Rs {relief_used} (up to Rs {relief_cap}).",
        f"Taxable income = gross minus relief = Rs {taxable}.",
    ]
    if taxable == 0:
        steps.append("Taxable income is zero, so estimated tax payable is Rs 0.00.")
    else:
        steps.append("Each tax band is applied only to the slice inside that band — not the whole income at the top rate.")
        for item in slices:
            if Decimal(item["amount_in_band"]) <= 0:
                continue
            pct = (Decimal(item["rate"]) * 100).quantize(Decimal("1"))
            steps.append(
                f"Band {item['index'] + 1}: Rs {item['amount_in_band']} × {pct}% = Rs {item['tax']}."
            )
        steps.append(f"Estimated tax payable: Rs {tax}.")
    steps.append(f"Net after this estimate: Rs {net}.")
    if income_kind == "savings_interest":
        steps.append(
            "The savings pile itself is not income tax. Only interest (and similar) can be income. "
            "Keeping cash in an account does not by itself create an income-tax bill."
        )
        ait = rule.get("interest_ait_rate")
        if ait is not None:
            steps.append(
                f"IRD public notice for YA 2025/2026 also notes Advance Income Tax on interest or discounts at {ait * 100}% — a different mechanism from these PIT bands."
            )

    return {
        "rule_id": rule["id"],
        "mode": rule["mode"],
        "income_kind": income_kind,
        "gross_income": str(gross),
        "personal_relief_cap": str(relief_cap),
        "relief_used": str(relief_used),
        "taxable_income": str(taxable),
        "tax_payable": str(tax),
        "net_income": str(net),
        "bands": slices,
        "crossed_relief_threshold": crossed,
        "crossed_first_band": crossed_first_band,
        "steps": steps,
        "year_of_assessment": rule["year_of_assessment"],
    }
