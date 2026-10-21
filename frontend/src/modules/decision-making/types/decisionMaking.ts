export type LevelStatus = "completed" | "current" | "available" | "locked";

export type LevelIcon =
  | "gift"
  | "loan"
  | "bnpl"
  | "festival"
  | "phone"
  | "salary"
  | "family"
  | "surprise"
  | "goal"
  | "complex";

export type LevelDefinition = {
  id: number;
  title: string;
  description: string;
  preview: string;
  cubHint: string;
  icon: LevelIcon;
  playable: boolean;
};

export type DecisionOptionId = "A" | "B" | "C";

export type DecisionOption = {
  id: DecisionOptionId;
  title: string;
  shortLabel: string;
  summary: string;
  bullets: string[];
  immediate: string;
  future: string;
  snapshot: MoneySnapshot;
};

export type ScenarioFact = {
  label: string;
  value: string;
};

export type ScenarioDefinition = {
  levelId: number;
  title: string;
  situation: string;
  facts: ScenarioFact[];
  options: DecisionOption[];
  moneyScale: number;
  sixMonthAssumptions: string[];
  waitAssumption?: string;
};

export type ReasoningDimensionId =
  | "immediateNeeds"
  | "savingsAwareness"
  | "borrowingObligations"
  | "futureConsequences"
  | "comparingAlternatives"
  | "explainingClearly";

export type DimensionScore = {
  id: ReasoningDimensionId;
  label: string;
  score: number;
  evidence: string;
};

export type AnalysisResult = {
  optionId: DecisionOptionId;
  reasoningText: string;
  dimensions: DimensionScore[];
  highlights: string[];
  gaps: string[];
  method: "rule-based";
  source: "single-response";
};

export type RecommendationBasis = "single-response" | "pattern";

export type AdaptiveRecommendation = {
  id: string;
  title: string;
  reason: string;
  suggestedLevelId: number;
  basedOn: RecommendationBasis;
};

export type MoneySnapshot = {
  label: string;
  savings: number;
  debt: number;
  stateLabel: string;
  state: string;
  note: string;
};

export type ConsequencePack = {
  optionId: DecisionOptionId;
  immediate: string;
  future: string;
  selectedSnapshot: MoneySnapshot;
  alternativeSnapshots: MoneySnapshot[];
  sixMonthAssumptions: string[];
};

export type LevelSession = {
  optionId?: DecisionOptionId;
  reasoning?: string;
  completed?: boolean;
  analysis?: AnalysisResult;
  recommendations?: AdaptiveRecommendation[];
};

export type ChoiceTownProgress = {
  completedLevelIds: number[];
  currentLevelId: number;
  sessions: Record<string, LevelSession>;
  updatedAt: string;
};
