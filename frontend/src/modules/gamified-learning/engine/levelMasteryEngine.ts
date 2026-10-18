// Level Mastery Engine for WiseCub CDEMF
// Enforces strict competency gates, evaluates pass/fail criteria, and generates remediation guidance

import {
  CharacterTransition,
} from '../types/emotion.types';
import { CoreCompetencyDimension } from '../types/competency.types';
import { DecisionOutcome, FinancialState } from '../types/financial.types';
import { LevelDefinition, LevelMasteryResult, PassCriteria } from '../types/mission.types';

export class LevelMasteryEngine {
  /**
   * Strictly evaluates whether the student meets the competency criteria to pass the level.
   * If failed, next level remains locked and targeted remediation is produced.
   */
  public static evaluatePassFail(
    level: LevelDefinition,
    financialState: FinancialState,
    outcome: DecisionOutcome,
    dimensionScores: Record<CoreCompetencyDimension, number>,
    characterTransition: CharacterTransition,
    selectedOptionIds?: string[],
    selectedRationaleId?: string
  ): LevelMasteryResult {
    const criteria: PassCriteria = level.passCriteria;
    const failureReasons: string[] = [];

    // 1. Budget Feasibility Gate
    if (criteria.requireBudgetFeasibility && !financialState.isBudgetFeasible) {
      failureReasons.push(
        `Budget deficit: You exceeded your available funds by Rs. ${financialState.budgetDeficitLKR.toLocaleString()}. In real life, spending money you do not have causes debt.`
      );
    }

    // 2. Essential Options Gate
    if (criteria.mustIncludeOptionIds && criteria.mustIncludeOptionIds.length > 0) {
      const selected = selectedOptionIds || [];
      const missingEssentialIds = criteria.mustIncludeOptionIds.filter(
        (reqId) => !selected.includes(reqId)
      );
      if (missingEssentialIds.length > 0) {
        const optionTitles = level.options
          ?.filter((o) => missingEssentialIds.includes(o.id))
          .map((o) => `"${o.title}"`)
          .join(', ');
        failureReasons.push(
          `Vital care omitted: You did not fund ${optionTitles || 'essential supplies'}. Non-negotiable needs must always be satisfied first.`
        );
      }
    }

    // 3. Disallowed / Substandard Options Gate
    if (criteria.disallowedOptionIds && criteria.disallowedOptionIds.length > 0) {
      const selected = selectedOptionIds || [];
      const chosenForbidden = criteria.disallowedOptionIds.filter((disId) =>
        selected.includes(disId)
      );
      if (chosenForbidden.length > 0) {
        const forbiddenTitles = level.options
          ?.filter((o) => chosenForbidden.includes(o.id))
          .map((o) => `"${o.title}"`)
          .join(', ');
        failureReasons.push(
          `Unsafe or substandard choice: Selecting ${forbiddenTitles} risks the puppy's health or wastes funds without medical benefits.`
        );
      }
    }

    // 4. Reserve Preservation Gate
    if (criteria.minReservePreservedLKR !== undefined && criteria.minReservePreservedLKR > 0) {
      if (outcome.reservePreservedLKR < criteria.minReservePreservedLKR) {
        failureReasons.push(
          `Safety buffer too low: You preserved Rs. ${outcome.reservePreservedLKR.toLocaleString()}, but a minimum reserve of Rs. ${criteria.minReservePreservedLKR.toLocaleString()} was required for emergency preparedness.`
        );
      }
    }

    // 5. Rationale Gate
    if (criteria.requiredRationaleId && selectedRationaleId !== criteria.requiredRationaleId) {
      const chosenRationale = level.tradeoffRationales?.find(
        (r) => r.id === selectedRationaleId
      );
      failureReasons.push(
        `Financial reasoning gap: ${
          chosenRationale?.feedback ||
          'Your justification did not prioritize the puppy’s sustainable recovery over short-term appeal.'
        }`
      );
    }

    // 6. Target Competency Score Gate
    const targetScore = dimensionScores[level.targetCompetency];
    if (targetScore < criteria.minCompetencyScore) {
      failureReasons.push(
        `Target competency below threshold: Scored ${targetScore} in ${level.targetCompetency} (minimum required: ${criteria.minCompetencyScore}).`
      );
    }

    const passed = failureReasons.length === 0;

    let successSummary = '';
    let remediationGuidance: string | undefined = undefined;

    if (passed) {
      successSummary = `Outstanding work! You demonstrated solid financial stewardship. You balanced the Rs. ${level.startingBudgetLKR.toLocaleString()} budget, satisfied every essential need, and earned passage to the next challenge!`;
    } else {
      remediationGuidance = LevelMasteryEngine.generateRemediationGuidance(
        level
      );
    }

    return {
      levelId: level.id,
      levelNumber: level.levelNumber,
      passed,
      overallScore: targetScore,
      dimensionScores,
      decisionOutcome: outcome,
      characterTransition,
      failureReasons,
      successSummary,
      remediationGuidance,
      nextLevelUnlocked: passed,
      timestamp: new Date().toISOString(),
    };
  }

  private static generateRemediationGuidance(
    level: LevelDefinition
  ): string {
    const scaffolding = level.remediationScaffolding;
    return `Learning Hint: ${scaffolding.ruleExplanation}\n\nReflection Question: ${scaffolding.guidingQuestions[0] || 'Which item is genuinely indispensable right now?'}\n\nSuggested Next Attempt Focus: ${scaffolding.suggestedFocus}`;
  }
}
