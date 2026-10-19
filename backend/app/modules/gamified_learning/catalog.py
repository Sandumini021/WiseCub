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
    subtitle="Recognize Essential Needs vs Optional Wants",
    story_intro=(
        "While walking home, you find Barnaby huddled under a park bench "
        "with a sprained, bleeding paw. You have a starting emergency rescue "
        "fund of Rs.\u202f5,000. Barnaby needs immediate stabilization before nightfall!"
    ),
    learning_objective=(
        "Distinguish essential survival needs from discretionary wants when "
        "resources are strictly limited."
    ),
    target_competency="spendingDiscipline",
    interaction_type="needs_wants",
    starting_budget_lkr=5000,
    options=(
        DecisionOption("opt_first_aid", "Antiseptic & Sterile Bandage Kit", 2500, "essential_care", True, "certified_good"),
        DecisionOption("opt_nutrition_pack", "High-Protein Puppy Meal & Clean Water", 1200, "nutrition", True, "certified_good"),
        DecisionOption("opt_squeaky_toy", "Fancy Squeaky Plush Toy", 1500, "discretionary", False, "luxury_excess"),
        DecisionOption("opt_cozy_towel", "Warm Thermal Rescue Blanket", 800, "essential_care", False, "certified_good"),
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
        "Barnaby is bleeding and hungry. Focus your funds on the wound dressing and food first.",
        "Beware of decorative toys right now—toys cannot disinfect a bleeding paw!",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation=(
            "Essential needs are items that prevent death, worsening injury, or serious harm. "
            "Wants are nice-to-have but not critical. When budgets are tight, fund essential needs first."
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
    subtitle="Multi-Category Expense Allocation & Emergency Reserve",
    story_intro=(
        "Barnaby’s initial wound is dressed, but he needs a comprehensive care plan for the week. "
        "The community shelter grants you a care budget of Rs. 15,000. You must allocate every "
        "rupee wisely across veterinary, medication, transport, and reserve categories."
    ),
    learning_objective=(
        "Create a balanced, comprehensive budget that fully covers essential line-items and sets aside an emergency buffer."
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
        "Total allocated amounts must not exceed Rs. 15,000.",
        "Make sure the Vet Checkup gets at least Rs. 6,000 and the Emergency Reserve gets at least Rs. 2,500.",
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
    subtitle="Multi-Period Savings Discipline & Goal Progress",
    story_intro=(
        "The vet says Barnaby’s torn ligament requires a specialized orthopedic splint in 3 weeks, costing Rs. 12,000. "
        "You earn a weekly community stipend of Rs. 5,000 for 3 weeks (total Rs. 15,000). Each week brings essential "
        "living costs and alluring impulse temptations. Will you accumulate the required Rs. 12,000?"
    ),
    learning_objective=(
        "Demonstrate multi-period savings discipline by consistently banking funds and resisting non-essential spending temptations."
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
        "To reach Rs. 12,000 over 3 weeks, you must save an average of Rs. 4,000 each week!",
        "Since your weekly income is Rs. 5,000 and mandatory costs are Rs. 1,000, giving in to temptations leaves you short of the goal.",
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
    title="Make Smart Purchasing Decisions",
    subtitle="Value-for-Money Analysis: Cheap Traps vs Certified Care",
    story_intro=(
        "You have Rs. 8,000 ready to purchase the medical procedure and antibiotics. Three medical providers offer "
        "different packages. Be careful: the cheapest option may be unsafe, while the most expensive option charges for unnecessary luxury."
    ),
    learning_objective=(
        "Evaluate value-for-money by balancing safety, certified efficacy, and cost, rather than assuming cheapest is best or expensive is required."
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
        "Compare what each provider actually delivers. Does Barnaby need silk pillows to heal?",
        "Look out for fake or uncertified cheap medicines that could harm the puppy.",
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
    title="Unexpected Financial Emergency",
    subtitle="Resilience Under Pressure: Utilizing Emergency Reserves",
    story_intro=(
        "Disaster strikes at midnight! Barnaby develops a sudden allergic fever and requires an immediate specialized "
        "antihistamine injection costing Rs. 4,500. Your current cash on hand is only Rs. 2,000, but fortunately you preserved "
        "an Emergency Reserve from previous levels of Rs. 3,500!"
    ),
    learning_objective=(
        "Protect essential health by prudently tapping emergency reserves while avoiding predatory debt or postponing non-negotiable care."
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
        "You specifically saved an Emergency Cushion for situations like this. Use it!",
        "Never take high-interest predatory loans when your own savings can cover the emergency.",
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
    subtitle="Long-Term Recurring Care & Reserve Sustainability",
    story_intro=(
        "Barnaby’s fever has subsided and his splint is doing its job. Now comes the critical 3-month rehabilitation phase. "
        "You manage a monthly youth animal guardian allowance of Rs. 8,000 per month. You must design a sustainable recurring monthly budget."
    ),
    learning_objective=(
        "Balance recurring monthly operating costs with ongoing reserve accumulation to sustain recovery over several months."
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
        "Total monthly expenses must stay under Rs. 8,000.",
        "Ensure both prescription food (Rs. 3,000) and physical therapy (Rs. 2,500) are funded, while setting aside at least Rs. 2,000 into the maintenance reserve.",
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
    title="Difficult Financial Trade-Off",
    subtitle="Evaluating Competing Priorities with Financial Reasoning",
    story_intro=(
        "With Rs. 10,000 remaining, you face competing priorities as Barnaby enters his final recovery stage. "
        "A friend urges you to buy a customized heated orthopedic bed (Rs. 4,500) and premium toys, while the "
        "vet recommends mandatory vaccinations & microchip (Rs. 4,000) plus an advanced mobility checkup (Rs. 4,000). "
        "You cannot afford everything! Choose wisely and explain your financial rationale."
    ),
    learning_objective=(
        "Defend a financial trade-off by identifying long-term preventive protection over short-term material comfort."
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
        "Think long-term: what prevents future disease versus what is merely a cozy luxury?",
        "Select the rationale that highlights preventive care over superficial pampering.",
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
    title="Final Rescue and Recovery Challenge",
    subtitle="Capstone Synthesis: Independent Financial Stewardship",
    story_intro=(
        "Today is Barnaby’s adoption day celebration! You are given a comprehensive graduation fund of Rs. 20,000. "
        "You must formulate Barnaby’s permanent adoption setup: finalize the adoption registration, secure a 6-month "
        "preventive care pack, allocate a permanent emergency cushion, and avoid wasteful overspending."
    ),
    learning_objective=(
        "Synthesize budgeting, saving, needs prioritization, and emergency buffer planning in an independent capstone scenario."
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
        "Do not spend money on loud fireworks that terrify animals.",
        "Ensure the Permanent Safety Cushion receives at least Rs. 6,000 and all essential registration & medicine are funded.",
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
# Catalog index — add future missions here
# ─────────────────────────────────────────────────────────────────────────────

MISSION_CATALOG: dict[str, MissionDefinition] = {
    RESCUE_PUPPY_MISSION.id: RESCUE_PUPPY_MISSION,
    # Future missions have empty level tuples as placeholders:
    "mission_squirrel_savings": MissionDefinition(
        id="mission_squirrel_savings",
        title="Squirrel's Winter Savings",
        character_name="Nutty",
        character_id="char_squirrel_nutty",
        primary_competency="savingBehavior",
        total_levels=8,
        theme_color="#c45f24",
        description="Manage food resources and seasonal tokens over simulated weeks.",
        levels=(),
    ),
    "mission_panda_fair": MissionDefinition(
        id="mission_panda_fair",
        title="Panda's School Fair",
        character_name="Bao Bao",
        character_id="char_panda_baobao",
        primary_competency="spendingDiscipline",
        total_levels=7,
        theme_color="#0a4d42",
        description="Distinguish needs from wants, manage booth budgets.",
        levels=(),
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
