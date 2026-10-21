from app.modules.decision_making.schemas import (
    AdaptiveRecommendation,
    AnalysisResult,
    LevelSession,
)

LEVEL_TITLES = {
    1: "Birthday money",
    2: "Friend wants a loan",
    3: "Buy now, pay later",
    4: "Tuition and a festival",
    5: "The phone that broke",
    6: "First salary",
    7: "Lending to family",
    8: "An unexpected expense",
    9: "Saving for a big goal",
    10: "A difficult choice",
}

GAP_TO_LEVEL = {
    "borrowingObligations": 7,
    "futureConsequences": 9,
    "comparingAlternatives": 6,
    "immediateNeeds": 8,
    "savingsAwareness": 6,
    "explainingClearly": 10,
}


def _title(level_id: int) -> str:
    return LEVEL_TITLES.get(level_id, f"Level {level_id}")


def recommend(
    analysis: AnalysisResult,
    sessions: dict[str, LevelSession],
) -> list[AdaptiveRecommendation]:
    """Suggest a next scenario from this answer, or from a repeated gap."""
    analyzed = [session.analysis for session in sessions.values() if session.analysis is not None]
    weakest = min(analysis.dimensions, key=lambda item: item.score)
    strongest = max(analysis.dimensions, key=lambda item: item.score)
    average = sum(item.score for item in analysis.dimensions) / len(analysis.dimensions)
    recommendations: list[AdaptiveRecommendation] = []

    repeated = False
    if weakest.score < 55:
        repeated = sum(
            1
            for previous in analyzed
            for dimension in previous.dimensions
            if dimension.id == weakest.id and dimension.score < 55
        ) >= 2
        level_id = GAP_TO_LEVEL[weakest.id]
        if repeated:
            reason = (
                f"{weakest.label} was less visible in more than one completed explanation. "
                f"{weakest.evidence} {_title(level_id)} is a useful next practice."
            )
            basis = "pattern"
        else:
            reason = (
                f"From this one explanation, {weakest.label.lower()} was less visible. "
                f"{weakest.evidence} A later scenario on that topic can give you more practice."
            )
            basis = "single-response"
        recommendations.append(
            AdaptiveRecommendation(
                id=f"gap-{weakest.id}",
                title=f"Try next: {_title(level_id)}",
                reason=reason,
                suggested_level_id=level_id,
                based_on=basis,
            )
        )

    if average >= 70:
        recommendations.append(
            AdaptiveRecommendation(
                id="stretch-complex",
                title=f"Stretch challenge: {_title(10)}",
                reason=(
                    f"In this response you showed strength in {strongest.label.lower()}. "
                    "A complex decision can be a stretch. This is not a judgement of ability."
                ),
                suggested_level_id=10,
                based_on="pattern" if len(analyzed) >= 2 else "single-response",
            )
        )

    if len(analyzed) < 2:
        recommendations.append(
            AdaptiveRecommendation(
                id="one-answer-note",
                title="One answer is a clue, not a pattern",
                reason=(
                    "Suggestions here come from this response. One answer is a clue, "
                    "not a pattern across many completed levels."
                ),
                suggested_level_id=5,
                based_on="single-response",
            )
        )

    return recommendations
