// Local Prototype Storage Service for WiseCub CDEMF
// Manages mission progress, competency profile, and level locking persistence

import { CompetencyProfile } from '../types/competency.types';
import { CharacterState } from '../types/emotion.types';
import { LevelMasteryResult } from '../types/mission.types';
import { LevelAttemptRecord, MissionProgress, UserLearningState } from '../types/progress.types';

const STORAGE_KEY_STATE = 'wisecub_cdemf_user_state_v1';
const CURRENT_VERSION = '1.0.0';

export const INITIAL_PUPPY_STATE: CharacterState = {
  characterId: 'char_puppy_barnaby',
  name: 'Barnaby the Puppy',
  physicalCondition: 'NEEDS_CARE',
  emotionalState: 'WORRIED',
  conditionDescription: 'Barnaby has an injured front paw with a makeshift cloth, resting on a quiet doorstep.',
  vitalityScore: 35,
  happinessScore: 30,
  activeDialogue:
    'Whimper... My paw hurts when I put weight on it, but I am so glad I found you. Can you help me get proper care?',
};

export const INITIAL_COMPETENCY_PROFILE: CompetencyProfile = {
  budgetingSkill: 50,
  spendingDiscipline: 50,
  savingBehavior: 50,
  investmentAwareness: 50,
  goalAchievement: 50,
  secondaryMetrics: {
    emergencyPreparedness: 50,
    prioritization: 50,
    consistency: 50,
    riskAwareness: 50,
    tradeoffReasoning: 50,
  },
  detailedDimensions: {
    budgetingSkill: {
      dimension: 'budgetingSkill',
      label: 'Budgeting Skill',
      score: 50,
      evidence: 'Baseline initialization — no decisions recorded yet.',
      strengths: [],
      growthAreas: ['Complete Level 1 to establish budgeting baseline.'],
      nextActionTip: 'Check total available money before choosing items.',
    },
    spendingDiscipline: {
      dimension: 'spendingDiscipline',
      label: 'Spending Discipline',
      score: 50,
      evidence: 'Baseline initialization.',
      strengths: [],
      growthAreas: ['Demonstrate prioritizing needs over wants.'],
      nextActionTip: 'Always fund medical recovery before accessories.',
    },
    savingBehavior: {
      dimension: 'savingBehavior',
      label: 'Saving Behavior',
      score: 50,
      evidence: 'Baseline initialization.',
      strengths: [],
      growthAreas: ['Build emergency safety reserves.'],
      nextActionTip: 'Keep a portion of money aside for surprises.',
    },
    investmentAwareness: {
      dimension: 'investmentAwareness',
      label: 'Value & Investment Awareness',
      score: 50,
      evidence: 'Baseline initialization.',
      strengths: [],
      growthAreas: ['Compare quality against cost.'],
      nextActionTip: 'Avoid substandard cheap items that fail quickly.',
    },
    goalAchievement: {
      dimension: 'goalAchievement',
      label: 'Goal Achievement',
      score: 50,
      evidence: 'Baseline initialization.',
      strengths: [],
      growthAreas: ['Complete story mission levels.'],
      nextActionTip: 'Follow each mission objective carefully.',
    },
  },
  overallMasteryLevel: 'Novice',
  cumulativeAttemptsCount: 0,
  lastUpdatedIso: new Date().toISOString(),
};

export class PrototypeStorage {
  public static getUserState(): UserLearningState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_STATE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.version === CURRENT_VERSION) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error loading user state from storage, resetting to default', e);
    }

    const defaultState = this.createDefaultState();
    this.saveUserState(defaultState);
    return defaultState;
  }

  public static saveUserState(state: UserLearningState): void {
    try {
      state.updatedAtIso = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }

  public static createDefaultState(): UserLearningState {
    const defaultProgress: MissionProgress = {
      missionId: 'mission_rescue_puppy',
      unlockedLevelNumber: 1, // Only Level 1 unlocked at start!
      completedLevelNumbers: [],
      highestCompletedLevelNumber: 0,
      characterState: { ...INITIAL_PUPPY_STATE },
      attemptsByLevel: {},
      lastAttemptAtIso: new Date().toISOString(),
      isMissionCompleted: false,
      earnedCoins: 0,
    };

    return {
      version: CURRENT_VERSION,
      activeMissionId: 'mission_rescue_puppy',
      missionProgress: {
        mission_rescue_puppy: defaultProgress,
      },
      competencyProfile: { ...INITIAL_COMPETENCY_PROFILE },
      totalVirtualCoins: 0,
      createdAtIso: new Date().toISOString(),
      updatedAtIso: new Date().toISOString(),
    };
  }

  public static recordLevelAttempt(
    missionId: string,
    levelNumber: number,
    levelId: string,
    masteryResult: LevelMasteryResult,
    newCharacterState: CharacterState,
    updatedCompetencyProfile: CompetencyProfile
  ): UserLearningState {
    const state = this.getUserState();
    if (!state.missionProgress[missionId]) {
      state.missionProgress[missionId] = {
        missionId,
        unlockedLevelNumber: 1,
        completedLevelNumbers: [],
        highestCompletedLevelNumber: 0,
        characterState: { ...INITIAL_PUPPY_STATE },
        attemptsByLevel: {},
        lastAttemptAtIso: new Date().toISOString(),
        isMissionCompleted: false,
        earnedCoins: 0,
      };
    }

    const progress = state.missionProgress[missionId];
    if (!progress.attemptsByLevel[levelNumber]) {
      progress.attemptsByLevel[levelNumber] = [];
    }

    const attemptNumber = progress.attemptsByLevel[levelNumber].length + 1;
    const attemptRecord: LevelAttemptRecord = {
      attemptNumber,
      levelId,
      levelNumber,
      timestamp: new Date().toISOString(),
      passed: masteryResult.passed,
      score: masteryResult.overallScore,
      masteryResult,
    };

    progress.attemptsByLevel[levelNumber].push(attemptRecord);
    progress.lastAttemptAtIso = new Date().toISOString();
    progress.characterState = newCharacterState;

    if (masteryResult.passed) {
      if (!progress.completedLevelNumbers.includes(levelNumber)) {
        progress.completedLevelNumbers.push(levelNumber);
        progress.earnedCoins += 100;
        state.totalVirtualCoins += 100;
      }
      if (levelNumber > progress.highestCompletedLevelNumber) {
        progress.highestCompletedLevelNumber = levelNumber;
      }
      // Strictly unlock next level if passed!
      const nextLevel = levelNumber + 1;
      if (nextLevel > progress.unlockedLevelNumber) {
        progress.unlockedLevelNumber = nextLevel;
      }
      if (levelNumber >= 8) {
        progress.isMissionCompleted = true;
      }
    }

    state.competencyProfile = updatedCompetencyProfile;
    this.saveUserState(state);
    return state;
  }

  public static resetDemoData(): UserLearningState {
    const fresh = this.createDefaultState();
    this.saveUserState(fresh);
    return fresh;
  }
}
