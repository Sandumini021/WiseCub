from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.modules.cub_intent.model import predict_intent

router = APIRouter()


class IntentIn(BaseModel):
    text: str = Field(min_length=1, max_length=500)
    role: str = Field(default="student", max_length=24)
    path: str = Field(default="", max_length=120)


@router.post("/api/cub/intent")
def cub_intent(payload: IntentIn) -> dict:
    return predict_intent(payload.text, payload.role, payload.path)
