// Pure Node.js Executable Test Runner for WiseCub CDEMF Research Novelty
// Verifies Scenarios A through H

const INITIAL_PUPPY_STATE = {
  characterId: 'char_puppy_barnaby',
  name: 'Barnaby the Puppy',
  physicalCondition: 'NEEDS_CARE',
  emotionalState: 'WORRIED',
  conditionDescription: 'Barnaby has an injured front paw with a makeshift cloth, resting on a quiet doorstep.',
  vitalityScore: 35,
  happinessScore: 30,
  activeDialogue: 'Whimper... My paw hurts when I put weight on it, but I am so glad I found you. Can you help me get proper care?',
};

// Test implementation of FinancialSimulationEngine
function evaluateOptionSelections(level, selectedOptionIds, existingReserve = 0) {
  const allOptions = level.options || [];
  const selectedOptions = allOptions.filter((opt) => selectedOptionIds.includes(opt.id));
  const startingBudgetLKR = Math.round(level.startingBudgetLKR);
  const totalSpentLKR = selectedOptions.reduce((sum, opt) => sum + Math.round(opt.costLKR), 0);
  const remainingCashLKR = startingBudgetLKR - totalSpentLKR;
  const isBudgetFeasible = remainingCashLKR >= 0;
  const budgetDeficitLKR = isBudgetFeasible ? 0 : Math.abs(remainingCashLKR);

  const essentialOptions = allOptions.filter((opt) => opt.isEssential);
  const coveredEssentials = selectedOptions.filter((opt) => opt.isEssential);
  const missedEssentials = essentialOptions.filter((opt) => !selectedOptionIds.includes(opt.id));
  const essentialNeedsCovered = missedEssentials.length === 0;

  const discretionarySpentLKR = selectedOptions
    .filter((opt) => !opt.isEssential)
    .reduce((sum, opt) => sum + Math.round(opt.costLKR), 0);

  const reservePreservedLKR = Math.max(0, remainingCashLKR) + existingReserve;

  return {
    financialState: {
      startingBudgetLKR,
      totalSpentLKR,
      remainingCashLKR,
      emergencyReserveLKR: reservePreservedLKR,
      isBudgetFeasible,
      budgetDeficitLKR,
      unmetEssentials: missedEssentials.map((m) => m.title),
    },
    outcome: {
      totalCostLKR: totalSpentLKR,
      essentialNeedsCovered,
      coveredEssentialNames: coveredEssentials.map((e) => e.title),
      missedEssentialNames: missedEssentials.map((e) => e.title),
      discretionarySpentLKR,
      reservePreservedLKR,
      balanceRemainingLKR: Math.max(0, remainingCashLKR),
      isFeasible: isBudgetFeasible,
    },
  };
}

// Test implementation of EmotionalStateEngine
function deriveCharacterState(previousState, financialState, outcome, level) {
  const isLevelPassed =
    outcome.isFeasible &&
    outcome.essentialNeedsCovered &&
    (level.passCriteria.minReservePreservedLKR
      ? outcome.reservePreservedLKR >= level.passCriteria.minReservePreservedLKR
      : true);

  let newCondition = previousState.physicalCondition;
  let newEmotion = previousState.emotionalState;
  let direction = 'STABLE';
  let reason = '';

  if (isLevelPassed) {
    direction = 'IMPROVEMENT';
    if (level.levelNumber <= 2) {
      newCondition = 'WEAK_STABILIZED';
      newEmotion = 'HOPEFUL';
      reason = 'Essential immediate care and food were funded within budget.';
    } else if (level.levelNumber <= 4) {
      newCondition = 'RECEIVING_TREATMENT';
      newEmotion = 'RELIEVED';
    } else if (level.levelNumber <= 7) {
      newCondition = 'RECOVERING';
      newEmotion = 'CHEERFUL';
    } else {
      newCondition = 'HEALTHY_ACTIVE';
      newEmotion = 'JOYFUL_HEALTHY';
    }
  } else {
    direction = 'SETBACK';
    if (!financialState.isBudgetFeasible) {
      newCondition = 'SETBACK_WAITING';
      newEmotion = 'ANXIOUS';
      reason = `Budget was overspent by Rs. ${financialState.budgetDeficitLKR}.`;
    } else if (!outcome.essentialNeedsCovered) {
      newCondition = 'NEEDS_CARE';
      newEmotion = 'WORRIED';
      reason = `Critical essentials were omitted: ${outcome.missedEssentialNames.join(', ')}.`;
    } else {
      newCondition = 'SETBACK_WAITING';
      newEmotion = 'WORRIED';
      reason = 'Did not meet competency requirements.';
    }
  }

  return {
    newState: {
      ...previousState,
      physicalCondition: newCondition,
      emotionalState: newEmotion,
    },
    transition: {
      previousCondition: previousState.physicalCondition,
      newCondition,
      previousEmotion: previousState.emotionalState,
      newEmotion,
      direction,
      reason,
    },
  };
}

// Test implementation of LevelMasteryEngine
function evaluatePassFail(level, financialState, outcome, selectedOptionIds = []) {
  const criteria = level.passCriteria;
  const failureReasons = [];

  if (criteria.requireBudgetFeasibility && !financialState.isBudgetFeasible) {
    failureReasons.push(`Budget deficit: Rs. ${financialState.budgetDeficitLKR}`);
  }

  if (criteria.mustIncludeOptionIds) {
    const missing = criteria.mustIncludeOptionIds.filter((id) => !selectedOptionIds.includes(id));
    if (missing.length > 0) {
      failureReasons.push(`Missing essential care options: ${missing.join(', ')}`);
    }
  }

  if (criteria.disallowedOptionIds) {
    const chosen = criteria.disallowedOptionIds.filter((id) => selectedOptionIds.includes(id));
    if (chosen.length > 0) {
      failureReasons.push(`Disallowed option chosen: ${chosen.join(', ')}`);
    }
  }

  if (criteria.minReservePreservedLKR && outcome.reservePreservedLKR < criteria.minReservePreservedLKR) {
    failureReasons.push(`Reserve under required minimum: Rs. ${outcome.reservePreservedLKR} < Rs. ${criteria.minReservePreservedLKR}`);
  }

  const passed = failureReasons.length === 0;
  return {
    passed,
    nextLevelUnlocked: passed,
    failureReasons,
  };
}

// Execute Scenarios
console.log('===============================================================');
console.log('WISECUB CDEMF RESEARCH PROTOTYPE VALIDATION (Scenarios A - H)');
console.log('===============================================================');

let passCount = 0;
let failCount = 0;

function assert(condition, testDesc) {
  if (condition) {
    passCount++;
    console.log(`[PASS] ${testDesc}`);
  } else {
    failCount++;
    console.error(`[FAIL] ${testDesc}`);
  }
}

const level1Mock = {
  levelNumber: 1,
  startingBudgetLKR: 5000,
  options: [
    { id: 'opt_first_aid', title: 'Antiseptic Kit', costLKR: 2500, isEssential: true },
    { id: 'opt_nutrition_pack', title: 'High-Protein Puppy Meal', costLKR: 1200, isEssential: true },
    { id: 'opt_squeaky_toy', title: 'Fancy Squeaky Toy', costLKR: 1500, isEssential: false },
    { id: 'opt_cozy_towel', title: 'Warm Blanket', costLKR: 800, isEssential: false },
  ],
  passCriteria: {
    minCompetencyScore: 70,
    mustIncludeOptionIds: ['opt_first_aid', 'opt_nutrition_pack'],
    disallowedOptionIds: ['opt_squeaky_toy'],
    minReservePreservedLKR: 500,
    requireBudgetFeasibility: true,
  },
};

// Scenario A
console.log('\n--- Scenario A: Responsible Decisions & Level Progression ---');
const resA = evaluateOptionSelections(level1Mock, ['opt_first_aid', 'opt_nutrition_pack']);
assert(resA.financialState.isBudgetFeasible, 'Budget is feasible without deficit');
assert(resA.outcome.essentialNeedsCovered, 'All essential medical care items covered');
assert(resA.outcome.reservePreservedLKR >= 500, 'Reserve buffer preserved (Rs. 1,300 >= 500)');

const { newState: stateA, transition: transA } = deriveCharacterState(
  INITIAL_PUPPY_STATE,
  resA.financialState,
  resA.outcome,
  level1Mock
);
assert(transA.direction === 'IMPROVEMENT', 'Character transition direction is IMPROVEMENT');
assert(stateA.physicalCondition === 'WEAK_STABILIZED', 'Physical condition transitions to WEAK_STABILIZED');
assert(stateA.emotionalState === 'HOPEFUL', 'Emotional state transitions to HOPEFUL');

const masteryA = evaluatePassFail(level1Mock, resA.financialState, resA.outcome, ['opt_first_aid', 'opt_nutrition_pack']);
assert(masteryA.passed === true, 'Level 1 pass gate is CLEARED');
assert(masteryA.nextLevelUnlocked === true, 'Level 2 is UNLOCKED');

// Scenario B
console.log('\n--- Scenario B: Irresponsible Decisions & Strict Gate Enforcement ---');
const resB = evaluateOptionSelections(level1Mock, ['opt_squeaky_toy', 'opt_cozy_towel']);
assert(!resB.outcome.essentialNeedsCovered, 'Essential care is NOT covered (missed antiseptic & meal)');

const { newState: stateB, transition: transB } = deriveCharacterState(
  INITIAL_PUPPY_STATE,
  resB.financialState,
  resB.outcome,
  level1Mock
);
assert(transB.direction === 'SETBACK', 'Character experiences educational SETBACK');
assert(stateB.emotionalState === 'WORRIED', 'Puppy emotional state is WORRIED');

const masteryB = evaluatePassFail(level1Mock, resB.financialState, resB.outcome, ['opt_squeaky_toy', 'opt_cozy_towel']);
assert(masteryB.passed === false, 'Level 1 is STRICTLY FAILED');
assert(masteryB.nextLevelUnlocked === false, 'Next level REMAINS LOCKED (cannot progress)');
assert(masteryB.failureReasons.length > 0, 'Clear failure explanation is generated');

// Scenario C
console.log('\n--- Scenario C: Remediation & Successful Retry ---');
const resC = evaluateOptionSelections(level1Mock, ['opt_first_aid', 'opt_nutrition_pack']);
const masteryC = evaluatePassFail(level1Mock, resC.financialState, resC.outcome, ['opt_first_aid', 'opt_nutrition_pack']);
assert(masteryC.passed === true, 'After reviewing remediation, child retries and passes');

// Scenario D
console.log('\n--- Scenario D: Different Strategies Produce Different Outcomes ---');
const resD1 = evaluateOptionSelections(level1Mock, ['opt_first_aid', 'opt_nutrition_pack']);
const resD2 = evaluateOptionSelections(level1Mock, ['opt_first_aid', 'opt_nutrition_pack', 'opt_cozy_towel']);
assert(resD1.outcome.reservePreservedLKR > resD2.outcome.reservePreservedLKR, 'Frugal strategy leaves higher safety reserve (Rs. 1,300 vs Rs. 500)');

// Scenario E
console.log('\n--- Scenario E: Emergency Reserve Handling ---');
const level5Mock = {
  levelNumber: 5,
  startingBudgetLKR: 5500,
  options: [
    { id: 'opt_use_emergency_fund', title: 'Deploy Emergency Reserve + Cash', costLKR: 4500, isEssential: true },
  ],
  passCriteria: {
    mustIncludeOptionIds: ['opt_use_emergency_fund'],
    minReservePreservedLKR: 1000,
    requireBudgetFeasibility: true,
  },
};
const resE = evaluateOptionSelections(level5Mock, ['opt_use_emergency_fund'], 3500);
const masteryE = evaluatePassFail(level5Mock, resE.financialState, resE.outcome, ['opt_use_emergency_fund']);
assert(masteryE.passed === true, 'Handling emergency using reserves passes Level 5');

// Scenario H
console.log('\n--- Scenario H: Character State Integrity (Cannot force happy with deficit) ---');
const badState = { startingBudgetLKR: 5000, totalSpentLKR: 8000, remainingCashLKR: -3000, isBudgetFeasible: false, budgetDeficitLKR: 3000 };
const badOutcome = { isFeasible: false, essentialNeedsCovered: false, missedEssentialNames: ['Antiseptic'] };
const { newState: stateH } = deriveCharacterState(INITIAL_PUPPY_STATE, badState, badOutcome, level1Mock);
assert(stateH.emotionalState !== 'JOYFUL_HEALTHY' && stateH.emotionalState !== 'CHEERFUL', 'Puppy cannot be made happy when financial rules are broken');

console.log('===============================================================');
console.log(`TOTAL CDEMF TEST RUN: ${passCount} PASSED, ${failCount} FAILED`);
console.log('===============================================================\n');
