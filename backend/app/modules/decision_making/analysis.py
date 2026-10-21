import re

from app.modules.decision_making.schemas import (
    AnalysisResult,
    DimensionScore,
    OptionContext,
    OptionId,
)

DimensionId = str

RULES: list[dict] = [
    {
        "id": "immediateNeeds",
        "label": "Considering what you need now",
        "patterns": [
            r"\bneed(ed|s)?\b",
            r"\bnow\b",
            r"\bbroken\b",
            r"\brepair(ed|ing)?\b",
            r"\bphone\b",
            r"\bschool\b",
            r"\bcall(s|ing)?\b",
            r"\bcontact\b",
            r"\buse(ful)?\b",
        ],
        "found": "You mentioned a present need, such as using a phone.",
        "missing": "You said little about what you need right now.",
    },
    {
        "id": "savingsAwareness",
        "label": "Understanding money and savings",
        "patterns": [
            r"\bsav(e|ed|ing|ings)\b",
            r"\b6,?000\b",
            r"\b4,?000\b",
            r"\b2,?000\b",
            r"\bafford\b",
            r"\bbudget\b",
            r"\bleft\b",
            r"\bkeep(ing)?\b",
            r"\bmoney\b",
        ],
        "found": "You referred to savings, costs, or how much money you have.",
        "missing": "You did not clearly talk about the savings or the costs.",
    },
    {
        "id": "borrowingObligations",
        "label": "Recognising borrowing obligations",
        "patterns": [
            r"\bborrow(ing|ed)?\b",
            r"\bloan\b",
            r"\bowe\b",
            r"\brepay(ment|ing)?\b",
            r"\bpay\s?back\b",
            r"\bdebt\b",
            r"\bcousin\b",
            r"\b14,?000\b",
            r"\breturn the money\b",
        ],
        "found": "You noticed that borrowing or lending creates an obligation.",
        "missing": "You did not mention borrowing, owing money, or repayment.",
    },
    {
        "id": "futureConsequences",
        "label": "Considering future consequences",
        "patterns": [
            r"\blater\b",
            r"\bfuture\b",
            r"\bmonth(s)?\b",
            r"\bweek(s)?\b",
            r"\bafter\b",
            r"\blong[- ]?term\b",
            r"\beventually\b",
            r"\bthen\b",
            r"\bconsequence(s)?\b",
            r"\bif I\b",
        ],
        "found": "You looked beyond today and thought about what might happen next.",
        "missing": "You focused on the present and said little about later effects.",
    },
    {
        "id": "comparingAlternatives",
        "label": "Comparing alternatives",
        "patterns": [
            r"\binstead\b",
            r"\brather than\b",
            r"\bother (option|choice)\b",
            r"\bcompared? to\b",
            r"\bcould also\b",
            r"\boption [abc]\b",
            r"\brepair vs\b",
            r"\bborrow vs\b",
            r"\bwait(ing)?\b",
            r"\bbut\b",
        ],
        "found": "You weighed more than one path, not only the option you picked.",
        "missing": "You described your choice without comparing it to the other options.",
    },
    {
        "id": "explainingClearly",
        "label": "Explaining your reasoning",
        "patterns": [r"\bbecause\b", r"\bso that\b", r"\bif\b", r"\btherefore\b"],
        "found": "You used connecting words to explain why the choice made sense to you.",
        "missing": "Try using words like because or so that to show the why.",
    },
]


def _hits(text: str, patterns: list[str]) -> int:
    return sum(1 for pattern in patterns if re.search(pattern, text, re.IGNORECASE))


def _score_rule(text: str, rule: dict) -> DimensionScore:
    if rule["id"] == "explainingClearly":
        length = len(text.strip())
        sentences = [part for part in re.split(r"[.!?]+", text) if len(part.strip()) > 8]
        connectors = _hits(text, rule["patterns"])
        score = 20
        if length >= 40:
            score += 20
        if length >= 90:
            score += 15
        if len(sentences) >= 2:
            score += 20
        if connectors >= 1:
            score += 15
        if connectors >= 2:
            score += 10
        score = min(100, score)
        return DimensionScore(
            id=rule["id"],
            label=rule["label"],
            score=score,
            evidence=rule["found"] if score >= 55 else rule["missing"],
        )

    hits = _hits(text, rule["patterns"])
    score = min(100, 18 if hits == 0 else 40 + hits * 14)
    return DimensionScore(
        id=rule["id"],
        label=rule["label"],
        score=score,
        evidence=rule["found"] if hits > 0 else rule["missing"],
    )


def _option_blob(option: OptionContext, include_bullets: bool) -> str:
    parts = [option.title, option.summary, option.immediate]
    if include_bullets:
        parts.extend(option.bullets)
    return " ".join(parts)


def analyze_reasoning(option_id: OptionId, option: OptionContext, reasoning_text: str) -> AnalysisResult:
    """Explainable keyword rules. This is not a trained model."""
    text = reasoning_text.strip()
    dimensions = [_score_rule(text, rule) for rule in RULES]
    lowered = text.lower()

    if re.search(r"\b(borrow|owe|debt|loan|lend|repay)\b", _option_blob(option, True), re.IGNORECASE):
        repay = re.search(r"\b(repay|pay back|owe|debt|loan|borrow|lend)\b", lowered, re.IGNORECASE)
        updated: list[DimensionScore] = []
        for dimension in dimensions:
            if dimension.id != "borrowingObligations":
                updated.append(dimension)
                continue
            if repay:
                updated.append(
                    dimension.model_copy(
                        update={
                            "score": min(100, dimension.score + 10),
                            "evidence": "You chose an option that involves borrowing or lending, and you mentioned that obligation.",
                        }
                    )
                )
            elif dimension.score < 50:
                updated.append(
                    dimension.model_copy(
                        update={
                            "evidence": "This option involves money borrowed or lent. Your explanation did not yet cover repayment or the risk that it is not returned."
                        }
                    )
                )
            else:
                updated.append(dimension)
        dimensions = updated

    if re.search(r"\b(wait|delay|skip|later|save)\b", _option_blob(option, False), re.IGNORECASE):
        need_now = re.search(
            r"\b(need|now|today|without|can't wait|cannot wait|school|manage)\b",
            lowered,
            re.IGNORECASE,
        )
        updated = []
        for dimension in dimensions:
            if dimension.id == "immediateNeeds" and not need_now and dimension.score < 50:
                updated.append(
                    dimension.model_copy(
                        update={
                            "evidence": "This option delays something. Your explanation said little about what you still need in the meantime."
                        }
                    )
                )
            else:
                updated.append(dimension)
        dimensions = updated

    highlights = [item.evidence for item in dimensions if item.score >= 60]
    gaps = [item.evidence for item in dimensions if item.score < 50]
    if not highlights:
        highlights.append(
            "Thanks for writing your own reason. Next time, try naming the money amounts and what might happen later."
        )

    return AnalysisResult(
        option_id=option_id,
        reasoning_text=text,
        dimensions=dimensions,
        highlights=highlights,
        gaps=gaps,
    )
