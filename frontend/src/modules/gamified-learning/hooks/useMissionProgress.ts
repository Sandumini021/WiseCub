/**
 * useMissionProgress — React hook for the CDEMF gamified-learning module
 *
 * This hook is the bridge between the frontend UI and the backend API.
 * It replaces direct PrototypeStorage / localStorage calls in MissionBoardPage
 * with server-backed operations.
 *
 * Behavior:
 *  - On mount: fetches progress from the backend (cross-device persistence).
 *  - On unauthenticated (401): exposes isAuthenticated=false so the UI can
 *    display a clear "please log in" message. No silent fake fallback.
 *  - On submit: calls the backend CDEMF pipeline. Local engines are NOT
 *    re-invoked. The hook returns the server's authoritative result.
 *  - On retry: re-enables submission. Server idempotency key is keyed to
 *    session_id, so retries within the same level do NOT conflict.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ApiError,
  EvaluationResultApi,
  MissionProgressApi,
  WeeklyDecisionInput,
  charStateFromApi,
  charTransitionFromApi,
  decisionOutcomeFromApi,
  getOrCreateSessionId,
  getMissionProgress,
  resetMissionProgress,
  resetSessionId,
  startLevel,
  startOrResumeMission,
  submitAllocationDecision,
  submitMultiPeriodDecision,
  submitOptionDecision,
} from '../services/gamifiedApi';
import { PrototypeStorage } from '../services/prototypeStorage';
import type { MissionProgress } from '../types/progress.types';
import type { CharacterTransition } from '../types/emotion.types';
import type { DecisionOutcome } from '../types/financial.types';
import type { LevelMasteryResult } from '../types/mission.types';

// ── State shape ───────────────────────────────────────────────────────────────

export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface MissionProgressState {
  /** null while loading */
  progress: MissionProgress | null;
  /** true when the initial progress fetch is in flight */
  loading: boolean;
  /** true when a decision submission is in flight */
  submitting: boolean;
  /** true if the user is authenticated */
  isAuthenticated: boolean;
  /** true after progress has been loaded at least once */
  initialized: boolean;
  /** The last server error message, if any */
  error: string | null;
  /** The authoritative evaluation result from the last submission */
  lastResult: EvaluationResultApi | null;
  /** Derived LevelMasteryResult compatible with existing UI components */
  lastMasteryResult: LevelMasteryResult | null;
}

// ── Conversion: EvaluationResultApi → LevelMasteryResult (for existing UI) ───

function masteryResultFromApi(result: EvaluationResultApi): LevelMasteryResult {
  const transition: CharacterTransition = charTransitionFromApi(result.character_transition);
  const outcome: DecisionOutcome = decisionOutcomeFromApi(result.decision_outcome);
  return {
    levelId: result.level_id,
    levelNumber: result.level_number,
    attemptNumber: result.attempt_number,
    passed: result.passed,
    overallScore: result.overall_score,
    dimensionScores: {
      budgetingSkill: result.dimension_scores.budgeting_skill,
      spendingDiscipline: result.dimension_scores.spending_discipline,
      savingBehavior: result.dimension_scores.saving_behavior,
      investmentAwareness: result.dimension_scores.investment_awareness,
      goalAchievement: result.dimension_scores.goal_achievement,
    },
    decisionOutcome: outcome,
    characterTransition: transition,
    failureReasons: result.failure_reasons,
    successSummary: result.success_summary,
    remediationGuidance: result.remediation_guidance ?? undefined,
    nextLevelUnlocked: result.next_level_unlocked,
    timestamp: new Date().toISOString(),
  };
}

function isApiUnreachable(err: unknown) {
  if (err instanceof ApiError) {
    return false;
  }
  const message = err instanceof Error ? err.message : String(err);
  return /failed to fetch|networkerror|load failed|network request failed/i.test(message);
}

function apiTalkError(err: unknown, fallback: string) {
  if (isApiUnreachable(err)) {
    return 'Missions need the API on port 8000. You can keep playing on this device.';
  }
  return err instanceof Error ? err.message : fallback;
}

function localMissionProgress(missionId: string): MissionProgress {
  const stored = PrototypeStorage.getUserState().missionProgress[missionId];
  if (stored) {
    return stored;
  }
  return {
    ...PrototypeStorage.createDefaultState().missionProgress.mission_rescue_puppy,
    missionId,
  };
}

function progressFromApiResponse(api: MissionProgressApi): MissionProgress {
  return {
    missionId: api.mission_id,
    unlockedLevelNumber: api.unlocked_level_number,
    completedLevelNumbers: api.completed_level_numbers,
    highestCompletedLevelNumber: api.highest_completed_level_number,
    characterState: charStateFromApi(api.character_state),
    attemptsByLevel: {},
    lastAttemptAtIso: api.last_attempt_at_iso,
    isMissionCompleted: api.is_mission_completed,
    earnedCoins: api.earned_coins,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useMissionProgress(missionId: string, childKey?: string) {
  const [state, setState] = useState<MissionProgressState>({
    progress: null,
    loading: true,
    submitting: false,
    isAuthenticated: true,
    initialized: false,
    error: null,
    lastResult: null,
    lastMasteryResult: null,
  });

  const missionIdRef = useRef(missionId);
  missionIdRef.current = missionId;

  // ── Load progress from backend on mount / missionId / childKey change ─────────
  const loadProgress = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      lastResult: null,
      lastMasteryResult: null,
    }));
    try {
      const api = await getMissionProgress(missionId);
      setState((prev) => ({
        ...prev,
        progress: progressFromApiResponse(api),
        loading: false,
        initialized: true,
        isAuthenticated: true,
        error: null,
      }));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setState((prev) => ({
          ...prev,
          progress: null,
          loading: false,
          isAuthenticated: false,
          error: 'Please log in to save your progress.',
        }));
      } else if (err instanceof ApiError && err.status === 404) {
        // Progress not yet started — start the mission
        try {
          const api = await startOrResumeMission(missionId);
          setState((prev) => ({
            ...prev,
            progress: progressFromApiResponse(api),
            loading: false,
            initialized: true,
            isAuthenticated: true,
            error: null,
          }));
        } catch (startErr) {
          if (isApiUnreachable(startErr)) {
            setState((prev) => ({
              ...prev,
              progress: localMissionProgress(missionId),
              loading: false,
              initialized: true,
              error: null,
            }));
            return;
          }
          setState((prev) => ({
            ...prev,
            progress: localMissionProgress(missionId),
            loading: false,
            initialized: true,
            error: apiTalkError(startErr, 'Could not start mission.'),
          }));
        }
      } else if (isApiUnreachable(err)) {
        setState((prev) => ({
          ...prev,
          progress: localMissionProgress(missionId),
          loading: false,
          initialized: true,
          error: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          progress: localMissionProgress(missionId),
          loading: false,
          initialized: true,
          error: apiTalkError(err, 'Could not load progress.'),
        }));
      }
    }
  }, [missionId, childKey]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // ── Start a level (enforces server-side lock) ──────────────────────────────
  const beginLevel = useCallback(async (levelNumber: number) => {
    setState((prev) => ({ ...prev, error: null }));
    // Rotate session ID when beginning a genuinely new level attempt or replay
    resetSessionId();
    try {
      await startLevel(missionId, levelNumber);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setState((prev) => ({
          ...prev,
          error: err.message,
        }));
        throw err; // let caller handle navigation
      }
      if (isApiUnreachable(err)) {
        return;
      }
      throw err;
    }
  }, [missionId]);

  // ── Submit option-selection decisions ─────────────────────────────────────
  const submitOptionSelection = useCallback(
    async (params: {
      levelId: string;
      levelNumber: number;
      interactionType: string;
      selectedOptionIds: string[];
      selectedRationaleId?: string;
    }): Promise<EvaluationResultApi> => {
      if (state.submitting) {
        throw new Error('A decision submission is already in progress.');
      }
      setState((prev) => ({ ...prev, submitting: true, error: null }));
      try {
        const result = await submitOptionDecision({
          missionId,
          levelId: params.levelId,
          levelNumber: params.levelNumber,
          sessionId: getOrCreateSessionId(),
          interactionType: params.interactionType,
          selectedOptionIds: params.selectedOptionIds,
          selectedRationaleId: params.selectedRationaleId,
        });
        const mastery = masteryResultFromApi(result);
        // Refresh progress from server
        const freshProgress = await getMissionProgress(missionId);
        setState((prev) => ({
          ...prev,
          submitting: false,
          lastResult: result,
          lastMasteryResult: mastery,
          progress: progressFromApiResponse(freshProgress),
          error: null,
        }));
        return result;
      } catch (err) {
        const msg = apiTalkError(err, 'Submission failed.');
        setState((prev) => ({ ...prev, submitting: false, error: msg }));
        throw err;
      }
    },
    [missionId, state.submitting]
  );

  // ── Submit allocation decisions ───────────────────────────────────────────
  const submitAllocation = useCallback(
    async (params: {
      levelId: string;
      levelNumber: number;
      interactionType: string;
      allocations: Record<string, number>;
    }): Promise<EvaluationResultApi> => {
      if (state.submitting) {
        throw new Error('A decision submission is already in progress.');
      }
      setState((prev) => ({ ...prev, submitting: true, error: null }));
      try {
        const result = await submitAllocationDecision({
          missionId,
          levelId: params.levelId,
          levelNumber: params.levelNumber,
          sessionId: getOrCreateSessionId(),
          interactionType: params.interactionType,
          allocations: params.allocations,
        });
        const mastery = masteryResultFromApi(result);
        const freshProgress = await getMissionProgress(missionId);
        setState((prev) => ({
          ...prev,
          submitting: false,
          lastResult: result,
          lastMasteryResult: mastery,
          progress: progressFromApiResponse(freshProgress),
          error: null,
        }));
        return result;
      } catch (err) {
        const msg = apiTalkError(err, 'Submission failed.');
        setState((prev) => ({ ...prev, submitting: false, error: msg }));
        throw err;
      }
    },
    [missionId, state.submitting]
  );

  // ── Submit multi-period saving decisions ──────────────────────────────────
  const submitMultiPeriod = useCallback(
    async (params: {
      levelId: string;
      levelNumber: number;
      weeklyDecisions: WeeklyDecisionInput[];
    }): Promise<EvaluationResultApi> => {
      if (state.submitting) {
        throw new Error('A decision submission is already in progress.');
      }
      setState((prev) => ({ ...prev, submitting: true, error: null }));
      try {
        const result = await submitMultiPeriodDecision({
          missionId,
          levelId: params.levelId,
          levelNumber: params.levelNumber,
          sessionId: getOrCreateSessionId(),
          weeklyDecisions: params.weeklyDecisions,
        });
        const mastery = masteryResultFromApi(result);
        const freshProgress = await getMissionProgress(missionId);
        setState((prev) => ({
          ...prev,
          submitting: false,
          lastResult: result,
          lastMasteryResult: mastery,
          progress: progressFromApiResponse(freshProgress),
          error: null,
        }));
        return result;
      } catch (err) {
        const msg = apiTalkError(err, 'Submission failed.');
        setState((prev) => ({ ...prev, submitting: false, error: msg }));
        throw err;
      }
    },
    [missionId, state.submitting]
  );

  // ── Clear error ────────────────────────────────────────────────────────────
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // ── Reset progress ────────────────────────────────────────────────────────
  const resetProgress = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const api = await resetMissionProgress(missionId);
      resetSessionId();
      setState((prev) => ({
        ...prev,
        progress: progressFromApiResponse(api),
        loading: false,
        initialized: true,
        isAuthenticated: true,
        error: null,
        lastResult: null,
        lastMasteryResult: null,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: apiTalkError(err, 'Could not reset progress.'),
      }));
    }
  }, [missionId]);

  // ── Reload progress ───────────────────────────────────────────────────────
  const reload = useCallback(() => {
    loadProgress();
  }, [loadProgress]);

  return {
    ...state,
    beginLevel,
    submitOptionSelection,
    submitAllocation,
    submitMultiPeriod,
    clearError,
    reload,
    resetProgress,
  };
}
