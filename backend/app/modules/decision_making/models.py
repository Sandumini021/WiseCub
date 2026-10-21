"""
models.py

Domain models and document schemas for the Decision-Making (Choice Town) module.
Handles BSON serialization and MongoDB document mapping for scenarios, learner progress,
and scenario attempts.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

OptionId = Literal["A", "B", "C"]
AttemptStatus = Literal["in_progress", "completed", "abandoned"]


def now_utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class CamelBaseModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class MoneySnapshotModel(CamelBaseModel):
    label: str
    savings: int
    debt: int
    state_label: str
    state: str
    note: str


class DecisionOptionModel(CamelBaseModel):
    id: OptionId
    title: str
    short_label: str
    summary: str
    bullets: list[str]
    immediate: str
    future: str
    snapshot: MoneySnapshotModel


class ScenarioFactModel(CamelBaseModel):
    label: str
    value: str


class ScenarioDocument(CamelBaseModel):
    level_id: int
    title: str
    description: str
    preview: str
    cub_hint: str
    icon: str
    playable: bool = True
    situation: str
    facts: list[ScenarioFactModel]
    options: list[DecisionOptionModel]
    money_scale: int
    six_month_assumptions: list[str]
    wait_assumption: str | None = None
    active: bool = True
    created_at: str = Field(default_factory=now_utc_iso)
    updated_at: str = Field(default_factory=now_utc_iso)
    schema_version: int = 1


class LevelSessionModel(CamelBaseModel):
    option_id: OptionId | None = None
    reasoning: str | None = None
    completed: bool | None = None
    analysis: dict[str, Any] | None = None
    recommendations: list[dict[str, Any]] | None = None


class ProgressDocument(CamelBaseModel):
    child_id: str
    completed_level_ids: list[int] = Field(default_factory=list)
    current_level_id: int = 1
    active_sessions: dict[str, LevelSessionModel] = Field(default_factory=dict)
    updated_at: str = Field(default_factory=now_utc_iso)
    schema_version: int = 1


class AttemptDocument(CamelBaseModel):
    attempt_id: str = Field(default_factory=lambda: str(uuid4()))
    child_id: str
    level_id: int
    selected_option_id: OptionId | None = None
    reasoning_text: str | None = None
    analysis: dict[str, Any] | None = None
    recommendations: list[dict[str, Any]] | None = None
    completion_status: AttemptStatus = "in_progress"
    started_at: str = Field(default_factory=now_utc_iso)
    reasoning_submitted_at: str | None = None
    completed_at: str | None = None
    created_at: str = Field(default_factory=now_utc_iso)
    updated_at: str = Field(default_factory=now_utc_iso)
