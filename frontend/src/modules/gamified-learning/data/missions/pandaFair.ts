// Mission 3: Panda's School Fair (Bao Bao's Charity Challenge)
// 6-Level CDEMF Mission for School Students Aged 12–16

import { MissionDefinition } from '../../types/mission.types';

export const INITIAL_BAOBAO_STATE = {
  characterId: 'char_panda_baobao',
  name: 'Bao Bao',
  physicalCondition: 'WEAK_STABILIZED' as const,
  emotionalState: 'EXCITED' as const,
  conditionDescription:
    'Bao Bao is eagerly preparing for the School Charity Fair, ready to balance the budget for the community library.',
  vitalityScore: 60,
  happinessScore: 55,
  activeDialogue:
    "Welcome to the School Fair planning committee! Together, let's budget carefully, partner with honest vendors, and build our dream library!",
  budgetHealth: 60,
  fairReadiness: 30,
  charityGoalProgress: 0,
  vendorRelationships: 50,
  customerSatisfaction: 50,
  financialRiskExposure: 35,
  emotionalWellbeing: 60,
};

export const PANDA_FAIR_MISSION: MissionDefinition = {
  id: 'mission_panda_fair',
  title: "Panda's School Fair",
  characterName: 'Bao Bao',
  characterRole: 'Student Council Treasurer organizing the community charity fair',
  characterSpecies: 'Giant Panda',
  primaryCompetency: 'spendingDiscipline',
  secondaryCompetencies: [
    'budgetingSkill',
    'investmentAwareness',
    'savingBehavior',
    'goalAchievement',
    'emergencyPreparedness',
    'tradeoffReasoning',
  ],
  description:
    "Partner with Bao Bao the Panda, student treasurer of the annual school charity fair. Make responsible financial decisions across booth construction, vendor negotiation, pricing, emergency mitigation, and charity distribution to build the Community Learning Library!",
  totalLevels: 6,
  themeColor: '#0a4d42',
  initialCharacterState: INITIAL_BAOBAO_STATE,
  levels: [
    // -------------------------------------------------------------
    // LEVEL 1: The School Fair Begins (Needs vs Wants & Budgeting)
    // -------------------------------------------------------------
    {
      id: 'level_panda_1',
      levelNumber: 1,
      title: 'The School Fair Begins',
      subtitle: 'Needs vs. Wants & Fair Staging',
      storyIntro:
        'Bao Bao is selected as student treasurer for the School Charity Fair! With Rs. 20,000 in starting funds, Bao Bao must build safe, attractive stalls, set up essential hygiene supplies, and print promotional posters while preserving at least Rs. 4,000 as a contingency buffer for fair week.',
      learningObjective:
        'Prioritize non-negotiable stall tables, first aid, and basic signage within budget, resisting oversized neon decorations.',
      targetCompetency: 'budgetingSkill',
      interactionType: 'needs_wants',
      startingBudgetLKR: 20000,
      options: [
        {
          id: 'opt_panda_sturdy_stalls',
          title: 'Sturdy Stall Tables & Wooden Booth Frames',
          description: 'Stable wooden tables and partition frames for students to run their game and food stalls safely.',
          costLKR: 7000,
          category: 'essential_care',
          isEssential: true,
          qualityLevel: 'certified_good',
          financialTradeoffNote: 'Core infrastructure: ensures physical safety and allows stalls to open.',
        },
        {
          id: 'opt_panda_hygiene_safety',
          title: 'First Aid Kit, Hand Sanitizer & Covered Bins',
          description: 'Mandatory school hygiene and emergency care kit with sanitary waste disposal bins.',
          costLKR: 4000,
          category: 'essential_care',
          isEssential: true,
          qualityLevel: 'certified_good',
          financialTradeoffNote: 'Core safety: non-negotiable health requirement for hosting public gatherings.',
        },
        {
          id: 'opt_panda_fair_flyers',
          title: 'Printed Fair Posters & Directional Signs',
          description: 'Recycled paper promotional banners and signs directing visitors to stalls.',
          costLKR: 2000,
          category: 'essential_care',
          isEssential: true,
          qualityLevel: 'certified_good',
          financialTradeoffNote: 'Essential promotion: informs students and parents about fair hours and charity causes.',
        },
        {
          id: 'opt_panda_paper_streamers',
          title: 'Affordable Colorful Paper Banners & Chalkboards',
          description: 'Cheerful festive paper buntings and chalkboards made by the student art club.',
          costLKR: 2000,
          category: 'discretionary',
          isEssential: false,
          qualityLevel: 'certified_good',
          financialTradeoffNote: 'Affordable aesthetics: adds festive cheer while leaving a healthy contingency buffer.',
        },
        {
          id: 'opt_panda_neon_archway',
          title: 'Giant Flashing Neon Balloon Archway',
          description: 'Expensive electric neon balloon entrance that requires heavy generator wiring.',
          costLKR: 9000,
          category: 'discretionary',
          isEssential: false,
          qualityLevel: 'luxury_excess',
          financialTradeoffNote: 'Luxury excess: consumes 45% of the preparation budget for cosmetic glow.',
        },
        {
          id: 'opt_panda_vip_sound_system',
          title: 'DJ Sound Blaster with Fog & Smoke Effects',
          description: 'High-end concert sound stage with artificial fog machine.',
          costLKR: 8000,
          category: 'discretionary',
          isEssential: false,
          qualityLevel: 'luxury_excess',
          financialTradeoffNote: 'Excessive indulgence: noisy and drains emergency reserves completely.',
        },
      ],
      passCriteria: {
        minCompetencyScore: 75,
        maxBudgetLKR: 20000,
        requireBudgetFeasibility: true,
        minReservePreservedLKR: 4000,
        mustIncludeOptionIds: [
          'opt_panda_sturdy_stalls',
          'opt_panda_hygiene_safety',
          'opt_panda_fair_flyers',
        ],
        disallowedOptionIds: [
          'opt_panda_neon_archway',
          'opt_panda_vip_sound_system',
        ],
      },
      hints: [
        'Ensure every student has safe stalls to sell from and clean waste bins before buying decorations.',
        'Keep at least Rs. 4,000 in reserve for unforeseen fair expenses.',
      ],
      remediationScaffolding: {
        ruleExplanation:
          'Sound project budgeting funds safety, infrastructure, and promotion first, setting aside a liquid cash buffer before entertaining luxury aesthetics.',
        guidingQuestions: [
          'Can the fair operate safely without sturdy tables or a first aid kit?',
          'How much reserve cash remains if you purchase the flashing neon archway?',
        ],
        suggestedFocus:
          'Select Sturdy Stall Tables (Rs. 7,000), Hygiene & Safety Kit (Rs. 4,000), and Fair Posters (Rs. 2,000). Optionally add Paper Banners (Rs. 2,000) and preserve Rs. 5,000.',
      },
    },

    // -------------------------------------------------------------
    // LEVEL 2: The Clever Vendor Deal (Price Comparison & Value)
    // -------------------------------------------------------------
    {
      id: 'level_panda_2',
      levelNumber: 2,
      title: 'The Clever Vendor Deal',
      subtitle: 'Price Comparison & Value Assessment',
      storyIntro:
        'Bao Bao must purchase 300 game prizes and 500 visitor game tokens. Several wholesale vendors have submitted competing bids. Some offer cheap substandard prizes with hidden delivery fees, while others offer certified durable prize bundles with student discounts and free delivery.',
      learningObjective:
        'Compare unit pricing, quality standards, and hidden transport fees to choose the highest-value vendor package.',
      targetCompetency: 'investmentAwareness',
      interactionType: 'value_comparison',
      startingBudgetLKR: 12000,
      options: [
        {
          id: 'opt_panda_vendor_bamboo_coop',
          title: 'Honest Bamboo Wholesale Bundle',
          description:
            '300 certified safe wooden puzzles & keychains + 500 durable bamboo game tokens, free delivery, and free replacement guarantee.',
          costLKR: 9500,
          category: 'essential_care',
          isEssential: true,
          qualityLevel: 'certified_good',
          financialTradeoffNote:
            'Best value: certified child-safe toys, free delivery, replacement policy, and leaves a Rs. 2,500 cash buffer.',
        },
        {
          id: 'opt_panda_vendor_cheap_trap',
          title: 'Discount Clearance Emporium',
          description:
            'Fragile plastic prizes with sharp edges and chemical odor. Hidden Rs. 2,500 courier fee added at checkout with no returns.',
          costLKR: 6500,
          category: 'discretionary',
          isEssential: false,
          qualityLevel: 'substandard',
          financialTradeoffNote:
            'Substandard trap: breaks immediately, damages school reputation, and charges hidden delivery fees.',
        },
        {
          id: 'opt_panda_vendor_luxury_boutique',
          title: 'Prestige Imperial Fair Kit',
          description:
            'Gold-trimmed imported gift boxes, silk ribbons, and engraved brass tokens. Exceeds available budget.',
          costLKR: 14500,
          category: 'discretionary',
          isEssential: false,
          qualityLevel: 'luxury_excess',
          financialTradeoffNote:
            'Over-budget: costs Rs. 2,500 more than our total available budget of Rs. 12,000.',
        },
        {
          id: 'opt_panda_vendor_standard_retail',
          title: 'Corner Stationery Retailer',
          description:
            'Standard retail shelf pricing with individual item markups and extra shipping fee.',
          costLKR: 11500,
          category: 'discretionary',
          isEssential: false,
          qualityLevel: 'certified_good',
          financialTradeoffNote:
            'Expensive retail: leaves only Rs. 500 buffer for emergencies.',
        },
      ],
      passCriteria: {
        minCompetencyScore: 75,
        maxBudgetLKR: 12000,
        requireBudgetFeasibility: true,
        mustIncludeOptionIds: ['opt_panda_vendor_bamboo_coop'],
        disallowedOptionIds: [
          'opt_panda_vendor_cheap_trap',
          'opt_panda_vendor_luxury_boutique',
        ],
      },
      hints: [
        'Watch out for hidden delivery fees and substandard toys that break easily.',
        'The best purchase is the one offering verified durability, fair bulk pricing, and a healthy remaining reserve.',
      ],
      remediationScaffolding: {
        ruleExplanation:
          'Value assessment weighs total landed cost (including transit and guarantees) against item quality, rather than blindly picking the lowest sticker price.',
        guidingQuestions: [
          'What happens to the school’s reputation if prizes break immediately in children’s hands?',
          'Which package leaves a Rs. 2,500 cash buffer while guaranteeing certified safety?',
        ],
        suggestedFocus:
          'Choose the Honest Bamboo Wholesale Bundle for Rs. 9,500.',
      },
    },

    // -------------------------------------------------------------
    // LEVEL 3: Needs, Wants and Festival Temptations
    // -------------------------------------------------------------
    {
      id: 'level_panda_3',
      levelNumber: 3,
      title: 'Needs, Wants & Festival Temptations',
      subtitle: 'Spending Discipline & Delayed Gratification',
      storyIntro:
        "Excited classmates urge Bao Bao to rent a giant commercial bouncy castle and an imported chocolate fountain. However, the fair's true mission is raising money for the Community Learning Library! Bao Bao has Rs. 16,000 and must balance affordable carnival games and student photo art with a dedicated charity seed fund.",
      learningObjective:
        'Demonstrate spending discipline by choosing affordable student activities and locking in the charity fund, justifying your trade-off.',
      targetCompetency: 'spendingDiscipline',
      interactionType: 'tradeoff_justification',
      startingBudgetLKR: 16000,
      options: [
        {
          id: 'opt_panda_carnival_games',
          title: 'Classic Ring Toss & Ball Roll Stalls',
          description: 'Fun carnival challenge booths built by students with reusable timber and hoops.',
          costLKR: 6000,
          category: 'essential_care',
          isEssential: true,
          qualityLevel: 'certified_good',
          financialTradeoffNote: 'Core attraction: popular, low ongoing cost, high student participation.',
        },
        {
          id: 'opt_panda_diy_photobooth',
          title: 'Student Art Photo Booth & Face Paint Station',
          description: 'Creative cardboard cutout photo frames and organic washable face paint kit.',
          costLKR: 3500,
          category: 'discretionary',
          isEssential: false,
          qualityLevel: 'certified_good',
          financialTradeoffNote: 'Affordable fun: creative, high student enjoyment, low cost.',
        },
        {
          id: 'opt_panda_inflatable_castle',
          title: 'Commercial Giant Inflatable Bouncy Castle',
          description: 'Heavy vinyl inflatable castle rental with electric air blower and fuel generator fees.',
          costLKR: 9500,
          category: 'discretionary',
          isEssential: false,
          qualityLevel: 'luxury_excess',
          financialTradeoffNote: 'Overpriced rental: consumes 60% of budget and leaves zero profit for the library.',
        },
        {
          id: 'opt_panda_chocolate_fountain',
          title: 'Imported Belgian Chocolate Dip Fountain',
          description: '3-tier electric fondue fountain requiring expensive chocolate chips and fruit skewers.',
          costLKR: 7000,
          category: 'discretionary',
          isEssential: false,
          qualityLevel: 'luxury_excess',
          financialTradeoffNote: 'Impulsive luxury: messy, expensive ingredient refills, no lasting value.',
        },
        {
          id: 'opt_panda_charity_seed',
          title: 'Protected Community Library Seed Fund',
          description: 'Initial protected allocation locked in the vault to buy community reference books.',
          costLKR: 5000,
          category: 'essential_care',
          isEssential: true,
          qualityLevel: 'certified_good',
          financialTradeoffNote: 'Charity commitment: guarantees initial book purchases for the library.',
        },
      ],
      tradeoffRationales: [
        {
          id: 'rat_panda_balanced_fun',
          text: 'Fund classic carnival games and affordable creative photo art while locking in Rs. 5,000 for the community library.',
          isSound: true,
          feedback:
            'Sound trade-off: Balances high student enjoyment with ethical charity preservation within budget.',
        },
        {
          id: 'rat_panda_all_luxury',
          text: 'Rent the giant bouncy castle and chocolate fountain to make the fair look glamorous, even if it wipes out the charity fund.',
          isSound: false,
          feedback:
            'Flawed reasoning: Flashy luxury rentals consume all funds and leave zero profit for the library.',
        },
        {
          id: 'rat_panda_no_fun',
          text: 'Cancel all fun activities and carnival games to save every rupee, even if no students visit the fair.',
          isSound: false,
          feedback:
            'Flawed reasoning: A fair with zero activities attracts no visitors and fails to raise community funds.',
        },
      ],
      passCriteria: {
        minCompetencyScore: 75,
        maxBudgetLKR: 16000,
        requireBudgetFeasibility: true,
        requiredRationaleId: 'rat_panda_balanced_fun',
        mustIncludeOptionIds: [
          'opt_panda_carnival_games',
          'opt_panda_charity_seed',
        ],
        disallowedOptionIds: [
          'opt_panda_inflatable_castle',
          'opt_panda_chocolate_fountain',
        ],
      },
      hints: [
        'Include the Classic Ring Toss and the Library Seed Fund.',
        'Pair affordable student entertainment with the sound rationale that protects the charity goal.',
      ],
      remediationScaffolding: {
        ruleExplanation:
          'Delayed gratification and spending discipline require resisting impulsive status purchases to safeguard long-term moral commitments.',
        guidingQuestions: [
          'What is the core purpose of the school charity fair?',
          'Can students have fun with creative games without spending Rs. 9,500 on a bouncy castle?',
        ],
        suggestedFocus:
          'Select Ring Toss Stalls (Rs. 6,000), DIY Photo Booth (Rs. 3,500), and Library Seed Fund (Rs. 5,000) with the balanced fun rationale.',
      },
    },

    // -------------------------------------------------------------
    // LEVEL 4: The Unexpected Fair Problem (Emergency Response)
    // -------------------------------------------------------------
    {
      id: 'level_panda_4',
      levelNumber: 4,
      title: 'The Unexpected Fair Problem',
      subtitle: 'Emergency Budgeting & Financial Resilience',
      storyIntro:
        'On the morning of the fair, an unexpected tropical downpour soaks the food stalls and triggers an electrical short in the outdoor string lights! Bao Bao has Rs. 10,000 in emergency reserves. Bao Bao must replace damaged staging with waterproof tarps and deploy safe solar lanterns without making panic purchases.',
      learningObjective:
        'Use emergency funds to remediate safety hazards with certified materials while preserving a cash contingency.',
      targetCompetency: 'savingBehavior',
      interactionType: 'emergency_response',
      startingBudgetLKR: 10000,
      existingReserveLKR: 10000,
      options: [
        {
          id: 'opt_panda_repair_waterproof_stalls',
          title: 'Heavy-Duty Weatherproof Tarps & Timber Staging',
          description: 'Reinforced vinyl waterproof canopy tarps and treated wooden supports to keep food and goods dry.',
          costLKR: 4500,
          category: 'essential_care',
          isEssential: true,
          qualityLevel: 'certified_good',
          financialTradeoffNote: 'Durable weatherproofing: protects food and visitors from downpours.',
        },
        {
          id: 'opt_panda_repair_solar_lanterns',
          title: 'Emergency Solar-Powered LED Safety Lanterns',
          description: 'Pack of 12 waterproof solar lanterns providing bright, safe lighting without electrical shock hazards.',
          costLKR: 2500,
          category: 'essential_care',
          isEssential: true,
          qualityLevel: 'certified_good',
          financialTradeoffNote: 'Energy-efficient safe lighting: resolves electrical hazard safely.',
        },
        {
          id: 'opt_panda_repair_panic_generator',
          title: 'Diesel Generator & Luxury Heated Gazebo Express Rental',
          description: 'Commercial diesel power generator and heated party tent delivered by downtown courier.',
          costLKR: 12000,
          category: 'discretionary',
          isEssential: false,
          qualityLevel: 'luxury_excess',
          financialTradeoffNote: 'Panic overspending: exceeds the entire emergency reserve by Rs. 2,000.',
        },
        {
          id: 'opt_panda_repair_duct_tape_hack',
          title: 'Wet Cardboard & Frayed Wire Quick Tape',
          description: 'Soggy cardboard sheets and cheap plastic adhesive tape over wet wires.',
          costLKR: 1000,
          category: 'discretionary',
          isEssential: false,
          qualityLevel: 'substandard',
          financialTradeoffNote: 'Dangerous hazard: frayed tape on wet wiring risks fire and electrical shocks.',
        },
      ],
      passCriteria: {
        minCompetencyScore: 75,
        maxBudgetLKR: 10000,
        requireBudgetFeasibility: true,
        minReservePreservedLKR: 2500,
        mustIncludeOptionIds: [
          'opt_panda_repair_waterproof_stalls',
          'opt_panda_repair_solar_lanterns',
        ],
        disallowedOptionIds: [
          'opt_panda_repair_panic_generator',
          'opt_panda_repair_duct_tape_hack',
        ],
      },
      hints: [
        'Address both structural waterproofing and lighting safety.',
        'Never use frayed tape on wet wiring, and avoid overspending on luxury diesel generators.',
      ],
      remediationScaffolding: {
        ruleExplanation:
          'Emergency financial management deploys reserves strictly for certified risk mitigation, preventing panic overspending and hazardous stopgaps.',
        guidingQuestions: [
          'Does duct-taping frayed wet wires create an unacceptable electrical danger for children?',
          'Can emergency reserves cover both waterproof tarps and solar lanterns while retaining a safety buffer?',
        ],
        suggestedFocus:
          'Purchase Waterproof Tarps (Rs. 4,500) and Solar LED Lanterns (Rs. 2,500), preserving Rs. 3,000 in reserves.',
      },
    },

    // -------------------------------------------------------------
    // LEVEL 5: Pricing for a Successful Fair (Pricing Simulation)
    // -------------------------------------------------------------
    {
      id: 'level_panda_5',
      levelNumber: 5,
      title: 'Pricing for a Successful Fair',
      subtitle: 'Cost, Revenue, Profit & Affordability',
      storyIntro:
        'The fair is about to welcome visitors! Bao Bao must set ticket bundle pricing. If prices are set too high, families cannot afford to attend and charity revenue collapses. If prices are below cost, every ticket loses money! Bao Bao must select the optimal pricing model that ensures high attendance, affordability, and maximum net profit.',
      learningObjective:
        'Understand unit costs, visitor volume, and profit margins to select a sustainable, student-friendly pricing strategy.',
      targetCompetency: 'budgetingSkill',
      interactionType: 'value_comparison',
      startingBudgetLKR: 15000,
      options: [
        {
          id: 'opt_panda_pricing_sweet_spot',
          title: 'Optimal Fair Entry & Token Combo (Rs. 100/ticket)',
          description:
            'Rs. 100/ticket (Unit cost Rs. 40). 300 visitors attend -> Gross Revenue Rs. 30,000, Operating Costs Rs. 12,000, Net Charity Profit Rs. 18,000.',
          costLKR: 12000,
          category: 'essential_care',
          isEssential: true,
          qualityLevel: 'certified_good',
          financialTradeoffNote:
            'Optimal Pricing: high attendance (300 tickets), affordable for students, maximizes net charity donation to Rs. 18,000.',
        },
        {
          id: 'opt_panda_pricing_predatory',
          title: 'VIP Monopoly Pricing (Rs. 350/ticket)',
          description:
            'Rs. 350/ticket (Unit cost Rs. 50). Only 35 visitors attend -> Gross Revenue Rs. 12,250, Costs Rs. 8,000, Net Charity Profit only Rs. 4,250.',
          costLKR: 8000,
          category: 'discretionary',
          isEssential: false,
          qualityLevel: 'luxury_excess',
          financialTradeoffNote:
            'Unreasonable Gouging: destroys customer satisfaction, low attendance, weak charity profit.',
        },
        {
          id: 'opt_panda_pricing_underpriced',
          title: 'Loss-Leader Bargain (Rs. 25/ticket)',
          description:
            'Rs. 25/ticket (Below cost of Rs. 40). 450 visitors attend -> Revenue Rs. 11,250, Operating Costs Rs. 18,000, Net Loss of -Rs. 6,750.',
          costLKR: 18000,
          category: 'discretionary',
          isEssential: false,
          qualityLevel: 'substandard',
          financialTradeoffNote:
            'Selling Below Cost: causes financial bankruptcy despite high crowds.',
        },
        {
          id: 'opt_panda_pricing_mid_conservative',
          title: 'Modest Family Pass (Rs. 75/ticket)',
          description:
            'Rs. 75/ticket. 220 visitors attend -> Gross Revenue Rs. 16,500, Operating Costs Rs. 8,800, Net Charity Profit Rs. 7,700.',
          costLKR: 8800,
          category: 'discretionary',
          isEssential: false,
          qualityLevel: 'certified_good',
          financialTradeoffNote:
            'Modest pricing: safe and affordable, but produces moderate charity contribution.',
        },
      ],
      passCriteria: {
        minCompetencyScore: 75,
        maxBudgetLKR: 15000,
        requireBudgetFeasibility: true,
        mustIncludeOptionIds: ['opt_panda_pricing_sweet_spot'],
        disallowedOptionIds: [
          'opt_panda_pricing_predatory',
          'opt_panda_pricing_underpriced',
        ],
      },
      hints: [
        'Compare total net charity profit across the options.',
        'High prices frighten customers away, while prices below unit cost cause a net financial deficit.',
      ],
      remediationScaffolding: {
        ruleExplanation:
          'Sustainable pricing balances unit cost recovery and customer willingness to pay, generating volume sales and maximized net charity profit.',
        guidingQuestions: [
          'Why does selling 450 tickets at Rs. 25 result in an overall loss when unit cost is Rs. 40?',
          'Which pricing model generates the highest net donation (Rs. 18,000) for the library?',
        ],
        suggestedFocus:
          'Select the Optimal Fair Entry & Token Combo for Rs. 12,000 operating budget.',
      },
    },

    // -------------------------------------------------------------
    // LEVEL 6: Bao Bao's Charity Fair Finale (Capstone Allocation)
    // -------------------------------------------------------------
    {
      id: 'level_panda_6',
      levelNumber: 6,
      title: "Bao Bao's Charity Fair Finale",
      subtitle: 'Integrated Financial Mastery & Charity Goal',
      storyIntro:
        'The school fair has concluded with immense joy and raised Rs. 35,000 in gross revenue! Bao Bao must now execute the final treasurer duty: settle outstanding venue cleanup bills (Rs. 8,000 - 10,000), set aside a seed reserve for next semester’s fair (Rs. 4,000 - 6,000), donate the maximum possible amount to the Community Learning Library (Rs. 18,000 - 21,000), and limit council celebration snacks to modest refreshments (under Rs. 3,000).',
      learningObjective:
        'Construct a balanced post-fair allocation budget fulfilling vendor obligations, council continuity, and the library charity goal.',
      targetCompetency: 'goalAchievement',
      interactionType: 'budget_allocator',
      startingBudgetLKR: 35000,
      allocationCategories: [
        {
          id: 'cat_panda_bills',
          name: 'Outstanding Venue & Vendor Obligations',
          category: 'essential_care',
          isEssential: true,
          minRecommendedLKR: 8000,
          maxRecommendedLKR: 10000,
          stepLKR: 500,
          defaultAmountLKR: 0,
          description: 'Settle remaining hall rental, clean-up crews, and power bills.',
        },
        {
          id: 'cat_panda_seed_reserve',
          name: 'Next Semester Student Fair Reserve',
          category: 'emergency_reserve',
          isEssential: true,
          minRecommendedLKR: 4000,
          maxRecommendedLKR: 6000,
          stepLKR: 500,
          defaultAmountLKR: 0,
          description: 'Seed contingency fund ensuring future student councils can host the annual fair.',
        },
        {
          id: 'cat_panda_library_donation',
          name: 'Community Learning Library Donation',
          category: 'savings_goal',
          isEssential: true,
          minRecommendedLKR: 18000,
          maxRecommendedLKR: 21000,
          stepLKR: 500,
          defaultAmountLKR: 0,
          description: 'The core mission: funding reference books, desks, and computers for neighborhood children.',
        },
        {
          id: 'cat_panda_council_party',
          name: 'Volunteer Refreshments & Celebration Party',
          category: 'discretionary',
          isEssential: false,
          minRecommendedLKR: 0,
          maxRecommendedLKR: 3000,
          stepLKR: 500,
          defaultAmountLKR: 0,
          description: 'Modest snacks and lemonade to celebrate the volunteer students.',
        },
      ],
      passCriteria: {
        minCompetencyScore: 75,
        maxBudgetLKR: 35000,
        requireBudgetFeasibility: true,
        minReservePreservedLKR: 22000,
        maxDiscretionaryRatio: 0.15,
      },
      hints: [
        'Allocate at least Rs. 8,000 to outstanding venue bills and Rs. 4,000 to the student council seed reserve.',
        'Donate at least Rs. 18,000 to the Community Library so the learning centre can open successfully.',
        'Keep the volunteer celebration party modest (Rs. 2,000 - 3,000).',
      ],
      remediationScaffolding: {
        ruleExplanation:
          'Complete financial stewardship honors all liabilities first, secures institutional continuity, and fulfills philanthropic goals with strict discretionary discipline.',
        guidingQuestions: [
          'Are all legal venue and equipment obligations fully settled?',
          'Does the combined library donation and seed reserve exceed Rs. 22,000?',
        ],
        suggestedFocus:
          'Allocate Rs. 9,000 to Venue Bills, Rs. 5,000 to Seed Reserve, Rs. 19,000 to Library Donation, and Rs. 2,000 to Volunteer Refreshments.',
      },
    },
  ],
};
