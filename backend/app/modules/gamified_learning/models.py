"""
Pydantic request / response models for the gamified-learning module.
All financial amounts are in integer LKR to avoid floating-point drift.
Schema version is encoded so ML pipelines can detect breaking changes.
"""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, model_validator

# ── Shared ────────────────────────────────────────────────────────────────────

SCHEMA_VERSION = "1.0.0-cdemf"

_VALID_COMPETENCY_DIMS = {
    "budgetingSkill",
    "spendingDiscipline",
    "savingBehavior",
    "investmentAwareness",
    "goalAchievement",
}

_VALID_INTERACTION_TYPES = {
    "needs_wants",
    "budget_allocator",
    "multi_period_saving",
    "value_comparison",
    "emergency_response",
    "recurring_budget",
    "tradeoff_justification",
    "capstone_challenge",
}


# ── Inbound: start / resume mission ──────────────────────────────────────────

class StartMissionIn(BaseModel):
    mission_id: str = Field(min_length=1, max_length=80)


# ── Inbound: start a level ────────────────────────────────────────────────────

class StartLevelIn(BaseModel):
    mission_id: str = Field(min_length=1, max_length=80)
    level_number: int = Field(ge=1, le=20)


# ── Inbound: submit a financial decision ─────────────────────────────────────

class MultiPeriodWeekDecision(BaseModel):
    period: int = Field(ge=1, le=52)
    saved_amount_lkr: int = Field(ge=0)
    resisted_temptation: bool = False


class SubmitDecisionIn(BaseModel):
    mission_id: str = Field(min_length=1, max_length=80)
    level_id: str = Field(min_length=1, max_length=120)
    level_number: int = Field(ge=1, le=20)
    session_id: str = Field(min_length=1, max_length=120)
    interaction_type: str = Field(min_length=1, max_length=60)

    # Selection-based (needs_wants, value_comparison, emergency_response,
    # tradeoff_justification, capstone_challenge with options)
    selected_option_ids: list[str] = Field(default_factory=list, max_length=30)

    # Allocation-based (budget_allocator, recurring_budget, capstone)
    allocations: dict[str, int] = Field(default_factory=dict)

    # Rationale choice (tradeoff_justification)
    selected_rationale_id: str | None = Field(default=None, max_length=80)

    # Multi-period (multi_period_saving)
    weekly_decisions: list[MultiPeriodWeekDecision] = Field(default_factory=list)

    @model_validator(mode="after")
    def _validate_interaction(self) -> "SubmitDecisionIn":
        if self.interaction_type not in _VALID_INTERACTION_TYPES:
            raise ValueError(f"Unknown interaction_type: {self.interaction_type}")
        # Validate amounts are non-negative
        for key, val in self.allocations.items():
            if not isinstance(val, int) or val < 0:
                raise ValueError(
                    f"Allocation '{key}' must be a non-negative integer."
                )
        return self


# ── Outbound: mission catalog summary ────────────────────────────────────────

class MissionSummaryOut(BaseModel):
    id: str
    title: str
    character_name: str
    primary_competency: str
    total_levels: int
    theme_color: str
    description: str


class MissionCatalogOut(BaseModel):
    missions: list[MissionSummaryOut]


# ── Outbound: mission progress ────────────────────────────────────────────────

class CharacterStateOut(BaseModel):
    character_id: str
    name: str
    physical_condition: str
    emotional_state: str
    condition_description: str
    vitality_score: int
    happiness_score: int
    active_dialogue: str
    food_supply: int | None = None
    savings_reserve: int | None = None
    shelter_readiness: int | None = None
    winter_preparedness: int | None = None
    emotional_wellbeing: int | None = None
    budget_health: int | None = None
    fair_readiness: int | None = None
    charity_goal_progress: int | None = None
    vendor_relationships: int | None = None
    customer_satisfaction: int | None = None
    financial_risk_exposure: int | None = None


class MissionProgressOut(BaseModel):
    mission_id: str
    unlocked_level_number: int
    completed_level_numbers: list[int]
    highest_completed_level_number: int
    character_state: CharacterStateOut
    last_attempt_at_iso: str
    is_mission_completed: bool
    earned_coins: int
    attempt_counts_by_level: dict[str, int]  # level_number str → attempt count


# ── Outbound: level start acknowledgement ────────────────────────────────────

class LevelStartOut(BaseModel):
    ok: bool
    mission_id: str
    level_id: str
    level_number: int
    is_retry: bool
    attempt_number: int


# ── Outbound: decision evaluation result (the CDEMF pipeline output) ─────────

class DecisionOutcomeOut(BaseModel):
    total_cost_lkr: int
    essential_needs_covered: bool
    covered_essential_names: list[str]
    missed_essential_names: list[str]
    discretionary_spent_lkr: int
    reserve_preserved_lkr: int
    balance_remaining_lkr: int
    is_feasible: bool
    financial_impact_summary: str


class DimensionScoresOut(BaseModel):
    budgeting_skill: int
    spending_discipline: int
    saving_behavior: int
    investment_awareness: int
    goal_achievement: int


class SecondaryScoresOut(BaseModel):
    prioritization: int
    emergency_preparedness: int
    consistency: int
    risk_awareness: int
    tradeoff_reasoning: int


class CharacterTransitionOut(BaseModel):
    previous_condition: str
    new_condition: str
    previous_emotion: str
    new_emotion: str
    direction: str
    reason: str
    character_dialogue: str
    learning_explanation: str
    visual_cue: str


class AdaptiveRecommendationOut(BaseModel):
    recommended_level_number: int
    learning_gap_identified: str | None
    pedagogical_rationale: str
    suggested_practice_type: str
    challenge_adjustment: str


class EvaluationResultOut(BaseModel):
    """Full CDEMF pipeline response — mirrors what was persisted to MongoDB."""
    mission_id: str
    level_id: str
    level_number: int
    attempt_number: int
    passed: bool
    overall_score: int
    target_score: int
    dimension_scores: DimensionScoresOut
    secondary_scores: SecondaryScoresOut
    decision_outcome: DecisionOutcomeOut
    character_state: CharacterStateOut
    character_transition: CharacterTransitionOut
    failure_reasons: list[str]
    success_summary: str
    remediation_guidance: str | None
    next_level_unlocked: bool
    adaptive_recommendation: AdaptiveRecommendationOut
    is_rules_based_prototype: bool  # False when future ML model is plugged in
    schema_version: str


# ── Outbound: competency history ──────────────────────────────────────────────

class CompetencyHistoryEntryOut(BaseModel):
    level_id: str
    level_number: int
    attempt_number: int
    timestamp: str
    passed: bool
    dimension_scores: DimensionScoresOut
    overall_score: int


class CompetencyHistoryOut(BaseModel):
    mission_id: str
    entries: list[CompetencyHistoryEntryOut]
    current_profile: dict[str, Any]


# ── Outbound: character state history ─────────────────────────────────────────

class CharacterStateHistoryEntryOut(BaseModel):
    timestamp: str
    level_number: int
    attempt_number: int
    physical_condition: str
    emotional_state: str
    vitality_score: int
    happiness_score: int
    transition_direction: str
    transition_reason: str


class CharacterStateHistoryOut(BaseModel):
    mission_id: str
    character_name: str
    history: list[CharacterStateHistoryEntryOut]


# ── Outbound: My Money Journey & Aggregated Analytics ────────────────────────

class JourneyOverviewStatsOut(BaseModel):
    total_missions_completed: int
    total_missions_count: int = 3
    total_levels_completed: int
    total_levels_count: int = 20
    overall_competency_score: int | None = None
    earned_coins: int = 0
    mastery_tier: str = "Explorer"
    active_mission_id: str = "mission_rescue_puppy"
    next_recommended_level: int = 1


class JourneyMissionSummaryOut(BaseModel):
    mission_id: str
    title: str
    character_name: str
    character_role: str
    focus_skill: str
    theme_color: str
    total_levels: int
    completed_levels_count: int
    completed_level_numbers: list[int]
    unlocked_level_number: int
    progress_percent: int
    is_completed: bool
    earned_coins: int
    competency_status: str
    character_state: CharacterStateOut


class SkillMetricOut(BaseModel):
    skill_key: str
    name: str
    category: str
    score: int | None = None
    evidence_count: int = 0
    has_sufficient_evidence: bool = False
    status: str
    is_strength: bool = False
    needs_practice: bool = False
    description: str


class AchievementBadgeOut(BaseModel):
    id: str
    title: str
    description: str
    icon: str
    unlocked: bool
    unlocked_at: str | None = None
    progress_current: int
    progress_target: int
    unlock_condition: str


class EmotionalImpactRecordOut(BaseModel):
    mission_id: str
    mission_title: str
    character_name: str
    level_number: int
    attempt_number: int
    previous_condition: str
    new_condition: str
    previous_emotion: str
    new_emotion: str
    direction: str
    reason: str
    character_dialogue: str
    learning_explanation: str
    visual_cue: str
    recorded_at: str
    improved_after_retry: bool = False


class LearningTipOut(BaseModel):
    title: str
    description: str
    category: str
    action_mission_id: str | None = None
    action_level_number: int | None = None
    action_label: str = "Start Level"


class JourneyOverviewOut(BaseModel):
    student_name: str
    child_id: str
    overview: JourneyOverviewStatsOut
    missions: list[JourneyMissionSummaryOut]
    financial_skills_profile: list[SkillMetricOut]
    achievements: list[AchievementBadgeOut]
    emotional_impact_showcase: list[EmotionalImpactRecordOut]
    learning_tips: list[LearningTipOut]


class JourneyLevelDetailOut(BaseModel):
    level_number: int
    level_id: str
    title: str
    focus_dimension: str
    interaction_type: str
    status: str
    best_score: int | None = None
    attempts_count: int = 0


class JourneyMissionDetailOut(BaseModel):
    mission_id: str
    title: str
    character_name: str
    character_role: str
    focus_skill: str
    theme_color: str
    total_levels: int
    completed_levels_count: int
    progress_percent: int
    is_completed: bool
    levels: list[JourneyLevelDetailOut]
    recent_attempts: list[dict[str, Any]]
    character_state: CharacterStateOut
    character_history: list[CharacterStateHistoryEntryOut]

