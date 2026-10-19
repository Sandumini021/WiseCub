// Mission 1: Rescue the Injured Puppy
// Flagship 8-Level Mission for Competency-Driven Emotional Mission Framework (CDEMF)

import { MissionDefinition } from '../../types/mission.types';
import { INITIAL_PUPPY_STATE } from '../../services/prototypeStorage';

export const RESCUE_PUPPY_MISSION: MissionDefinition = {
  id: 'mission_rescue_puppy',
  title: 'Rescue the Injured Puppy',
  characterName: 'Barnaby',
  characterRole: 'Injured stray pup needing medical rehabilitation',
  characterSpecies: 'Golden Retriever Mix Puppy',
  primaryCompetency: 'budgetingSkill',
  secondaryCompetencies: [
    'spendingDiscipline',
    'savingBehavior',
    'investmentAwareness',
    'emergencyPreparedness',
  ],
  description:
    'Manage virtual funds carefully to rescue and nurse Barnaby the puppy back to vibrant health. Every financial choice immediately impacts Barnaby’s comfort, recovery, and emotional state.',
  totalLevels: 8,
  themeColor: '#0f6b5c',
  initialCharacterState: INITIAL_PUPPY_STATE,
  levels: [
    // -------------------------------------------------------------
    // LEVEL 1: Discover the Injured Puppy (Needs vs Wants)
    // -------------------------------------------------------------
    {
      id: 'level_puppy_1',
      levelNumber: 1,
      title: 'Discover the Injured Puppy',
      subtitle: 'Needs vs. Wants',
      storyIntro:
        'You find Barnaby shivering under a park bench with a hurt paw! You have Rs. 5,000 in rescue money. Help him survive the night before it gets dark.',
      learningObjective:
        'Pick only what Barnaby needs to survive right now — save the rest of your cash!',
      targetCompetency: 'spendingDiscipline',
      interactionType: 'needs_wants',
      startingBudgetLKR: 5000,
      options: [
        {
          id: 'opt_first_aid',
          title: 'Antiseptic & Sterile Bandage Kit',
          description:
            'Cleans the wound and bandages the hurt paw to stop dangerous infection.',
          costLKR: 2500,
          category: 'essential_care',
          isEssential: true,
          financialTradeoffNote:
            'Must-have care! Without this, the infection will get worse.',
        },
        {
          id: 'opt_nutrition_pack',
          title: 'Puppy Meal & Clean Water',
          description:
            'Nourishing puppy food and water to give hungry Barnaby energy.',
          costLKR: 1200,
          category: 'nutrition',
          isEssential: true,
          financialTradeoffNote:
            'Vital nutrition needed right away to keep him strong.',
        },
        {
          id: 'opt_squeaky_toy',
          title: 'Fancy Squeaky Plush Toy',
          description:
            'A cute plush bone. Fun to play with, but won’t heal a hurt paw!',
          costLKR: 1500,
          category: 'discretionary',
          isEssential: false,
          financialTradeoffNote:
            'An optional want. Buying this empties your pockets and leaves nothing for tomorrow.',
        },
        {
          id: 'opt_cozy_towel',
          title: 'Warm Thermal Blanket',
          description:
            'A soft warm blanket to keep Barnaby comfortable tonight.',
          costLKR: 800,
          category: 'essential_care',
          isEssential: false,
          financialTradeoffNote:
            'A helpful comfort item that fits neatly within leftover change.',
        },
      ],
      passCriteria: {
        minCompetencyScore: 70,
        mustIncludeOptionIds: ['opt_first_aid', 'opt_nutrition_pack'],
        disallowedOptionIds: ['opt_squeaky_toy'],
        maxBudgetLKR: 5000,
        minReservePreservedLKR: 500,
        requireBudgetFeasibility: true,
      },
      hints: [
        'Barnaby is bleeding and hungry. Focus your funds on medicine and food first.',
        'Beware of cute toys right now — a squeaky toy cannot fix a hurt paw!',
      ],
      remediationScaffolding: {
        ruleExplanation:
          'When an emergency occurs, non-negotiable needs (safety, medicine, food) must always come first before optional wants (toys, luxury extras).',
        guidingQuestions: [
          'What happens to Barnaby if you buy the plush toy but cannot afford the bandage kit?',
          'How much cash remains in your pocket for tomorrow after buying essentials?',
        ],
        suggestedFocus:
          'Select the Antiseptic Kit and High-Protein Meal. Leave the toy on the shelf and keep the remaining change as a safety buffer.',
      },
    },

    // -------------------------------------------------------------
    // LEVEL 2: Plan the Care Budget (Multi-Category Allocation)
    // -------------------------------------------------------------
    {
      id: 'level_puppy_2',
      levelNumber: 2,
      title: 'Plan the Care Budget',
      subtitle: 'Budgeting & Safety Cushion',
      storyIntro:
        'Barnaby’s paw is bandaged, but he needs a full week of care. The shelter gave you Rs. 15,000. Split it wisely across his vet check, medicine, transport, and emergency cushion.',
      learningObjective:
        'Fund all essential care while keeping at least Rs. 2,500 safely tucked away in your emergency cushion.',
      targetCompetency: 'budgetingSkill',
      interactionType: 'budget_allocator',
      startingBudgetLKR: 15000,
      allocationCategories: [
        {
          id: 'cat_vet_check',
          name: 'Veterinary Clinical Checkup',
          category: 'veterinary_fees',
          isEssential: true,
          minRecommendedLKR: 6000,
          maxRecommendedLKR: 8000,
          stepLKR: 500,
          defaultAmountLKR: 6000,
          description:
            'Professional vet visit, health checkup, and paw x-ray.',
        },
        {
          id: 'cat_medicine_dress',
          name: 'Medication & Sterile Dressings',
          category: 'medical_supplies',
          isEssential: true,
          minRecommendedLKR: 3500,
          maxRecommendedLKR: 5000,
          stepLKR: 500,
          defaultAmountLKR: 3500,
          description:
            'Pain relief medicine and fresh bandages for daily dressing changes.',
        },
        {
          id: 'cat_transport',
          name: 'Safe Clinic Transport (Pet Taxi)',
          category: 'transportation',
          isEssential: true,
          minRecommendedLKR: 2000,
          maxRecommendedLKR: 3000,
          stepLKR: 500,
          defaultAmountLKR: 2000,
          description:
            'Safe, gentle pet taxi so Barnaby’s hurt leg doesn’t get bumped on bumpy roads.',
        },
        {
          id: 'cat_emergency_reserve',
          name: 'Emergency Safety Cushion',
          category: 'emergency_reserve',
          isEssential: true,
          minRecommendedLKR: 2500,
          maxRecommendedLKR: 4000,
          stepLKR: 500,
          defaultAmountLKR: 3500,
          description:
            'Backup emergency money kept safe in your cash box for sudden surprises.',
        },
        {
          id: 'cat_deluxe_grooming',
          name: 'Deluxe Salon Fur Styling',
          category: 'discretionary',
          isEssential: false,
          minRecommendedLKR: 0,
          maxRecommendedLKR: 3000,
          stepLKR: 500,
          defaultAmountLKR: 0,
          description:
            'Fancy scented fur spray and designer bandana. Fun, but totally optional!',
        },
      ],
      passCriteria: {
        minCompetencyScore: 75,
        maxBudgetLKR: 15000,
        minReservePreservedLKR: 2500,
        requireBudgetFeasibility: true,
      },
      hints: [
        'Your total spending must not go over Rs. 15,000.',
        'Make sure the Vet Check gets at least Rs. 6,000 and the Emergency Safety Cushion gets at least Rs. 2,500.',
      ],
      remediationScaffolding: {
        ruleExplanation:
          'A feasible budget matches or stays below income. If you overspend on luxury salon grooming, your emergency reserve drops to zero.',
        guidingQuestions: [
          'Did your total planned expenses exceed Rs. 15,000?',
          'Is your emergency safety cushion at least Rs. 2,500?',
        ],
        suggestedFocus:
          'Set Vet Checkup to Rs. 6,000, Medication to Rs. 3,500, Transport to Rs. 2,000, and put the remaining Rs. 3,500 into the Emergency Safety Cushion.',
      },
    },

    // -------------------------------------------------------------
    // LEVEL 3: Save for Treatment (Multi-Period Savings)
    // -------------------------------------------------------------
    {
      id: 'level_puppy_3',
      levelNumber: 3,
      title: 'Save for Treatment',
      subtitle: 'The 3-Week Saving Challenge',
      storyIntro:
        'Barnaby needs a Rs. 12,000 leg splint in 3 weeks so he can run again! You get Rs. 5,000 allowance each week. Can you cover his food, resist tempting treats, and save Rs. 12,000 in time?',
      learningObjective:
        'Bank Rs. 4,000 each week by resisting quick impulse fun so Barnaby gets his splint!',
      targetCompetency: 'savingBehavior',
      interactionType: 'multi_period_saving',
      startingBudgetLKR: 15000,
      multiPeriodConfig: {
        targetGoalLKR: 12000,
        goalDescription: 'Specialized Orthopedic Splint for Barnaby',
        periods: [
          {
            period: 1,
            label: 'Week 1',
            allowanceLKR: 5000,
            mandatoryCostLKR: 1000,
            mandatoryCostDescription: 'Fresh puppy kibble & clean bedding',
            temptationCostLKR: 1500,
            temptationTitle: 'Video Game Arcade Afternoon with Friends',
            temptationDescription:
              'Spend Rs. 1,500 on game tokens at the mall arcade.',
          },
          {
            period: 2,
            label: 'Week 2',
            allowanceLKR: 5000,
            mandatoryCostLKR: 1000,
            mandatoryCostDescription: 'Wound antiseptic replenishment',
            temptationCostLKR: 1200,
            temptationTitle: 'Fast Food Pizza Feast',
            temptationDescription:
              'Order a large takeout pizza with extra sodas.',
          },
          {
            period: 3,
            label: 'Week 3',
            allowanceLKR: 5000,
            mandatoryCostLKR: 1000,
            mandatoryCostDescription: 'Pre-surgery sanitized wash',
            temptationCostLKR: 1400,
            temptationTitle: 'Trendy Designer T-Shirt',
            temptationDescription:
              'A flashy graphic t-shirt on weekend clearance sale.',
          },
        ],
      },
      passCriteria: {
        minCompetencyScore: 75,
        maxBudgetLKR: 15000,
        minReservePreservedLKR: 12000,
        requireBudgetFeasibility: true,
      },
      hints: [
        'To reach Rs. 12,000 in 3 weeks, you must stash away Rs. 4,000 every single week!',
        'After paying Rs. 1,000 for basics, spending money on pizza or arcade games will make you fail the goal.',
      ],
      remediationScaffolding: {
        ruleExplanation:
          'Delayed gratification means passing on small instant pleasures today so you can fund life-changing goals tomorrow.',
        guidingQuestions: [
          'If you buy the arcade tokens in Week 1, can you mathematically hit Rs. 12,000 by Week 3?',
          'Which matters more: temporary video games or Barnaby being able to walk again?',
        ],
        suggestedFocus:
          'Resist the impulse temptations in all three weeks and commit Rs. 4,000 per week directly into the medical savings goal.',
      },
    },

    // -------------------------------------------------------------
    // LEVEL 4: Make Smart Purchasing Decisions (Value for Money)
    // -------------------------------------------------------------
    {
      id: 'level_puppy_4',
      levelNumber: 4,
      title: 'Smart Shopping Decisions',
      subtitle: 'Value for Money: Safe Care vs. Cheap Traps',
      storyIntro:
        'You have Rs. 8,000 for Barnaby’s medicine and care. Three clinics offer treatments. Watch out: the cheapest one is sketchy, and the luxury pet spa charges for useless perks!',
      learningObjective:
        'Pick the certified, safe clinic that gives true value without falling for cheap fakes or overpaying for hype.',
      targetCompetency: 'investmentAwareness',
      interactionType: 'value_comparison',
      startingBudgetLKR: 8000,
      options: [
        {
          id: 'opt_clinic_shady',
          title: 'Unlicensed Street Stall "Miracle Ointment"',
          description:
            'Cost: Rs. 2,000. Mystery potion from a street stall with no vet license. Dangerous! Could cause skin burns.',
          costLKR: 2000,
          category: 'medical_supplies',
          isEssential: false,
          qualityLevel: 'substandard',
          financialTradeoffNote:
            'A dangerous cheap trap. Saves money at first but causes medical disaster.',
        },
        {
          id: 'opt_clinic_certified',
          title: 'Community Veterinary Hospital Standard Treatment',
          description:
            'Cost: Rs. 6,500. Real animal hospital with licensed doctors, sterile tools, verified medicine, and 2-week checkup guarantee.',
          costLKR: 6500,
          category: 'medical_supplies',
          isEssential: true,
          qualityLevel: 'certified_good',
          financialTradeoffNote:
            'True value for money: certified care that fits in budget and leaves Rs. 1,500 in savings.',
        },
        {
          id: 'opt_clinic_luxury',
          title: 'Prestige Pet Spa & VIP Treatment Suite',
          description:
            'Cost: Rs. 14,000. Same medicine as the hospital, plus silk puppy pillows, classical music, and golden bowls. Way over budget!',
          costLKR: 14000,
          category: 'medical_supplies',
          isEssential: false,
          qualityLevel: 'luxury_excess',
          financialTradeoffNote:
            'Wasteful luxury. Far exceeds your Rs. 8,000 budget with zero extra medical benefit.',
        },
      ],
      passCriteria: {
        minCompetencyScore: 80,
        mustIncludeOptionIds: ['opt_clinic_certified'],
        disallowedOptionIds: ['opt_clinic_shady', 'opt_clinic_luxury'],
        maxBudgetLKR: 8000,
        minReservePreservedLKR: 1000,
        requireBudgetFeasibility: true,
      },
      hints: [
        'Does Barnaby need silk pillows to heal, or real medicine from a certified doctor?',
        'Watch out for fake bargains — cheap unverified medicine can make a sick pet worse!',
      ],
      remediationScaffolding: {
        ruleExplanation:
          'Value-for-money means paying for certified reliability, not paying for overpriced branding, nor cutting corners on dangerous fake bargains.',
        guidingQuestions: [
          'Why is the Rs. 2,000 unlicensed ointment a false economy?',
          'Can you afford the Rs. 14,000 VIP suite on an Rs. 8,000 budget?',
        ],
        suggestedFocus:
          'Select the Community Veterinary Hospital. It delivers certified medicine, stays under budget, and leaves Rs. 1,500 in savings.',
      },
    },

    // -------------------------------------------------------------
    // LEVEL 5: Unexpected Financial Emergency (Reserve Utilization)
    // -------------------------------------------------------------
    {
      id: 'level_puppy_5',
      levelNumber: 5,
      title: 'Unexpected Emergency!',
      subtitle: 'Using Your Emergency Fund',
      storyIntro:
        'Midnight alert! Barnaby woke up with a burning fever and needs an urgent Rs. 4,500 clinic injection. You only have Rs. 2,000 cash in your pocket. Luckily, you saved an emergency fund!',
      learningObjective:
        'Use your saved emergency cash to solve the crisis instantly with zero debt!',
      targetCompetency: 'savingBehavior',
      interactionType: 'emergency_response',
      startingBudgetLKR: 5500, // Rs. 2000 cash + Rs. 3500 emergency reserve
      existingReserveLKR: 3500,
      options: [
        {
          id: 'opt_use_emergency_fund',
          title: 'Deploy Emergency Reserve + Available Cash',
          description:
            'Use your Rs. 2,000 cash and Rs. 2,500 from your emergency cushion. Leaves Rs. 1,000 backup savings with ZERO debt!',
          costLKR: 4500,
          category: 'essential_care',
          isEssential: true,
          financialTradeoffNote:
            'The smart move. This is exactly what emergency reserves exist for!',
        },
        {
          id: 'opt_delay_treatment',
          title: 'Delay the Antibiotic Injection until Next Week',
          description:
            'Pay nothing today, but risk Barnaby’s fever turning into a life-threatening illness. Not safe!',
          costLKR: 0,
          category: 'discretionary',
          isEssential: false,
          financialTradeoffNote:
            'Extremely dangerous. Health emergencies cannot be postponed.',
        },
        {
          id: 'opt_predatory_loan',
          title: 'Borrow from a Fast Money Shark (High 50% Weekly Interest)',
          description:
            'Borrow Rs. 4,500 from a shady loan shark who demands Rs. 6,750 back in 7 days! A dangerous money trap.',
          costLKR: 6750,
          category: 'discretionary',
          isEssential: false,
          financialTradeoffNote:
            'Predatory debt trap. Borrowing when you already have reserve cash is destructive.',
        },
      ],
      passCriteria: {
        minCompetencyScore: 80,
        mustIncludeOptionIds: ['opt_use_emergency_fund'],
        disallowedOptionIds: ['opt_delay_treatment', 'opt_predatory_loan'],
        maxBudgetLKR: 5500,
        minReservePreservedLKR: 1000,
        requireBudgetFeasibility: true,
      },
      hints: [
        'This is exactly why you saved an Emergency Cushion. Use it!',
        'Never take loans with crazy interest fees when your own savings can cover the emergency.',
      ],
      remediationScaffolding: {
        ruleExplanation:
          'Emergency funds exist to absorb unforeseen shocks without incurring toxic debt or sacrificing safety.',
        guidingQuestions: [
          'Why take a loan with 50% interest when you have money sitting in your emergency jar?',
          'What happens to Barnaby if you choose to wait until next week?',
        ],
        suggestedFocus:
          'Choose to deploy your emergency reserve and available cash. It covers the medical cost in full and preserves your peace of mind.',
      },
    },

    // -------------------------------------------------------------
    // LEVEL 6: Recovery Planning (Recurring Budget Management)
    // -------------------------------------------------------------
    {
      id: 'level_puppy_6',
      levelNumber: 6,
      title: 'Recovery Planning',
      subtitle: 'Monthly Budget Balance',
      storyIntro:
        'Barnaby’s fever is gone and his splint works! Now you manage an Rs. 8,000 monthly allowance for his 3-month recovery. Balance his nutrition, physio workouts, and backup savings.',
      learningObjective:
        'Keep total monthly spending under Rs. 8,000 while putting money back into your emergency fund.',
      targetCompetency: 'budgetingSkill',
      interactionType: 'recurring_budget',
      startingBudgetLKR: 8000,
      allocationCategories: [
        {
          id: 'cat_rec_nutrition',
          name: 'Bone & Joint Prescription Kibble',
          category: 'nutrition',
          isEssential: true,
          minRecommendedLKR: 3000,
          maxRecommendedLKR: 4000,
          stepLKR: 500,
          defaultAmountLKR: 3000,
          description:
            'Nutritious calcium and protein food to help Barnaby’s bone heal strong.',
        },
        {
          id: 'cat_rec_physio',
          name: 'Bi-Weekly Physical Therapy Check',
          category: 'veterinary_fees',
          isEssential: true,
          minRecommendedLKR: 2500,
          maxRecommendedLKR: 3500,
          stepLKR: 500,
          defaultAmountLKR: 2500,
          description:
            'Guided leg exercises with the animal physical therapist.',
        },
        {
          id: 'cat_rec_reserve',
          name: 'Monthly Maintenance Reserve',
          category: 'emergency_reserve',
          isEssential: true,
          minRecommendedLKR: 2000,
          maxRecommendedLKR: 3000,
          stepLKR: 500,
          defaultAmountLKR: 2500,
          description:
            'Puts money back into the emergency cushion for future health surprises.',
        },
        {
          id: 'cat_rec_treats',
          name: 'Imported Gourmet Liver Snacks',
          category: 'discretionary',
          isEssential: false,
          minRecommendedLKR: 0,
          maxRecommendedLKR: 2500,
          stepLKR: 500,
          defaultAmountLKR: 0,
          description:
            'Imported gourmet treats. Yummy, but won’t help heal his bone!',
        },
      ],
      passCriteria: {
        minCompetencyScore: 75,
        maxBudgetLKR: 8000,
        minReservePreservedLKR: 2000,
        requireBudgetFeasibility: true,
      },
      hints: [
        'Total monthly spending must stay within your Rs. 8,000 allowance.',
        'Fund the healing kibble (Rs. 3,000) and physio (Rs. 2,500), and put at least Rs. 2,000 into backup savings.',
      ],
      remediationScaffolding: {
        ruleExplanation:
          'Long-term recovery fails if ongoing expenses exceed income. Consistent recurring budgets build enduring stability.',
        guidingQuestions: [
          'Did your recurring allocations exceed your Rs. 8,000 monthly allowance?',
          'Did you leave sufficient funds to replenish your emergency cushion?',
        ],
        suggestedFocus:
          'Allocate Rs. 3,000 to Nutrition, Rs. 2,500 to Physio, and Rs. 2,500 to the Reserve. Skip the luxury imported snacks.',
      },
    },

    // -------------------------------------------------------------
    // LEVEL 7: Difficult Financial Trade-Off (Reasoning & Justification)
    // -------------------------------------------------------------
    {
      id: 'level_puppy_7',
      levelNumber: 7,
      title: 'Tough Money Choices',
      subtitle: 'Real Health vs. Shiny Comforts',
      storyIntro:
        'You have Rs. 10,000 left for Barnaby’s final healing step. A friend wants you to buy a fancy Rs. 4,500 heated velvet bed, but Barnaby needs his vaccines and mobility clearance. You can’t buy both!',
      learningObjective:
        'Choose lasting health protection over short-term luxury and explain your smart reasoning.',
      targetCompetency: 'investmentAwareness',
      interactionType: 'tradeoff_justification',
      startingBudgetLKR: 10000,
      options: [
        {
          id: 'opt_vaccine_chip',
          title: 'Mandatory Core Vaccinations & Safety Microchip',
          description:
            'Cost: Rs. 4,000. Protects against deadly viral diseases, and the microchip ensures Barnaby never gets lost.',
          costLKR: 4000,
          category: 'essential_care',
          isEssential: true,
          financialTradeoffNote:
            'Preventive health and permanent identification are non-negotiable.',
        },
        {
          id: 'opt_mobility_check',
          title: 'Final Physical Mobility & X-Ray Certification',
          description:
            'Cost: Rs. 4,000. Confirms the leg bone is 100% healed so Barnaby gets medical clearance to run freely.',
          costLKR: 4000,
          category: 'veterinary_fees',
          isEssential: true,
          financialTradeoffNote:
            'Essential clinical verification of recovery.',
        },
        {
          id: 'opt_heated_bed',
          title: 'Designer Heated Orthopedic Velvet Bed',
          description:
            'Cost: Rs. 4,500. A luxurious velvet bed with an electric warmer.',
          costLKR: 4500,
          category: 'discretionary',
          isEssential: false,
          financialTradeoffNote:
            'A comfort want. A regular clean blanket and towel already keep Barnaby warm.',
        },
      ],
      tradeoffRationales: [
        {
          id: 'rat_sound_preventive',
          text: 'I choose Vaccinations & Mobility Certification because preventive health protects against deadly diseases, while an ordinary clean blanket already keeps Barnaby warm.',
          isSound: true,
          feedback:
            'Excellent financial judgment! Long-term preventive investments safeguard health and avert catastrophic future hospital bills.',
        },
        {
          id: 'rat_comfort_first',
          text: 'I choose the Heated Velvet Bed because comfort makes Barnaby feel pampered right now, and vaccines can wait.',
          isSound: false,
          feedback:
            'Dangerous trade-off! Skipping vaccinations exposes Barnaby to deadly parvo virus. Luxury bedding cannot cure infectious diseases.',
        },
      ],
      passCriteria: {
        minCompetencyScore: 80,
        mustIncludeOptionIds: ['opt_vaccine_chip', 'opt_mobility_check'],
        disallowedOptionIds: ['opt_heated_bed'],
        maxBudgetLKR: 10000,
        minReservePreservedLKR: 2000,
        requiredRationaleId: 'rat_sound_preventive',
        requireBudgetFeasibility: true,
      },
      hints: [
        'Think long term: what permanently protects Barnaby from disease, versus what’s just cozy luxury?',
        'Pick the explanation that values prevention over luxury pampering.',
      ],
      remediationScaffolding: {
        ruleExplanation:
          'Financial maturity is shown by prioritizing preventive investments (vaccines, microchips) that permanently avert future risks over luxury goods.',
        guidingQuestions: [
          'If you buy the heated bed and skip vaccines, what happens if an infection breaks out?',
          'Which choice leaves Barnaby permanently protected for life?',
        ],
        suggestedFocus:
          'Select the Vaccinations and Mobility Certification options, and pick the rationale explaining preventive protection.',
      },
    },

    // -------------------------------------------------------------
    // LEVEL 8: Final Rescue and Recovery Challenge (Capstone)
    // -------------------------------------------------------------
    {
      id: 'level_puppy_8',
      levelNumber: 8,
      title: 'Barnaby’s Forever Home',
      subtitle: 'Graduation Capstone: Money Master',
      storyIntro:
        'Adoption Day is here! You have a Rs. 20,000 graduation fund to set up Barnaby’s forever life: legal adoption papers, 6 months of wellness medicine, and a permanent safety cushion.',
      learningObjective:
        'Prove your money mastery: fund all essential care and lock in a big safety cushion for Barnaby!',
      targetCompetency: 'goalAchievement',
      interactionType: 'capstone_challenge',
      startingBudgetLKR: 20000,
      allocationCategories: [
        {
          id: 'cap_adoption_legal',
          name: 'Legal Adoption & Registration Certificate',
          category: 'essential_care',
          isEssential: true,
          minRecommendedLKR: 3000,
          maxRecommendedLKR: 4000,
          stepLKR: 500,
          defaultAmountLKR: 3000,
          description:
            'Official municipal adoption papers and legal pet passport.',
        },
        {
          id: 'cap_six_month_care',
          name: '6-Month Preventive Healthcare & Deworming Kit',
          category: 'medical_supplies',
          isEssential: true,
          minRecommendedLKR: 7000,
          maxRecommendedLKR: 9000,
          stepLKR: 500,
          defaultAmountLKR: 7000,
          description:
            'Full 6-month supply of flea protection, deworming, and joint supplements.',
        },
        {
          id: 'cap_permanent_reserve',
          name: 'Permanent Emergency Safety Cushion',
          category: 'emergency_reserve',
          isEssential: true,
          minRecommendedLKR: 6000,
          maxRecommendedLKR: 9000,
          stepLKR: 500,
          defaultAmountLKR: 6000,
          description:
            'A locked emergency savings fund in the bank for future vet visits.',
        },
        {
          id: 'cap_celebration_party',
          name: 'Grand Fireworks & Pet Mascot Party',
          category: 'discretionary',
          isEssential: false,
          minRecommendedLKR: 0,
          maxRecommendedLKR: 8000,
          stepLKR: 500,
          defaultAmountLKR: 0,
          description:
            'Loud fireworks and party caterers. Terrifies the puppy and wastes Rs. 8,000!',
        },
      ],
      passCriteria: {
        minCompetencyScore: 85,
        maxBudgetLKR: 20000,
        minReservePreservedLKR: 6000,
        requireBudgetFeasibility: true,
      },
      hints: [
        'Don’t blow money on loud fireworks that scare pets and burn cash.',
        'Ensure the Permanent Safety Cushion gets at least Rs. 6,000 and all essential care is funded.',
      ],
      remediationScaffolding: {
        ruleExplanation:
          'True financial freedom is achieved when you have funded all legal essentials, secured future maintenance, and maintained a massive emergency buffer.',
        guidingQuestions: [
          'Does Barnaby benefit from fireworks, or does he benefit from a permanent emergency reserve?',
          'Did you stay within the Rs. 20,000 graduation budget?',
        ],
        suggestedFocus:
          'Allocate Rs. 3,000 to Legal Adoption, Rs. 8,000 to 6-Month Preventive Care, Rs. 9,000 to Permanent Emergency Reserve, and Rs. 0 to Fireworks.',
      },
    },
  ],
};
