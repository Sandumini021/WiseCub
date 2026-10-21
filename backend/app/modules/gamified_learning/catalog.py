"""
CDEMF mission catalog — server-side authoritative copy.

This is the single source of truth the backend uses to validate level IDs,
budget limits, pass criteria, and option lists.  The frontend catalog is
kept in sync but the server never trusts browser-supplied option costs,
budget values, or pass thresholds.

Structure mirrors the frontend TypeScript definitions exactly so diffing is
trivial when levels are updated.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class PassCriteria:
    min_competency_score: int  # 0-100
    max_budget_lkr: int
    require_budget_feasibility: bool
    must_include_option_ids: tuple[str, ...] = field(default_factory=tuple)
    disallowed_option_ids: tuple[str, ...] = field(default_factory=tuple)
    min_reserve_preserved_lkr: int = 0
    required_rationale_id: str | None = None
    max_discretionary_ratio: float | None = None


@dataclass(frozen=True)
class DecisionOption:
    id: str
    title: str
    cost_lkr: int
    category: str
    is_essential: bool
    quality_level: str | None = None  # substandard | certified_good | luxury_excess


@dataclass(frozen=True)
class AllocationCategory:
    id: str
    name: str
    category: str
    is_essential: bool
    min_recommended_lkr: int
    max_recommended_lkr: int
    step_lkr: int
    default_amount_lkr: int


@dataclass(frozen=True)
class MultiPeriodWeekConfig:
    period: int
    allowance_lkr: int
    mandatory_cost_lkr: int
    temptation_cost_lkr: int


@dataclass(frozen=True)
class TradeoffRationale:
    id: str
    is_sound: bool
    feedback: str


@dataclass(frozen=True)
class RemediationScaffolding:
    rule_explanation: str
    guiding_questions: tuple[str, ...]
    suggested_focus: str


@dataclass(frozen=True)
class LevelDefinition:
    id: str
    level_number: int
    title: str
    subtitle: str
    story_intro: str
    learning_objective: str
    target_competency: str
    interaction_type: str
    starting_budget_lkr: int
    pass_criteria: PassCriteria
    hints: tuple[str, ...]
    remediation_scaffolding: RemediationScaffolding
    existing_reserve_lkr: int = 0
    options: tuple[DecisionOption, ...] = field(default_factory=tuple)
    allocation_categories: tuple[AllocationCategory, ...] = field(default_factory=tuple)
    multi_period_config: dict[str, Any] | None = None  # {periods, targetGoalLKR}
    tradeoff_rationales: tuple[TradeoffRationale, ...] = field(default_factory=tuple)


@dataclass(frozen=True)
class MissionDefinition:
    id: str
    title: str
    character_name: str
    character_id: str
    primary_competency: str
    total_levels: int
    theme_color: str
    description: str
    levels: tuple[LevelDefinition, ...]
    initial_vitality: int = 35
    initial_happiness: int = 30


# ─────────────────────────────────────────────────────────────────────────────
# MISSION 1 — Rescue the Injured Puppy
# ─────────────────────────────────────────────────────────────────────────────

_L1 = LevelDefinition(
    id="level_puppy_1",
    level_number=1,
    title="Discover the Injured Puppy",
    subtitle="Needs vs. Wants",
    story_intro=(
        "You find Barnaby shivering under a park bench with a hurt paw! You have Rs. 5,000 in "
        "rescue money. Help him survive the night before it gets dark."
    ),
    learning_objective=(
        "Pick only what Barnaby needs to survive right now — save the rest of your cash!"
    ),
    target_competency="spendingDiscipline",
    interaction_type="needs_wants",
    starting_budget_lkr=5000,
    options=(
        DecisionOption("opt_first_aid", "Antiseptic & Sterile Bandage Kit", 2500, "essential_care", True, "certified_good"),
        DecisionOption("opt_nutrition_pack", "Puppy Meal & Clean Water", 1200, "nutrition", True, "certified_good"),
        DecisionOption("opt_squeaky_toy", "Fancy Squeaky Plush Toy", 1500, "discretionary", False, "luxury_excess"),
        DecisionOption("opt_cozy_towel", "Warm Thermal Blanket", 800, "essential_care", False, "certified_good"),
    ),
    pass_criteria=PassCriteria(
        min_competency_score=70,
        max_budget_lkr=5000,
        require_budget_feasibility=True,
        must_include_option_ids=("opt_first_aid", "opt_nutrition_pack"),
        disallowed_option_ids=("opt_squeaky_toy",),
        min_reserve_preserved_lkr=500,
    ),
    hints=(
        "Barnaby is bleeding and hungry. Focus your funds on medicine and food first.",
        "Beware of cute toys right now — a squeaky toy cannot fix a hurt paw!",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation=(
            "When an emergency occurs, non-negotiable needs (safety, medicine, food) must always "
            "come first before optional wants (toys, luxury extras)."
        ),
        guiding_questions=(
            "Which items help Barnaby survive this emergency night safely?",
            "If you removed the toy, would Barnaby be in danger?",
        ),
        suggested_focus="Prioritize antiseptic and food before any comfort or decorative items.",
    ),
)

_L2 = LevelDefinition(
    id="level_puppy_2",
    level_number=2,
    title="Plan the Care Budget",
    subtitle="Budgeting & Safety Cushion",
    story_intro=(
        "Barnaby’s paw is bandaged, but he needs a full week of care. The shelter gave you Rs. 15,000. "
        "Split it wisely across his vet check, medicine, transport, and emergency cushion."
    ),
    learning_objective=(
        "Fund all essential care while keeping at least Rs. 2,500 safely tucked away in your emergency cushion."
    ),
    target_competency="budgetingSkill",
    interaction_type="budget_allocator",
    starting_budget_lkr=15000,
    allocation_categories=(
        AllocationCategory("cat_vet_check", "Veterinary Clinical Checkup", "veterinary_fees", True, 6000, 8000, 500, 6000),
        AllocationCategory("cat_medicine_dress", "Medication & Sterile Dressings", "medical_supplies", True, 3500, 5000, 500, 3500),
        AllocationCategory("cat_transport", "Safe Clinic Transport (Pet Taxi)", "transportation", True, 2000, 3000, 500, 2000),
        AllocationCategory("cat_emergency_reserve", "Emergency Safety Cushion", "emergency_reserve", True, 2500, 4000, 500, 3500),
        AllocationCategory("cat_deluxe_grooming", "Deluxe Salon Fur Styling", "discretionary", False, 0, 3000, 500, 0),
    ),
    pass_criteria=PassCriteria(
        min_competency_score=75,
        max_budget_lkr=15000,
        require_budget_feasibility=True,
        min_reserve_preserved_lkr=2500,
    ),
    hints=(
        "Your total spending must not go over Rs. 15,000.",
        "Make sure the Vet Check gets at least Rs. 6,000 and the Emergency Safety Cushion gets at least Rs. 2,500.",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation=(
            "A feasible budget matches or stays below income. If you overspend on luxury salon grooming, your emergency reserve drops to zero."
        ),
        guiding_questions=(
            "Did your total planned expenses exceed Rs. 15,000?",
            "Is your emergency safety cushion at least Rs. 2,500?",
        ),
        suggested_focus=(
            "Set Vet Checkup to Rs. 6,000, Medication to Rs. 3,500, Transport to Rs. 2,000, and put the remaining Rs. 3,500 into the Emergency Safety Cushion."
        ),
    ),
)

_L3 = LevelDefinition(
    id="level_puppy_3",
    level_number=3,
    title="Save for Treatment",
    subtitle="The 3-Week Saving Challenge",
    story_intro=(
        "Barnaby needs a Rs. 12,000 leg splint in 3 weeks so he can run again! You get Rs. 5,000 allowance each week. "
        "Can you cover his food, resist tempting treats, and save Rs. 12,000 in time?"
    ),
    learning_objective=(
        "Bank Rs. 4,000 each week by resisting quick impulse fun so Barnaby gets his splint!"
    ),
    target_competency="savingBehavior",
    interaction_type="multi_period_saving",
    starting_budget_lkr=15000,
    multi_period_config={
        "periods": [
            {
                "period": 1,
                "label": "Week 1",
                "allowance_lkr": 5000,
                "mandatory_cost_lkr": 1000,
                "mandatory_cost_description": "Fresh puppy kibble & clean bedding",
                "temptation_cost_lkr": 1500,
                "temptation_title": "Video Game Arcade Afternoon with Friends",
                "temptation_description": "Spend Rs. 1,500 on tokens at the game parlor.",
            },
            {
                "period": 2,
                "label": "Week 2",
                "allowance_lkr": 5000,
                "mandatory_cost_lkr": 1000,
                "mandatory_cost_description": "Wound antiseptic replenishment",
                "temptation_cost_lkr": 1200,
                "temptation_title": "Fast Food Pizza Feast",
                "temptation_description": "Order a large takeout pizza with extra sodas.",
            },
            {
                "period": 3,
                "label": "Week 3",
                "allowance_lkr": 5000,
                "mandatory_cost_lkr": 1000,
                "mandatory_cost_description": "Pre-surgery sanitized wash",
                "temptation_cost_lkr": 1400,
                "temptation_title": "Trendy Designer T-Shirt",
                "temptation_description": "A flashy graphic t-shirt on weekend clearance sale.",
            },
        ],
        "target_goal_lkr": 12000,
        "goal_description": "Specialized Orthopedic Splint for Barnaby",
    },
    pass_criteria=PassCriteria(
        min_competency_score=75,
        max_budget_lkr=15000,
        require_budget_feasibility=True,
        min_reserve_preserved_lkr=12000,
    ),
    hints=(
        "To reach Rs. 12,000 in 3 weeks, you must stash away Rs. 4,000 every single week!",
        "After paying Rs. 1,000 for basics, spending money on pizza or arcade games will make you fail the goal.",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation=(
            "Delayed gratification means passing on small instant pleasures today so you can fund life-changing goals tomorrow."
        ),
        guiding_questions=(
            "If you buy the arcade tokens in Week 1, can you mathematically hit Rs. 12,000 by Week 3?",
            "Which matters more: temporary video games or Barnaby being able to walk again?",
        ),
        suggested_focus="Resist the impulse temptations in all three weeks and commit Rs. 4,000 per week directly into the medical savings goal.",
    ),
)

_L4 = LevelDefinition(
    id="level_puppy_4",
    level_number=4,
    title="Smart Shopping Decisions",
    subtitle="Value for Money: Safe Care vs. Cheap Traps",
    story_intro=(
        "You have Rs. 8,000 for Barnaby’s medicine and care. Three clinics offer treatments. "
        "Watch out: the cheapest one is sketchy, and the luxury pet spa charges for useless perks!"
    ),
    learning_objective=(
        "Pick the certified, safe clinic that gives true value without falling for cheap fakes or overpaying for hype."
    ),
    target_competency="investmentAwareness",
    interaction_type="value_comparison",
    starting_budget_lkr=8000,
    options=(
        DecisionOption("opt_clinic_shady", "Unlicensed Street Stall 'Miracle Ointment'", 2000, "medical_supplies", False, "substandard"),
        DecisionOption("opt_clinic_certified", "Community Veterinary Hospital Standard Treatment", 6500, "medical_supplies", True, "certified_good"),
        DecisionOption("opt_clinic_luxury", "Prestige Pet Spa & VIP Treatment Suite", 14000, "medical_supplies", False, "luxury_excess"),
    ),
    pass_criteria=PassCriteria(
        min_competency_score=80,
        max_budget_lkr=8000,
        require_budget_feasibility=True,
        must_include_option_ids=("opt_clinic_certified",),
        disallowed_option_ids=("opt_clinic_shady", "opt_clinic_luxury"),
        min_reserve_preserved_lkr=1000,
    ),
    hints=(
        "Does Barnaby need silk pillows to heal, or real medicine from a certified doctor?",
        "Watch out for fake bargains — cheap unverified medicine can make a sick pet worse!",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation=(
            "Value-for-money means paying for certified reliability, not paying for overpriced branding, nor cutting corners on dangerous fake bargains."
        ),
        guiding_questions=(
            "Why is the Rs. 2,000 unlicensed ointment a false economy?",
            "Can you afford the Rs. 14,000 VIP suite on an Rs. 8,000 budget?",
        ),
        suggested_focus="Select the Community Veterinary Hospital. It delivers certified medicine, stays under budget, and leaves Rs. 1,500 in savings.",
    ),
)

_L5 = LevelDefinition(
    id="level_puppy_5",
    level_number=5,
    title="Unexpected Emergency!",
    subtitle="Using Your Emergency Fund",
    story_intro=(
        "Midnight alert! Barnaby woke up with a burning fever and needs an urgent Rs. 4,500 clinic injection. "
        "You only have Rs. 2,000 cash in your pocket. Luckily, you saved an emergency fund!"
    ),
    learning_objective=(
        "Use your saved emergency cash to solve the crisis instantly with zero debt!"
    ),
    target_competency="savingBehavior",
    interaction_type="emergency_response",
    starting_budget_lkr=5500,
    existing_reserve_lkr=3500,
    options=(
        DecisionOption("opt_use_emergency_fund", "Deploy Emergency Reserve + Available Cash", 4500, "essential_care", True, "certified_good"),
        DecisionOption("opt_delay_treatment", "Delay the Antibiotic Injection until Next Week", 0, "discretionary", False),
        DecisionOption("opt_predatory_loan", "Borrow from a Fast Money Shark (High 50% Weekly Interest)", 6750, "discretionary", False),
    ),
    pass_criteria=PassCriteria(
        min_competency_score=80,
        max_budget_lkr=5500,
        require_budget_feasibility=True,
        must_include_option_ids=("opt_use_emergency_fund",),
        disallowed_option_ids=("opt_delay_treatment", "opt_predatory_loan"),
        min_reserve_preserved_lkr=1000,
    ),
    hints=(
        "This is exactly why you saved an Emergency Cushion. Use it!",
        "Never take loans with crazy interest fees when your own savings can cover the emergency.",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation=(
            "Emergency funds exist to absorb unforeseen shocks without incurring toxic debt or sacrificing safety."
        ),
        guiding_questions=(
            "Why take a loan with 50% interest when you have money sitting in your emergency jar?",
            "What happens to Barnaby if you choose to wait until next week?",
        ),
        suggested_focus="Choose to deploy your emergency reserve and available cash. It covers the medical cost in full and preserves your peace of mind.",
    ),
)

_L6 = LevelDefinition(
    id="level_puppy_6",
    level_number=6,
    title="Recovery Planning",
    subtitle="Monthly Budget Balance",
    story_intro=(
        "Barnaby’s fever is gone and his splint works! Now you manage an Rs. 8,000 monthly allowance for his "
        "3-month recovery. Balance his nutrition, physio workouts, and backup savings."
    ),
    learning_objective=(
        "Keep total monthly spending under Rs. 8,000 while putting money back into your emergency fund."
    ),
    target_competency="budgetingSkill",
    interaction_type="recurring_budget",
    starting_budget_lkr=8000,
    allocation_categories=(
        AllocationCategory("cat_rec_nutrition", "Bone & Joint Prescription Kibble", "nutrition", True, 3000, 4000, 500, 3000),
        AllocationCategory("cat_rec_physio", "Bi-Weekly Physical Therapy Check", "veterinary_fees", True, 2500, 3500, 500, 2500),
        AllocationCategory("cat_rec_reserve", "Monthly Maintenance Reserve", "emergency_reserve", True, 2000, 3000, 500, 2500),
        AllocationCategory("cat_rec_treats", "Imported Gourmet Liver Snacks", "discretionary", False, 0, 2500, 500, 0),
    ),
    pass_criteria=PassCriteria(
        min_competency_score=75,
        max_budget_lkr=8000,
        require_budget_feasibility=True,
        min_reserve_preserved_lkr=2000,
    ),
    hints=(
        "Total monthly spending must stay within your Rs. 8,000 allowance.",
        "Fund the healing kibble (Rs. 3,000) and physio (Rs. 2,500), and put at least Rs. 2,000 into backup savings.",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation=(
            "Long-term recovery fails if ongoing expenses exceed income. Consistent recurring budgets build enduring stability."
        ),
        guiding_questions=(
            "Did your recurring allocations exceed your Rs. 8,000 monthly allowance?",
            "Did you leave sufficient funds to replenish your emergency cushion?",
        ),
        suggested_focus="Allocate Rs. 3,000 to Nutrition, Rs. 2,500 to Physio, and Rs. 2,500 to the Reserve. Skip the luxury imported snacks.",
    ),
)

_L7 = LevelDefinition(
    id="level_puppy_7",
    level_number=7,
    title="Tough Money Choices",
    subtitle="Real Health vs. Shiny Comforts",
    story_intro=(
        "You have Rs. 10,000 left for Barnaby’s final healing step. A friend wants you to buy a fancy "
        "Rs. 4,500 heated velvet bed, but Barnaby needs his vaccines and mobility clearance. You can’t buy both!"
    ),
    learning_objective=(
        "Choose lasting health protection over short-term luxury and explain your smart reasoning."
    ),
    target_competency="investmentAwareness",
    interaction_type="tradeoff_justification",
    starting_budget_lkr=10000,
    options=(
        DecisionOption("opt_vaccine_chip", "Mandatory Core Vaccinations & Safety Microchip", 4000, "essential_care", True, "certified_good"),
        DecisionOption("opt_mobility_check", "Final Physical Mobility & X-Ray Certification", 4000, "veterinary_fees", True, "certified_good"),
        DecisionOption("opt_heated_bed", "Designer Heated Orthopedic Velvet Bed", 4500, "discretionary", False, "luxury_excess"),
    ),
    tradeoff_rationales=(
        TradeoffRationale(
            id="rat_sound_preventive",
            is_sound=True,
            feedback="Excellent financial judgment! Long-term preventive investments safeguard health and avert catastrophic future hospital bills.",
        ),
        TradeoffRationale(
            id="rat_comfort_first",
            is_sound=False,
            feedback="Dangerous trade-off! Skipping vaccinations exposes Barnaby to deadly parvo virus. Luxury bedding cannot cure infectious diseases.",
        ),
    ),
    pass_criteria=PassCriteria(
        min_competency_score=80,
        max_budget_lkr=10000,
        require_budget_feasibility=True,
        must_include_option_ids=("opt_vaccine_chip", "opt_mobility_check"),
        disallowed_option_ids=("opt_heated_bed",),
        min_reserve_preserved_lkr=2000,
        required_rationale_id="rat_sound_preventive",
    ),
    hints=(
        "Think long term: what permanently protects Barnaby from disease, versus what’s just cozy luxury?",
        "Pick the explanation that values prevention over luxury pampering.",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation=(
            "Financial maturity is shown by prioritizing preventive investments (vaccines, microchips) that permanently avert future risks over luxury goods."
        ),
        guiding_questions=(
            "If you buy the heated bed and skip vaccines, what happens if an infection breaks out?",
            "Which choice leaves Barnaby permanently protected for life?",
        ),
        suggested_focus="Select the Vaccinations and Mobility Certification options, and pick the rationale explaining preventive protection.",
    ),
)

_L8 = LevelDefinition(
    id="level_puppy_8",
    level_number=8,
    title="Barnaby’s Forever Home",
    subtitle="Graduation Capstone: Money Master",
    story_intro=(
        "Adoption Day is here! You have a Rs. 20,000 graduation fund to set up Barnaby’s forever life: "
        "legal adoption papers, 6 months of wellness medicine, and a permanent safety cushion."
    ),
    learning_objective=(
        "Prove your money mastery: fund all essential care and lock in a big safety cushion for Barnaby!"
    ),
    target_competency="goalAchievement",
    interaction_type="capstone_challenge",
    starting_budget_lkr=20000,
    allocation_categories=(
        AllocationCategory("cap_adoption_legal", "Legal Adoption & Registration Certificate", "essential_care", True, 3000, 4000, 500, 3000),
        AllocationCategory("cap_six_month_care", "6-Month Preventive Healthcare & Deworming Kit", "medical_supplies", True, 7000, 9000, 500, 7000),
        AllocationCategory("cap_permanent_reserve", "Permanent Emergency Safety Cushion", "emergency_reserve", True, 6000, 9000, 500, 6000),
        AllocationCategory("cap_celebration_party", "Grand Fireworks & Pet Mascot Party", "discretionary", False, 0, 8000, 500, 0),
    ),
    pass_criteria=PassCriteria(
        min_competency_score=85,
        max_budget_lkr=20000,
        require_budget_feasibility=True,
        min_reserve_preserved_lkr=6000,
    ),
    hints=(
        "Don’t blow money on loud fireworks that scare pets and burn cash.",
        "Ensure the Permanent Safety Cushion gets at least Rs. 6,000 and all essential care is funded.",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation=(
            "True financial freedom is achieved when you have funded all legal essentials, secured future maintenance, and maintained a massive emergency buffer."
        ),
        guiding_questions=(
            "Does Barnaby benefit from fireworks, or does he benefit from a permanent emergency reserve?",
            "Did you stay within the Rs. 20,000 graduation budget?",
        ),
        suggested_focus="Allocate Rs. 3,000 to Legal Adoption, Rs. 8,000 to 6-Month Preventive Care, Rs. 9,000 to Permanent Emergency Reserve, and Rs. 0 to Fireworks.",
    ),
)

RESCUE_PUPPY_MISSION = MissionDefinition(
    id="mission_rescue_puppy",
    title="Rescue the Injured Puppy",
    character_name="Barnaby",
    character_id="char_puppy_barnaby",
    primary_competency="budgetingSkill",
    total_levels=8,
    theme_color="#0f6b5c",
    description=(
        "Manage virtual funds carefully to rescue and nurse Barnaby the puppy back "
        "to vibrant health. Every financial choice immediately impacts Barnaby's "
        "comfort, recovery, and emotional state."
    ),
    levels=(_L1, _L2, _L3, _L4, _L5, _L6, _L7, _L8),
    initial_vitality=35,
    initial_happiness=30,
)


# ─────────────────────────────────────────────────────────────────────────────
# MISSION 2 — Squirrel's Winter Savings (Nutty's Winter Survival Story)
# ─────────────────────────────────────────────────────────────────────────────

_SQUIRREL_L1 = LevelDefinition(
    id="level_squirrel_1",
    level_number=1,
    title="Prepare for Winter",
    subtitle="Needs vs. Wants",
    story_intro=(
        "Autumn winds are turning cold in the forest! Nutty has Rs. 5,000 in forest tokens. "
        "Help Nutty fund winter survival necessities without wasting tokens on shiny extras."
    ),
    learning_objective=(
        "Pick only essential food supplies and shelter repairs — keep remaining tokens safe in your pouch!"
    ),
    target_competency="spendingDiscipline",
    interaction_type="needs_wants",
    starting_budget_lkr=5000,
    options=(
        DecisionOption("opt_sq_essential_nuts", "Dried Oak Acorns & Seed Basket", 2200, "essential_food", True, "certified_good"),
        DecisionOption("opt_sq_shelter_patch", "Moss & Pine Bark Shelter Seal", 1600, "shelter_repair", True, "certified_good"),
        DecisionOption("opt_sq_glitter_feather", "Decorative Shimmer Feather Cap", 1500, "accessory", False, "luxury_excess"),
        DecisionOption("opt_sq_maple_candy", "Sugary Candied Maple Treat", 800, "snacks", False, "luxury_excess"),
    ),
    pass_criteria=PassCriteria(
        min_competency_score=75,
        max_budget_lkr=5000,
        require_budget_feasibility=True,
        must_include_option_ids=("opt_sq_essential_nuts", "opt_sq_shelter_patch"),
        disallowed_option_ids=("opt_sq_glitter_feather",),
        min_reserve_preserved_lkr=500,
    ),
    hints=(
        "Winter frost will freeze unsealed hollows. Prioritize the shelter seal and dried acorns first!",
        "A feather cap looks fancy, but it cannot feed Nutty or stop the freezing wind.",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation="Non-negotiable survival needs (food and shelter) must always be secured before discretionary wants (costumes, sweet treats).",
        guiding_questions=(
            "What happens to Nutty if you buy the feather cap but lack the acorns to survive?",
            "How much emergency money remains when you only purchase essentials?",
        ),
        suggested_focus="Select the Acorn Basket (Rs. 2,200) and Shelter Seal (Rs. 1,600). Leave the feather cap and save the remaining Rs. 1,200.",
    ),
)

_SQUIRREL_L2 = LevelDefinition(
    id="level_squirrel_2",
    level_number=2,
    title="Save the Acorns",
    subtitle="Saving Behavior & Goal Planning",
    story_intro=(
        "Nutty gathered Rs. 8,000 from seasonal foraging! Nutty must allocate these resources "
        "to stock the winter pantry, weatherproof the granary, and build an emergency acorn reserve of at least Rs. 2,500."
    ),
    learning_objective=(
        "Allocate Rs. 8,000 across categories to fund food and shelter while locking away at least Rs. 2,500 into emergency savings."
    ),
    target_competency="savingBehavior",
    interaction_type="budget_allocator",
    starting_budget_lkr=8000,
    allocation_categories=(
        AllocationCategory("cat_sq_winter_food", "Winter Food Pantry (Acorns & Seeds)", "food", True, 2500, 4000, 500, 0),
        AllocationCategory("cat_sq_weatherproofing", "Granary Weatherproofing & Seal", "shelter", True, 1500, 2500, 500, 0),
        AllocationCategory("cat_sq_emergency_reserve", "Emergency Acorn Reserve Fund", "savings", True, 2500, 4000, 500, 0),
        AllocationCategory("cat_sq_decorations", "Carved Tree Hollow Ornaments", "discretionary", False, 0, 2000, 500, 0),
    ),
    pass_criteria=PassCriteria(
        min_competency_score=75,
        max_budget_lkr=8000,
        require_budget_feasibility=True,
        min_reserve_preserved_lkr=2500,
    ),
    hints=(
        "Nutty needs at least Rs. 2,500 in food and Rs. 1,500 in weatherproofing to survive.",
        "Ensure your Emergency Acorn Reserve has at least Rs. 2,500. Keep tree ornaments low or zero.",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation="Pay yourself first! Setting aside savings before buying decorative novelties ensures you meet future survival targets.",
        guiding_questions=(
            "How much total money is available in forest tokens?",
            "Did you allocate at least Rs. 2,500 to the emergency acorn reserve?",
        ),
        suggested_focus="Allocate Rs. 3,000 to Food, Rs. 1,500 to Weatherproofing, Rs. 3,000 to Emergency Reserve, and Rs. 500 to Ornaments.",
    ),
)

_SQUIRREL_L3 = LevelDefinition(
    id="level_squirrel_3",
    level_number=3,
    title="The Tempting Forest Festival",
    subtitle="Delayed Gratification & Spending Discipline",
    story_intro=(
        "The 3-week Autumn Forest Festival is here! Tempting carnival stalls, games, and candy stand "
        "between Nutty and the Rs. 7,500 needed to purchase a Thermal Winter Quilt & Heavy Granary Lock."
    ),
    learning_objective=(
        "Save at least Rs. 7,500 across 3 weeks by resisting expensive impulse temptations and putting tokens into the winter bank."
    ),
    target_competency="spendingDiscipline",
    interaction_type="multi_period_saving",
    starting_budget_lkr=4500,
    multi_period_config={
        "periods": [
            {
                "period": 1,
                "label": "Week 1",
                "allowance_lkr": 4500,
                "mandatory_cost_lkr": 1500,
                "mandatory_cost_description": "Fresh forest forage & basic hollow maintenance",
                "temptation_cost_lkr": 1200,
                "temptation_title": "Carnival Acorn Toss Game",
                "temptation_description": "Spend Rs. 1,200 playing carnival games with forest friends.",
            },
            {
                "period": 2,
                "label": "Week 2",
                "allowance_lkr": 4500,
                "mandatory_cost_lkr": 1500,
                "mandatory_cost_description": "Fresh forest forage & basic hollow maintenance",
                "temptation_cost_lkr": 1000,
                "temptation_title": "Golden Berry Sugar Floss",
                "temptation_description": "Spend Rs. 1,000 on sweet candied berries.",
            },
            {
                "period": 3,
                "label": "Week 3",
                "allowance_lkr": 4500,
                "mandatory_cost_lkr": 1500,
                "mandatory_cost_description": "Fresh forest forage & basic hollow maintenance",
                "temptation_cost_lkr": 1000,
                "temptation_title": "Glowing Lantern Souvenir",
                "temptation_description": "Spend Rs. 1,000 on a festive decorative lantern.",
            },
        ],
        "target_goal_lkr": 7500,
    },
    pass_criteria=PassCriteria(
        min_competency_score=75,
        max_budget_lkr=13500,
        require_budget_feasibility=True,
        min_reserve_preserved_lkr=7500,
    ),
    hints=(
        "To reach Rs. 7,500, you need to save an average of Rs. 2,500 each week.",
        "Resisting the carnival games and treats unlocks the maximum saving power of Rs. 3,000 per week.",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation="Delayed gratification means resisting immediate impulse spending so you can afford high-value security items that protect your future.",
        guiding_questions=(
            "How much total savings do you need for the Thermal Quilt & Granary Lock?",
            "If you buy every festival treat, will you meet the Rs. 7,500 goal?",
        ),
        suggested_focus="Skip the temptations in Weeks 1 and 2, save Rs. 3,000 and Rs. 3,000, then in Week 3 save Rs. 2,000+ to exceed the Rs. 7,500 target.",
    ),
)

_SQUIRREL_L4 = LevelDefinition(
    id="level_squirrel_4",
    level_number=4,
    title="Unexpected Food Shortage",
    subtitle="Emergency Preparedness & Resilience",
    story_intro=(
        "A torrential rainstorm battered the oak trees! Water seeped into Nutty's lower hollow, ruining stored seeds. "
        "You have Rs. 7,000 in emergency reserves. Fix the leak and replace ruined food with certified supplies before mold spreads!"
    ),
    learning_objective=(
        "Use emergency reserves to replace essential food and seal the leak. Avoid overpriced luxury treats or cheap moldy seeds."
    ),
    target_competency="emergencyPreparedness",
    interaction_type="emergency_response",
    starting_budget_lkr=7000,
    existing_reserve_lkr=7000,
    options=(
        DecisionOption("opt_sq_emergency_seed_bulk", "Sealed Kiln-Dried Acorn Pack", 3500, "emergency_food", True, "certified_good"),
        DecisionOption("opt_sq_tarp_seal_patch", "Waterproof Bark Tarpaulin", 1500, "emergency_repair", True, "certified_good"),
        DecisionOption("opt_sq_luxury_imported_berries", "Imported Honey Glazed Berries", 3500, "luxury_food", False, "luxury_excess"),
        DecisionOption("opt_sq_moldy_discount_seeds", "Discount Wet Floor Seeds", 1000, "substandard_food", False, "substandard"),
    ),
    pass_criteria=PassCriteria(
        min_competency_score=75,
        max_budget_lkr=7000,
        require_budget_feasibility=True,
        must_include_option_ids=("opt_sq_emergency_seed_bulk", "opt_sq_tarp_seal_patch"),
        disallowed_option_ids=("opt_sq_luxury_imported_berries", "opt_sq_moldy_discount_seeds"),
        min_reserve_preserved_lkr=1500,
    ),
    hints=(
        "Buy the sealed kiln-dried acorns and waterproof tarp. Do not gamble with damp moldy floor seeds!",
        "Save at least Rs. 1,500 in reserve for tomorrow's unpredictable weather.",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation="Emergency funds exist to restore safety and replace essentials during unforeseen crises. Never waste emergency funds on luxury treats or hazardous cut-rate supplies.",
        guiding_questions=(
            "What health hazard happens if Nutty eats cheap moldy seeds from the wet forest floor?",
            "How much emergency cash is left after purchasing the dried acorns and waterproof tarp?",
        ),
        suggested_focus="Select the Kiln-Dried Acorn Pack (Rs. 3,500) and Waterproof Tarpaulin (Rs. 1,500). Total spent is Rs. 5,000, preserving Rs. 2,000 in your reserve.",
    ),
)

_SQUIRREL_L5 = LevelDefinition(
    id="level_squirrel_5",
    level_number=5,
    title="The Coldest Winter Night",
    subtitle="Complex Financial Trade-offs",
    story_intro=(
        "A severe Arctic freeze is approaching the forest tonight! Temperature will drop below freezing. "
        "Nutty has Rs. 10,000, but cannot afford every possible purchase. Make a reasoned financial trade-off to keep Nutty alive and warm."
    ),
    learning_objective=(
        "Select critical thermal moss and high-calorie walnuts within budget. Choose the sound financial rationale that explains your trade-off."
    ),
    target_competency="tradeoffReasoning",
    interaction_type="tradeoff_justification",
    starting_budget_lkr=10000,
    options=(
        DecisionOption("opt_sq_thick_moss_insulation", "High-Density Thermal Moss Lining", 4500, "thermal_safety", True, "certified_good"),
        DecisionOption("opt_sq_protein_walnut_pack", "High-Calorie Walnut & Hazelnut Ration", 3500, "caloric_fuel", True, "certified_good"),
        DecisionOption("opt_sq_hand_knitted_hammock", "Decorative Velvet Squirrel Hammock", 3000, "comfort_luxury", False, "luxury_excess"),
        DecisionOption("opt_sq_extra_pinecones", "Fragrant Scented Pinecones", 1200, "cosmetic", False, "luxury_excess"),
    ),
    tradeoff_rationales=(
        TradeoffRationale("rat_sq_safety_first", True, "Sound trade-off: Prioritized essential thermal insulation and caloric fuel to survive sub-zero freeze while keeping a Rs. 2,000 cash cushion."),
        TradeoffRationale("rat_sq_luxury_comfort", False, "Flawed reasoning: Velvet hammock offers soft sleeping but fails to block freezing drafts or provide metabolic heat."),
        TradeoffRationale("rat_sq_cheap_cosmetics", False, "Flawed reasoning: Scented pinecones are purely cosmetic and provide neither warmth nor nutrition during a freeze."),
    ),
    pass_criteria=PassCriteria(
        min_competency_score=75,
        max_budget_lkr=10000,
        require_budget_feasibility=True,
        must_include_option_ids=("opt_sq_thick_moss_insulation", "opt_sq_protein_walnut_pack"),
        disallowed_option_ids=("opt_sq_hand_knitted_hammock",),
        required_rationale_id="rat_sq_safety_first",
        min_reserve_preserved_lkr=1500,
    ),
    hints=(
        "Thermal moss blocks the sub-zero draft and calorie-dense nuts keep Nutty's metabolism warm.",
        "Select 'rat_sq_safety_first' to justify prioritizing life-saving thermal protection over cosmetic bedding.",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation="When scarcity forces difficult choices, prioritize core survival capabilities and explain your decision using clear risk reduction principles.",
        guiding_questions=(
            "Can a velvet hammock keep out sub-zero drafts if the walls lack thermal moss insulation?",
            "Why is keeping a Rs. 2,000 cash cushion important even during severe weather?",
        ),
        suggested_focus="Select Thermal Moss (Rs. 4,500) + Walnut Ration (Rs. 3,500). Choose 'rat_sq_safety_first' as your rationale and preserve Rs. 2,000.",
    ),
)

_SQUIRREL_L6 = LevelDefinition(
    id="level_squirrel_6",
    level_number=6,
    title="Nutty's Winter Home",
    subtitle="Integrated Financial Mastery",
    story_intro=(
        "Winter has arrived! Snow blankets the oak canopy. With Rs. 12,000 in total winter funds, "
        "synthesize everything you learned: stock deep-winter food, fortify the hollow hearth, and establish a snowstorm contingency reserve."
    ),
    learning_objective=(
        "Build a complete winter survival budget allocating all Rs. 12,000 across food, shelter, contingency, and modest celebrations."
    ),
    target_competency="budgetingSkill",
    interaction_type="budget_allocator",
    starting_budget_lkr=12000,
    allocation_categories=(
        AllocationCategory("cat_sq_deep_winter_food", "Deep-Winter Food Stocks (Acorns & Seeds)", "food", True, 4000, 6000, 500, 0),
        AllocationCategory("cat_sq_hollow_fortification", "Winter Hearth & Hollow Fortification", "shelter", True, 3000, 4500, 500, 0),
        AllocationCategory("cat_sq_snowstorm_contingency", "Mid-Winter Snowstorm Contingency Fund", "savings", True, 2500, 4000, 500, 0),
        AllocationCategory("cat_sq_festive_celebration", "Forest Snow Celebration Favors", "discretionary", False, 0, 2000, 500, 0),
    ),
    pass_criteria=PassCriteria(
        min_competency_score=75,
        max_budget_lkr=12000,
        require_budget_feasibility=True,
        min_reserve_preserved_lkr=2500,
    ),
    hints=(
        "Allocate at least Rs. 4,000 to food, Rs. 3,000 to hollow fortification, and Rs. 2,500 to the contingency fund.",
        "Spend no more than Rs. 1,500 on celebration favors so core survival is 100% fortified.",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation="A comprehensive financial plan balances essential living needs, capital maintenance, and liquid reserves, allowing modest celebrations only after security is guaranteed.",
        guiding_questions=(
            "Did you fund all three pillars: food, shelter, and emergency contingency?",
            "Does total allocation equal the full Rs. 12,000 budget?",
        ),
        suggested_focus="Allocate Rs. 5,000 to Food, Rs. 3,500 to Hollow Fortification, Rs. 3,000 to Contingency, and Rs. 500 to Snow Celebration.",
    ),
)


# ─────────────────────────────────────────────────────────────────────────────

# ─────────────────────────────────────────────────────────────────────────────
# Panda's School Fair Levels (Levels 1 - 6)
# ─────────────────────────────────────────────────────────────────────────────

_PANDA_L1 = LevelDefinition(
    id="level_panda_1",
    level_number=1,
    title="The School Fair Begins",
    subtitle="Needs vs. Wants & Fair Staging",
    story_intro=(
        "Bao Bao is selected as student treasurer for the School Charity Fair! With Rs. 20,000 in starting "
        "funds, Bao Bao must build safe, attractive stalls, set up essential hygiene supplies, and print promotional "
        "posters while preserving at least Rs. 4,000 as a contingency buffer for fair week."
    ),
    learning_objective=(
        "Prioritize non-negotiable stall tables, first aid, and basic signage within budget, resisting oversized neon decorations."
    ),
    target_competency="budgetingSkill",
    interaction_type="needs_wants",
    starting_budget_lkr=20000,
    options=(
        DecisionOption("opt_panda_sturdy_stalls", "Sturdy Stall Tables & Wooden Booth Frames", 7000, "essential_care", True, "certified_good"),
        DecisionOption("opt_panda_hygiene_safety", "First Aid Kit, Hand Sanitizer & Covered Bins", 4000, "essential_care", True, "certified_good"),
        DecisionOption("opt_panda_fair_flyers", "Printed Fair Posters & Directional Signs", 2000, "essential_care", True, "certified_good"),
        DecisionOption("opt_panda_paper_streamers", "Affordable Colorful Paper Banners & Chalkboards", 2000, "discretionary", False, "certified_good"),
        DecisionOption("opt_panda_neon_archway", "Giant Flashing Neon Balloon Archway", 9000, "discretionary", False, "luxury_excess"),
        DecisionOption("opt_panda_vip_sound_system", "DJ Sound Blaster with Fog & Smoke Effects", 8000, "discretionary", False, "luxury_excess"),
    ),
    pass_criteria=PassCriteria(
        min_competency_score=75,
        max_budget_lkr=20000,
        require_budget_feasibility=True,
        min_reserve_preserved_lkr=4000,
        must_include_option_ids=("opt_panda_sturdy_stalls", "opt_panda_hygiene_safety", "opt_panda_fair_flyers"),
        disallowed_option_ids=("opt_panda_neon_archway", "opt_panda_vip_sound_system"),
    ),
    hints=(
        "Ensure every student has safe stalls to sell from and clean waste bins before buying decorations.",
        "Keep at least Rs. 4,000 in reserve for unforeseen fair expenses.",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation="Sound project budgeting funds safety, infrastructure, and promotion first, setting aside a liquid cash buffer before entertaining luxury aesthetics.",
        guiding_questions=(
            "Can the fair operate safely without sturdy tables or a first aid kit?",
            "How much reserve cash remains if you purchase the flashing neon archway?",
        ),
        suggested_focus="Select Sturdy Stall Tables (Rs. 7,000), Hygiene & Safety Kit (Rs. 4,000), and Fair Posters (Rs. 2,000). Optionally add Paper Banners (Rs. 2,000) and preserve Rs. 5,000.",
    ),
)

_PANDA_L2 = LevelDefinition(
    id="level_panda_2",
    level_number=2,
    title="The Clever Vendor Deal",
    subtitle="Price Comparison & Value Assessment",
    story_intro=(
        "Bao Bao must purchase 300 game prizes and 500 visitor game tokens. Several wholesale vendors have submitted "
        "competing bids. Some offer cheap substandard prizes with hidden delivery fees, while others offer certified "
        "durable prize bundles with student discounts and free delivery."
    ),
    learning_objective=(
        "Compare unit pricing, quality standards, and hidden transport fees to choose the highest-value vendor package."
    ),
    target_competency="investmentAwareness",
    interaction_type="value_comparison",
    starting_budget_lkr=12000,
    options=(
        DecisionOption(
            "opt_panda_vendor_bamboo_coop",
            "Honest Bamboo Wholesale Bundle (300 prizes, 500 tokens, free delivery, replacement guarantee)",
            9500,
            "essential_care",
            True,
            "certified_good",
        ),
        DecisionOption(
            "opt_panda_vendor_cheap_trap",
            "Discount Clearance Emporium (Fragile sharp-edged prizes, hidden Rs. 2,500 courier fee, no returns)",
            6500,
            "discretionary",
            False,
            "substandard",
        ),
        DecisionOption(
            "opt_panda_vendor_luxury_boutique",
            "Prestige Imperial Fair Kit (Gold-trimmed boutique crates, imported silk tokens, luxury packaging)",
            14500,
            "discretionary",
            False,
            "luxury_excess",
        ),
        DecisionOption(
            "opt_panda_vendor_standard_retail",
            "Corner Stationery Retailer (Individual item prices, no bulk discount, paid delivery fee)",
            11500,
            "discretionary",
            False,
            "certified_good",
        ),
    ),
    pass_criteria=PassCriteria(
        min_competency_score=75,
        max_budget_lkr=12000,
        require_budget_feasibility=True,
        must_include_option_ids=("opt_panda_vendor_bamboo_coop",),
        disallowed_option_ids=("opt_panda_vendor_cheap_trap", "opt_panda_vendor_luxury_boutique"),
    ),
    hints=(
        "Watch out for hidden delivery fees and substandard toys that break easily.",
        "The best purchase is the one offering verified durability, fair bulk pricing, and a healthy remaining reserve.",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation="Value assessment weighs total landed cost (including transit and guarantees) against item quality, rather than blindly picking the lowest sticker price.",
        guiding_questions=(
            "What happens to the school's reputation if prizes break immediately in children's hands?",
            "Which package leaves a Rs. 2,500 cash buffer while guaranteeing certified safety?",
        ),
        suggested_focus="Choose the Honest Bamboo Wholesale Bundle for Rs. 9,500.",
    ),
)

_PANDA_L3 = LevelDefinition(
    id="level_panda_3",
    level_number=3,
    title="Needs, Wants & Festival Temptations",
    subtitle="Spending Discipline & Delayed Gratification",
    story_intro=(
        "Excited classmates urge Bao Bao to rent a giant commercial bouncy castle and an imported chocolate fountain. "
        "However, the fair's true mission is raising money for the Community Learning Library! Bao Bao has Rs. 16,000 "
        "and must balance affordable carnival games and student photo art with a dedicated charity seed fund."
    ),
    learning_objective=(
        "Demonstrate spending discipline by choosing affordable student activities and locking in the charity fund, justifying your trade-off."
    ),
    target_competency="spendingDiscipline",
    interaction_type="tradeoff_justification",
    starting_budget_lkr=16000,
    options=(
        DecisionOption("opt_panda_carnival_games", "Classic Ring Toss & Ball Roll Stalls", 6000, "essential_care", True, "certified_good"),
        DecisionOption("opt_panda_diy_photobooth", "Student Art Photo Booth & Face Paint Station", 3500, "discretionary", False, "certified_good"),
        DecisionOption("opt_panda_inflatable_castle", "Commercial Giant Inflatable Bouncy Castle", 9500, "discretionary", False, "luxury_excess"),
        DecisionOption("opt_panda_chocolate_fountain", "Imported Belgian Chocolate Dip Fountain", 7000, "discretionary", False, "luxury_excess"),
        DecisionOption("opt_panda_charity_seed", "Protected Community Library Seed Fund", 5000, "essential_care", True, "certified_good"),
    ),
    tradeoff_rationales=(
        TradeoffRationale(
            "rat_panda_balanced_fun",
            True,
            "Sound trade-off: Balances high student enjoyment with ethical charity preservation within budget.",
        ),
        TradeoffRationale(
            "rat_panda_all_luxury",
            False,
            "Flawed reasoning: Flashy luxury rentals consume all funds and leave zero profit for the library.",
        ),
        TradeoffRationale(
            "rat_panda_no_fun",
            False,
            "Flawed reasoning: A fair with zero activities attracts no visitors and fails to raise community funds.",
        ),
    ),
    pass_criteria=PassCriteria(
        min_competency_score=75,
        max_budget_lkr=16000,
        require_budget_feasibility=True,
        required_rationale_id="rat_panda_balanced_fun",
        must_include_option_ids=("opt_panda_carnival_games", "opt_panda_charity_seed"),
        disallowed_option_ids=("opt_panda_inflatable_castle", "opt_panda_chocolate_fountain"),
    ),
    hints=(
        "Include the Classic Ring Toss and the Library Seed Fund.",
        "Pair affordable student entertainment with the sound rationale that protects the charity goal.",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation="Delayed gratification and spending discipline require resisting impulsive status purchases to safeguard long-term moral commitments.",
        guiding_questions=(
            "What is the core purpose of the school charity fair?",
            "Can students have fun with creative games without spending Rs. 9,500 on a bouncy castle?",
        ),
        suggested_focus="Select Ring Toss Stalls (Rs. 6,000), DIY Photo Booth (Rs. 3,500), and Library Seed Fund (Rs. 5,000) with the balanced fun rationale.",
    ),
)

_PANDA_L4 = LevelDefinition(
    id="level_panda_4",
    level_number=4,
    title="The Unexpected Fair Problem",
    subtitle="Emergency Budgeting & Financial Resilience",
    story_intro=(
        "On the morning of the fair, an unexpected tropical downpour soaks the food stalls and triggers an electrical "
        "short in the outdoor string lights! Bao Bao has Rs. 10,000 in emergency reserves. Bao Bao must replace "
        "damaged staging with waterproof tarps and deploy safe solar lanterns without making panic purchases."
    ),
    learning_objective=(
        "Use emergency funds to remediate safety hazards with certified materials while preserving a cash contingency."
    ),
    target_competency="savingBehavior",
    interaction_type="emergency_response",
    starting_budget_lkr=10000,
    existing_reserve_lkr=10000,
    options=(
        DecisionOption("opt_panda_repair_waterproof_stalls", "Heavy-Duty Weatherproof Tarps & Timber Staging", 4500, "essential_care", True, "certified_good"),
        DecisionOption("opt_panda_repair_solar_lanterns", "Emergency Solar-Powered LED Safety Lanterns", 2500, "essential_care", True, "certified_good"),
        DecisionOption("opt_panda_repair_panic_generator", "Diesel Generator & Luxury Heated Gazebo Express Rental", 12000, "discretionary", False, "luxury_excess"),
        DecisionOption("opt_panda_repair_duct_tape_hack", "Wet Cardboard & Frayed Wire Quick Tape", 1000, "discretionary", False, "substandard"),
    ),
    pass_criteria=PassCriteria(
        min_competency_score=75,
        max_budget_lkr=10000,
        require_budget_feasibility=True,
        min_reserve_preserved_lkr=2500,
        must_include_option_ids=("opt_panda_repair_waterproof_stalls", "opt_panda_repair_solar_lanterns"),
        disallowed_option_ids=("opt_panda_repair_panic_generator", "opt_panda_repair_duct_tape_hack"),
    ),
    hints=(
        "Address both structural waterproofing and lighting safety.",
        "Never use frayed tape on wet wiring, and avoid overspending on luxury diesel generators.",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation="Emergency financial management deploys reserves strictly for certified risk mitigation, preventing panic overspending and hazardous stopgaps.",
        guiding_questions=(
            "Does duct-taping frayed wet wires create an unacceptable electrical danger for children?",
            "Can emergency reserves cover both waterproof tarps and solar lanterns while retaining a safety buffer?",
        ),
        suggested_focus="Purchase Waterproof Tarps (Rs. 4,500) and Solar LED Lanterns (Rs. 2,500), preserving Rs. 3,000 in reserves.",
    ),
)

_PANDA_L5 = LevelDefinition(
    id="level_panda_5",
    level_number=5,
    title="Pricing for a Successful Fair",
    subtitle="Cost, Revenue, Profit & Affordability",
    story_intro=(
        "The fair is about to welcome visitors! Bao Bao must set ticket bundle pricing. If prices are set too high, "
        "families cannot afford to attend and charity revenue collapses. If prices are below cost, every ticket loses money! "
        "Bao Bao must select the optimal pricing model that ensures high attendance, affordability, and maximum net profit."
    ),
    learning_objective=(
        "Understand unit costs, visitor volume, and profit margins to select a sustainable, student-friendly pricing strategy."
    ),
    target_competency="budgetingSkill",
    interaction_type="value_comparison",
    starting_budget_lkr=15000,
    options=(
        DecisionOption(
            "opt_panda_pricing_sweet_spot",
            "Optimal Fair Entry & Token Combo (Rs. 100/ticket, 300 visitors -> Rs. 30,000 revenue, Rs. 12,000 costs, Rs. 18,000 charity profit)",
            12000,
            "essential_care",
            True,
            "certified_good",
        ),
        DecisionOption(
            "opt_panda_pricing_predatory",
            "VIP Monopoly Pricing (Rs. 350/ticket, only 35 visitors -> Rs. 12,250 revenue, Rs. 8,000 costs, Rs. 4,250 profit, empty fair)",
            8000,
            "discretionary",
            False,
            "luxury_excess",
        ),
        DecisionOption(
            "opt_panda_pricing_underpriced",
            "Loss-Leader Bargain (Rs. 25/ticket, below cost of Rs. 40 -> 450 visitors, Rs. 11,250 revenue, Rs. 18,000 costs, -Rs. 6,750 net loss)",
            18000,
            "discretionary",
            False,
            "substandard",
        ),
        DecisionOption(
            "opt_panda_pricing_mid_conservative",
            "Modest Family Pass (Rs. 75/ticket -> 220 visitors, Rs. 16,500 revenue, Rs. 8,800 costs, Rs. 7,700 profit)",
            8800,
            "discretionary",
            False,
            "certified_good",
        ),
    ),
    pass_criteria=PassCriteria(
        min_competency_score=75,
        max_budget_lkr=15000,
        require_budget_feasibility=True,
        must_include_option_ids=("opt_panda_pricing_sweet_spot",),
        disallowed_option_ids=("opt_panda_pricing_predatory", "opt_panda_pricing_underpriced"),
    ),
    hints=(
        "Compare total net charity profit across the options.",
        "High prices frighten customers away, while prices below unit cost cause a net financial deficit.",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation="Sustainable pricing balances unit cost recovery and customer willingness to pay, generating volume sales and maximized net charity profit.",
        guiding_questions=(
            "Why does selling 450 tickets at Rs. 25 result in an overall loss when unit cost is Rs. 40?",
            "Which pricing model generates the highest net donation (Rs. 18,000) for the library?",
        ),
        suggested_focus="Select the Optimal Fair Entry & Token Combo for Rs. 12,000 operating budget.",
    ),
)

_PANDA_L6 = LevelDefinition(
    id="level_panda_6",
    level_number=6,
    title="Bao Bao's Charity Fair Finale",
    subtitle="Integrated Financial Mastery & Charity Goal",
    story_intro=(
        "The school fair has concluded with immense joy and raised Rs. 35,000 in gross revenue! Bao Bao must now "
        "execute the final treasurer duty: settle outstanding venue cleanup bills (Rs. 8,000 - 10,000), set aside a "
        "seed reserve for next semester's fair (Rs. 4,000 - 6,000), donate the maximum possible amount to the Community "
        "Learning Library (Rs. 18,000 - 21,000), and limit council celebration snacks to modest refreshments (under Rs. 3,000)."
    ),
    learning_objective=(
        "Construct a balanced post-fair allocation budget fulfilling vendor obligations, council continuity, and the library charity goal."
    ),
    target_competency="goalAchievement",
    interaction_type="budget_allocator",
    starting_budget_lkr=35000,
    allocation_categories=(
        AllocationCategory("cat_panda_bills", "Outstanding Venue & Vendor Obligations", "essential_care", True, 8000, 10000, 500, 0),
        AllocationCategory("cat_panda_seed_reserve", "Next Semester Student Fair Reserve", "emergency_reserve", True, 4000, 6000, 500, 0),
        AllocationCategory("cat_panda_library_donation", "Community Learning Library Donation", "savings_goal", True, 18000, 21000, 500, 0),
        AllocationCategory("cat_panda_council_party", "Volunteer Refreshments & Celebration Party", "discretionary", False, 0, 3000, 500, 0),
    ),
    pass_criteria=PassCriteria(
        min_competency_score=75,
        max_budget_lkr=35000,
        require_budget_feasibility=True,
        min_reserve_preserved_lkr=22000,
        max_discretionary_ratio=0.15,
    ),
    hints=(
        "Allocate at least Rs. 8,000 to outstanding venue bills and Rs. 4,000 to the student council seed reserve.",
        "Donate at least Rs. 18,000 to the Community Library so the learning centre can open successfully.",
        "Keep the volunteer celebration party modest (Rs. 2,000 - 3,000).",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation="Complete financial stewardship honors all liabilities first, secures institutional continuity, and fulfills philanthropic goals with strict discretionary discipline.",
        guiding_questions=(
            "Are all legal venue and equipment obligations fully settled?",
            "Does the combined library donation and seed reserve exceed Rs. 22,000?",
        ),
        suggested_focus="Allocate Rs. 9,000 to Venue Bills, Rs. 5,000 to Seed Reserve, Rs. 19,000 to Library Donation, and Rs. 2,000 to Volunteer Refreshments.",
    ),
)

# Catalog index — add future missions here
# ─────────────────────────────────────────────────────────────────────────────

MISSION_CATALOG: dict[str, MissionDefinition] = {
    RESCUE_PUPPY_MISSION.id: RESCUE_PUPPY_MISSION,
    "mission_squirrel_savings": MissionDefinition(
        id="mission_squirrel_savings",
        title="Squirrel's Winter Savings",
        character_name="Nutty",
        character_id="char_squirrel_nutty",
        primary_competency="savingBehavior",
        total_levels=6,
        theme_color="#c45f24",
        description="Manage food resources and seasonal tokens over simulated weeks.",
        levels=(_SQUIRREL_L1, _SQUIRREL_L2, _SQUIRREL_L3, _SQUIRREL_L4, _SQUIRREL_L5, _SQUIRREL_L6),
        initial_vitality=40,
        initial_happiness=35,
    ),
    "mission_panda_fair": MissionDefinition(
        id="mission_panda_fair",
        title="Panda's School Fair",
        character_name="Bao Bao",
        character_id="char_panda_baobao",
        primary_competency="spendingDiscipline",
        total_levels=6,
        theme_color="#0a4d42",
        description="Treasurer Bao Bao organizes a school charity fair to fund a community library.",
        levels=(_PANDA_L1, _PANDA_L2, _PANDA_L3, _PANDA_L4, _PANDA_L5, _PANDA_L6),
        initial_vitality=60,
        initial_happiness=55,
    ),
    "mission_turtle_emergency": MissionDefinition(
        id="mission_turtle_emergency",
        title="Turtle's Emergency Fund",
        character_name="Shelly",
        character_id="char_turtle_shelly",
        primary_competency="savingBehavior",
        total_levels=8,
        theme_color="#2f7d4a",
        description="Fortify a riverside home against unpredictable storm damage.",
        levels=(),
    ),
    "mission_fox_business": MissionDefinition(
        id="mission_fox_business",
        title="Fox's Little Business",
        character_name="Felix",
        character_id="char_fox_felix",
        primary_competency="budgetingSkill",
        total_levels=8,
        theme_color="#e07a3d",
        description="Manage starting capital, ingredients, and net profit margins.",
        levels=(),
    ),
    "mission_bear_forest": MissionDefinition(
        id="mission_bear_forest",
        title="Bear's Future Forest",
        character_name="Barnaby Bear",
        character_id="char_bear_barnaby",
        primary_competency="investmentAwareness",
        total_levels=8,
        theme_color="#4d382c",
        description="Learn long-term horizons, compound growth, and diversification.",
        levels=(),
    ),
}


def get_mission(mission_id: str) -> MissionDefinition | None:
    return MISSION_CATALOG.get(mission_id)


def get_level(mission_id: str, level_number: int) -> LevelDefinition | None:
    mission = get_mission(mission_id)
    if not mission:
        return None
    for lvl in mission.levels:
        if lvl.level_number == level_number:
            return lvl
    return None


def get_level_by_id(mission_id: str, level_id: str) -> LevelDefinition | None:
    mission = get_mission(mission_id)
    if not mission:
        return None
    for lvl in mission.levels:
        if lvl.id == level_id:
            return lvl
    return None
