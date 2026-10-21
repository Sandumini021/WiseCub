// Financial Simulation Engine for WiseCub CDEMF
// Evaluates financial choices, allocations, and multi-period trade-offs with integer LKR arithmetic

import {
  DecisionOutcome,
  FinancialState,
} from '../types/financial.types';
import { LevelDefinition } from '../types/mission.types';

export class FinancialSimulationEngine {
  /**
   * Evaluates simple selection choices (needs vs wants, value comparison, trade-offs)
   */
  public static evaluateOptionSelections(
    level: LevelDefinition,
    selectedOptionIds: string[],
    existingReserveLKR: number = 0
  ): { financialState: FinancialState; outcome: DecisionOutcome } {
    const allOptions = level.options || [];
    const selectedOptions = allOptions.filter((opt) =>
      selectedOptionIds.includes(opt.id)
    );

    const startingBudgetLKR = Math.round(level.startingBudgetLKR);
    const totalSpentLKR = selectedOptions.reduce(
      (sum, opt) => sum + Math.round(opt.costLKR),
      0
    );
    const remainingCashLKR = startingBudgetLKR - totalSpentLKR;
    const isBudgetFeasible = remainingCashLKR >= 0;
    const budgetDeficitLKR = isBudgetFeasible ? 0 : Math.abs(remainingCashLKR);

    // Identify essential vs discretionary
    const essentialOptions = allOptions.filter((opt) => opt.isEssential);
    const coveredEssentials = selectedOptions.filter((opt) => opt.isEssential);
    const missedEssentials = essentialOptions.filter(
      (opt) => !selectedOptionIds.includes(opt.id)
    );
    const essentialNeedsCovered = missedEssentials.length === 0;

    const discretionarySpentLKR = selectedOptions
      .filter((opt) => !opt.isEssential)
      .reduce((sum, opt) => sum + Math.round(opt.costLKR), 0);

    const reservePreservedLKR = Math.max(0, remainingCashLKR) + existingReserveLKR;

    const allocatedCategories: Record<string, number> = {};
    for (const opt of selectedOptions) {
      allocatedCategories[opt.category] =
        (allocatedCategories[opt.category] || 0) + Math.round(opt.costLKR);
    }

    const financialState: FinancialState = {
      startingBudgetLKR,
      totalSpentLKR,
      remainingCashLKR,
      emergencyReserveLKR: reservePreservedLKR,
      allocatedCategories,
      unmetEssentials: missedEssentials.map((m) => m.title),
      isBudgetFeasible,
      budgetDeficitLKR,
    };

    let impactSummary = '';
    if (!isBudgetFeasible) {
      impactSummary = `Overspent by Rs. ${budgetDeficitLKR.toLocaleString()}. You committed Rs. ${totalSpentLKR.toLocaleString()} with only Rs. ${startingBudgetLKR.toLocaleString()} available.`;
    } else if (!essentialNeedsCovered) {
      impactSummary = `Budget is balanced, but essential care is missing: ${missedEssentials.map((e) => e.title).join(', ')}.`;
    } else {
      impactSummary = `Successfully funded essential care (Rs. ${coveredEssentials.reduce((s, c) => s + c.costLKR, 0).toLocaleString()}) and preserved Rs. ${reservePreservedLKR.toLocaleString()} in safety reserves.`;
    }

    const outcome: DecisionOutcome = {
      decisionId: `dec_${Date.now()}`,
      totalCostLKR: totalSpentLKR,
      essentialNeedsCovered,
      coveredEssentialNames: coveredEssentials.map((e) => e.title),
      missedEssentialNames: missedEssentials.map((e) => e.title),
      discretionarySpentLKR,
      reservePreservedLKR,
      balanceRemainingLKR: Math.max(0, remainingCashLKR),
      isFeasible: isBudgetFeasible,
      financialImpactSummary: impactSummary,
    };

    return { financialState, outcome };
  }

  /**
   * Evaluates category-based budget allocations (e.g. Level 2, Level 6)
   */
  public static evaluateCategoryAllocations(
    level: LevelDefinition,
    allocations: Record<string, number>,
    existingReserveLKR: number = 0
  ): { financialState: FinancialState; outcome: DecisionOutcome } {
    const categories = level.allocationCategories || [];
    const startingBudgetLKR = Math.round(level.startingBudgetLKR);

    let totalSpentLKR = 0;
    let discretionarySpentLKR = 0;
    const coveredEssentials: string[] = [];
    const missedEssentials: string[] = [];
    let reserveAllocated = 0;
    const cleanedAllocations: Record<string, number> = {};

    for (const cat of categories) {
      const allocated = Math.max(0, Math.round(allocations[cat.id] || 0));
      cleanedAllocations[cat.id] = allocated;
      totalSpentLKR += allocated;

      if (cat.isEssential) {
        if (allocated >= cat.minRecommendedLKR) {
          coveredEssentials.push(cat.name);
        } else {
          missedEssentials.push(
            `${cat.name} (allocated Rs. ${allocated.toLocaleString()} vs min Rs. ${cat.minRecommendedLKR.toLocaleString()})`
          );
        }
      } else {
        discretionarySpentLKR += allocated;
      }

      // Check if this category represents an emergency reserve or savings cushion
      const catCat = cat.category as string;
      if (
        catCat === 'emergency_reserve' ||
        catCat === 'savings_goal' ||
        catCat === 'emergency_savings' ||
        catCat === 'savings' ||
        cat.id.toLowerCase().includes('reserve') ||
        cat.id.toLowerCase().includes('saving') ||
        cat.id === 'emergency_reserve' ||
        cat.id === 'cat_emergency_reserve' ||
        cat.id === 'cat_rec_reserve' ||
        cat.id === 'cap_permanent_reserve'
      ) {
        reserveAllocated += allocated;
      }
    }

    const remainingCashLKR = startingBudgetLKR - totalSpentLKR;
    const isBudgetFeasible = remainingCashLKR >= 0;
    const budgetDeficitLKR = isBudgetFeasible ? 0 : Math.abs(remainingCashLKR);
    const essentialNeedsCovered = missedEssentials.length === 0;

    // Total preserved emergency reserve includes protected reserve allocations + existing reserves + unallocated cash
    const totalReserveLKR =
      reserveAllocated + existingReserveLKR + Math.max(0, remainingCashLKR);

    const financialState: FinancialState = {
      startingBudgetLKR,
      totalSpentLKR,
      remainingCashLKR,
      emergencyReserveLKR: totalReserveLKR,
      allocatedCategories: cleanedAllocations,
      unmetEssentials: missedEssentials,
      isBudgetFeasible,
      budgetDeficitLKR,
    };

    let impactSummary = '';
    if (!isBudgetFeasible) {
      impactSummary = `Allocations exceed budget by Rs. ${budgetDeficitLKR.toLocaleString()}. You planned Rs. ${totalSpentLKR.toLocaleString()} against Rs. ${startingBudgetLKR.toLocaleString()}.`;
    } else if (!essentialNeedsCovered) {
      impactSummary = `Funding fell short for critical categories: ${missedEssentials.join('; ')}.`;
    } else {
      impactSummary = `Balanced plan! All required care categories funded with Rs. ${totalReserveLKR.toLocaleString()} in reserve buffer.`;
    }

    const outcome: DecisionOutcome = {
      decisionId: `dec_alloc_${Date.now()}`,
      totalCostLKR: totalSpentLKR,
      essentialNeedsCovered,
      coveredEssentialNames: coveredEssentials,
      missedEssentialNames: missedEssentials,
      discretionarySpentLKR,
      reservePreservedLKR: totalReserveLKR,
      balanceRemainingLKR: Math.max(0, remainingCashLKR),
      isFeasible: isBudgetFeasible,
      financialImpactSummary: impactSummary,
    };

    return { financialState, outcome };
  }

  /**
   * Evaluates multi-period savings choices (e.g. Level 3)
   */
  public static evaluateMultiPeriodSavings(
    level: LevelDefinition,
    weeklyDecisions: Array<{
      period: number;
      savedAmountLKR: number;
      resistedTemptation: boolean;
    }>
  ): { financialState: FinancialState; outcome: DecisionOutcome } {
    const config = level.multiPeriodConfig;
    if (!config) {
      throw new Error('Level definition missing multiPeriodConfig');
    }

    let totalSavedLKR = 0;
    let totalIncomeLKR = 0;
    let totalDiscretionarySpentLKR = 0;
    let allEssentialsCovered = true;

    for (const weekDecision of weeklyDecisions) {
      const periodConfig = config.periods.find(
        (p) => p.period === weekDecision.period
      );
      if (!periodConfig) continue;

      totalIncomeLKR += periodConfig.allowanceLKR;
      const mandatory = periodConfig.mandatoryCostLKR;
      const temptation = weekDecision.resistedTemptation
        ? 0
        : periodConfig.temptationCostLKR;
      totalDiscretionarySpentLKR += temptation;

      // Available to save = allowance - mandatory - temptation
      const maxPossibleSave = periodConfig.allowanceLKR - mandatory - temptation;
      const actualSaved = Math.min(
        Math.max(0, weekDecision.savedAmountLKR),
        maxPossibleSave
      );
      totalSavedLKR += actualSaved;

      if (periodConfig.allowanceLKR < mandatory + temptation + actualSaved) {
        allEssentialsCovered = false;
      }
    }

    const goalLKR = config.targetGoalLKR;
    const goalReached = totalSavedLKR >= goalLKR;
    const deficitLKR = Math.max(0, goalLKR - totalSavedLKR);

    const financialState: FinancialState = {
      startingBudgetLKR: totalIncomeLKR,
      totalSpentLKR: totalIncomeLKR - totalSavedLKR,
      remainingCashLKR: totalSavedLKR,
      emergencyReserveLKR: totalSavedLKR,
      allocatedCategories: { savings: totalSavedLKR, discretionary: totalDiscretionarySpentLKR },
      unmetEssentials: goalReached ? [] : [`Saving target shortfall: Rs. ${deficitLKR.toLocaleString()}`],
      isBudgetFeasible: totalSavedLKR >= 0,
      budgetDeficitLKR: deficitLKR,
    };

    const impactSummary = goalReached
      ? `Goal achieved! Saved Rs. ${totalSavedLKR.toLocaleString()} (Target: Rs. ${goalLKR.toLocaleString()}). The puppy's specialized treatment is fully funded!`
      : `Shortfall of Rs. ${deficitLKR.toLocaleString()}. Accumulated Rs. ${totalSavedLKR.toLocaleString()} vs required Rs. ${goalLKR.toLocaleString()} due to impulse spending.`;

    const outcome: DecisionOutcome = {
      decisionId: `dec_saving_${Date.now()}`,
      totalCostLKR: totalIncomeLKR - totalSavedLKR,
      essentialNeedsCovered: goalReached && allEssentialsCovered,
      coveredEssentialNames: goalReached ? ['Specialized Splint Treatment'] : [],
      missedEssentialNames: goalReached ? [] : ['Specialized Splint Treatment'],
      discretionarySpentLKR: totalDiscretionarySpentLKR,
      reservePreservedLKR: totalSavedLKR,
      balanceRemainingLKR: totalSavedLKR,
      isFeasible: true,
      financialImpactSummary: impactSummary,
    };

    return { financialState, outcome };
  }
}
