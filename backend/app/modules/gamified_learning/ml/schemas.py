"""
Pydantic schemas and dataclasses for synthetic dataset records and feature models.
"""
from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field


ArchetypeType = Literal[
    "STRUGGLING_LEARNER",
    "IMPULSIVE_SPENDER",
    "CAUTIOUS_IMPROVER",
    "ADVANCED_ACHIEVER",
]

SupportNeedLabel = Literal[
    "NEEDS_FOUNDATION_SUPPORT",
    "READY_FOR_STANDARD",
    "READY_FOR_ADVANCED",
]


class SyntheticGameplayRecord(BaseModel):
    """Full schema for a single synthetic gameplay decision record (CSV & JSONL)."""
    # ── Identifiers ───────────────────────────────────────────────────────────
    record_id: str = Field(..., description="Unique record identifier e.g. SYNTH_REC_0001")
    synthetic_student_id: str = Field(..., description="Synthetic student identifier e.g. SYNTH_001")
    attempt_id: str = Field(..., description="Unique attempt ID")
    archetype: ArchetypeType = Field(..., description="Student behavioral archetype")
    step_index: int = Field(..., ge=0, description="0-indexed sequence step for this student")
    simulated_timestamp_iso: str = Field(..., description="Simulated chronological ISO-8601 timestamp")

    # ── Activity Context (Known Before Decision) ──────────────────────────────
    mission_id: str = Field(..., description="Target mission identifier")
    level_number: int = Field(..., ge=1, le=8, description="Level number")
    level_id: str = Field(..., description="Level identifier in catalog")
    interaction_type: str = Field(..., description="Interaction mechanic type")
    starting_budget_lkr: int = Field(..., ge=0, description="Available budget in LKR")
    attempt_number: int = Field(..., ge=1, description="Attempt number on this specific level")
    is_retry: bool = Field(..., description="True if attempt_number > 1")

    # ── Prior Historical Predictors (Strictly Lagged Before Activity) ─────────
    hist_completed_levels_count: int = Field(..., ge=0)
    hist_prior_attempts_count: int = Field(..., ge=0)
    hist_retry_rate: float = Field(..., ge=0.0, le=1.0)
    hist_remediation_count: int = Field(..., ge=0)
    hist_avg_budgeting_score: float = Field(..., ge=0.0, le=100.0)
    hist_avg_spending_score: float = Field(..., ge=0.0, le=100.0)
    hist_avg_saving_score: float = Field(..., ge=0.0, le=100.0)
    hist_avg_investment_score: float = Field(..., ge=0.0, le=100.0)
    hist_avg_planning_score: float = Field(..., ge=0.0, le=100.0)
    hist_avg_emergency_prep_score: float = Field(..., ge=0.0, le=100.0)
    hist_overall_score_avg: float = Field(..., ge=0.0, le=100.0)
    hist_consecutive_fails: int = Field(..., ge=0)
    hist_consecutive_passes: int = Field(..., ge=0)

    # ── Simulated Decision Inputs ─────────────────────────────────────────────
    decision_summary: str = Field(..., description="Summary of decision inputs made by student")
    allocated_amount_lkr: int = Field(..., ge=0)
    discretionary_spent_lkr: int = Field(..., ge=0)
    reserve_preserved_lkr: int = Field(..., ge=0)

    # ── CDEMF Evaluated Outcomes (Current Activity) ───────────────────────────
    is_budget_feasible: bool
    essential_needs_covered: bool
    score_budgeting: int = Field(..., ge=0, le=100)
    score_spending: int = Field(..., ge=0, le=100)
    score_saving: int = Field(..., ge=0, le=100)
    score_investment: int = Field(..., ge=0, le=100)
    score_goal: int = Field(..., ge=0, le=100)
    overall_score: int = Field(..., ge=0, le=100)
    passed: bool
    character_condition: str
    character_emotion: str
    transition_direction: str
    remediation_triggered: bool

    # ── Forward-Looking Target Label (For Next Activity Support) ─────────────
    next_activity_support_need: SupportNeedLabel
