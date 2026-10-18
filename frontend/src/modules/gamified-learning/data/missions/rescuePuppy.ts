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
      subtitle: 'Recognize Essential Needs vs Optional Wants',
      storyIntro:
        'While walking home, you find Barnaby huddled under a park bench with a sprained, bleeding paw. You have a starting emergency rescue fund of Rs. 5,000. Barnaby needs immediate stabilization before nightfall!',
      learningObjective:
        'Distinguish essential survival needs from discretionary wants when resources are strictly limited.',
      targetCompetency: 'spendingDiscipline',
      interactionType: 'needs_wants',
      startingBudgetLKR: 5000,
      options: [
        {
          id: 'opt_first_aid',
          title: 'Antiseptic & Sterile Bandage Kit',
          description:
            'Cleans the wound thoroughly and binds the injured paw to prevent dangerous infection.',
          costLKR: 2500,
          category: 'essential_care',
          isEssential: true,
          financialTradeoffNote:
            'Indispensable medical need. Without this, infection risks worsen.',
        },
        {
          id: 'opt_nutrition_pack',
          title: 'High-Protein Puppy Meal & Clean Water',
          description:
            'Nourishes the dehydrated, hungry puppy to rebuild bodily strength.',
          costLKR: 1200,
          category: 'nutrition',
          isEssential: true,
          financialTradeoffNote:
            'Vital nourishment needed immediately to stabilize vitality.',
        },
        {
          id: 'opt_squeaky_toy',
          title: 'Fancy Squeaky Plush Toy',
          description:
            'A cute plush bone toy that looks fun, but provides no medical healing or nutrition.',
          costLKR: 1500,
          category: 'discretionary',
          isEssential: false,
          financialTradeoffNote:
            'Discretionary want. Buying this would exhaust your funds and cause an overspend if essentials are bought.',
        },
        {
          id: 'opt_cozy_towel',
          title: 'Warm Thermal Rescue Blanket',
          description:
            'Keeps the shivering puppy warm during chilly evening recovery.',
          costLKR: 800,
          category: 'essential_care',
          isEssential: false,
          financialTradeoffNote:
            'Helpful comfort item that fits neatly within remaining change.',
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
        'Barnaby is bleeding and hungry. Focus your funds on the wound dressing and food first.',
        'Beware of decorative toys right now—toys cannot disinfect a bleeding paw!',
      ],
      remediationScaffolding: {
        ruleExplanation:
          'When an emergency occurs, non-negotiable needs (safety, medicine, food) must always take 100% precedence over optional wants (toys, luxury extras).',
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
      subtitle: 'Multi-Category Budget Allocation & Reserve Preservation',
      storyIntro:
        'Barnaby’s initial wound is dressed, but he needs a comprehensive care plan for the week. The community shelter grants you a care budget of Rs. 15,000. You must allocate every rupee wisely across veterinary, medication, transport, and reserve categories.',
      learningObjective:
        'Create a balanced, comprehensive budget that fully covers essential line-items and sets aside an emergency buffer.',
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
            'Professional veterinary diagnosis, physical palpation, and x-ray consultation.',
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
            'Prescription pain relievers and daily wound dressing replenishment.',
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
            'Gentle, low-vibration transport so Barnaby’s hurt leg is not jarred on bumpy roads.',
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
            'Unallocated reserve kept safe in the cash box for sudden complications.',
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
            'A perfumed coat spray and designer bandana. Completely optional.',
        },
      ],
      passCriteria: {
        minCompetencyScore: 75,
        maxBudgetLKR: 15000,
        minReservePreservedLKR: 2500,
        requireBudgetFeasibility: true,
      },
      hints: [
        'Total allocated amounts must not exceed Rs. 15,000.',
        'Make sure the Vet Checkup gets at least Rs. 6,000 and the Emergency Reserve gets at least Rs. 2,500.',
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
      subtitle: 'Multi-Period Savings Discipline & Goal Progress',
      storyIntro:
        'The vet says Barnaby’s torn ligament requires a specialized orthopedic splint in 3 weeks, costing Rs. 12,000. You earn a weekly community stipend of Rs. 5,000 for 3 weeks (total Rs. 15,000). Each week brings essential living costs and alluring impulse temptations. Will you accumulate the required Rs. 12,000?',
      learningObjective:
        'Demonstrate multi-period savings discipline by consistently banking funds and resisting non-essential spending temptations.',
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
              'Spend Rs. 1,500 on tokens at the game parlor.',
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
        'To reach Rs. 12,000 over 3 weeks, you must save an average of Rs. 4,000 each week!',
        'Since your weekly income is Rs. 5,000 and mandatory costs are Rs. 1,000, giving in to temptations leaves you short of the goal.',
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
      title: 'Make Smart Purchasing Decisions',
      subtitle: 'Value-for-Money Analysis: Cheap Traps vs Certified Care',
      storyIntro:
        'You have Rs. 8,000 ready to purchase the medical procedure and antibiotics. Three medical providers offer different packages. Be careful: the cheapest option may be unsafe, while the most expensive option charges for unnecessary luxury.',
      learningObjective:
        'Evaluate value-for-money by balancing safety, certified efficacy, and cost, rather than assuming cheapest is best or expensive is required.',
      targetCompetency: 'investmentAwareness',
      interactionType: 'value_comparison',
      startingBudgetLKR: 8000,
      options: [
        {
          id: 'opt_clinic_shady',
          title: 'Unlicensed Street Stall "Miracle Ointment"',
          description:
            'Cost: Rs. 2,000. Unverified chemical ointment with no vet certification. High risk of chemical burns and toxic skin irritation.',
          costLKR: 2000,
          category: 'medical_supplies',
          isEssential: false,
          qualityLevel: 'substandard',
          financialTradeoffNote:
            'A dangerous cheap trap. Saves money initially but causes medical disaster.',
        },
        {
          id: 'opt_clinic_certified',
          title: 'Community Veterinary Hospital Standard Treatment',
          description:
            'Cost: Rs. 6,500. Fully certified veterinary staff, sterile surgical equipment, verified antibiotics, and a 2-week follow-up guarantee.',
          costLKR: 6500,
          category: 'medical_supplies',
          isEssential: true,
          qualityLevel: 'certified_good',
          financialTradeoffNote:
            'True value-for-money: certified efficacy that fits within budget and leaves Rs. 1,500 in reserve.',
        },
        {
          id: 'opt_clinic_luxury',
          title: 'Prestige Pet Spa & VIP Treatment Suite',
          description:
            'Cost: Rs. 14,000. Same medical antibiotics as the hospital, plus silk puppy pillows, classical music, and golden bowls.',
          costLKR: 14000,
          category: 'medical_supplies',
          isEssential: false,
          qualityLevel: 'luxury_excess',
          financialTradeoffNote:
            'Wasteful luxury. Far exceeds your Rs. 8,000 budget with zero additional medical benefit.',
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
        'Compare what each provider actually delivers. Does Barnaby need silk pillows to heal?',
        'Look out for fake or uncertified cheap medicines that could harm the puppy.',
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
      title: 'Unexpected Financial Emergency',
      subtitle: 'Resilience Under Pressure: Utilizing Emergency Reserves',
      storyIntro:
        'Disaster strikes at midnight! Barnaby develops a sudden allergic fever and requires an immediate specialized antihistamine injection costing Rs. 4,500. Your current cash on hand is only Rs. 2,000, but fortunately you preserved an Emergency Reserve from previous levels of Rs. 3,500!',
      learningObjective:
        'Protect essential health by prudently tapping emergency reserves while avoiding predatory debt or postponing non-negotiable care.',
      targetCompetency: 'savingBehavior',
      interactionType: 'emergency_response',
      startingBudgetLKR: 5500, // Rs. 2000 cash + Rs. 3500 emergency reserve
      existingReserveLKR: 3500,
      options: [
        {
          id: 'opt_use_emergency_fund',
          title: 'Deploy Emergency Reserve + Available Cash',
          description:
            'Use Rs. 2,000 cash and withdraw Rs. 2,500 from your emergency reserve. Leaves Rs. 1,000 in backup cushion with ZERO debt.',
          costLKR: 4500,
          category: 'essential_care',
          isEssential: true,
          financialTradeoffNote:
            'The correct financial move. This is exactly what emergency reserves exist for!',
        },
        {
          id: 'opt_delay_treatment',
          title: 'Delay the Antibiotic Injection until Next Week',
          description:
            'Pay nothing today, but risk Barnaby’s fever spiking into a life-threatening illness.',
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
            'Borrow Rs. 4,500 with a predatory repayment fee of Rs. 6,750 due in 7 days.',
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
        'You specifically saved an Emergency Cushion for situations like this. Use it!',
        'Never take high-interest predatory loans when your own savings can cover the emergency.',
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
      subtitle: 'Long-Term Recurring Care & Reserve Sustainability',
      storyIntro:
        'Barnaby’s fever has subsided and his splint is doing its job. Now comes the critical 3-month rehabilitation phase. You manage a monthly youth animal guardian allowance of Rs. 8,000 per month. You must design a sustainable recurring monthly budget.',
      learningObjective:
        'Balance recurring monthly operating costs with ongoing reserve accumulation to sustain recovery over several months.',
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
            'Essential calcium and protein diet necessary for bone regrowth.',
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
            'Professional leg mobility exercises supervised by the animal therapist.',
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
            'Replenishes the safety cushion for any future medical needs.',
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
            'Expensive imported snacks that taste nice but offer no therapeutic benefit.',
        },
      ],
      passCriteria: {
        minCompetencyScore: 75,
        maxBudgetLKR: 8000,
        minReservePreservedLKR: 2000,
        requireBudgetFeasibility: true,
      },
      hints: [
        'Total monthly expenses must stay under Rs. 8,000.',
        'Ensure both prescription food (Rs. 3,000) and physical therapy (Rs. 2,500) are funded, while setting aside at least Rs. 2,000 into the maintenance reserve.',
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
      title: 'Difficult Financial Trade-Off',
      subtitle: 'Evaluating Competing Priorities with Financial Reasoning',
      storyIntro:
        'With Rs. 10,000 remaining, you face competing priorities as Barnaby enters his final recovery stage. A friend urges you to buy a customized heated orthopedic bed (Rs. 4,500) and premium toys, while the vet recommends mandatory vaccinations & microchip (Rs. 4,000) plus an advanced mobility checkup (Rs. 4,000). You cannot afford everything! Choose wisely and explain your financial rationale.',
      learningObjective:
        'Defend a financial trade-off by identifying long-term preventive protection over short-term material comfort.',
      targetCompetency: 'investmentAwareness',
      interactionType: 'tradeoff_justification',
      startingBudgetLKR: 10000,
      options: [
        {
          id: 'opt_vaccine_chip',
          title: 'Mandatory Core Vaccinations & Safety Microchip',
          description:
            'Cost: Rs. 4,000. Protects against rabies and parvo virus; microchip ensures Barnaby will never be lost again.',
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
            'Cost: Rs. 4,000. Confirms the leg bone is 100% healed and gives Barnaby medical clearance to run freely.',
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
        'Think long-term: what prevents future disease versus what is merely a cozy luxury?',
        'Select the rationale that highlights preventive care over superficial pampering.',
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
      title: 'Final Rescue and Recovery Challenge',
      subtitle: 'Capstone Synthesis: Independent Financial Stewardship',
      storyIntro:
        'Today is Barnaby’s adoption day celebration! You are given a comprehensive graduation fund of Rs. 20,000. You must formulate Barnaby’s permanent adoption setup: finalize the adoption registration, secure a 6-month preventive care pack, allocate a permanent emergency cushion, and avoid wasteful overspending.',
      learningObjective:
        'Synthesize budgeting, saving, needs prioritization, and emergency buffer planning in an independent capstone scenario.',
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
            'Six months of heartworm, flea, and joint protection supplements.',
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
            'Dedicated high-yield emergency bank reserve for unforeseen future vet costs.',
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
            'Noisy fireworks and party caterers that scare the puppy and drain Rs. 8,000.',
        },
      ],
      passCriteria: {
        minCompetencyScore: 85,
        maxBudgetLKR: 20000,
        minReservePreservedLKR: 6000,
        requireBudgetFeasibility: true,
      },
      hints: [
        'Do not spend money on loud fireworks that terrify animals.',
        'Ensure the Permanent Safety Cushion receives at least Rs. 6,000 and all essential registration & medicine are funded.',
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
