// Competency Framework Types for WiseCub CDEMF

export type CoreCompetencyDimension =
  | 'budgetingSkill'
  | 'spendingDiscipline'
  | 'savingBehavior'
  | 'investmentAwareness'
  | 'goalAchievement';

export type SecondaryCompetencyMetric =
  | 'emergencyPreparedness'
  | 'prioritization'
  | 'consistency'
  | 'riskAwareness'
  | 'tradeoffReasoning';

export interface CompetencyDimensionScore {
  dimension: CoreCompetencyDimension;
  label: string;
  score: number; // 0 - 100
  evidence: string;
  strengths: string[];
  growthAreas: string[];
  nextActionTip: string;
}

export interface SecondaryMetricScore {
  metric: SecondaryCompetencyMetric;
  label: string;
  score: number; // 0 - 100
  observation: string;
}

export interface CompetencyProfile {
  budgetingSkill: number;
  spendingDiscipline: number;
  savingBehavior: number;
  investmentAwareness: number;
  goalAchievement: number;
  secondaryMetrics: Record<SecondaryCompetencyMetric, number>;
  detailedDimensions: Record<CoreCompetencyDimension, CompetencyDimensionScore>;
  overallMasteryLevel: 'Novice' | 'Developing' | 'Proficient' | 'Advanced';
  cumulativeAttemptsCount: number;
  lastUpdatedIso: string;
}
