// Financial State and Decision Types for WiseCub CDEMF

export type FinancialCategory = 
  | 'essential_care'
  | 'medical_supplies'
  | 'nutrition'
  | 'transportation'
  | 'veterinary_fees'
  | 'discretionary'
  | 'emergency_reserve'
  | 'savings_goal'
  | 'recurring_care'
  | 'essential_food'
  | 'shelter_repair'
  | 'accessory'
  | 'snacks'
  | 'food'
  | 'shelter'
  | 'savings'
  | 'emergency_food'
  | 'emergency_repair'
  | 'luxury_food'
  | 'substandard_food'
  | 'thermal_safety'
  | 'caloric_fuel'
  | 'comfort_luxury'
  | 'cosmetic';

export interface FinancialAllocation {
  categoryId: string;
  categoryName: string;
  isEssential: boolean;
  allocatedAmountLKR: number;
  recommendedMinLKR?: number;
  recommendedMaxLKR?: number;
}

export interface FinancialState {
  startingBudgetLKR: number;
  totalSpentLKR: number;
  remainingCashLKR: number;
  emergencyReserveLKR: number;
  allocatedCategories: Record<string, number>;
  unmetEssentials: string[];
  isBudgetFeasible: boolean;
  budgetDeficitLKR: number;
}

export interface DecisionOption {
  id: string;
  title: string;
  description: string;
  costLKR: number;
  category: FinancialCategory;
  isEssential: boolean;
  qualityLevel?: 'substandard' | 'certified_good' | 'luxury_excess';
  financialTradeoffNote?: string;
}

export interface FinancialDecision {
  decisionId: string;
  levelId: string;
  timestamp: string;
  selectedOptionIds: string[];
  allocations: Record<string, number>;
  selectedRationaleId?: string;
  emergencyFundUsedLKR?: number;
}

export interface DecisionOutcome {
  decisionId: string;
  totalCostLKR: number;
  essentialNeedsCovered: boolean;
  coveredEssentialNames: string[];
  missedEssentialNames: string[];
  discretionarySpentLKR: number;
  reservePreservedLKR: number;
  balanceRemainingLKR: number;
  isFeasible: boolean;
  financialImpactSummary: string;
}
