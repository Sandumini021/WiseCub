// Mission 2: Squirrel's Winter Savings (Nutty's Winter Survival Story)
// 6-Level CDEMF Mission for School Students Aged 12–16

import { MissionDefinition } from '../../types/mission.types';

export const INITIAL_NUTTY_STATE = {
  characterId: 'char_squirrel_nutty',
  name: 'Nutty',
  physicalCondition: 'NEEDS_CARE' as const,
  emotionalState: 'WORRIED' as const,
  conditionDescription: 'Nutty’s winter pantry is nearly empty while cold autumn winds blow through the forest.',
  vitalityScore: 40,
  happinessScore: 35,
  activeDialogue:
    'Chirp! Winter frost is coming early this year. If I do not save enough acorns in time, my family will be hungry!',
  foodSupply: 35,
  savingsReserve: 25,
  shelterReadiness: 30,
  winterPreparedness: 30,
  emotionalWellbeing: 40,
};

export const SQUIRREL_SAVINGS_MISSION: MissionDefinition = {
  id: 'mission_squirrel_savings',
  title: "Squirrel's Winter Savings",
  characterName: 'Nutty',
  characterRole: 'Forager preparing an acorn granary for harsh winter',
  characterSpecies: 'Eurasian Red Squirrel',
  primaryCompetency: 'savingBehavior',
  secondaryCompetencies: [
    'budgetingSkill',
    'spendingDiscipline',
    'emergencyPreparedness',
    'tradeoffReasoning',
  ],
  description:
    'Help Nutty the squirrel manage forest tokens and acorn supplies across six challenging winter-preparation scenarios. Learn needs vs. wants, goal planning, delayed gratification, and emergency reserves.',
  totalLevels: 6,
  themeColor: '#c45f24',
  initialCharacterState: INITIAL_NUTTY_STATE,
  levels: [
    // -------------------------------------------------------------
    // LEVEL 1: Prepare for Winter (Needs vs Wants)
    // -------------------------------------------------------------
    {
      id: 'level_squirrel_1',
      levelNumber: 1,
      title: 'Prepare for Winter',
      subtitle: 'Needs vs. Wants',
      storyIntro:
        'Autumn winds are turning cold in the forest! Nutty has Rs. 5,000 in forest tokens. Help Nutty fund winter survival necessities without wasting tokens on shiny extras.',
      learningObjective:
        'Pick only essential food supplies and shelter repairs — keep remaining tokens safe in your pouch!',
      targetCompetency: 'spendingDiscipline',
      interactionType: 'needs_wants',
      startingBudgetLKR: 5000,
      options: [
        {
          id: 'opt_sq_essential_nuts',
          title: 'Dried Oak Acorns & Seed Basket',
          description: 'Nutritious kiln-dried oak acorns and pumpkin seeds for daily survival food.',
          costLKR: 2200,
          category: 'essential_food',
          isEssential: true,
          qualityLevel: 'certified_good',
          financialTradeoffNote: 'Must-have food! Without this, Nutty will be hungry.',
        },
        {
          id: 'opt_sq_shelter_patch',
          title: 'Moss & Pine Bark Shelter Seal',
          description: 'Thermal forest moss and tree resin to patch drafts in the tree hollow.',
          costLKR: 1600,
          category: 'shelter_repair',
          isEssential: true,
          qualityLevel: 'certified_good',
          financialTradeoffNote: 'Must-have shelter! Keeps sub-zero freezing winds outside.',
        },
        {
          id: 'opt_sq_glitter_feather',
          title: 'Decorative Shimmer Feather Cap',
          description: 'A stylish blue jay feather to wear on your head during forest walks.',
          costLKR: 1500,
          category: 'accessory',
          isEssential: false,
          qualityLevel: 'luxury_excess',
          financialTradeoffNote: 'Costume want: looks pretty but provides zero warmth or nutrition.',
        },
        {
          id: 'opt_sq_maple_candy',
          title: 'Sugary Candied Maple Treat',
          description: 'Sweet hardened maple syrup drops for instant sugary delight.',
          costLKR: 800,
          category: 'snacks',
          isEssential: false,
          qualityLevel: 'luxury_excess',
          financialTradeoffNote: 'Impulse candy: tasty treat that quickly disappears.',
        },
      ],
      passCriteria: {
        minCompetencyScore: 75,
        maxBudgetLKR: 5000,
        requireBudgetFeasibility: true,
        mustIncludeOptionIds: ['opt_sq_essential_nuts', 'opt_sq_shelter_patch'],
        disallowedOptionIds: ['opt_sq_glitter_feather'],
        minReservePreservedLKR: 500,
      },
      hints: [
        'Winter frost will freeze unsealed hollows. Prioritize the shelter seal and dried acorns first!',
        'A feather cap looks fancy, but it cannot feed Nutty or stop the freezing wind.',
      ],
      remediationScaffolding: {
        ruleExplanation:
          'Non-negotiable survival needs (food and shelter) must always be secured before discretionary wants (costumes, sweet treats).',
        guidingQuestions: [
          'What happens to Nutty if you buy the feather cap but lack the acorns to survive?',
          'How much emergency money remains when you only purchase essentials?',
        ],
        suggestedFocus:
          'Select the Acorn Basket (Rs. 2,200) and Shelter Seal (Rs. 1,600). Leave the feather cap and save the remaining Rs. 1,200.',
      },
    },

    // -------------------------------------------------------------
    // LEVEL 2: Save the Acorns (Budget Allocation & Savings Goal)
    // -------------------------------------------------------------
    {
      id: 'level_squirrel_2',
      levelNumber: 2,
      title: 'Save the Acorns',
      subtitle: 'Saving Behavior & Goal Planning',
      storyIntro:
        'Nutty gathered Rs. 8,000 from seasonal foraging! Nutty must allocate these resources to stock the winter pantry, weatherproof the granary, and build an emergency acorn reserve of at least Rs. 2,500.',
      learningObjective:
        'Allocate Rs. 8,000 across categories to fund food and shelter while locking away at least Rs. 2,500 into emergency savings.',
      targetCompetency: 'savingBehavior',
      interactionType: 'budget_allocator',
      startingBudgetLKR: 8000,
      allocationCategories: [
        {
          id: 'cat_sq_winter_food',
          name: 'Winter Food Pantry (Acorns & Seeds)',
          category: 'food',
          isEssential: true,
          minRecommendedLKR: 2500,
          maxRecommendedLKR: 4000,
          stepLKR: 500,
          defaultAmountLKR: 0,
          description: 'Bulk store of winter walnuts, acorns, and sunflower seeds.',
        },
        {
          id: 'cat_sq_weatherproofing',
          name: 'Granary Weatherproofing & Seal',
          category: 'shelter',
          isEssential: true,
          minRecommendedLKR: 1500,
          maxRecommendedLKR: 2500,
          stepLKR: 500,
          defaultAmountLKR: 0,
          description: 'Cedar bark insulation to protect granary stores from damp rot.',
        },
        {
          id: 'cat_sq_emergency_reserve',
          name: 'Emergency Acorn Reserve Fund',
          category: 'savings',
          isEssential: true,
          minRecommendedLKR: 2500,
          maxRecommendedLKR: 4000,
          stepLKR: 500,
          defaultAmountLKR: 0,
          description: 'Emergency tokens preserved in an underground root vault.',
        },
        {
          id: 'cat_sq_decorations',
          name: 'Carved Tree Hollow Ornaments',
          category: 'discretionary',
          isEssential: false,
          minRecommendedLKR: 0,
          maxRecommendedLKR: 2000,
          stepLKR: 500,
          defaultAmountLKR: 0,
          description: 'Artistic wood carvings to decorate the hollow walls.',
        },
      ],
      passCriteria: {
        minCompetencyScore: 75,
        maxBudgetLKR: 8000,
        requireBudgetFeasibility: true,
        minReservePreservedLKR: 2500,
      },
      hints: [
        'Nutty needs at least Rs. 2,500 in food and Rs. 1,500 in weatherproofing to survive.',
        'Ensure your Emergency Acorn Reserve has at least Rs. 2,500. Keep tree ornaments low or zero.',
      ],
      remediationScaffolding: {
        ruleExplanation:
          'Pay yourself first! Setting aside savings before buying decorative novelties ensures you meet future survival targets.',
        guidingQuestions: [
          'How much total money is available in forest tokens?',
          'Did you allocate at least Rs. 2,500 to the emergency acorn reserve?',
        ],
        suggestedFocus:
          'Allocate Rs. 3,000 to Food, Rs. 1,500 to Weatherproofing, Rs. 3,000 to Emergency Reserve, and Rs. 500 to Ornaments.',
      },
    },

    // -------------------------------------------------------------
    // LEVEL 3: The Tempting Forest Festival (Multi-Period Savings)
    // -------------------------------------------------------------
    {
      id: 'level_squirrel_3',
      levelNumber: 3,
      title: 'The Tempting Forest Festival',
      subtitle: 'Delayed Gratification & Spending Discipline',
      storyIntro:
        'The 3-week Autumn Forest Festival is here! Tempting carnival stalls, games, and candy stand between Nutty and the Rs. 7,500 needed to purchase a Thermal Winter Quilt & Heavy Granary Lock.',
      learningObjective:
        'Save at least Rs. 7,500 across 3 weeks by resisting expensive impulse temptations and putting tokens into the winter bank.',
      targetCompetency: 'spendingDiscipline',
      interactionType: 'multi_period_saving',
      startingBudgetLKR: 4500,
      multiPeriodConfig: {
        goalDescription: 'Save Rs. 7,500 across 3 festival weeks for thermal winter shelter',
        periods: [
          {
            period: 1,
            label: 'Week 1',
            allowanceLKR: 4500,
            mandatoryCostLKR: 1500,
            mandatoryCostDescription: 'Fresh forest forage & basic hollow maintenance',
            temptationCostLKR: 1200,
            temptationTitle: 'Carnival Acorn Toss Game',
            temptationDescription: 'Spend Rs. 1,200 playing carnival games with forest friends.',
          },
          {
            period: 2,
            label: 'Week 2',
            allowanceLKR: 4500,
            mandatoryCostLKR: 1500,
            mandatoryCostDescription: 'Fresh forest forage & basic hollow maintenance',
            temptationCostLKR: 1000,
            temptationTitle: 'Golden Berry Sugar Floss',
            temptationDescription: 'Spend Rs. 1,000 on sweet candied berries.',
          },
          {
            period: 3,
            label: 'Week 3',
            allowanceLKR: 4500,
            mandatoryCostLKR: 1500,
            mandatoryCostDescription: 'Fresh forest forage & basic hollow maintenance',
            temptationCostLKR: 1000,
            temptationTitle: 'Glowing Lantern Souvenir',
            temptationDescription: 'Spend Rs. 1,000 on a festive decorative lantern.',
          },
        ],
        targetGoalLKR: 7500,
      },
      passCriteria: {
        minCompetencyScore: 75,
        maxBudgetLKR: 13500,
        requireBudgetFeasibility: true,
        minReservePreservedLKR: 7500,
      },
      hints: [
        'To reach Rs. 7,500, you need to save an average of Rs. 2,500 each week.',
        'Resisting the carnival games and treats unlocks the maximum saving power of Rs. 3,000 per week.',
      ],
      remediationScaffolding: {
        ruleExplanation:
          'Delayed gratification means resisting immediate impulse spending so you can afford high-value security items that protect your future.',
        guidingQuestions: [
          'How much total savings do you need for the Thermal Quilt & Granary Lock?',
          'If you buy every festival treat, will you meet the Rs. 7,500 goal?',
        ],
        suggestedFocus:
          'Skip the temptations in Weeks 1 and 2, save Rs. 3,000 and Rs. 3,000, then in Week 3 save Rs. 2,000+ to exceed the Rs. 7,500 target.',
      },
    },

    // -------------------------------------------------------------
    // LEVEL 4: Unexpected Food Shortage (Emergency Response)
    // -------------------------------------------------------------
    {
      id: 'level_squirrel_4',
      levelNumber: 4,
      title: 'Unexpected Food Shortage',
      subtitle: 'Emergency Preparedness & Resilience',
      storyIntro:
        'A torrential rainstorm battered the oak trees! Water seeped into Nutty’s lower hollow, ruining stored seeds. You have Rs. 7,000 in emergency reserves. Fix the leak and replace ruined food with certified supplies before mold spreads!',
      learningObjective:
        'Use emergency reserves to replace essential food and seal the leak. Avoid overpriced luxury treats or cheap moldy seeds.',
      targetCompetency: 'savingBehavior',
      interactionType: 'emergency_response',
      startingBudgetLKR: 7000,
      existingReserveLKR: 7000,
      options: [
        {
          id: 'opt_sq_emergency_seed_bulk',
          title: 'Sealed Kiln-Dried Acorn Pack',
          description: 'Airtight sack of roasted dry acorns safe from rain moisture and mold.',
          costLKR: 3500,
          category: 'emergency_food',
          isEssential: true,
          qualityLevel: 'certified_good',
          financialTradeoffNote: 'Essential food replacement: prevents winter starvation.',
        },
        {
          id: 'opt_sq_tarp_seal_patch',
          title: 'Waterproof Bark Tarpaulin',
          description: 'Heavy waterproof birch bark tarp to cover the roof leak permanently.',
          costLKR: 1500,
          category: 'emergency_repair',
          isEssential: true,
          qualityLevel: 'certified_good',
          financialTradeoffNote: 'Essential repair: stops continuous rainwater intrusion.',
        },
        {
          id: 'opt_sq_luxury_imported_berries',
          title: 'Imported Honey Glazed Berries',
          description: 'Expensive candied gourmet berries sold by visiting magpie traders.',
          costLKR: 3500,
          category: 'luxury_food',
          isEssential: false,
          qualityLevel: 'luxury_excess',
          financialTradeoffNote: 'Luxury impulse: depletes emergency cash on fancy sweets.',
        },
        {
          id: 'opt_sq_moldy_discount_seeds',
          title: 'Discount Wet Floor Seeds',
          description: 'Cheap wet seeds scraped off the forest mud floor at a discount.',
          costLKR: 1000,
          category: 'substandard_food',
          isEssential: false,
          qualityLevel: 'substandard',
          financialTradeoffNote: 'Dangerous false economy: carries toxic mold spores!',
        },
      ],
      passCriteria: {
        minCompetencyScore: 75,
        maxBudgetLKR: 7000,
        requireBudgetFeasibility: true,
        mustIncludeOptionIds: ['opt_sq_emergency_seed_bulk', 'opt_sq_tarp_seal_patch'],
        disallowedOptionIds: ['opt_sq_luxury_imported_berries', 'opt_sq_moldy_discount_seeds'],
        minReservePreservedLKR: 1500,
      },
      hints: [
        'Buy the sealed kiln-dried acorns and waterproof tarp. Do not gamble with damp moldy floor seeds!',
        'Save at least Rs. 1,500 in reserve for tomorrow’s unpredictable weather.',
      ],
      remediationScaffolding: {
        ruleExplanation:
          'Emergency funds exist to restore safety and replace essentials during unforeseen crises. Never waste emergency funds on luxury treats or hazardous cut-rate supplies.',
        guidingQuestions: [
          'What health hazard happens if Nutty eats cheap moldy seeds from the wet forest floor?',
          'How much emergency cash is left after purchasing the dried acorns and waterproof tarp?',
        ],
        suggestedFocus:
          'Select the Kiln-Dried Acorn Pack (Rs. 3,500) and Waterproof Tarpaulin (Rs. 1,500). Total spent is Rs. 5,000, preserving Rs. 2,000 in your reserve.',
      },
    },

    // -------------------------------------------------------------
    // LEVEL 5: The Coldest Winter Night (Trade-off Justification)
    // -------------------------------------------------------------
    {
      id: 'level_squirrel_5',
      levelNumber: 5,
      title: 'The Coldest Winter Night',
      subtitle: 'Complex Financial Trade-offs',
      storyIntro:
        'A severe Arctic freeze is approaching the forest tonight! Temperature will drop below freezing. Nutty has Rs. 10,000, but cannot afford every possible purchase. Make a reasoned financial trade-off to keep Nutty alive and warm.',
      learningObjective:
        'Select critical thermal moss and high-calorie walnuts within budget. Choose the sound financial rationale that explains your trade-off.',
      targetCompetency: 'spendingDiscipline',
      interactionType: 'tradeoff_justification',
      startingBudgetLKR: 10000,
      options: [
        {
          id: 'opt_sq_thick_moss_insulation',
          title: 'High-Density Thermal Moss Lining',
          description: 'Dense insulating peat moss to line tree walls against sub-zero drafts.',
          costLKR: 4500,
          category: 'thermal_safety',
          isEssential: true,
          qualityLevel: 'certified_good',
          financialTradeoffNote: 'Core thermal protection: prevents frostbite inside the hollow.',
        },
        {
          id: 'opt_sq_protein_walnut_pack',
          title: 'High-Calorie Walnut & Hazelnut Ration',
          description: 'Calorie-dense winter nuts providing internal metabolic body heat.',
          costLKR: 3500,
          category: 'caloric_fuel',
          isEssential: true,
          qualityLevel: 'certified_good',
          financialTradeoffNote: 'Core survival fuel: provides long-lasting body warmth.',
        },
        {
          id: 'opt_sq_hand_knitted_hammock',
          title: 'Decorative Velvet Squirrel Hammock',
          description: 'A cozy plush hanging hammock for luxurious sleeping.',
          costLKR: 3000,
          category: 'comfort_luxury',
          isEssential: false,
          qualityLevel: 'luxury_excess',
          financialTradeoffNote: 'Comfort extra: nice to have, but cannot stop drafts without wall moss.',
        },
        {
          id: 'opt_sq_extra_pinecones',
          title: 'Fragrant Scented Pinecones',
          description: 'Aromatic pinecones that smell like pine needles.',
          costLKR: 1200,
          category: 'cosmetic',
          isEssential: false,
          qualityLevel: 'luxury_excess',
          financialTradeoffNote: 'Cosmetic novelty: provides zero heat or food value.',
        },
      ],
      tradeoffRationales: [
        {
          id: 'rat_sq_safety_first',
          text: 'Prioritize life-critical thermal moss and nutrition first, preserving Rs. 2,000 for emergency shelter needs.',
          isSound: true,
          feedback:
            'Sound trade-off: Prioritized essential thermal insulation and caloric fuel to survive sub-zero freeze while keeping a Rs. 2,000 cash cushion.',
        },
        {
          id: 'rat_sq_luxury_comfort',
          text: 'Prioritize the velvet sleeping hammock for maximum comfort rather than investing in thick thermal wall insulation.',
          isSound: false,
          feedback:
            'Flawed reasoning: Velvet hammock offers soft sleeping but fails to block freezing drafts or provide metabolic heat.',
        },
        {
          id: 'rat_sq_cheap_cosmetics',
          text: 'Spend funds on scented fragrant pinecones to make the tree hollow smell pleasant during the freeze.',
          isSound: false,
          feedback:
            'Flawed reasoning: Scented pinecones are purely cosmetic and provide neither warmth nor nutrition during a freeze.',
        },
      ],
      passCriteria: {
        minCompetencyScore: 75,
        maxBudgetLKR: 10000,
        requireBudgetFeasibility: true,
        mustIncludeOptionIds: ['opt_sq_thick_moss_insulation', 'opt_sq_protein_walnut_pack'],
        disallowedOptionIds: ['opt_sq_hand_knitted_hammock'],
        requiredRationaleId: 'rat_sq_safety_first',
        minReservePreservedLKR: 1500,
      },
      hints: [
        'Thermal moss blocks the sub-zero draft and calorie-dense nuts keep Nutty’s metabolism warm.',
        'Select "rat_sq_safety_first" to justify prioritizing life-saving thermal protection over cosmetic bedding.',
      ],
      remediationScaffolding: {
        ruleExplanation:
          'When scarcity forces difficult choices, prioritize core survival capabilities and explain your decision using clear risk reduction principles.',
        guidingQuestions: [
          'Can a velvet hammock keep out sub-zero drafts if the walls lack thermal moss insulation?',
          'Why is keeping a Rs. 2,000 cash cushion important even during severe weather?',
        ],
        suggestedFocus:
          'Select Thermal Moss (Rs. 4,500) + Walnut Ration (Rs. 3,500). Choose "rat_sq_safety_first" as your rationale and preserve Rs. 2,000.',
      },
    },

    // -------------------------------------------------------------
    // LEVEL 6: Nutty's Winter Home (Capstone Allocation)
    // -------------------------------------------------------------
    {
      id: 'level_squirrel_6',
      levelNumber: 6,
      title: "Nutty's Winter Home",
      subtitle: 'Integrated Financial Mastery',
      storyIntro:
        'Winter has arrived! Snow blankets the oak canopy. With Rs. 12,000 in total winter funds, synthesize everything you learned: stock deep-winter food, fortify the hollow hearth, and establish a snowstorm contingency reserve.',
      learningObjective:
        'Build a complete winter survival budget allocating all Rs. 12,000 across food, shelter, contingency, and modest celebrations.',
      targetCompetency: 'budgetingSkill',
      interactionType: 'budget_allocator',
      startingBudgetLKR: 12000,
      allocationCategories: [
        {
          id: 'cat_sq_deep_winter_food',
          name: 'Deep-Winter Food Stocks (Acorns & Seeds)',
          category: 'food',
          isEssential: true,
          minRecommendedLKR: 4000,
          maxRecommendedLKR: 6000,
          stepLKR: 500,
          defaultAmountLKR: 0,
          description: 'Long-term pantry reserve for months of frozen ground.',
        },
        {
          id: 'cat_sq_hollow_fortification',
          name: 'Winter Hearth & Hollow Fortification',
          category: 'shelter',
          isEssential: true,
          minRecommendedLKR: 3000,
          maxRecommendedLKR: 4500,
          stepLKR: 500,
          defaultAmountLKR: 0,
          description: 'Reinforced wood framing and clay chimney seal to withstand blizzards.',
        },
        {
          id: 'cat_sq_snowstorm_contingency',
          name: 'Mid-Winter Snowstorm Contingency Fund',
          category: 'savings',
          isEssential: true,
          minRecommendedLKR: 2500,
          maxRecommendedLKR: 4000,
          stepLKR: 500,
          defaultAmountLKR: 0,
          description: 'Liquid cash reserve for emergency repairs during blizzard months.',
        },
        {
          id: 'cat_sq_festive_celebration',
          name: 'Forest Snow Celebration Favors',
          category: 'discretionary',
          isEssential: false,
          minRecommendedLKR: 0,
          maxRecommendedLKR: 2000,
          stepLKR: 500,
          defaultAmountLKR: 0,
          description: 'Winter party decorations and candied nuts for visiting bird neighbors.',
        },
      ],
      passCriteria: {
        minCompetencyScore: 75,
        maxBudgetLKR: 12000,
        requireBudgetFeasibility: true,
        minReservePreservedLKR: 2500,
      },
      hints: [
        'Allocate at least Rs. 4,000 to food, Rs. 3,000 to hollow fortification, and Rs. 2,500 to the contingency fund.',
        'Spend no more than Rs. 1,500 on celebration favors so core survival is 100% fortified.',
      ],
      remediationScaffolding: {
        ruleExplanation:
          'A comprehensive financial plan balances essential living needs, capital maintenance, and liquid reserves, allowing modest celebrations only after security is guaranteed.',
        guidingQuestions: [
          'Did you fund all three pillars: food, shelter, and emergency contingency?',
          'Does total allocation equal the full Rs. 12,000 budget?',
        ],
        suggestedFocus:
          'Allocate Rs. 5,000 to Food, Rs. 3,500 to Hollow Fortification, Rs. 3,000 to Contingency, and Rs. 500 to Snow Celebration.',
      },
    },
  ],
};
