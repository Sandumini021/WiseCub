// Full 6-Mission Catalog for WiseCub CDEMF
// Defines the 6 approved research mission stories and their competencies

import { MissionDefinition } from '../../types/mission.types';
import { RESCUE_PUPPY_MISSION } from './rescuePuppy';
import { SQUIRREL_SAVINGS_MISSION } from './squirrelSavings';
import { PANDA_FAIR_MISSION } from './pandaFair';

export const MISSION_CATALOG: MissionDefinition[] = [
  RESCUE_PUPPY_MISSION,
  SQUIRREL_SAVINGS_MISSION,
  PANDA_FAIR_MISSION,
  {
    id: 'mission_turtle_emergency',
    title: "Turtle's Emergency Fund",
    characterName: 'Shelly',
    characterRole: 'Homeowner preparing for seasonal monsoons and floods',
    characterSpecies: 'River Turtle',
    primaryCompetency: 'emergencyPreparedness' as any,
    secondaryCompetencies: ['savingBehavior', 'budgetingSkill', 'riskAwareness'],
    description:
      'Fortify a riverside home against unpredictable storm damage. Build liquid cash reserves and differentiate genuine emergencies from cosmetic upgrades.',
    totalLevels: 8,
    themeColor: '#2f7d4a',
    initialCharacterState: {
      characterId: 'char_turtle_shelly',
      name: 'Shelly the Turtle',
      physicalCondition: 'WEAK_STABILIZED',
      emotionalState: 'ANXIOUS',
      conditionDescription: 'Shelly’s home roof has small leaks as dark storm clouds gather over the river.',
      vitalityScore: 45,
      happinessScore: 35,
      activeDialogue: 'The river current is rising fast. If I do not build an emergency buffer, one big storm could wash away my home!',
    },
    levels: [],
  },
  {
    id: 'mission_fox_business',
    title: "Fox's Little Business",
    characterName: 'Felix',
    characterRole: 'Young entrepreneur opening an artisan fruit smoothie cart',
    characterSpecies: 'Red Fox',
    primaryCompetency: 'budgetingSkill',
    secondaryCompetencies: ['investmentAwareness', 'spendingDiscipline', 'goalAchievement'],
    description:
      'Manage starting capital, wholesale ingredients, equipment depreciation, pricing strategy, customer feedback, and net profit margins.',
    totalLevels: 8,
    themeColor: '#e07a3d',
    initialCharacterState: {
      characterId: 'char_fox_felix',
      name: 'Felix the Fox',
      physicalCondition: 'NEEDS_CARE',
      emotionalState: 'HOPEFUL',
      conditionDescription: 'Felix has a modest wooden cart and a notebook full of recipe ideas.',
      vitalityScore: 60,
      happinessScore: 50,
      activeDialogue: 'I have delicious fresh fruit ideas, but I need to master business expenses so my cart turns a real profit!',
    },
    levels: [],
  },
  {
    id: 'mission_bear_forest',
    title: "Bear's Future Forest",
    characterName: 'Barnaby Bear',
    characterRole: 'Forester planting sustainable fruit orchard for future generations',
    characterSpecies: 'Sun Bear',
    primaryCompetency: 'investmentAwareness',
    secondaryCompetencies: ['savingBehavior', 'consistency', 'riskAwareness'],
    description:
      'Learn long-term horizons, compound growth, patience, and diversification. Balance slow-growing timber with quick-yield berry bushes without risky speculation.',
    totalLevels: 8,
    themeColor: '#4d382c',
    initialCharacterState: {
      characterId: 'char_bear_barnaby',
      name: 'Barnaby Bear',
      physicalCondition: 'WEAK_STABILIZED',
      emotionalState: 'HOPEFUL',
      conditionDescription: 'Barnaby Bear looks out over an empty clearing, holding small tree saplings.',
      vitalityScore: 55,
      happinessScore: 45,
      activeDialogue: 'Trees take years to grow tall, but good planning and diversified planting will feed our forest forever!',
    },
    levels: [],
  },
];
