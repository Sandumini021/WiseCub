// Progress and Persistence Types for CDEMF

import { CharacterState } from './emotion.types';
import { CompetencyProfile } from './competency.types';
import { LevelMasteryResult } from './mission.types';

export interface LevelAttemptRecord {
  attemptNumber: number;
  levelId: string;
  levelNumber: number;
  timestamp: string;
  passed: boolean;
  score: number;
  masteryResult: LevelMasteryResult;
}

export interface AdaptiveRecommendation {
  recommendedMissionId: string;
  recommendedLevelNumber: number;
  learningGapIdentified?: string;
  pedagogicalRationale: string;
  suggestedPracticeType: string;
  challengeAdjustment: 'STANDARD' | 'SCAFFOLDED' | 'EXTENSION';
}

export interface MissionProgress {
  missionId: string;
  unlockedLevelNumber: number; // 1-based, 1 means Level 1 is open
  completedLevelNumbers: number[];
  highestCompletedLevelNumber: number;
  characterState: CharacterState;
  attemptsByLevel: Record<number, LevelAttemptRecord[]>;
  lastAttemptAtIso: string;
  isMissionCompleted: boolean;
  earnedCoins: number;
}

export interface UserLearningState {
  version: string;
  activeMissionId: string;
  missionProgress: Record<string, MissionProgress>;
  competencyProfile: CompetencyProfile;
  totalVirtualCoins: number;
  adaptiveRecommendation?: AdaptiveRecommendation;
  createdAtIso: string;
  updatedAtIso: string;
}
