"""Supportive Cub lines. Never shame. Compatible with later Sinhala/Tamil keys."""

from typing import Any

# English first. Keys can later map to si/ta tables without changing the engine.
COACHING_EN = {
    "herd_behaviour": "Before following a crowd, what information would help you decide for yourself?",
    "panic_selling": "A price drop can feel worrying. Would you like to review the company information before deciding?",
    "overconfidence": "You've had some successful trades. How could you keep managing risk?",
    "impulsive_investing": "Let's pause and check your plan before placing another order.",
    "poor_diversification": "What might happen if most of your money depends on one company?",
    "insufficient_research": "Would you like to explore the company's information before making a decision?",
}


def coaching_for(indicators: list[dict[str, Any]], language: str = "en") -> list[dict[str, str]]:
    table = COACHING_EN
    lines: list[dict[str, str]] = []
    for item in indicators:
        if item.get("level") != "worth_reviewing":
            continue
        name = str(item.get("behaviour") or "")
        text = table.get(name)
        if not text:
            continue
        lines.append(
            {
                "behaviour": name,
                "language": language,
                "text": text,
            }
        )
    return lines
