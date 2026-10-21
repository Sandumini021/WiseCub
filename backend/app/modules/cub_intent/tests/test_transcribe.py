from app.modules.cub_intent.transcribe import _parse_speech_body, transcribe_wav_bytes


def test_rejects_non_wav():
    result = transcribe_wav_bytes(b"not-audio", "en")
    assert result["error"] == "bad_audio"
    assert result["text"] == ""


def test_parses_chromium_speech_json():
    body = '{"result":[]}\n{"result":[{"alternative":[{"transcript":"open the market","confidence":0.9}],"final":true}]}'
    assert _parse_speech_body(body) == "open the market"
