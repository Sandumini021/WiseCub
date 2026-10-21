import type { JourneyOverview, JourneyMissionDetail, AdaptiveRecommendation } from '../types/journey.types';
/**
 * Gamified-Learning API Service — WiseCub CDEMF
 *
 * Replaces local-only localStorage calls with backend API calls.
 * All financial evaluation, level locking, and competency scoring
 * happens server-side. The frontend renders what the server returns.
 *
 * Demo mode: if the user is not authenticated (no wisecub_session cookie),
 * the service throws an ApiError(401) which callers must handle explicitly.
 * There is NO silent fallback to fake successful API responses.
 */

import {
  apiGet,
  apiPost,
  ApiError,
} from '../../../services/apiClient';

import type { MissionProgress } from '../types/progress.types';
import type { CharacterState, CharacterTransition } from '../types/emotion.types';
import type { DecisionOutcome } from '../types/financial.types';

// ── API shape types (mirrors backend Pydantic models) ────────────────────────

export interface MissionSummaryApi {
  id: string;
  title: string;
  character_name: string;
  primary_competency: string;
  total_levels: number;
  theme_color: string;
  description: string;
}

export interface MissionCatalogApi {
  missions: MissionSummaryApi[];
}

export interface CharacterStateApi {
  character_id: string;
  name: string;
  physical_condition: string;
  emotional_state: string;
  condition_description: string;
  vitality_score: number;
  happiness_score: number;
  active_dialogue: string;
}

export interface MissionProgressApi {
  mission_id: string;
  unlocked_level_number: number;
  completed_level_numbers: number[];
  highest_completed_level_number: number;
  character_state: CharacterStateApi;
  last_attempt_at_iso: string;
  is_mission_completed: boolean;
  earned_coins: number;
  attempt_counts_by_level: Record<string, number>;
}

export interface LevelStartApi {
  ok: boolean;
  mission_id: string;
  level_id: string;
  level_number: number;
  is_retry: boolean;
  attempt_number: number;
}

export interface DimensionScoresApi {
  budgeting_skill: number;
  spending_discipline: number;
  saving_behavior: number;
  investment_awareness: number;
  goal_achievement: number;
}

export interface SecondaryScoresApi {
  prioritization: number;
  emergency_preparedness: number;
  consistency: number;
  risk_awareness: number;
  tradeoff_reasoning: number;
}

export interface DecisionOutcomeApi {
  total_cost_lkr: number;
  essential_needs_covered: boolean;
  covered_essential_names: string[];
  missed_essential_names: string[];
  discretionary_spent_lkr: number;
  reserve_preserved_lkr: number;
  balance_remaining_lkr: number;
  is_feasible: boolean;
  financial_impact_summary: string;
}

export interface CharacterTransitionApi {
  previous_condition: string;
  new_condition: string;
  previous_emotion: string;
  new_emotion: string;
  direction: string;
  reason: string;
  character_dialogue: string;
  learning_explanation: string;
  visual_cue: string;
}

export interface AdaptiveRecommendationApi {
  recommended_level_number: number;
  learning_gap_identified: string | null;
  pedagogical_rationale: string;
  suggested_practice_type: string;
  challenge_adjustment: 'STANDARD' | 'SCAFFOLDED' | 'EXTENSION';
}

export interface EvaluationResultApi {
  mission_id: string;
  level_id: string;
  level_number: number;
  attempt_number: number;
  passed: boolean;
  overall_score: number;
  target_score: number;
  dimension_scores: DimensionScoresApi;
  secondary_scores: SecondaryScoresApi;
  decision_outcome: DecisionOutcomeApi;
  character_state: CharacterStateApi;
  character_transition: CharacterTransitionApi;
  failure_reasons: string[];
  success_summary: string;
  remediation_guidance: string | null;
  next_level_unlocked: boolean;
  adaptive_recommendation: AdaptiveRecommendationApi;
  is_rules_based_prototype: boolean;
  schema_version: string;
}

export interface CompetencyHistoryApi {
  mission_id: string;
  entries: Array<{
    level_id: string;
    level_number: number;
    attempt_number: number;
    timestamp: string;
    passed: boolean;
    dimension_scores: DimensionScoresApi;
    overall_score: number;
  }>;
  current_profile: Record<string, number>;
}

export interface CharacterStateHistoryApi {
  mission_id: string;
  character_name: string;
  history: Array<{
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

// ── Multi-period week decision ────────────────────────────────────────────────

export interface WeeklyDecisionInput {
  period: number;
  saved_amount_lkr: number;
  resisted_temptation: boolean;
}

// ── Converters: API → frontend types ─────────────────────────────────────────

export function charStateFromApi(api: CharacterStateApi): CharacterState {
  return {
    characterId: api.character_id,
    name: api.name,
    physicalCondition: api.physical_condition as CharacterState['physicalCondition'],
    emotionalState: api.emotional_state as CharacterState['emotionalState'],
    conditionDescription: api.condition_description,
    vitalityScore: api.vitality_score,
    happinessScore: api.happiness_score,
    activeDialogue: api.active_dialogue,
  };
}

export function charTransitionFromApi(api: CharacterTransitionApi): CharacterTransition {
  return {
    characterId: '', // enriched client-side if needed
    previousCondition: api.previous_condition as CharacterTransition['previousCondition'],
    newCondition: api.new_condition as CharacterTransition['newCondition'],
    previousEmotion: api.previous_emotion as CharacterTransition['previousEmotion'],
    newEmotion: api.new_emotion as CharacterTransition['newEmotion'],
    direction: api.direction as CharacterTransition['direction'],
    reason: api.reason,
    characterDialogue: api.character_dialogue,
    learningExplanation: api.learning_explanation,
    visualCue: api.visual_cue,
  };
}

export function decisionOutcomeFromApi(api: DecisionOutcomeApi): DecisionOutcome {
  return {
    decisionId: '',
    totalCostLKR: api.total_cost_lkr,
    essentialNeedsCovered: api.essential_needs_covered,
    coveredEssentialNames: api.covered_essential_names,
    missedEssentialNames: api.missed_essential_names,
    discretionarySpentLKR: api.discretionary_spent_lkr,
    reservePreservedLKR: api.reserve_preserved_lkr,
    balanceRemainingLKR: api.balance_remaining_lkr,
    isFeasible: api.is_feasible,
    financialImpactSummary: api.financial_impact_summary,
  };
}

export function progressFromApi(api: MissionProgressApi): MissionProgress {
  return {
    missionId: api.mission_id,
    unlockedLevelNumber: api.unlocked_level_number,
    completedLevelNumbers: api.completed_level_numbers,
    highestCompletedLevelNumber: api.highest_completed_level_number,
    characterState: charStateFromApi(api.character_state),
    attemptsByLevel: {}, // server returns attempt counts; full records fetched lazily
    lastAttemptAtIso: api.last_attempt_at_iso,
    isMissionCompleted: api.is_mission_completed,
    earnedCoins: api.earned_coins,
  };
}

// ── API calls ────────────────────────────────────────────────────────────────

/** Retrieve the full mission catalog. No authentication required. */
export function getMissionCatalog(): Promise<MissionCatalogApi> {
  return apiGet<MissionCatalogApi>('/api/gamified/catalog');
}

/** Retrieve metadata for a single mission. */
export function getMissionDefinition(missionId: string): Promise<Record<string, unknown>> {
  return apiGet<Record<string, unknown>>(`/api/gamified/missions/${missionId}`);
}

/**
 * Start or resume a mission.
 * Creates a progress record server-side if none exists.
 * Returns the current MissionProgress (may be fresh or pre-existing).
 */
export function startOrResumeMission(missionId: string): Promise<MissionProgressApi> {
  return apiPost<MissionProgressApi>(`/api/gamified/missions/${missionId}/start`);
}

/**
 * Reset the authenticated student's progress for a mission back to level 1.
 */
export function resetMissionProgress(missionId: string): Promise<MissionProgressApi> {
  return apiPost<MissionProgressApi>(`/api/gamified/missions/${missionId}/reset`);
}

/**
 * Fetch the authenticated student's current progress for a mission.
 * Restores progress across devices and browser refreshes.
 */
export function getMissionProgress(missionId: string): Promise<MissionProgressApi> {
  return apiGet<MissionProgressApi>(`/api/gamified/progress/${missionId}`);
}

/**
 * Signal the server that the student is starting a level.
 * The server enforces level locking and returns the current attempt number.
 */
export function startLevel(missionId: string, levelNumber: number): Promise<LevelStartApi> {
  return apiPost<LevelStartApi>('/api/gamified/levels/start', {
    mission_id: missionId,
    level_number: levelNumber,
  });
}

/**
 * Submit a financial decision for option-selection interaction types.
 * (needs_wants, value_comparison, emergency_response, tradeoff_justification)
 *
 * The server runs the full CDEMF pipeline and returns the authoritative result.
 * Never trust the returned passed/score values unless they come from this response.
 */
export function submitOptionDecision(params: {
  missionId: string;
  levelId: string;
  levelNumber: number;
  sessionId: string;
  interactionType: string;
  selectedOptionIds: string[];
  selectedRationaleId?: string;
}): Promise<EvaluationResultApi> {
  return apiPost<EvaluationResultApi>('/api/gamified/decisions/submit', {
    mission_id: params.missionId,
    level_id: params.levelId,
    level_number: params.levelNumber,
    session_id: params.sessionId,
    interaction_type: params.interactionType,
    selected_option_ids: params.selectedOptionIds,
    allocations: {},
    selected_rationale_id: params.selectedRationaleId ?? null,
    weekly_decisions: [],
  });
}

/**
 * Submit a budget-allocation decision.
 * (budget_allocator, recurring_budget, capstone_challenge)
 */
export function submitAllocationDecision(params: {
  missionId: string;
  levelId: string;
  levelNumber: number;
  sessionId: string;
  interactionType: string;
  allocations: Record<string, number>;
}): Promise<EvaluationResultApi> {
  return apiPost<EvaluationResultApi>('/api/gamified/decisions/submit', {
    mission_id: params.missionId,
    level_id: params.levelId,
    level_number: params.levelNumber,
    session_id: params.sessionId,
    interaction_type: params.interactionType,
    selected_option_ids: [],
    allocations: params.allocations,
    selected_rationale_id: null,
    weekly_decisions: [],
  });
}

/**
 * Submit a multi-period savings decision.
 * (multi_period_saving)
 */
export function submitMultiPeriodDecision(params: {
  missionId: string;
  levelId: string;
  levelNumber: number;
  sessionId: string;
  weeklyDecisions: WeeklyDecisionInput[];
}): Promise<EvaluationResultApi> {
  return apiPost<EvaluationResultApi>('/api/gamified/decisions/submit', {
    mission_id: params.missionId,
    level_id: params.levelId,
    level_number: params.levelNumber,
    session_id: params.sessionId,
    interaction_type: 'multi_period_saving',
    selected_option_ids: [],
    allocations: {},
    selected_rationale_id: null,
    weekly_decisions: params.weeklyDecisions,
  });
}

/**
 * Retrieve the student's full competency assessment history for a mission.
 * Used by the analytics modal and learning dashboard.
 */
export function getCompetencyHistory(missionId: string): Promise<CompetencyHistoryApi> {
  return apiGet<CompetencyHistoryApi>(`/api/gamified/competency/${missionId}`);
}

/**
 * Retrieve the character's emotional/physical state history for a mission.
 */
export function getCharacterStateHistory(missionId: string): Promise<CharacterStateHistoryApi> {
  return apiGet<CharacterStateHistoryApi>(`/api/gamified/character/${missionId}`);
}

// ── Session ID generation (stable per browser tab) ───────────────────────────

let _currentSessionId: string | null = null;

export function getOrCreateSessionId(): string {
  if (!_currentSessionId) {
    _currentSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  return _currentSessionId;
}

export function resetSessionId(): void {
  _currentSessionId = null;
}

// ── Re-export ApiError so callers can detect auth failures ───────────────────
export { ApiError };


/**
 * Retrieve aggregated My Money Journey overview across all CDEMF missions.
 */
export async function getJourneyOverview(): Promise<JourneyOverview> {
  const raw = await apiGet<any>('/api/gamified/journey/overview');
  return {
    studentName: raw.student_name,
    childId: raw.child_id,
    overview: {
      totalMissionsCompleted: raw.overview.total_missions_completed,
      totalMissionsCount: raw.overview.total_missions_count,
      totalLevelsCompleted: raw.overview.total_levels_completed,
      totalLevelsCount: raw.overview.total_levels_count,
      overallCompetencyScore: raw.overview.overall_competency_score,
      earnedCoins: raw.overview.earned_coins,
      masteryTier: raw.overview.mastery_tier,
      activeMissionId: raw.overview.active_mission_id,
      nextRecommendedLevel: raw.overview.next_recommended_level,
    },
    missions: (raw.missions || []).map((m: any) => ({
      missionId: m.mission_id,
      title: m.title,
      characterName: m.character_name,
      characterRole: m.character_role,
      focusSkill: m.focus_skill,
      themeColor: m.theme_color,
      totalLevels: m.total_levels,
      completedLevelsCount: m.completed_levels_count,
      completedLevelNumbers: m.completed_level_numbers || [],
      unlockedLevelNumber: m.unlocked_level_number,
      progressPercent: m.progress_percent,
      isCompleted: m.is_completed,
      earnedCoins: m.earned_coins,
      competencyStatus: m.competency_status,
      characterState: m.character_state,
    })),
    financialSkillsProfile: (raw.financial_skills_profile || []).map((s: any) => ({
      skillKey: s.skill_key,
      name: s.name,
      category: s.category,
      score: s.score,
      evidenceCount: s.evidence_count,
      hasSufficientEvidence: s.has_sufficient_evidence,
      status: s.status,
      isStrength: s.is_strength,
      needsPractice: s.needs_practice,
      description: s.description,
    })),
    achievements: (raw.achievements || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      icon: a.icon,
      unlocked: a.unlocked,
      unlockedAt: a.unlocked_at,
      progressCurrent: a.progress_current,
      progressTarget: a.progress_target,
      unlockCondition: a.unlock_condition,
    })),
    emotionalImpactShowcase: (raw.emotional_impact_showcase || []).map((e: any) => ({
      missionId: e.mission_id,
      missionTitle: e.mission_title,
      characterName: e.character_name,
      levelNumber: e.level_number,
      attemptNumber: e.attempt_number,
      previousCondition: e.previous_condition,
      newCondition: e.new_condition,
      previousEmotion: e.previous_emotion,
      newEmotion: e.new_emotion,
      direction: e.direction,
      reason: e.reason,
      characterDialogue: e.character_dialogue,
      learningExplanation: e.learning_explanation,
      visualCue: e.visual_cue,
      recordedAt: e.recorded_at,
      improvedAfterRetry: e.improved_after_retry,
    })),
    learningTips: (raw.learning_tips || []).map((t: any) => ({
      title: t.title,
      description: t.description,
      category: t.category,
      actionMissionId: t.action_mission_id,
      actionLevelNumber: t.action_level_number,
      actionLabel: t.action_label,
    })),
  };
}

/**
 * Retrieve detailed level-by-level progression for a single CDEMF mission.
 */
export async function getJourneyMissionDetail(missionId: string): Promise<JourneyMissionDetail> {
  const raw = await apiGet<any>('/api/gamified/journey/mission-details/' + encodeURIComponent(missionId));
  return {
    missionId: raw.mission_id,
    title: raw.title,
    characterName: raw.character_name,
    characterRole: raw.character_role,
    focusSkill: raw.focus_skill,
    themeColor: raw.theme_color,
    totalLevels: raw.total_levels,
    completedLevelsCount: raw.completed_levels_count,
    progressPercent: raw.progress_percent,
    isCompleted: raw.is_completed,
    levels: (raw.levels || []).map((lvl: any) => ({
      levelNumber: lvl.level_number,
      levelId: lvl.level_id,
      title: lvl.title,
      focusDimension: lvl.focus_dimension,
      interactionType: lvl.interaction_type,
      status: lvl.status,
      bestScore: lvl.best_score,
      attemptsCount: lvl.attempts_count,
    })),
    recentAttempts: raw.recent_attempts || [],
    characterState: raw.character_state,
    characterHistory: raw.character_history || [],
  };
}


/**
 * Retrieve adaptive practice recommendation for the authenticated student.
 */
export async function getAdaptiveRecommendation(): Promise<AdaptiveRecommendation | null> {
  try {
    const raw = await apiGet<any>('/api/gamified/ml/adaptive-recommendation');
    if (!raw) return null;
    return {
      childId: raw.child_id,
      recommendedCategory: raw.recommended_category,
      recommendedCompetency: raw.recommended_competency,
      recommendedMissionId: raw.recommended_mission_id,
      recommendedMissionTitle: raw.recommended_mission_title,
      recommendedLevelNumber: raw.recommended_level_number,
      recommendedLevelId: raw.recommended_level_id,
      recommendedLevelTitle: raw.recommended_level_title,
      recommendedInteractionType: raw.recommended_interaction_type,
      recommendationTitle: raw.recommendation_title,
      explanation: raw.explanation,
      pedagogicalAction: raw.pedagogical_action,
      isOptional: raw.is_optional,
      predictionSource: raw.prediction_source,
      fallbackUsed: raw.fallback_used,
      fallbackReason: raw.fallback_reason,
      modelVersion: raw.model_version,
      canNavigate: raw.can_navigate ?? true,
    };
  } catch (err) {
    console.warn('Could not load adaptive recommendation:', err);
    return null;
  }
}
