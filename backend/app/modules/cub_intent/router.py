from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.modules.cub_intent.model import predict_intent
from app.modules.cub_intent.transcribe import transcribe_wav_bytes

router = APIRouter()


class IntentIn(BaseModel):
    text: str = Field(min_length=1, max_length=500)
    role: str = Field(default="student", max_length=24)
    path: str = Field(default="", max_length=120)


@router.post("/api/cub/intent")
def cub_intent(payload: IntentIn) -> dict:
    return predict_intent(payload.text, payload.role, payload.path)


@router.post("/api/cub/transcribe")
async def cub_transcribe(
    audio: UploadFile = File(...),
    language: str = Form(default="en"),
) -> dict:
    data = await audio.read()
    if len(data) > 6_000_000:
        raise HTTPException(status_code=413, detail="Audio clip is too long.")
    result = transcribe_wav_bytes(data, language if language in {"en", "si"} else "en")
    return {"text": result.get("text") or "", "language": result.get("language") or language, "error": result.get("error")}
