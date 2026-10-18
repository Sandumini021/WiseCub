// Emotional and Physical Character State Types for CDEMF

export type CharacterPhysicalCondition =
  | 'NEEDS_CARE'
  | 'WEAK_STABILIZED'
  | 'RECEIVING_TREATMENT'
  | 'RECOVERING'
  | 'HEALTHY_ACTIVE'
  | 'SETBACK_WAITING';

export type CharacterEmotionalState =
  | 'ANXIOUS'
  | 'WORRIED'
  | 'VULNERABLE'
  | 'HOPEFUL'
  | 'RELIEVED'
  | 'CHEERFUL'
  | 'JOYFUL_HEALTHY';

export interface CharacterState {
  characterId: string;
  name: string;
  physicalCondition: CharacterPhysicalCondition;
  emotionalState: CharacterEmotionalState;
  conditionDescription: string;
  vitalityScore: number; // 0 - 100
  happinessScore: number; // 0 - 100
  activeDialogue: string;
}

export interface CharacterTransition {
  characterId: string;
  previousCondition: CharacterPhysicalCondition;
  newCondition: CharacterPhysicalCondition;
  previousEmotion: CharacterEmotionalState;
  newEmotion: CharacterEmotionalState;
  direction: 'IMPROVEMENT' | 'SETBACK' | 'STABLE';
  reason: string;
  characterDialogue: string;
  learningExplanation: string;
  visualCue: string;
}
