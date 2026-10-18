// Future AI Integration Contract for WiseCub CDEMF
// Defines typed interface for future ML model integration while using deterministic engine for prototype

import { CoreCompetencyDimension } from '../types/competency.types';
import { DecisionOutcome, FinancialState } from '../types/financial.types';
import { LevelDefinition } from '../types/mission.types';
import { LevelAttemptRecord } from '../types/progress.types';
import { CompetencyEvaluationEngine } from '../engine/competencyEvaluationEngine';

export interface CompetencyPredictionContext {
  missionId: string;
  level: LevelDefinition;
  financialState: FinancialState;
  decisionOutcome: DecisionOutcome;
  priorAttempts: LevelAttemptRecord[];
  selectedRationaleId?: string;
}

export interface CompetencyPredictionResult {
  estimatedProfile: Record<CoreCompetencyDimension, number>;
  identifiedLearningGaps: string[];
  suggestedNextPracticeFocus: string;
  confidenceScore?: number; // Optional calibrated uncertainty for future ML model (0.0 - 1.0)
  isRulesBasedPrototype: boolean;
}

/**
 * Interface that future ML / neural-net / LLM inference services must adhere to
 */
export interface CompetencyPredictor {
  predictCompetencies(
    context: CompetencyPredictionContext
  ): Promise<CompetencyPredictionResult>;
}

/**
 * Baseline Prototype Implementation:
 * Uses our transparent, explainable deterministic evaluation engine
 */
export class DeterministicCompetencyPredictor implements CompetencyPredictor {
  public async predictCompetencies(
    context: CompetencyPredictionContext
  ): Promise<CompetencyPredictionResult> {
    const evaluation = CompetencyEvaluationEngine.evaluateDecision(
      context.level,
      context.financialState,
      context.decisionOutcome,
      context.selectedRationaleId
    );

    const gaps: string[] = [];
    if (evaluation.dimensionScores.budgetingSkill < 70) {
      gaps.push('Budget discipline & avoiding deficits');
    }
    if (evaluation.dimensionScores.spendingDiscipline < 70) {
      gaps.push('Prioritizing essential medical care over optional wants');
    }
    if (evaluation.dimensionScores.savingBehavior < 70) {
      gaps.push('Maintaining an emergency safety cushion');
    }

    return {
      estimatedProfile: evaluation.dimensionScores,
      identifiedLearningGaps: gaps,
      suggestedNextPracticeFocus:
        gaps.length > 0 ? gaps[0] : 'Continue to advance through increasingly complex scenarios',
      confidenceScore: 0.95, // High confidence in deterministic rule verification
      isRulesBasedPrototype: true,
    };
  }
}
