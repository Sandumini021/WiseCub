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
    title="First Aid Budget Plan",
    subtitle="Allocate Budget Across Care Categories",
    story_intro=(
        "Barnaby is stable but needs a proper care plan for the next few days. "
        "You have Rs.\u202f8,000 to allocate across different care categories. "
        "Plan wisely so all essentials are covered!"
    ),
    learning_objective=(
        "Practice budgeting by allocating funds across multiple mandatory and "
        "optional care categories without exceeding the total budget."
    ),
    target_competency="budgetingSkill",
    interaction_type="budget_allocator",
    starting_budget_lkr=8000,
    allocation_categories=(
        AllocationCategory("vet_consultation", "Vet Consultation Fee", "veterinary_fees", True, 2000, 3000, 100, 2500),
        AllocationCategory("medications", "Antibiotics & Pain Relief", "medical_supplies", True, 1500, 2500, 100, 2000),
        AllocationCategory("nutrition_week", "One-Week Nutritious Food", "nutrition", True, 1500, 2500, 100, 2000),
        AllocationCategory("emergency_reserve", "Emergency Reserve Fund", "emergency_reserve", False, 0, 2000, 100, 500),
        AllocationCategory("comfort_items", "Comfort & Enrichment Items", "discretionary", False, 0, 1000, 100, 0),
    ),
    pass_criteria=PassCriteria(
        min_competency_score=65,
        max_budget_lkr=8000,
        require_budget_feasibility=True,
        min_reserve_preserved_lkr=300,
    ),
    hints=(
        "Allocate vet fee, medicine, and food first. Reserve is a safety net.",
        "Keep some money in reserve — surprises happen!",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation=(
            "A budget plan must cover all mandatory costs within available funds and keep a "
            "small reserve buffer for unexpected expenses."
        ),
        guiding_questions=(
            "Did all three essential categories receive at least their minimum amount?",
            "Is there any money remaining as a safety buffer?",
        ),
        suggested_focus="Fund the three essential rows first, then distribute leftover funds.",
    ),
)

_L3 = LevelDefinition(
    id="level_puppy_3",
    level_number=3,
    title="Save for the Specialist",
    subtitle="Multi-Period Savings Goal",
    story_intro=(
        "The vet says Barnaby needs a specialist's splint treatment costing Rs.\u202f3,500. "
        "Over four weeks you receive a total pocket allowance of Rs.\u202f6,000. "
        "Save consistently and resist temptations to reach the goal!"
    ),
    learning_objective=(
        "Build disciplined saving habits across multiple time periods by resisting "
        "impulse spending to reach a clear financial goal."
    ),
    target_competency="savingBehavior",
    interaction_type="multi_period_saving",
    starting_budget_lkr=6000,
    multi_period_config={
        "periods": [
            {"period": 1, "allowance_lkr": 1500, "mandatory_cost_lkr": 200, "temptation_cost_lkr": 800, "temptation_title": "Arcade Games", "temptation_description": "Fun at the arcade! Rs. 800"},
            {"period": 2, "allowance_lkr": 1500, "mandatory_cost_lkr": 200, "temptation_cost_lkr": 600, "temptation_title": "Snack Fiesta", "temptation_description": "Street snack cart! Rs. 600"},
            {"period": 3, "allowance_lkr": 1500, "mandatory_cost_lkr": 200, "temptation_cost_lkr": 700, "temptation_title": "Mobile Top-Up", "temptation_description": "Game credits! Rs. 700"},
            {"period": 4, "allowance_lkr": 1500, "mandatory_cost_lkr": 200, "temptation_cost_lkr": 500, "temptation_title": "Party Food", "temptation_description": "Friend's birthday party food! Rs. 500"},
        ],
        "target_goal_lkr": 3500,
        "goal_description": "Specialist Splint Treatment for Barnaby",
    },
    pass_criteria=PassCriteria(
        min_competency_score=65,
        max_budget_lkr=6000,
        require_budget_feasibility=True,
        min_reserve_preserved_lkr=3500,
    ),
    hints=(
        "Aim to save at least Rs. 900 per week after mandatory costs.",
        "Skipping temptations in early weeks gives you more flexibility later.",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation=(
            "Achieving a savings goal requires resisting short-term temptations. "
            "Set a weekly savings target and track it period by period."
        ),
        guiding_questions=(
            "How much do you need to save each week to reach Rs. 3,500 in four weeks?",
            "Which temptations are costing you the most savings?",
        ),
        suggested_focus="Resist at least two temptations and save Rs. 875+ per week.",
    ),
)

_L4 = LevelDefinition(
    id="level_puppy_4",
    level_number=4,
    title="Clinic Day Value Choice",
    subtitle="Compare Value Against Cost",
    story_intro=(
        "It is clinic day! The vet offers three treatment options. "
        "You have Rs.\u202f4,000. Choose the treatment that gives the best health "
        "outcome for Barnaby without overspending or choosing substandard care."
    ),
    learning_objective=(
        "Evaluate cost versus quality to select the best value option — "
        "neither the cheapest (substandard) nor the most expensive (wasteful)."
    ),
    target_competency="investmentAwareness",
    interaction_type="value_comparison",
    starting_budget_lkr=4000,
    options=(
        DecisionOption("opt_cheap_treatment", "Budget Clinic (Unqualified Vet)", 1200, "veterinary_fees", False, "substandard"),
        DecisionOption("opt_certified_treatment", "Certified Animal Clinic Treatment", 2800, "veterinary_fees", True, "certified_good"),
        DecisionOption("opt_luxury_spa", "Premium Pet Wellness Spa Package", 4200, "discretionary", False, "luxury_excess"),
    ),
    pass_criteria=PassCriteria(
        min_competency_score=65,
        max_budget_lkr=4000,
        require_budget_feasibility=True,
        must_include_option_ids=("opt_certified_treatment",),
        disallowed_option_ids=("opt_cheap_treatment", "opt_luxury_spa"),
    ),
    hints=(
        "An unqualified vet risks re-infection. Cheap does not mean good.",
        "The luxury spa exceeds your budget and does not help recovery.",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation=(
            "Best value means the option that delivers the required quality within budget. "
            "Substandard options may save money short-term but cause greater harm and cost later."
        ),
        guiding_questions=(
            "Which treatment is certified safe and affordable?",
            "Does the luxury option provide more health benefit than the certified clinic?",
        ),
        suggested_focus="Select the certified clinic — it meets quality standards and fits the budget.",
    ),
)

_L5 = LevelDefinition(
    id="level_puppy_5",
    level_number=5,
    title="Surprise Setback!",
    subtitle="Emergency Financial Response",
    story_intro=(
        "Barnaby tripped and reopened his wound. An emergency vet visit costs "
        "Rs.\u202f2,200 immediately. You have Rs.\u202f3,500 available. Cover the emergency "
        "while preserving enough for tomorrow's scheduled medication!"
    ),
    learning_objective=(
        "Respond to an unexpected financial emergency by prioritizing urgent needs "
        "and maintaining enough reserves for scheduled ongoing expenses."
    ),
    target_competency="savingBehavior",
    interaction_type="emergency_response",
    starting_budget_lkr=3500,
    existing_reserve_lkr=500,
    options=(
        DecisionOption("opt_emergency_vet", "Emergency Vet Visit & Re-dressing", 2200, "veterinary_fees", True, "certified_good"),
        DecisionOption("opt_scheduled_meds", "Tomorrow's Scheduled Medication Dose", 800, "medical_supplies", True, "certified_good"),
        DecisionOption("opt_comfort_toy_2", "Stress-Relief Chew Toy", 900, "discretionary", False),
        DecisionOption("opt_premium_food", "Premium Recovery Diet Meal", 700, "nutrition", False),
    ),
    pass_criteria=PassCriteria(
        min_competency_score=65,
        max_budget_lkr=3500,
        require_budget_feasibility=True,
        must_include_option_ids=("opt_emergency_vet", "opt_scheduled_meds"),
        min_reserve_preserved_lkr=200,
    ),
    hints=(
        "Cover the emergency first, then the scheduled medication.",
        "Luxury food and toys are not urgent in an emergency.",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation=(
            "Financial emergencies test whether you have reserved funds. "
            "Always cover urgent health needs before optional comfort items."
        ),
        guiding_questions=(
            "What happens if the emergency vet visit is skipped?",
            "Is there enough left for tomorrow's medication after the emergency?",
        ),
        suggested_focus="Select emergency vet and scheduled medication only. Preserve Rs. 200+ reserve.",
    ),
)

_L6 = LevelDefinition(
    id="level_puppy_6",
    level_number=6,
    title="Recurring Monthly Care Budget",
    subtitle="Plan Sustainable Long-Term Care",
    story_intro=(
        "Barnaby is recovering well! Plan his monthly care budget across recurring "
        "and occasional categories. You have Rs.\u202f12,000 for the month. "
        "Make sure every category is adequately funded for a full month."
    ),
    learning_objective=(
        "Create a realistic recurring monthly budget that covers all recurring "
        "necessities and retains an emergency cushion."
    ),
    target_competency="budgetingSkill",
    interaction_type="recurring_budget",
    starting_budget_lkr=12000,
    allocation_categories=(
        AllocationCategory("monthly_food", "Monthly Premium Dog Food", "nutrition", True, 3000, 5000, 100, 3500),
        AllocationCategory("monthly_vet_check", "Monthly Vet Check-Up", "veterinary_fees", True, 2000, 3000, 100, 2500),
        AllocationCategory("grooming", "Monthly Grooming Session", "recurring_care", True, 1000, 2000, 100, 1500),
        AllocationCategory("emergency_savings", "Monthly Emergency Savings", "emergency_reserve", True, 1500, 3000, 100, 2000),
        AllocationCategory("enrichment", "Play & Enrichment Activities", "discretionary", False, 0, 1500, 100, 500),
    ),
    pass_criteria=PassCriteria(
        min_competency_score=65,
        max_budget_lkr=12000,
        require_budget_feasibility=True,
        min_reserve_preserved_lkr=1500,
    ),
    hints=(
        "Emergency savings is marked essential — think of it as paying yourself first.",
        "Enrichment is nice but keep it modest so all essential rows are fully funded.",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation=(
            "A monthly recurring budget must cover all repeating expenses and build savings. "
            "Treat savings as a non-negotiable expense category, not an afterthought."
        ),
        guiding_questions=(
            "Are all four essential categories above their minimum?",
            "Have you allocated at least Rs. 1,500 to emergency savings?",
        ),
        suggested_focus="Fund all four essential categories before allocating to enrichment.",
    ),
)

_L7 = LevelDefinition(
    id="level_puppy_7",
    level_number=7,
    title="Trade-Off Reasoning",
    subtitle="Justify Your Financial Decision",
    story_intro=(
        "Barnaby is almost fully recovered but two final care options exist: "
        "standard physiotherapy (Rs.\u202f3,000) or premium water therapy (Rs.\u202f5,500). "
        "You have Rs.\u202f4,000. Choose wisely and explain your reasoning!"
    ),
    learning_objective=(
        "Demonstrate trade-off analysis and articulate sound financial reasoning "
        "when two competing options are available at different quality-cost levels."
    ),
    target_competency="investmentAwareness",
    interaction_type="tradeoff_justification",
    starting_budget_lkr=4000,
    options=(
        DecisionOption("opt_physio", "Standard Certified Physiotherapy", 3000, "veterinary_fees", True, "certified_good"),
        DecisionOption("opt_water_therapy", "Premium Water Hydrotherapy", 5500, "veterinary_fees", False, "luxury_excess"),
    ),
    tradeoff_rationales=(
        TradeoffRationale(
            id="rationale_value",
            is_sound=True,
            feedback="Correct! Certified physiotherapy delivers clinically equivalent recovery within budget. Premium therapy exceeds available funds and offers marginal extra benefit.",
        ),
        TradeoffRationale(
            id="rationale_cheapest",
            is_sound=False,
            feedback="Choosing the cheapest option is not always best — you must evaluate quality, not just price. However, in this case physio IS the better-value option.",
        ),
        TradeoffRationale(
            id="rationale_splurge",
            is_sound=False,
            feedback="Premium therapy exceeds the budget by Rs. 1,500 and creates a deficit. Financial decisions must stay within available funds.",
        ),
    ),
    pass_criteria=PassCriteria(
        min_competency_score=65,
        max_budget_lkr=4000,
        require_budget_feasibility=True,
        must_include_option_ids=("opt_physio",),
        disallowed_option_ids=("opt_water_therapy",),
        required_rationale_id="rationale_value",
    ),
    hints=(
        "Water therapy is excellent but costs more than you have. Check if physiotherapy achieves the same recovery.",
        "Justify your choice using value-for-money reasoning, not just cost alone.",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation=(
            "Trade-off decisions require comparing quality-adjusted value. Staying within budget "
            "while choosing certified quality is the optimal financial decision."
        ),
        guiding_questions=(
            "Does the higher-priced option deliver proportionally better health outcomes?",
            "Which option provides certified quality within your budget?",
        ),
        suggested_focus="Select physiotherapy AND choose rationale_value as your reasoning.",
    ),
)

_L8 = LevelDefinition(
    id="level_puppy_8",
    level_number=8,
    title="Capstone: Barnaby's Full Rescue Plan",
    subtitle="Holistic Financial Stewardship",
    story_intro=(
        "Barnaby is ready for his final comprehensive care package! "
        "Allocate Rs.\u202f15,000 across all care dimensions to complete his recovery "
        "and build a lasting financial safety net for ongoing care."
    ),
    learning_objective=(
        "Demonstrate holistic financial stewardship by balancing all care dimensions, "
        "maintaining reserves, and achieving the mission goal within budget."
    ),
    target_competency="goalAchievement",
    interaction_type="capstone_challenge",
    starting_budget_lkr=15000,
    allocation_categories=(
        AllocationCategory("final_vet", "Final Veterinary Clearance", "veterinary_fees", True, 3000, 5000, 100, 4000),
        AllocationCategory("rehab_food", "Rehabilitation Nutrition Plan", "nutrition", True, 2500, 4000, 100, 3000),
        AllocationCategory("final_meds", "Completion Medication Course", "medical_supplies", True, 2000, 3000, 100, 2500),
        AllocationCategory("adoption_fee", "Official Adoption Registration Fee", "essential_care", True, 1500, 2000, 100, 1500),
        AllocationCategory("long_term_savings", "Long-Term Care Savings Fund", "savings_goal", True, 2000, 4000, 100, 2500),
        AllocationCategory("celebration", "Barnaby's Homecoming Celebration", "discretionary", False, 0, 1000, 100, 500),
    ),
    pass_criteria=PassCriteria(
        min_competency_score=70,
        max_budget_lkr=15000,
        require_budget_feasibility=True,
        min_reserve_preserved_lkr=2000,
    ),
    hints=(
        "Fund all five essential rows before celebration.",
        "Build at least Rs. 2,000 in the long-term savings to secure Barnaby's future.",
    ),
    remediation_scaffolding=RemediationScaffolding(
        rule_explanation=(
            "Completing a full financial rescue plan requires balancing immediate needs, "
            "ongoing care, and future savings. All categories marked essential must receive "
            "their minimum allocation first."
        ),
        guiding_questions=(
            "Are all five essential categories funded at or above their minimum?",
            "Have you preserved at least Rs. 2,000 in savings / reserve?",
        ),
        suggested_focus="Allocate to all five essentials before considering the celebration budget.",
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
