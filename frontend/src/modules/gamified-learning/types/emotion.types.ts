// Emotional and Physical Character State Types for CDEMF

export type CharacterPhysicalCondition =
  | 'NEEDS_CARE'
  | 'WEAK_STABILIZED'
  | 'RECEIVING_TREATMENT'
  | 'RECOVERING'
  | 'HEALTHY_ACTIVE'
  | 'SETBACK_WAITING'
  | 'SHELTER_UNPREPARED'
  | 'BASIC_STOCKS_FORMED'
  | 'STORAGE_ORGANIZED'
  | 'WINTER_RESERVES_ACTIVE'
  | 'WEATHER_IMPACTED'
  | 'SHELTER_FORTIFIED'
  | 'WINTER_READY';

export type CharacterEmotionalState =
  | 'ANXIOUS'
  | 'WORRIED'
  | 'VULNERABLE'
  | 'HOPEFUL'
  | 'RELIEVED'
  | 'CHEERFUL'
  | 'JOYFUL_HEALTHY'
  | 'TEMPTED'
  | 'CONFIDENT'
  | 'HAPPY_AND_SECURE';

export interface CharacterState {
  characterId: string;
  name: string;
  physicalCondition: CharacterPhysicalCondition;
  emotionalState: CharacterEmotionalState;
  conditionDescription: string;
  vitalityScore: number; // 0 - 100
  happinessScore: number; // 0 - 100
  activeDialogue: string;
  foodSupply?: number;
  savingsReserve?: number;
  shelterReadiness?: number;
  winterPreparedness?: number;
  emotionalWellbeing?: number;
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
