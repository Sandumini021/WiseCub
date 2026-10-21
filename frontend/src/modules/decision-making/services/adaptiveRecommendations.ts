import { getLevel } from "../data/levels";
import type {
  AdaptiveRecommendation,
  AnalysisResult,
  ReasoningDimensionId,
} from "../types/decisionMaking";

const GAP_TO_LEVEL: Record<ReasoningDimensionId, number> = {
  borrowingObligations: 7,
  futureConsequences: 9,
  comparingAlternatives: 6,
  immediateNeeds: 8,
  savingsAwareness: 6,
  explainingClearly: 10,
};

function titleForLevel(id: number): string {
  return getLevel(id)?.title ?? `Level ${id}`;
}

export function recommendFromAnalysis(
  analysis: AnalysisResult,
  completedCount: number,
): AdaptiveRecommendation[] {
  const weakest = [...analysis.dimensions].sort((a, b) => a.score - b.score)[0];
  const strongest = [...analysis.dimensions].sort((a, b) => b.score - a.score)[0];
  const recommendations: AdaptiveRecommendation[] = [];

  if (weakest && weakest.score < 55) {
    const levelId = GAP_TO_LEVEL[weakest.id];
    recommendations.push({
      id: `gap-${weakest.id}`,
      title: `Try next: ${titleForLevel(levelId)}`,
      reason: `From this one explanation, ${weakest.label.toLowerCase()} was less visible. ${weakest.evidence} A later scenario on that topic can give you more practice.`,
      suggestedLevelId: levelId,
      basedOn: "single-response",
    });
  }

  const average =
    analysis.dimensions.reduce((sum, item) => sum + item.score, 0) /
    analysis.dimensions.length;

  if (average >= 70 && strongest) {
    recommendations.push({
      id: "stretch-complex",
      title: `Stretch challenge: ${titleForLevel(10)}`,
      reason: `In this response you showed strength in ${strongest.label.toLowerCase()}. When more scenarios are completed, a complex decision could be a good stretch — this is not yet a long-term pattern.`,
      suggestedLevelId: 10,
      basedOn: "single-response",
    });
  }

  if (completedCount < 2) {
    recommendations.push({
      id: "one-answer-note",
      title: "One answer is a clue, not a pattern",
      reason:
        "Suggestions here come from this response. One answer is a clue, not a pattern across many completed levels.",
      suggestedLevelId: 5,
      basedOn: "single-response",
    });
  }

  return recommendations;
}
