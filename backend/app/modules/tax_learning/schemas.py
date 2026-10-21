from pydantic import BaseModel, Field


class CalculateIn(BaseModel):
    rule_id: str = Field(min_length=3, max_length=40)
    income: str = Field(min_length=1, max_length=24)
    income_kind: str = Field(default="employment", max_length=40)
    allow_expired: bool = False


class QuizAnswerIn(BaseModel):
    question_id: str = Field(min_length=1, max_length=24)
    choice: str | None = Field(default=None, max_length=8)
    amount: str | None = Field(default=None, max_length=24)
