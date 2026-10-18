// Adaptive Learning Engine for WiseCub CDEMF
// Analyzes student behavioral patterns across attempts and provides pedagogical adaptation

import { CompetencyProfile } from '../types/competency.types';
import { AdaptiveRecommendation, MissionProgress } from '../types/progress.types';

export class AdaptiveLearningEngine {
  /**
   * Evaluates historical performance and derives adaptive learning recommendations.
   * Does NOT bypass competency gates; rather, it tailors hints and scaffolding.
   */
  public static deriveAdaptiveRecommendation(
    missionProgress: MissionProgress,
    competencyProfile: CompetencyProfile
  ): AdaptiveRecommendation {
    const consecutiveFailsOnCurrent = (
      missionProgress.attemptsByLevel[missionProgress.unlockedLevelNumber] || []
    ).filter((a) => !a.passed).length;

    // Pattern 1: High failure rate due to impulse spending / needs vs wants
    if (competencyProfile.spendingDiscipline < 60) {
      return {
        recommendedMissionId: missionProgress.missionId,
        recommendedLevelNumber: missionProgress.unlockedLevelNumber,
        learningGapIdentified: 'Temptation towards non-essential discretionary items before core medical care.',
        pedagogicalRationale:
          'Your spending discipline score is developing. Before making any allocation, mentally separate indispensable needs from nice-to-have extras.',
        suggestedPracticeType: 'Needs-vs-Wants Scaffolding',
        challengeAdjustment: consecutiveFailsOnCurrent >= 2 ? 'SCAFFOLDED' : 'STANDARD',
      };
    }

    // Pattern 2: Neglecting emergency reserves
    if (competencyProfile.savingBehavior < 65) {
      return {
        recommendedMissionId: missionProgress.missionId,
        recommendedLevelNumber: missionProgress.unlockedLevelNumber,
        learningGapIdentified: 'Depleting emergency reserves and spending all available funds.',
        pedagogicalRationale:
          'Your reserve margin has been low. Real financial resilience requires keeping at least 15-20% of your funds untouched for emergencies.',
        suggestedPracticeType: 'Safety Buffer Planning',
        challengeAdjustment: consecutiveFailsOnCurrent >= 2 ? 'SCAFFOLDED' : 'STANDARD',
      };
    }

    // Pattern 3: Deficit / Overspending
    if (competencyProfile.budgetingSkill < 65) {
      return {
        recommendedMissionId: missionProgress.missionId,
        recommendedLevelNumber: missionProgress.unlockedLevelNumber,
        learningGapIdentified: 'Over-allocating funds beyond total available virtual money.',
        pedagogicalRationale:
          'Always monitor your live remaining balance bar before confirming decisions. Overspending locks you out of passing.',
        suggestedPracticeType: 'Strict Ledger Tracking',
        challengeAdjustment: 'SCAFFOLDED',
      };
    }

    // Pattern 4: High mastery / Proficient learner
    if (competencyProfile.overallMasteryLevel === 'Advanced' || competencyProfile.overallMasteryLevel === 'Proficient') {
      return {
        recommendedMissionId: missionProgress.missionId,
        recommendedLevelNumber: missionProgress.unlockedLevelNumber,
        learningGapIdentified: undefined,
        pedagogicalRationale:
          'You are demonstrating consistent financial maturity across budgeting, saving, and trade-off analysis. Ready for higher-order financial challenges!',
        suggestedPracticeType: 'Multi-variable Optimization',
        challengeAdjustment: 'EXTENSION',
      };
    }

    // Default
    return {
      recommendedMissionId: missionProgress.missionId,
      recommendedLevelNumber: missionProgress.unlockedLevelNumber,
      learningGapIdentified: undefined,
      pedagogicalRationale:
        'Continue following the sequential levels to build financial mastery through caring for the puppy.',
      suggestedPracticeType: 'Standard Mission Progression',
      challengeAdjustment: consecutiveFailsOnCurrent >= 2 ? 'SCAFFOLDED' : 'STANDARD',
    };
  }
}
