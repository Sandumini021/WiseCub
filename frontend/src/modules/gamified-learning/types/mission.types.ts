// Mission, Level, and Mastery Types for CDEMF

import { CharacterState, CharacterTransition } from './emotion.types';
import { CoreCompetencyDimension } from './competency.types';
import { DecisionOption, DecisionOutcome, FinancialCategory } from './financial.types';

export type LevelInteractionType =
  | 'needs_wants'
  | 'budget_allocator'
  | 'multi_period_saving'
  | 'value_comparison'
  | 'emergency_response'
  | 'recurring_budget'
  | 'tradeoff_justification'
  | 'capstone_challenge';

export interface BudgetAllocationCategoryConfig {
  id: string;
  name: string;
  category: FinancialCategory;
  isEssential: boolean;
  minRecommendedLKR: number;
  maxRecommendedLKR: number;
  stepLKR: number;
  defaultAmountLKR: number;
  description: string;
}

export interface MultiPeriodWeekConfig {
  period: number;
  label: string;
  allowanceLKR: number;
  mandatoryCostLKR: number;
  mandatoryCostDescription: string;
  temptationCostLKR: number;
  temptationTitle: string;
  temptationDescription: string;
}

export interface TradeoffRationaleOption {
  id: string;
  text: string;
  isSound: boolean;
  feedback: string;
}

export interface PassCriteria {
  minCompetencyScore: number; // 0 - 100
  mustIncludeOptionIds?: string[];
  disallowedOptionIds?: string[];
  maxBudgetLKR: number;
  minReservePreservedLKR?: number;
  requireBudgetFeasibility: boolean;
  requiredRationaleId?: string;
  maxDiscretionaryRatio?: number; // e.g. 0.3 = max 30% on non-essentials
  customValidationId?: string;
}

export interface LevelDefinition {
  id: string;
  levelNumber: number;
  title: string;
  subtitle: string;
  storyIntro: string;
  learningObjective: string;
  targetCompetency: CoreCompetencyDimension;
  interactionType: LevelInteractionType;
  startingBudgetLKR: number;
  existingReserveLKR?: number;
  options?: DecisionOption[];
  allocationCategories?: BudgetAllocationCategoryConfig[];
  multiPeriodConfig?: {
    periods: MultiPeriodWeekConfig[];
    targetGoalLKR: number;
    goalDescription: string;
  };
  tradeoffRationales?: TradeoffRationaleOption[];
  passCriteria: PassCriteria;
  hints: string[];
  remediationScaffolding: {
    ruleExplanation: string;
    guidingQuestions: string[];
    suggestedFocus: string;
  };
}

export interface MissionDefinition {
  id: string;
  title: string;
  characterName: string;
  characterRole: string;
  characterSpecies: string;
  primaryCompetency: CoreCompetencyDimension;
  secondaryCompetencies: string[];
  description: string;
  totalLevels: number;
  themeColor: string;
  initialCharacterState: CharacterState;
  levels: LevelDefinition[];
}

export interface LevelMasteryResult {
  levelId: string;
  levelNumber: number;
  attemptNumber?: number;
  passed: boolean;
  overallScore: number;
  dimensionScores: Record<CoreCompetencyDimension, number>;
  decisionOutcome: DecisionOutcome;
  characterTransition: CharacterTransition;
  failureReasons: string[];
  successSummary: string;
  remediationGuidance?: string;
  nextLevelUnlocked: boolean;
  timestamp: string;
}
