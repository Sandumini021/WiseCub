"""
CDEMF Server-Side Engine
========================
Ports the frontend TypeScript engine logic to Python for authoritative
server-side evaluation.  This is the SINGLE source of truth for:

  - Financial simulation (budget feasibility, essential coverage)
  - Competency evaluation (5 dimensions + 5 secondary metrics)
  - Emotional character state transitions
  - Level mastery pass/fail gating
  - Adaptive learning recommendations

The engine is entirely deterministic and rule-based (no ML model yet).
The `CompetencyPredictor` interface below defines the contract that a
future trained model must satisfy — swap `DeterministicPredictor` for
an `MLModelPredictor` without touching any route or MongoDB code.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any

from app.modules.gamified_learning.catalog import (
    AllocationCategory,
    DecisionOption,
    LevelDefinition,
    MissionDefinition,
)


# ─────────────────────────────────────────────────────────────────────────────
# Data classes (pure Python, no Mongo / Pydantic dependency)
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class FinancialState:
    starting_budget_lkr: int
    total_spent_lkr: int
    remaining_cash_lkr: int
    emergency_reserve_lkr: int
    allocated_categories: dict[str, int]
    unmet_essentials: list[str]
    is_budget_feasible: bool
    budget_deficit_lkr: int


@dataclass
class DecisionOutcome:
    decision_id: str
    total_cost_lkr: int
    essential_needs_covered: bool
    covered_essential_names: list[str]
    missed_essential_names: list[str]
    discretionary_spent_lkr: int
    reserve_preserved_lkr: int
    balance_remaining_lkr: int
    is_feasible: bool
    financial_impact_summary: str


@dataclass
class DimensionScores:
    budgeting_skill: int
    spending_discipline: int
    saving_behavior: int
    investment_awareness: int
    goal_achievement: int


@dataclass
class SecondaryScores:
    prioritization: int
    emergency_preparedness: int
    consistency: int
    risk_awareness: int
    tradeoff_reasoning: int


@dataclass
class CompetencyEvaluation:
    dimension_scores: DimensionScores
    secondary_scores: SecondaryScores
    target_score: int
    overall_score: int
    detailed_evidence: dict[str, Any]


@dataclass
class CharacterState:
    character_id: str
    name: str
    physical_condition: str
    emotional_state: str
    condition_description: str
    vitality_score: int
    happiness_score: int
    active_dialogue: str


@dataclass
class CharacterTransition:
    previous_condition: str
    new_condition: str
    previous_emotion: str
    new_emotion: str
    direction: str
    reason: str
    character_dialogue: str
    learning_explanation: str
    visual_cue: str


@dataclass
class MasteryResult:
    level_id: str
    level_number: int
    passed: bool
    overall_score: int
    target_score: int
    dimension_scores: DimensionScores
    decision_outcome: DecisionOutcome
    character_transition: CharacterTransition
    failure_reasons: list[str]
    success_summary: str
    remediation_guidance: str | None
    next_level_unlocked: bool


@dataclass
class AdaptiveRecommendation:
    recommended_level_number: int
    learning_gap_identified: str | None
    pedagogical_rationale: str
    suggested_practice_type: str
    challenge_adjustment: str


# ─────────────────────────────────────────────────────────────────────────────
# 1. Financial Simulation Engine
# ─────────────────────────────────────────────────────────────────────────────

def _clamp_int(val: Any) -> int:
    """Force any allocation value to a non-negative integer."""
    return max(0, int(val or 0))


def simulate_option_selections(
    level: LevelDefinition,
    selected_option_ids: list[str],
    existing_reserve_lkr: int = 0,
    decision_id: str = "dec_server",
) -> tuple[FinancialState, DecisionOutcome]:
    all_options: list[DecisionOption] = list(level.options)
    selected = [o for o in all_options if o.id in selected_option_ids]

    starting = level.starting_budget_lkr
    total_spent = sum(o.cost_lkr for o in selected)
    remaining = starting - total_spent
    feasible = remaining >= 0
    deficit = max(0, -remaining)

    essential_all = [o for o in all_options if o.is_essential]
    covered_ess = [o for o in selected if o.is_essential]
    missed_ess = [o for o in essential_all if o.id not in selected_option_ids]
    ess_covered = len(missed_ess) == 0

    disc_spent = sum(o.cost_lkr for o in selected if not o.is_essential)
    reserve = max(0, remaining) + existing_reserve_lkr
    alloc_cats: dict[str, int] = {}
    for o in selected:
        alloc_cats[o.category] = alloc_cats.get(o.category, 0) + o.cost_lkr

    if not feasible:
        summary = (
            f"Overspent by Rs.\u202f{deficit:,}. "
            f"Committed Rs.\u202f{total_spent:,} with only Rs.\u202f{starting:,} available."
        )
    elif not ess_covered:
        names = ", ".join(m.title for m in missed_ess)
        summary = f"Budget balanced but essential care missing: {names}."
    else:
        cov_sum = sum(c.cost_lkr for c in covered_ess)
        summary = (
            f"Successfully funded essential care (Rs.\u202f{cov_sum:,}) "
            f"and preserved Rs.\u202f{reserve:,} in safety reserves."
        )

    fs = FinancialState(
        starting_budget_lkr=starting,
        total_spent_lkr=total_spent,
        remaining_cash_lkr=remaining,
        emergency_reserve_lkr=reserve,
        allocated_categories=alloc_cats,
        unmet_essentials=[m.title for m in missed_ess],
        is_budget_feasible=feasible,
        budget_deficit_lkr=deficit,
    )
    out = DecisionOutcome(
        decision_id=decision_id,
        total_cost_lkr=total_spent,
        essential_needs_covered=ess_covered,
        covered_essential_names=[c.title for c in covered_ess],
        missed_essential_names=[m.title for m in missed_ess],
        discretionary_spent_lkr=disc_spent,
        reserve_preserved_lkr=reserve,
        balance_remaining_lkr=max(0, remaining),
        is_feasible=feasible,
        financial_impact_summary=summary,
    )
    return fs, out


def simulate_category_allocations(
    level: LevelDefinition,
    allocations: dict[str, int],
    existing_reserve_lkr: int = 0,
    decision_id: str = "dec_alloc_server",
) -> tuple[FinancialState, DecisionOutcome]:
    cats: list[AllocationCategory] = list(level.allocation_categories)
    starting = level.starting_budget_lkr

    total_spent = 0
    disc_spent = 0
    covered_ess: list[str] = []
    missed_ess: list[str] = []
    clean: dict[str, int] = {}

    for cat in cats:
        allocated = _clamp_int(allocations.get(cat.id, 0))
        clean[cat.id] = allocated
        total_spent += allocated
        if cat.is_essential:
            if allocated >= cat.min_recommended_lkr:
                covered_ess.append(cat.name)
            else:
                missed_ess.append(
                    f"{cat.name} (allocated Rs.\u202f{allocated:,} vs min Rs.\u202f{cat.min_recommended_lkr:,})"
                )
        else:
            disc_spent += allocated

    remaining = starting - total_spent
    feasible = remaining >= 0
    deficit = max(0, -remaining)
    ess_covered = len(missed_ess) == 0

    reserve_alloc = sum(
        clean[cat.id]
        for cat in cats
        if cat.category in ("emergency_reserve", "emergency_savings", "savings", "savings_goal")
        or "reserve" in cat.id.lower()
        or "saving" in cat.id.lower()
        or cat.id in ("emergency_reserve", "cat_emergency_reserve", "cat_rec_reserve", "cap_permanent_reserve")
    )
    total_reserve = reserve_alloc + existing_reserve_lkr + max(0, remaining)

    if not feasible:
        summary = (
            f"Allocations exceed budget by Rs.\u202f{deficit:,}. "
            f"Planned Rs.\u202f{total_spent:,} against Rs.\u202f{starting:,}."
        )
    elif not ess_covered:
        summary = f"Funding fell short for critical categories: {'; '.join(missed_ess)}."
    else:
        summary = (
            f"Balanced plan! All required care categories funded with "
            f"Rs.\u202f{total_reserve:,} in reserve buffer."
        )

    fs = FinancialState(
        starting_budget_lkr=starting,
        total_spent_lkr=total_spent,
        remaining_cash_lkr=remaining,
        emergency_reserve_lkr=total_reserve,
        allocated_categories=clean,
        unmet_essentials=missed_ess,
        is_budget_feasible=feasible,
        budget_deficit_lkr=deficit,
    )
    out = DecisionOutcome(
        decision_id=decision_id,
        total_cost_lkr=total_spent,
        essential_needs_covered=ess_covered,
        covered_essential_names=covered_ess,
        missed_essential_names=missed_ess,
        discretionary_spent_lkr=disc_spent,
        reserve_preserved_lkr=total_reserve,
        balance_remaining_lkr=max(0, remaining),
        is_feasible=feasible,
        financial_impact_summary=summary,
    )
    return fs, out


def simulate_multi_period_savings(
    level: LevelDefinition,
    weekly_decisions: list[dict],  # {period, saved_amount_lkr, resisted_temptation}
    decision_id: str = "dec_saving_server",
) -> tuple[FinancialState, DecisionOutcome]:
    config = level.multi_period_config
    if not config:
        raise ValueError("Level definition missing multi_period_config")

    period_map = {p["period"]: p for p in config["periods"]}
    submitted_periods = [int(wd.get("period", 0)) for wd in weekly_decisions]
    if (
        len(submitted_periods) != len(period_map)
        or set(submitted_periods) != set(period_map)
    ):
        raise ValueError("Weekly decisions must include each configured period exactly once.")

    goal_lkr: int = config["target_goal_lkr"]

    total_saved = 0
    total_income = 0
    total_disc = 0
    all_ess_covered = True

    for wd in weekly_decisions:
        period_num = int(wd.get("period", 0))
        pc = period_map.get(period_num)
        if not pc:
            continue

        total_income += pc["allowance_lkr"]
        mandatory = pc["mandatory_cost_lkr"]
        temptation = 0 if wd.get("resisted_temptation", False) else pc["temptation_cost_lkr"]
        total_disc += temptation

        max_save = max(0, pc["allowance_lkr"] - mandatory - temptation)
        actual_saved = min(max(_clamp_int(wd.get("saved_amount_lkr", 0)), 0), max_save)
        total_saved += actual_saved

        if pc["allowance_lkr"] < mandatory + temptation + actual_saved:
            all_ess_covered = False

    goal_reached = total_saved >= goal_lkr
    deficit = max(0, goal_lkr - total_saved)

    summary = (
        f"Goal achieved! Saved Rs.\u202f{total_saved:,} "
        f"(Target: Rs.\u202f{goal_lkr:,}). The puppy's treatment is fully funded!"
        if goal_reached
        else (
            f"Shortfall of Rs.\u202f{deficit:,}. Accumulated Rs.\u202f{total_saved:,} "
            f"vs required Rs.\u202f{goal_lkr:,} due to impulse spending."
        )
    )

    fs = FinancialState(
        starting_budget_lkr=total_income,
        total_spent_lkr=total_income - total_saved,
        remaining_cash_lkr=total_saved,
        emergency_reserve_lkr=total_saved,
        allocated_categories={"savings": total_saved, "discretionary": total_disc},
        unmet_essentials=[] if goal_reached else [f"Saving target shortfall: Rs.\u202f{deficit:,}"],
        is_budget_feasible=total_saved >= 0,
        budget_deficit_lkr=deficit,
    )
    out = DecisionOutcome(
        decision_id=decision_id,
        total_cost_lkr=total_income - total_saved,
        essential_needs_covered=goal_reached and all_ess_covered,
        covered_essential_names=["Specialized Splint Treatment"] if goal_reached else [],
        missed_essential_names=[] if goal_reached else ["Specialized Splint Treatment"],
        discretionary_spent_lkr=total_disc,
        reserve_preserved_lkr=total_saved,
        balance_remaining_lkr=total_saved,
        is_feasible=True,
        financial_impact_summary=summary,
    )
    return fs, out


# ─────────────────────────────────────────────────────────────────────────────
# 2. Competency Evaluation Engine
# ─────────────────────────────────────────────────────────────────────────────

def evaluate_competencies(
    level: LevelDefinition,
    fs: FinancialState,
    outcome: DecisionOutcome,
    selected_rationale_id: str | None = None,
) -> CompetencyEvaluation:
    starting = max(1, fs.starting_budget_lkr)
    reserve_ratio = fs.emergency_reserve_lkr / starting
    disc_ratio = outcome.discretionary_spent_lkr / starting

    # 1. Budgeting Skill
    budgeting = 80
    if not fs.is_budget_feasible:
        budgeting = max(15, 60 - min(45, int((fs.budget_deficit_lkr / starting) * 100)))
    else:
        budgeting += 10
    if outcome.essential_needs_covered:
        budgeting += 10
    else:
        budgeting -= 30
    budgeting = min(100, max(10, budgeting))

    # 2. Spending Discipline
    discipline = 85
    if disc_ratio > 0.4 and not outcome.essential_needs_covered:
        discipline -= 45
    elif disc_ratio > 0.3:
        discipline -= 15
    if outcome.discretionary_spent_lkr == 0 and outcome.essential_needs_covered:
        discipline += 15
    discipline = min(100, max(10, discipline))

    # 3. Saving Behavior
    saving = 70
    min_reserve_req = level.pass_criteria.min_reserve_preserved_lkr or 0
    if reserve_ratio >= 0.2 or (min_reserve_req > 0 and fs.emergency_reserve_lkr >= min_reserve_req):
        saving += 25
    elif reserve_ratio >= 0.1 or (min_reserve_req > 0 and fs.emergency_reserve_lkr >= int(min_reserve_req * 0.6)):
        saving += 10
    else:
        saving -= 25
    saving = min(100, max(10, saving))

    # 4. Investment Awareness
    investment = 75
    if selected_rationale_id and level.tradeoff_rationales:
        rationale = next(
            (r for r in level.tradeoff_rationales if r.id == selected_rationale_id),
            None,
        )
        if rationale and rationale.is_sound:
            investment += 20
        elif rationale:
            investment -= 30
    else:
        if outcome.essential_needs_covered and fs.is_budget_feasible:
            investment += 15
    investment = min(100, max(10, investment))

    # 5. Goal Achievement
    if outcome.essential_needs_covered and fs.is_budget_feasible:
        goal = 95
    elif fs.is_budget_feasible:
        goal = 45
    else:
        goal = 30

    # Secondary metrics
    prioritization = 90 if (outcome.essential_needs_covered and disc_ratio <= 0.25) else (70 if outcome.essential_needs_covered else 35)
    emergency_prep = min(100, int(reserve_ratio * 300))
    if min_reserve_req > 0 and fs.emergency_reserve_lkr >= min_reserve_req:
        emergency_prep = max(emergency_prep, 85)
    consistency = 85 if outcome.is_feasible else 40
    risk_awareness = 90 if (reserve_ratio >= 0.15 or (min_reserve_req > 0 and fs.emergency_reserve_lkr >= min_reserve_req)) else 50
    tradeoff_reasoning = (
        (90 if investment >= 80 else 45) if selected_rationale_id
        else (85 if outcome.essential_needs_covered else 45)
    )

    target_dim = level.target_competency
    dim_map = {
        "budgetingSkill": budgeting,
        "spendingDiscipline": discipline,
        "savingBehavior": saving,
        "investmentAwareness": investment,
        "goalAchievement": goal,
    }
    target_score = dim_map.get(target_dim, goal)
    overall = int(
        budgeting * 0.25
        + discipline * 0.20
        + saving * 0.20
        + investment * 0.15
        + goal * 0.20
    )

    dims = DimensionScores(
        budgeting_skill=budgeting,
        spending_discipline=discipline,
        saving_behavior=saving,
        investment_awareness=investment,
        goal_achievement=goal,
    )
    secs = SecondaryScores(
        prioritization=prioritization,
        emergency_preparedness=emergency_prep,
        consistency=consistency,
        risk_awareness=risk_awareness,
        tradeoff_reasoning=tradeoff_reasoning,
    )
    evidence = {
        "spent_lkr": fs.total_spent_lkr,
        "starting_lkr": starting,
        "reserve_lkr": fs.emergency_reserve_lkr,
        "disc_ratio_pct": round(disc_ratio * 100, 1),
        "reserve_ratio_pct": round(reserve_ratio * 100, 1),
    }
    return CompetencyEvaluation(
        dimension_scores=dims,
        secondary_scores=secs,
        target_score=target_score,
        overall_score=overall,
        detailed_evidence=evidence,
    )


# ─────────────────────────────────────────────────────────────────────────────
# 3. Emotional State Engine
# ─────────────────────────────────────────────────────────────────────────────

def _get_condition_description(condition: str, name: str) -> str:
    descriptions = {
        "NEEDS_CARE": f"{name} is injured with a hurt paw, resting cautiously and needing urgent care.",
        "WEAK_STABILIZED": f"{name} has a fresh bandage and food, resting safely and quietly building strength.",
        "RECEIVING_TREATMENT": f"{name} is undergoing treatment at the clinic with gentle vet support.",
        "RECOVERING": f"{name} is walking gingerly on all four paws, smiling with bright hopeful eyes!",
        "HEALTHY_ACTIVE": f"{name} is fully healed, jumping with joy in the sunny yard! Complete recovery achieved.",
        "SETBACK_WAITING": f"{name} is patiently waiting for financial planning to balance needed care.",
    }
    return descriptions.get(condition, f"{name} is in an unknown condition.")


def derive_character_state(
    previous: CharacterState,
    fs: FinancialState,
    outcome: DecisionOutcome,
    level: LevelDefinition,
) -> tuple[CharacterState, CharacterTransition]:
    is_passed = (
        outcome.is_feasible
        and outcome.essential_needs_covered
        and (
            outcome.reserve_preserved_lkr >= level.pass_criteria.min_reserve_preserved_lkr
            if level.pass_criteria.min_reserve_preserved_lkr
            else True
        )
    )

    new_condition = previous.physical_condition
    new_emotion = previous.emotional_state
    direction = "STABLE"
    reason = ""
    dialogue = ""
    explanation = ""
    visual_cue = ""
    vitality_delta = 0
    happiness_delta = 0

    if is_passed:
        direction = "IMPROVEMENT"
        ln = level.level_number
        if ln <= 2:
            new_condition, new_emotion = "WEAK_STABILIZED", "HOPEFUL"
            reason = "Essential immediate care and food were funded within budget."
            dialogue = "Woof! The soft bandage feels cool and soothing on my paw. Thank you for thinking of my real needs first!"
            explanation = "Because you prioritized essential needs over discretionary wants, the puppy is now safe and stabilized."
            visual_cue = "puppy-hopeful"
            vitality_delta, happiness_delta = 20, 25
        elif ln <= 4:
            new_condition, new_emotion = "RECEIVING_TREATMENT", "RELIEVED"
            reason = "Medication and clinic care were secured through patient savings and smart purchasing."
            dialogue = "The clinic doctor was kind! The medicine is working and I can gently put my foot on the ground."
            explanation = "Disciplined saving and choosing certified care gave the puppy professional treatment without debt."
            visual_cue = "puppy-treatment"
            vitality_delta, happiness_delta = 25, 25
        elif ln <= 7:
            new_condition, new_emotion = "RECOVERING", "CHEERFUL"
            reason = "Emergency reserve protected the puppy from sudden setbacks and recurring care is steady."
            dialogue = "I can walk to the bowl on my own today! My tail is wagging so fast because you planned ahead."
            explanation = "Holding an emergency reserve absorbed the sudden surprise expense smoothly, keeping recovery on schedule."
            visual_cue = "puppy-recovering"
            vitality_delta, happiness_delta = 20, 25
        else:
            new_condition, new_emotion = "HEALTHY_ACTIVE", "JOYFUL_HEALTHY"
            reason = "Complete financial plan executed: puppy is fully healed, playful, and has a lasting safety fund."
            dialogue = "Yip yip hurrah! Look at me run and jump in the sunny grass! We did it together with wise financial choices!"
            explanation = "Mastery demonstrated across budgeting, saving, and emergency resilience. The puppy is fully recovered and secure!"
            visual_cue = "puppy-rescued"
            vitality_delta, happiness_delta = 30, 30
    else:
        direction = "SETBACK"
        if not fs.is_budget_feasible:
            new_condition, new_emotion = "SETBACK_WAITING", "ANXIOUS"
            reason = f"Budget was overspent by Rs.\u202f{fs.budget_deficit_lkr:,}, halting treatment until funds are recalculated."
            dialogue = "Whimper... The clinic counter said the bill cannot be paid. We need to recount our money so I can get my medicine."
            explanation = "Overspending creates a deficit that freezes purchasing. We must adjust the plan to stay within our means."
            visual_cue = "puppy-waiting"
            vitality_delta, happiness_delta = -10, -20
        elif not outcome.essential_needs_covered:
            new_condition, new_emotion = "NEEDS_CARE", "WORRIED"
            reason = f"Critical essentials were omitted: {', '.join(outcome.missed_essential_names)}."
            dialogue = "My leg still throbs a bit because we bought accessories instead of the clean bandage and antiseptic."
            explanation = "Optional items cannot heal wounds. Prioritizing wants before essentials delays necessary medical care."
            visual_cue = "puppy-sad"
            vitality_delta, happiness_delta = -15, -20
        elif (
            level.pass_criteria.min_reserve_preserved_lkr
            and outcome.reserve_preserved_lkr < level.pass_criteria.min_reserve_preserved_lkr
        ):
            new_condition, new_emotion = "WEAK_STABILIZED", "VULNERABLE"
            reason = (
                f"Reserve buffer was exhausted "
                f"(Rs.\u202f{outcome.reserve_preserved_lkr:,} remaining vs "
                f"recommended Rs.\u202f{level.pass_criteria.min_reserve_preserved_lkr:,})."
            )
            dialogue = "I have my meal, but what if another surprise happens tomorrow? We have no coins left in the safety jar..."
            explanation = "Zero reserves leave the puppy exposed to sudden risks. Keeping a safety cushion builds true financial resilience."
            visual_cue = "puppy-worried"
            vitality_delta, happiness_delta = -5, -15
        else:
            new_condition, new_emotion = "SETBACK_WAITING", "WORRIED"
            reason = "Decision did not meet the target financial competency standard."
            dialogue = "I believe in you! Let us re-examine our choices and balance the budget carefully."
            explanation = "Financial mistakes happen. Analyze the feedback, adjust your allocations, and try again."
            visual_cue = "puppy-waiting"
            vitality_delta, happiness_delta = -5, -10

    new_vitality = min(100, max(15, previous.vitality_score + vitality_delta))
    new_happiness = min(100, max(15, previous.happiness_score + happiness_delta))
    new_desc = _get_condition_description(new_condition, previous.name)

    new_state = CharacterState(
        character_id=previous.character_id,
        name=previous.name,
        physical_condition=new_condition,
        emotional_state=new_emotion,
        condition_description=new_desc,
        vitality_score=new_vitality,
        happiness_score=new_happiness,
        active_dialogue=dialogue,
    )
    transition = CharacterTransition(
        previous_condition=previous.physical_condition,
        new_condition=new_condition,
        previous_emotion=previous.emotional_state,
        new_emotion=new_emotion,
        direction=direction,
        reason=reason,
        character_dialogue=dialogue,
        learning_explanation=explanation,
        visual_cue=visual_cue,
    )
    return new_state, transition


# ─────────────────────────────────────────────────────────────────────────────
# 4. Level Mastery Engine
# ─────────────────────────────────────────────────────────────────────────────

def evaluate_mastery(
    level: LevelDefinition,
    fs: FinancialState,
    outcome: DecisionOutcome,
    comp_eval: CompetencyEvaluation,
    transition: CharacterTransition,
    selected_option_ids: list[str] | None = None,
    selected_rationale_id: str | None = None,
) -> MasteryResult:
    criteria = level.pass_criteria
    failures: list[str] = []
    selected = selected_option_ids or []

    # Gate 1: Budget feasibility
    if criteria.require_budget_feasibility and not fs.is_budget_feasible:
        failures.append(
            f"Budget deficit: You exceeded your available funds by "
            f"Rs.\u202f{fs.budget_deficit_lkr:,}. In real life, spending money you do not have causes debt."
        )

    # Gate 2: Must-include options
    if criteria.must_include_option_ids:
        missing = [rid for rid in criteria.must_include_option_ids if rid not in selected]
        if missing:
            titles = [
                o.title for o in level.options if o.id in missing
            ]
            failures.append(
                f"Vital care omitted: You did not fund "
                f"{', '.join(f'\"{t}\"' for t in titles) or 'essential supplies'}. "
                f"Non-negotiable needs must always be satisfied first."
            )

    # Gate 3: Disallowed options
    if criteria.disallowed_option_ids:
        forbidden = [rid for rid in criteria.disallowed_option_ids if rid in selected]
        if forbidden:
            titles = [o.title for o in level.options if o.id in forbidden]
            failures.append(
                f"Unsafe or substandard choice: Selecting "
                f"{', '.join(f'\"{t}\"' for t in titles)} "
                f"risks the puppy's health or wastes funds without medical benefits."
            )

    # Gate 4: Reserve
    if (
        criteria.min_reserve_preserved_lkr
        and outcome.reserve_preserved_lkr < criteria.min_reserve_preserved_lkr
    ):
        failures.append(
            f"Safety buffer too low: You preserved Rs.\u202f{outcome.reserve_preserved_lkr:,}, "
            f"but a minimum reserve of Rs.\u202f{criteria.min_reserve_preserved_lkr:,} was required."
        )

    # Gate 5: Rationale
    if criteria.required_rationale_id and selected_rationale_id != criteria.required_rationale_id:
        chosen = next(
            (r for r in level.tradeoff_rationales if r.id == selected_rationale_id),
            None,
        )
        failures.append(
            f"Financial reasoning gap: {chosen.feedback if chosen else 'Your justification did not prioritize sustainable recovery.'}"
        )

    # Gate 6: Target competency score
    target_score = comp_eval.target_score
    if target_score < criteria.min_competency_score:
        failures.append(
            f"Target competency below threshold: Scored {target_score} in "
            f"{level.target_competency} (minimum required: {criteria.min_competency_score})."
        )

    passed = len(failures) == 0
    scaffolding = level.remediation_scaffolding
    remediation = None if passed else (
        f"Learning Hint: {scaffolding.rule_explanation}\n\n"
        f"Reflection Question: {scaffolding.guiding_questions[0] if scaffolding.guiding_questions else 'Which item is genuinely indispensable right now?'}\n\n"
        f"Suggested Next Attempt Focus: {scaffolding.suggested_focus}"
    )
    success_summary = (
        f"Outstanding work! You demonstrated solid financial stewardship. "
        f"You balanced the Rs.\u202f{level.starting_budget_lkr:,} budget, "
        f"satisfied every essential need, and earned passage to the next challenge!"
        if passed else ""
    )

    return MasteryResult(
        level_id=level.id,
        level_number=level.level_number,
        passed=passed,
        overall_score=comp_eval.overall_score,
        target_score=target_score,
        dimension_scores=comp_eval.dimension_scores,
        decision_outcome=outcome,
        character_transition=transition,
        failure_reasons=failures,
        success_summary=success_summary,
        remediation_guidance=remediation,
        next_level_unlocked=passed,
    )


# ─────────────────────────────────────────────────────────────────────────────
# 5. Adaptive Learning Engine
# ─────────────────────────────────────────────────────────────────────────────

def derive_adaptive_recommendation(
    current_level_number: int,
    consecutive_fails: int,
    budgeting_score: int,
    discipline_score: int,
    saving_score: int,
    mastery_level: str,
    mission_id: str,
) -> AdaptiveRecommendation:
    adjustment = "SCAFFOLDED" if consecutive_fails >= 2 else "STANDARD"

    if discipline_score < 60:
        return AdaptiveRecommendation(
            recommended_level_number=current_level_number,
            learning_gap_identified="Temptation towards non-essential discretionary items before core medical care.",
            pedagogical_rationale="Your spending discipline score is developing. Before making any allocation, mentally separate indispensable needs from nice-to-have extras.",
            suggested_practice_type="Needs-vs-Wants Scaffolding",
            challenge_adjustment=adjustment,
        )
    if saving_score < 65:
        return AdaptiveRecommendation(
            recommended_level_number=current_level_number,
            learning_gap_identified="Depleting emergency reserves and spending all available funds.",
            pedagogical_rationale="Your reserve margin has been low. Real financial resilience requires keeping at least 15-20% of your funds untouched for emergencies.",
            suggested_practice_type="Safety Buffer Planning",
            challenge_adjustment=adjustment,
        )
    if budgeting_score < 65:
        return AdaptiveRecommendation(
            recommended_level_number=current_level_number,
            learning_gap_identified="Over-allocating funds beyond total available virtual money.",
            pedagogical_rationale="Always monitor your live remaining balance bar before confirming decisions. Overspending locks you out of passing.",
            suggested_practice_type="Strict Ledger Tracking",
            challenge_adjustment="SCAFFOLDED",
        )
    if mastery_level in ("Advanced", "Proficient"):
        return AdaptiveRecommendation(
            recommended_level_number=current_level_number,
            learning_gap_identified=None,
            pedagogical_rationale="You are demonstrating consistent financial maturity across budgeting, saving, and trade-off analysis. Ready for higher-order financial challenges!",
            suggested_practice_type="Multi-variable Optimization",
            challenge_adjustment="EXTENSION",
        )
    return AdaptiveRecommendation(
        recommended_level_number=current_level_number,
        learning_gap_identified=None,
        pedagogical_rationale="Continue following the sequential levels to build financial mastery through caring for the puppy.",
        suggested_practice_type="Standard Mission Progression",
        challenge_adjustment=adjustment,
    )


# ─────────────────────────────────────────────────────────────────────────────
# 6. Full CDEMF Pipeline Dispatcher
# ─────────────────────────────────────────────────────────────────────────────

def run_cdemf_pipeline(
    level: LevelDefinition,
    interaction_type: str,
    selected_option_ids: list[str],
    allocations: dict[str, int],
    selected_rationale_id: str | None,
    weekly_decisions: list[dict],
    previous_char_state: CharacterState,
    decision_id: str,
    current_level_number: int,
    consecutive_fails: int,
    budgeting_profile: int,
    discipline_profile: int,
    saving_profile: int,
    mastery_level: str,
    mission_id: str,
) -> tuple[FinancialState, DecisionOutcome, CompetencyEvaluation, CharacterState, CharacterTransition, MasteryResult, AdaptiveRecommendation]:
    """
    Execute the complete CDEMF processing pipeline server-side:
      Financial Decision
      → Server-Side Financial Simulation
      → Competency Evaluation
      → Emotional Character State Transition
      → Level Mastery Evaluation
      → Adaptive Learning Recommendation

    Returns all intermediate and final results for MongoDB persistence.
    """
    # Step 1: Financial Simulation
    if interaction_type in ("needs_wants", "value_comparison", "emergency_response"):
        fs, outcome = simulate_option_selections(level, selected_option_ids, level.existing_reserve_lkr, decision_id)
    elif interaction_type in ("budget_allocator", "recurring_budget"):
        fs, outcome = simulate_category_allocations(level, allocations, level.existing_reserve_lkr, decision_id)
    elif interaction_type == "multi_period_saving":
        fs, outcome = simulate_multi_period_savings(level, weekly_decisions, decision_id)
    elif interaction_type == "tradeoff_justification":
        fs, outcome = simulate_option_selections(level, selected_option_ids, level.existing_reserve_lkr, decision_id)
    elif interaction_type == "capstone_challenge":
        # Capstone uses allocation categories if available, else options
        if level.allocation_categories:
            fs, outcome = simulate_category_allocations(level, allocations, level.existing_reserve_lkr, decision_id)
        else:
            fs, outcome = simulate_option_selections(level, selected_option_ids, level.existing_reserve_lkr, decision_id)
    else:
        raise ValueError(f"Unknown interaction_type: {interaction_type}")

    # Step 2: Competency Evaluation
    comp_eval = evaluate_competencies(level, fs, outcome, selected_rationale_id)

    # Step 3: Emotional State Transition
    new_char_state, transition = derive_character_state(previous_char_state, fs, outcome, level)

    # Step 4: Level Mastery Evaluation
    mastery = evaluate_mastery(
        level, fs, outcome, comp_eval, transition,
        selected_option_ids, selected_rationale_id,
    )

    # Step 5: Adaptive Recommendation
    recommendation = derive_adaptive_recommendation(
        current_level_number=current_level_number,
        consecutive_fails=consecutive_fails,
        budgeting_score=budgeting_profile,
        discipline_score=discipline_profile,
        saving_score=saving_profile,
        mastery_level=mastery_level,
        mission_id=mission_id,
    )

    return fs, outcome, comp_eval, new_char_state, transition, mastery, recommendation
