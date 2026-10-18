// ML-Ready Structured Event Types for CDEMF

export type LearningEventType =
  | 'MISSION_STARTED'
  | 'LEVEL_STARTED'
  | 'DECISION_SUBMITTED'
  | 'FINANCIAL_OUTCOME_CALCULATED'
  | 'CHARACTER_STATE_CHANGED'
  | 'COMPETENCY_EVALUATED'
  | 'LEVEL_FAILED'
  | 'LEVEL_PASSED'
  | 'HINT_REQUESTED'
  | 'LEVEL_RETRIED'
  | 'MISSION_COMPLETED';

export interface LearningEvent<T = Record<string, unknown>> {
  eventId: string;
  sessionId: string;
  missionId: string;
  levelId: string;
  levelNumber: number;
  attemptNumber: number;
  eventType: LearningEventType;
  timestamp: string;
  payload: T;
  schemaVersion: string;
}

export interface DecisionSubmittedPayload {
  selectedOptionIds: string[];
  allocations: Record<string, number>;
  totalAllocatedLKR: number;
  selectedRationaleId?: string;
  emergencyFundUsedLKR?: number;
}

export interface EvaluationPayload {
  passed: boolean;
  budgetingScore: number;
  disciplineScore: number;
  savingScore: number;
  targetCompetencyScore: number;
  primaryFailureReason?: string;
}
