from __future__ import annotations

import json
from typing import Any

import httpx

GOOGLE_LANG = {"en": "en-US", "si": "si-LK", "singlish": "en-US"}
SPEECH_URL = "https://www.google.com/speech-api/v2/recognize"
# Public Chromium Speech API key (same one browsers use for web speech).
CHROMIUM_SPEECH_KEY = "AIzaSyBOti4mM-6x9WDnZIjIeyEU21OpBXqWBgw"


def transcribe_wav_bytes(data: bytes, language: str = "en") -> dict[str, Any]:
    if len(data) < 44 or data[0:4] != b"RIFF" or data[8:12] != b"WAVE":
        return {"text": "", "error": "bad_audio", "language": language}
    sample_rate = int.from_bytes(data[24:28], "little") or 16000
    pcm = data[44:]
    if sample_rate not in {8000, 16000, 44100, 48000}:
        sample_rate = 16000
    if len(pcm) < 3200:
        return {"text": "", "error": "no_speech", "language": language}
    google_lang = GOOGLE_LANG.get(language, "en-US")
    text, error = _recognize_pcm(pcm, sample_rate, google_lang)
    if not text and google_lang != "en-US" and error in {None, "no_speech"}:
        text, error = _recognize_pcm(pcm, sample_rate, "en-US")
        if text:
            return {"text": text, "error": None, "language": "en"}
    return {"text": text or "", "error": error, "language": language}


def _recognize_pcm(pcm: bytes, sample_rate: int, google_lang: str) -> tuple[str, str | None]:
    try:
        response = httpx.post(
            SPEECH_URL,
            params={
                "client": "chromium",
                "lang": google_lang,
                "key": CHROMIUM_SPEECH_KEY,
                "output": "json",
                "maxresults": 1,
                "pfilter": 0,
            },
            headers={"Content-Type": f"audio/l16; rate={sample_rate}"},
            content=pcm,
            timeout=20,
        )
        response.raise_for_status()
    except httpx.HTTPError:
        return "", "network"
    transcript = _parse_speech_body(response.text)
    if not transcript:
        return "", "no_speech"
    return transcript, None


def _parse_speech_body(body: str) -> str:
    best = ""
    for line in body.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            payload = json.loads(line)
        except json.JSONDecodeError:
            continue
        for result in payload.get("result") or []:
            alternatives = result.get("alternative") or []
            if alternatives:
                text = str(alternatives[0].get("transcript") or "").strip()
                if text:
                    best = text
    return best
