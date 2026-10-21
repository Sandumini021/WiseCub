import { CharacterStateApi } from '../services/gamifiedApi';

export interface JourneyOverviewStats {
  totalMissionsCompleted: number;
  totalMissionsCount: number;
  totalLevelsCompleted: number;
  totalLevelsCount: number;
  overallCompetencyScore: number | null;
  earnedCoins: number;
  masteryTier: string;
  activeMissionId: string;
  nextRecommendedLevel: number;
}

export interface JourneyMissionSummary {
  missionId: string;
  title: string;
  characterName: string;
  characterRole: string;
  focusSkill: string;
  themeColor: string;
  totalLevels: number;
  completedLevelsCount: number;
  completedLevelNumbers: number[];
  unlockedLevelNumber: number;
  progressPercent: number;
  isCompleted: boolean;
  earnedCoins: number;
  competencyStatus: string;
  characterState: CharacterStateApi;
}

export interface SkillMetric {
  skillKey: string;
  name: string;
  category: string;
  score: number | null;
  evidenceCount: number;
  hasSufficientEvidence: boolean;
  status: 'insufficient_evidence' | 'developing' | 'proficient' | 'mastered' | string;
  isStrength: boolean;
  needsPractice: boolean;
  description: string;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progressCurrent: number;
  progressTarget: number;
  unlockCondition: string;
}

export interface EmotionalImpactRecord {
  missionId: string;
  missionTitle: string;
  characterName: string;
  levelNumber: number;
  attemptNumber: number;
  previousCondition: string;
  newCondition: string;
  previousEmotion: string;
  newEmotion: string;
  direction: string;
  reason: string;
  characterDialogue: string;
  learningExplanation: string;
  visualCue: string;
  recordedAt: string;
  improvedAfterRetry: boolean;
}

export interface LearningTip {
  title: string;
  description: string;
  category: string;
  actionMissionId: string | null;
  actionLevelNumber: number | null;
  actionLabel: string;
}

export interface JourneyOverview {
  studentName: string;
  childId: string;
  overview: JourneyOverviewStats;
  missions: JourneyMissionSummary[];
  financialSkillsProfile: SkillMetric[];
  achievements: AchievementBadge[];
  emotionalImpactShowcase: EmotionalImpactRecord[];
  learningTips: LearningTip[];
}

export interface JourneyLevelDetail {
  levelNumber: number;
  levelId: string;
  title: string;
  focusDimension: string;
  interactionType: string;
  status: 'COMPLETED' | 'CURRENT' | 'LOCKED' | string;
  bestScore: number | null;
  attemptsCount: number;
}

export interface JourneyMissionDetail {
  missionId: string;
  title: string;
  characterName: string;
  characterRole: string;
  focusSkill: string;
  themeColor: string;
  totalLevels: number;
  completedLevelsCount: number;
  progressPercent: number;
  isCompleted: boolean;
  levels: JourneyLevelDetail[];
  recentAttempts: Array<Record<string, any>>;
  characterState: CharacterStateApi;
  characterHistory: Array<{
    timestamp: string;
    level_number: number;
    attempt_number: number;
    physical_condition: string;
    emotional_state: string;
    vitality_score: number;
    happiness_score: number;
    transition_direction: string;
    transition_reason: string;
  }>;
}


export interface AdaptiveRecommendation {
  childId: string;
  recommendedCategory: 'FOUNDATION' | 'STANDARD' | 'ADVANCED';
  recommendedCompetency: string;
  recommendedMissionId: string;
  recommendedMissionTitle: string;
  recommendedLevelNumber: number;
  recommendedLevelId: string;
  recommendedLevelTitle: string;
  recommendedInteractionType: string;
  recommendationTitle: string;
  explanation: string;
  pedagogicalAction: string;
  isOptional: boolean;
  predictionSource: string;
  fallbackUsed: boolean;
  fallbackReason: string | null;
  modelVersion: string;
  canNavigate: boolean;
}
