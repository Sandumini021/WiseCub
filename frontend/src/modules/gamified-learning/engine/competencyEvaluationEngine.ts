// Competency Evaluation Engine for WiseCub CDEMF
// Evaluates 5 core dimensions + secondary evidence with explainable feedback

import {
  CompetencyDimensionScore,
  CompetencyProfile,
  CoreCompetencyDimension,
  SecondaryCompetencyMetric,
} from '../types/competency.types';
import { DecisionOutcome, FinancialState } from '../types/financial.types';
import { LevelDefinition } from '../types/mission.types';

export class CompetencyEvaluationEngine {
  public static evaluateDecision(
    level: LevelDefinition,
    financialState: FinancialState,
    outcome: DecisionOutcome,
    selectedRationaleId?: string
  ): {
    dimensionScores: Record<CoreCompetencyDimension, number>;
    detailedScores: Record<CoreCompetencyDimension, CompetencyDimensionScore>;
    secondaryScores: Record<SecondaryCompetencyMetric, number>;
    targetScore: number;
    overallScore: number;
  } {
    const startingBudget = Math.max(1, financialState.startingBudgetLKR);
    const reserveRatio =
      financialState.emergencyReserveLKR / startingBudget;
    const discretionaryRatio =
      outcome.discretionarySpentLKR / startingBudget;

    // 1. Budgeting Skill (0 - 100)
    let budgetingScore = 80;
    const budgetingStrengths: string[] = [];
    const budgetingGrowth: string[] = [];

    if (!financialState.isBudgetFeasible) {
      budgetingScore = Math.max(15, 60 - Math.min(45, (financialState.budgetDeficitLKR / startingBudget) * 100));
      budgetingGrowth.push(
        `Overspent budget by Rs. ${financialState.budgetDeficitLKR.toLocaleString()}. Always ensure total expenses are within limit.`
      );
    } else {
      budgetingScore += 10;
      budgetingStrengths.push('Remained strictly within virtual funds without taking on deficit.');
    }

    if (outcome.essentialNeedsCovered) {
      budgetingScore += 10;
      budgetingStrengths.push('Successfully funded all core necessary care items.');
    } else {
      budgetingScore -= 30;
      budgetingGrowth.push(
        `Missed essential items: ${outcome.missedEssentialNames.join(', ')}.`
      );
    }
    budgetingScore = Math.min(100, Math.max(10, Math.round(budgetingScore)));

    // 2. Spending Discipline (0 - 100)
    let disciplineScore = 85;
    const disciplineStrengths: string[] = [];
    const disciplineGrowth: string[] = [];

    if (discretionaryRatio > 0.4 && !outcome.essentialNeedsCovered) {
      disciplineScore -= 45;
      disciplineGrowth.push(
        'Spent on discretionary or optional items while critical medical needs remained unfunded.'
      );
    } else if (discretionaryRatio > 0.3) {
      disciplineScore -= 15;
      disciplineGrowth.push(
        'High proportion of non-essential spending reduced your financial cushion.'
      );
    } else {
      disciplineStrengths.push(
        'Prioritized vital needs first and kept non-essential spending under control.'
      );
    }

    if (outcome.discretionarySpentLKR === 0 && outcome.essentialNeedsCovered) {
      disciplineScore += 15;
      disciplineStrengths.push('Demonstrated disciplined restraint by focusing solely on real needs.');
    }
    disciplineScore = Math.min(100, Math.max(10, Math.round(disciplineScore)));

    // 3. Saving Behavior (0 - 100)
    let savingScore = 70;
    const savingStrengths: string[] = [];
    const savingGrowth: string[] = [];

    if (reserveRatio >= 0.2) {
      savingScore += 25;
      savingStrengths.push(
        `Preserved a healthy reserve buffer (Rs. ${financialState.emergencyReserveLKR.toLocaleString()}, ~${Math.round(reserveRatio * 100)}% of budget).`
      );
    } else if (reserveRatio >= 0.1) {
      savingScore += 10;
      savingStrengths.push('Kept a small emergency safety margin.');
    } else {
      savingScore -= 25;
      savingGrowth.push(
        'Left little or no reserve funds for unexpected medical emergencies.'
      );
    }
    savingScore = Math.min(100, Math.max(10, Math.round(savingScore)));

    // 4. Investment Awareness / Value for Money (0 - 100)
    let investmentScore = 75;
    const investmentStrengths: string[] = [];
    const investmentGrowth: string[] = [];

    // Check rationale if provided
    if (selectedRationaleId && level.tradeoffRationales) {
      const rationale = level.tradeoffRationales.find(
        (r) => r.id === selectedRationaleId
      );
      if (rationale?.isSound) {
        investmentScore += 20;
        investmentStrengths.push('Demonstrated sound financial reasoning for resource allocation.');
      } else {
        investmentScore -= 30;
        investmentGrowth.push(
          rationale?.feedback || 'Selected reasoning showed short-term bias or unsafe trade-offs.'
        );
      }
    } else {
      if (outcome.essentialNeedsCovered && financialState.isBudgetFeasible) {
        investmentScore += 15;
        investmentStrengths.push('Selected reliable, high-value care options for sustainable recovery.');
      }
    }
    investmentScore = Math.min(100, Math.max(10, Math.round(investmentScore)));

    // 5. Goal Achievement (0 - 100)
    let goalScore = 60;
    const goalStrengths: string[] = [];
    const goalGrowth: string[] = [];

    if (outcome.essentialNeedsCovered && financialState.isBudgetFeasible) {
      goalScore = 95;
      goalStrengths.push(`Completed mission level objective: "${level.title}".`);
    } else if (financialState.isBudgetFeasible && !outcome.essentialNeedsCovered) {
      goalScore = 45;
      goalGrowth.push('Partially completed: stayed on budget but did not deliver required care.');
    } else {
      goalScore = 30;
      goalGrowth.push('Level objective failed due to budget overrun or critical missing treatment.');
    }

    // Secondary metrics
    const prioritization = outcome.essentialNeedsCovered ? (discretionaryRatio <= 0.25 ? 90 : 70) : 35;
    const emergencyPreparedness = Math.min(100, Math.round(reserveRatio * 300));
    const consistency = outcome.isFeasible ? 85 : 40;
    const riskAwareness = reserveRatio >= 0.15 ? 90 : 50;
    const tradeoffReasoning = selectedRationaleId ? (investmentScore >= 80 ? 90 : 45) : (outcome.essentialNeedsCovered ? 85 : 45);

    const detailedScores: Record<CoreCompetencyDimension, CompetencyDimensionScore> = {
      budgetingSkill: {
        dimension: 'budgetingSkill',
        label: 'Budgeting Skill',
        score: budgetingScore,
        evidence: `Spent Rs. ${financialState.totalSpentLKR.toLocaleString()} of Rs. ${startingBudget.toLocaleString()} available. Deficit: Rs. ${financialState.budgetDeficitLKR.toLocaleString()}.`,
        strengths: budgetingStrengths,
        growthAreas: budgetingGrowth,
        nextActionTip: 'Always tally essential line-items first before confirming any purchase.',
      },
      spendingDiscipline: {
        dimension: 'spendingDiscipline',
        label: 'Spending Discipline',
        score: disciplineScore,
        evidence: `Discretionary items totaled Rs. ${outcome.discretionarySpentLKR.toLocaleString()} (${Math.round(discretionaryRatio * 100)}% of budget).`,
        strengths: disciplineStrengths,
        growthAreas: disciplineGrowth,
        nextActionTip: 'Ask: "Will the puppy face a setback if I skip this item right now?"',
      },
      savingBehavior: {
        dimension: 'savingBehavior',
        label: 'Saving Behavior',
        score: savingScore,
        evidence: `Emergency reserve preserved: Rs. ${financialState.emergencyReserveLKR.toLocaleString()}.`,
        strengths: savingStrengths,
        growthAreas: savingGrowth,
        nextActionTip: 'Aim to keep at least 15% to 20% of your funds untouched for sudden surprises.',
      },
      investmentAwareness: {
        dimension: 'investmentAwareness',
        label: 'Value & Investment Awareness',
        score: investmentScore,
        evidence: 'Evaluated quality, safety, and long-term durability of purchased goods.',
        strengths: investmentStrengths,
        growthAreas: investmentGrowth,
        nextActionTip: 'Do not choose the cheapest option if it risks infection or poor quality.',
      },
      goalAchievement: {
        dimension: 'goalAchievement',
        label: 'Goal Achievement',
        score: goalScore,
        evidence: outcome.financialImpactSummary,
        strengths: goalStrengths,
        growthAreas: goalGrowth,
        nextActionTip: 'Focus on solving the core story mission before exploring extras.',
      },
    };

    const dimensionScores: Record<CoreCompetencyDimension, number> = {
      budgetingSkill: budgetingScore,
      spendingDiscipline: disciplineScore,
      savingBehavior: savingScore,
      investmentAwareness: investmentScore,
      goalAchievement: goalScore,
    };

    const secondaryScores: Record<SecondaryCompetencyMetric, number> = {
      prioritization,
      emergencyPreparedness,
      consistency,
      riskAwareness,
      tradeoffReasoning,
    };

    const targetScore = dimensionScores[level.targetCompetency];
    const overallScore = Math.round(
      (budgetingScore * 0.25) +
      (disciplineScore * 0.20) +
      (savingScore * 0.20) +
      (investmentScore * 0.15) +
      (goalScore * 0.20)
    );

    return {
      dimensionScores,
      detailedScores,
      secondaryScores,
      targetScore,
      overallScore,
    };
  }

  public static updateCumulativeProfile(
    currentProfile: CompetencyProfile,
    newDimensionScores: Record<CoreCompetencyDimension, number>,
    newSecondaryScores: Record<SecondaryCompetencyMetric, number>
  ): CompetencyProfile {
    // Exponential smoothing moving average (alpha = 0.4 for recent performance)
    const alpha = 0.4;
    const updatedBudgeting = Math.round(
      currentProfile.budgetingSkill * (1 - alpha) + newDimensionScores.budgetingSkill * alpha
    );
    const updatedDiscipline = Math.round(
      currentProfile.spendingDiscipline * (1 - alpha) + newDimensionScores.spendingDiscipline * alpha
    );
    const updatedSaving = Math.round(
      currentProfile.savingBehavior * (1 - alpha) + newDimensionScores.savingBehavior * alpha
    );
    const updatedInvestment = Math.round(
      currentProfile.investmentAwareness * (1 - alpha) + newDimensionScores.investmentAwareness * alpha
    );
    const updatedGoal = Math.round(
      currentProfile.goalAchievement * (1 - alpha) + newDimensionScores.goalAchievement * alpha
    );

    const avg = (updatedBudgeting + updatedDiscipline + updatedSaving + updatedInvestment + updatedGoal) / 5;
    let masteryLevel: 'Novice' | 'Developing' | 'Proficient' | 'Advanced' = 'Novice';
    if (avg >= 85) masteryLevel = 'Advanced';
    else if (avg >= 70) masteryLevel = 'Proficient';
    else if (avg >= 50) masteryLevel = 'Developing';

    return {
      ...currentProfile,
      budgetingSkill: updatedBudgeting,
      spendingDiscipline: updatedDiscipline,
      savingBehavior: updatedSaving,
      investmentAwareness: updatedInvestment,
      goalAchievement: updatedGoal,
      secondaryMetrics: {
        ...currentProfile.secondaryMetrics,
        ...newSecondaryScores,
      },
      overallMasteryLevel: masteryLevel,
      cumulativeAttemptsCount: currentProfile.cumulativeAttemptsCount + 1,
      lastUpdatedIso: new Date().toISOString(),
    };
  }
}
