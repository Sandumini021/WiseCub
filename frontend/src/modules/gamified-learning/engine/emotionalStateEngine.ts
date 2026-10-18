// Emotional State Engine for WiseCub CDEMF
// Implements explainable, bidirectional state transitions for character emotional and physical conditions

import {
  CharacterEmotionalState,
  CharacterPhysicalCondition,
  CharacterState,
  CharacterTransition,
} from '../types/emotion.types';
import { DecisionOutcome, FinancialState } from '../types/financial.types';
import { LevelDefinition } from '../types/mission.types';

export class EmotionalStateEngine {
  /**
   * Evaluates the character's reaction to a financial decision.
   * BIDIRECTIONAL: Can improve or experience educational, reversible setbacks.
   */
  public static deriveCharacterState(
    previousState: CharacterState,
    financialState: FinancialState,
    outcome: DecisionOutcome,
    level: LevelDefinition
  ): {
    newState: CharacterState;
    transition: CharacterTransition;
  } {
    const isLevelPassed =
      outcome.isFeasible &&
      outcome.essentialNeedsCovered &&
      (level.passCriteria.minReservePreservedLKR
        ? outcome.reservePreservedLKR >= level.passCriteria.minReservePreservedLKR
        : true);

    let newCondition: CharacterPhysicalCondition = previousState.physicalCondition;
    let newEmotion: CharacterEmotionalState = previousState.emotionalState;
    let direction: 'IMPROVEMENT' | 'SETBACK' | 'STABLE' = 'STABLE';
    let reason = '';
    let dialogue = '';
    let learningExplanation = '';
    let visualCue = '';
    let vitalityChange = 0;
    let happinessChange = 0;

    if (isLevelPassed) {
      direction = 'IMPROVEMENT';
      // Progressive improvement based on level progression and good stewardship
      if (level.levelNumber <= 2) {
        newCondition = 'WEAK_STABILIZED';
        newEmotion = 'HOPEFUL';
        reason = 'Essential immediate care and food were funded within budget.';
        dialogue = 'Woof! The soft bandage feels cool and soothing on my paw. Thank you for thinking of my real needs first!';
        learningExplanation = 'Because you prioritized essential needs over discretionary wants, the puppy is now safe and stabilized.';
        visualCue = 'puppy-hopeful';
        vitalityChange = +20;
        happinessChange = +25;
      } else if (level.levelNumber <= 4) {
        newCondition = 'RECEIVING_TREATMENT';
        newEmotion = 'RELIEVED';
        reason = 'Medication and clinic care were secured through patient savings and smart purchasing.';
        dialogue = 'The clinic doctor was kind! The medicine is working and I can gently put my foot on the ground.';
        learningExplanation = 'Disciplined saving and choosing certified care gave the puppy professional treatment without debt.';
        visualCue = 'puppy-treatment';
        vitalityChange = +25;
        happinessChange = +25;
      } else if (level.levelNumber <= 7) {
        newCondition = 'RECOVERING';
        newEmotion = 'CHEERFUL';
        reason = 'Emergency reserve protected the puppy from sudden setbacks and recurring care is steady.';
        dialogue = 'I can walk to the bowl on my own today! My tail is wagging so fast because you planned ahead.';
        learningExplanation = 'Holding an emergency reserve absorbed the sudden surprise expense smoothly, keeping recovery on schedule.';
        visualCue = 'puppy-recovering';
        vitalityChange = +20;
        happinessChange = +25;
      } else {
        // Level 8 (Capstone Rescue Completion)
        newCondition = 'HEALTHY_ACTIVE';
        newEmotion = 'JOYFUL_HEALTHY';
        reason = 'Complete financial plan executed: puppy is fully healed, playful, and has a lasting safety fund.';
        dialogue = 'Yip yip hurrah! Look at me run and jump in the sunny grass! We did it together with wise financial choices!';
        learningExplanation = 'Mastery demonstrated across budgeting, saving, and emergency resilience. The puppy is fully recovered and secure!';
        visualCue = 'puppy-rescued';
        vitalityChange = +30;
        happinessChange = +30;
      }
    } else {
      // SETBACK / WAITING (Educational and Reversible)
      direction = 'SETBACK';
      if (!financialState.isBudgetFeasible) {
        newCondition = 'SETBACK_WAITING';
        newEmotion = 'ANXIOUS';
        reason = `Budget was overspent by Rs. ${financialState.budgetDeficitLKR.toLocaleString()}, halting treatment until funds are recalculated.`;
        dialogue = 'Whimper... The clinic counter said the bill cannot be paid. We need to recount our money so I can get my medicine.';
        learningExplanation = 'Overspending creates a deficit that freezes purchasing. We must adjust the plan to stay within our means.';
        visualCue = 'puppy-waiting';
        vitalityChange = -10;
        happinessChange = -20;
      } else if (!outcome.essentialNeedsCovered) {
        newCondition = 'NEEDS_CARE';
        newEmotion = 'WORRIED';
        reason = `Critical essentials were omitted: ${outcome.missedEssentialNames.join(', ')}.`;
        dialogue = 'My leg still throbs a bit because we bought accessories instead of the clean bandage and antiseptic.';
        learningExplanation = 'Optional items cannot heal wounds. Prioritizing wants before essentials delays necessary medical care.';
        visualCue = 'puppy-sad';
        vitalityChange = -15;
        happinessChange = -20;
      } else if (
        level.passCriteria.minReservePreservedLKR &&
        outcome.reservePreservedLKR < level.passCriteria.minReservePreservedLKR
      ) {
        newCondition = 'WEAK_STABILIZED';
        newEmotion = 'VULNERABLE';
        reason = `Reserve buffer was exhausted (Rs. ${outcome.reservePreservedLKR.toLocaleString()} remaining vs recommended Rs. ${level.passCriteria.minReservePreservedLKR.toLocaleString()}).`;
        dialogue = 'I have my meal, but what if another surprise happens tomorrow? We have no coins left in the safety jar...';
        learningExplanation = 'Zero reserves leave the puppy exposed to sudden risks. Keeping a safety cushion builds true financial resilience.';
        visualCue = 'puppy-worried';
        vitalityChange = -5;
        happinessChange = -15;
      } else {
        newCondition = 'SETBACK_WAITING';
        newEmotion = 'WORRIED';
        reason = 'Decision did not meet the target financial competency standard.';
        dialogue = 'I believe in you! Let us re-examine our choices and balance the budget carefully.';
        learningExplanation = 'Financial mistakes happen. Analyze the feedback, adjust your allocations, and try again.';
        visualCue = 'puppy-waiting';
        vitalityChange = -5;
        happinessChange = -10;
      }
    }

    const newVitality = Math.min(
      100,
      Math.max(15, previousState.vitalityScore + vitalityChange)
    );
    const newHappiness = Math.min(
      100,
      Math.max(15, previousState.happinessScore + happinessChange)
    );

    const conditionDescription = EmotionalStateEngine.getConditionDescription(
      newCondition,
      previousState.name
    );

    const newState: CharacterState = {
      ...previousState,
      physicalCondition: newCondition,
      emotionalState: newEmotion,
      conditionDescription,
      vitalityScore: newVitality,
      happinessScore: newHappiness,
      activeDialogue: dialogue,
    };

    const transition: CharacterTransition = {
      characterId: previousState.characterId,
      previousCondition: previousState.physicalCondition,
      newCondition,
      previousEmotion: previousState.emotionalState,
      newEmotion,
      direction,
      reason,
      characterDialogue: dialogue,
      learningExplanation,
      visualCue,
    };

    return { newState, transition };
  }

  private static getConditionDescription(
    condition: CharacterPhysicalCondition,
    name: string
  ): string {
    switch (condition) {
      case 'NEEDS_CARE':
        return `${name} is injured with a hurt paw, resting cautiously and needing urgent care.`;
      case 'WEAK_STABILIZED':
        return `${name} has a fresh bandage and food, resting safely and quietly building strength.`;
      case 'RECEIVING_TREATMENT':
        return `${name} is undergoing treatment at the clinic with gentle vet support.`;
      case 'RECOVERING':
        return `${name} is walking gingerly on all four paws, smiling with bright hopeful eyes!`;
      case 'HEALTHY_ACTIVE':
        return `${name} is fully healed, jumping with joy in the sunny yard! Complete recovery achieved.`;
      case 'SETBACK_WAITING':
        return `${name} is patiently waiting for financial planning to balance needed care.`;
    }
  }
}
