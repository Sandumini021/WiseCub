import type {
  AnalysisResult,
  DecisionOption,
  DimensionScore,
  ReasoningDimensionId,
} from "../types/decisionMaking";

type DimensionRule = {
  id: ReasoningDimensionId;
  label: string;
  patterns: RegExp[];
  missingHint: string;
  foundHint: string;
};

const RULES: DimensionRule[] = [
  {
    id: "immediateNeeds",
    label: "Considering what you need now",
    patterns: [
      /\bneed(ed|s)?\b/i,
      /\bnow\b/i,
      /\bbroken\b/i,
      /\brepair(ed|ing)?\b/i,
      /\bphone\b/i,
      /\bschool\b/i,
      /\bcall(s|ing)?\b/i,
      /\bcontact\b/i,
      /\buse(ful)?\b/i,
    ],
    foundHint: "You mentioned a present need, such as using a phone.",
    missingHint: "You said little about what you need the phone for right now.",
  },
  {
    id: "savingsAwareness",
    label: "Understanding money and savings",
    patterns: [
      /\bsav(e|ed|ing|ings)\b/i,
      /\b6,?000\b/,
      /\b4,?000\b/,
      /\b2,?000\b/,
      /\bafford\b/i,
      /\bbudget\b/i,
      /\bleft\b/i,
      /\bkeep(ing)?\b/i,
      /\bmoney\b/i,
    ],
    foundHint: "You referred to savings, costs, or how much money you have.",
    missingHint: "You did not clearly talk about your Rs. 6,000 savings or the costs.",
  },
  {
    id: "borrowingObligations",
    label: "Recognising borrowing obligations",
    patterns: [
      /\bborrow(ing|ed)?\b/i,
      /\bloan\b/i,
      /\bowe\b/i,
      /\brepay(ment|ing)?\b/i,
      /\bpay\s?back\b/i,
      /\bdebt\b/i,
      /\bcousin\b/i,
      /\b14,?000\b/,
      /\breturn the money\b/i,
    ],
    foundHint: "You noticed that borrowing creates a repayment obligation.",
    missingHint: "You did not mention borrowing, owing money, or repayment.",
  },
  {
    id: "futureConsequences",
    label: "Considering future consequences",
    patterns: [
      /\blater\b/i,
      /\bfuture\b/i,
      /\bmonth(s)?\b/i,
      /\bweek(s)?\b/i,
      /\bafter\b/i,
      /\blong[- ]?term\b/i,
      /\beventually\b/i,
      /\bthen\b/i,
      /\bconsequence(s)?\b/i,
      /\bif I\b/i,
    ],
    foundHint: "You looked beyond today and thought about what might happen next.",
    missingHint: "You focused on the present and said little about later effects.",
  },
  {
    id: "comparingAlternatives",
    label: "Comparing alternatives",
    patterns: [
      /\binstead\b/i,
      /\brather than\b/i,
      /\bother (option|choice)\b/i,
      /\bcompared? to\b/i,
      /\bcould also\b/i,
      /\boption [abc]\b/i,
      /\brepair vs\b/i,
      /\bborrow vs\b/i,
      /\bwait(ing)?\b/i,
      /\bbut\b/i,
    ],
    foundHint: "You weighed more than one path, not only the option you picked.",
    missingHint: "You described your choice without comparing it to the other options.",
  },
  {
    id: "explainingClearly",
    label: "Explaining your reasoning",
    patterns: [/\bbecause\b/i, /\bso that\b/i, /\bif\b/i, /\btherefore\b/i],
    foundHint: "You used connecting words to explain why the choice made sense to you.",
    missingHint: "Try using words like “because” or “so that” to show the why.",
  },
];

function uniqueMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);
}

function scoreExplaining(text: string, rule: DimensionRule): DimensionScore {
  const length = text.trim().length;
  const sentences = text.split(/[.!?]+/).filter((part) => part.trim().length > 8).length;
  const connectors = uniqueMatches(text, rule.patterns);
  let score = 20;
  if (length >= 40) score += 20;
  if (length >= 90) score += 15;
  if (sentences >= 2) score += 20;
  if (connectors >= 1) score += 15;
  if (connectors >= 2) score += 10;
  score = Math.min(100, score);
  return {
    id: rule.id,
    label: rule.label,
    score,
    evidence: score >= 55 ? rule.foundHint : rule.missingHint,
  };
}

function scoreRule(text: string, rule: DimensionRule): DimensionScore {
  if (rule.id === "explainingClearly") {
    return scoreExplaining(text, rule);
  }
  const hits = uniqueMatches(text, rule.patterns);
  const score = Math.min(100, hits === 0 ? 18 : 40 + hits * 14);
  return {
    id: rule.id,
    label: rule.label,
    score,
    evidence: hits > 0 ? rule.foundHint : rule.missingHint,
  };
}

function optionInvolvesBorrowing(option: DecisionOption): boolean {
  const blob = `${option.title} ${option.summary} ${option.immediate} ${option.bullets.join(" ")}`;
  return /\b(borrow|owe|debt|loan|lend|repay)\b/i.test(blob);
}

function optionInvolvesWaiting(option: DecisionOption): boolean {
  const blob = `${option.title} ${option.summary} ${option.immediate}`;
  return /\b(wait|delay|skip|later|save)\b/i.test(blob);
}

function extraForOption(option: DecisionOption, text: string, dimensions: DimensionScore[]) {
  const lowered = text.toLowerCase();
  let next = dimensions;

  if (optionInvolvesBorrowing(option)) {
    const repay = /\b(repay|pay back|owe|debt|loan|borrow|lend)\b/i.test(lowered);
    next = next.map((dimension) => {
      if (dimension.id !== "borrowingObligations") return dimension;
      if (repay) {
        return {
          ...dimension,
          score: Math.min(100, dimension.score + 10),
          evidence:
            "You chose an option that involves borrowing or lending, and you mentioned that obligation.",
        };
      }
      return {
        ...dimension,
        evidence:
          dimension.score < 50
            ? "This option involves money borrowed or lent. Your explanation did not yet cover repayment or the risk that it is not returned."
            : dimension.evidence,
      };
    });
  }

  if (optionInvolvesWaiting(option)) {
    const needNow = /\b(need|now|today|without|can't wait|cannot wait|school|manage)\b/i.test(
      lowered,
    );
    next = next.map((dimension) => {
      if (dimension.id !== "immediateNeeds") return dimension;
      if (!needNow && dimension.score < 50) {
        return {
          ...dimension,
          evidence:
            "This option delays something. Your explanation said little about what you still need in the meantime.",
        };
      }
      return dimension;
    });
  }

  return next;
}

export function analyzeReasoning(
  option: DecisionOption,
  reasoningText: string,
): AnalysisResult {
  const text = reasoningText.trim();
  const base = RULES.map((rule) => scoreRule(text, rule));
  const dimensions = extraForOption(option, text, base);
  const highlights = dimensions
    .filter((dimension) => dimension.score >= 60)
    .map((dimension) => dimension.evidence);
  const gaps = dimensions
    .filter((dimension) => dimension.score < 50)
    .map((dimension) => dimension.evidence);

  if (highlights.length === 0) {
    highlights.push(
      "Thanks for writing your own reason. Next time, try naming the money amounts and what might happen later.",
    );
  }

  return {
    optionId: option.id,
    reasoningText: text,
    dimensions,
    highlights,
    gaps,
    method: "rule-based",
    source: "single-response",
  };
}
