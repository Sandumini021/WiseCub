from __future__ import annotations

from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

OptionId = Literal["A", "B", "C"]
DimensionId = Literal[
    "immediateNeeds",
    "savingsAwareness",
    "borrowingObligations",
    "futureConsequences",
    "comparingAlternatives",
    "explainingClearly",
]
RecommendationBasis = Literal["single-response", "pattern"]


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class OptionContext(CamelModel):
    title: str = Field(default="", max_length=160)
    summary: str = Field(default="", max_length=400)
    immediate: str = Field(default="", max_length=500)
    bullets: list[str] = Field(default_factory=list, max_length=8)


class MoneySnapshotOut(CamelModel):
    label: str
    savings: int
    debt: int
    state_label: str
    state: str
    note: str


class DecisionOptionOut(CamelModel):
    id: OptionId
    title: str
    short_label: str
    summary: str
    bullets: list[str]
    immediate: str
    future: str
    snapshot: MoneySnapshotOut


class ScenarioFactOut(CamelModel):
    label: str
    value: str


class ScenarioOut(CamelModel):
    level_id: int
    id: int | None = None
    title: str
    description: str
    preview: str
    cub_hint: str
    icon: str
    playable: bool = True
    situation: str
    facts: list[ScenarioFactOut]
    options: list[DecisionOptionOut]
    money_scale: int
    six_month_assumptions: list[str]
    wait_assumption: str | None = None
    active: bool = True

    def model_post_init(self, __context: Any) -> None:
        if self.id is None:
            self.id = self.level_id


class DecisionIn(CamelModel):
    option_id: OptionId


class ReasoningIn(CamelModel):
    option_id: OptionId
    reasoning: str = Field(min_length=20, max_length=400)
    option: OptionContext | None = None


class DimensionScore(CamelModel):
    id: DimensionId
    label: str
    score: int
    evidence: str


class AnalysisResult(CamelModel):
    option_id: OptionId
    reasoning_text: str
    dimensions: list[DimensionScore]
    highlights: list[str]
    gaps: list[str]
    method: Literal["rule-based"] = "rule-based"
    source: Literal["single-response"] = "single-response"


class AdaptiveRecommendation(CamelModel):
    id: str
    title: str
    reason: str
    suggested_level_id: int
    based_on: RecommendationBasis


class LevelSession(CamelModel):
    option_id: OptionId | None = None
    reasoning: str | None = None
    completed: bool | None = None
    analysis: AnalysisResult | None = None
    recommendations: list[AdaptiveRecommendation] | None = None


class ChoiceTownProgress(CamelModel):
    child_id: str | None = None
    completed_level_ids: list[int] = Field(default_factory=list)
    current_level_id: int = 1
    sessions: dict[str, LevelSession] = Field(default_factory=dict)
    updated_at: str
    storage: Literal["mongodb", "prototype-file"] = "mongodb"


class ReasoningOut(CamelModel):
    progress: ChoiceTownProgress
    analysis: AnalysisResult
    recommendations: list[AdaptiveRecommendation]


class ResetProgressOut(CamelModel):
    ok: bool = True
    progress: ChoiceTownProgress
    message: str = "Progress reset to Level 1."


class AttemptSummaryOut(CamelModel):
    attempt_id: str
    level_id: int
    selected_option_id: str | None = None
    started_at: str
    completed_at: str | None = None
    completion_status: str
    scores: dict[str, int] = Field(default_factory=dict)
    highlights: list[str] = Field(default_factory=list)


class AnalyticsOut(CamelModel):
    child_id: str
    child_name: str | None = None
    completed_levels_count: int
    completed_level_ids: list[int]
    current_level_id: int
    total_attempts: int
    average_dimension_scores: dict[str, float]
    persistent_strengths: list[str]
    persistent_learning_gaps: list[str]
    recent_attempts_summary: list[AttemptSummaryOut]
    disclaimer: str
