from __future__ import annotations

COPY = {
    "upward": {
        "title": "Climbing lately",
        "kid": "This index has been moving up over the next-week classroom window we practised. Up days in the past are not a promise of more up days.",
        "risk": "Prices can drop after a climb. On WiseCub you only use pretend rupees.",
    },
    "downward": {
        "title": "Sliding lately",
        "kid": "This index has been moving down in the classroom window. A fall is a chance to pause, not a rule to tap Sell on your practice bag.",
        "risk": "A drop can keep going or bounce. Nobody here can promise which. Virtual money only.",
    },
    "sideways": {
        "title": "Mostly sideways",
        "kid": "This index has been wobbling without a strong climb or fall. Sideways is a real market mood — it is not 'boring so buy'.",
        "risk": "Quiet charts can still jump. Practice waiting and reading, not chasing.",
    },
}


def explain(label: str) -> dict[str, str]:
    return COPY.get(label, COPY["sideways"])
