from typing import Literal

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
    title: str = Field(min_length=1, max_length=160)
    summary: str = Field(min_length=1, max_length=400)
    immediate: str = Field(min_length=1, max_length=500)
    bullets: list[str] = Field(min_length=1, max_length=8)


class DecisionIn(CamelModel):
    option_id: OptionId


class ReasoningIn(CamelModel):
    option_id: OptionId
    reasoning: str = Field(min_length=20, max_length=400)
    option: OptionContext


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
    completed_level_ids: list[int]
    current_level_id: int
    sessions: dict[str, LevelSession]
    updated_at: str
    storage: Literal["prototype-file"] = "prototype-file"


class ReasoningOut(CamelModel):
    progress: ChoiceTownProgress
    analysis: AnalysisResult
    recommendations: list[AdaptiveRecommendation]
