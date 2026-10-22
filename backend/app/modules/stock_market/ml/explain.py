from __future__ import annotations

COPY = {
    "upward": {
        "title": "Climbing lately",
        "kid": "This classroom chart has been moving up over the next-week window we practised. Up days in the past are not a promise of more up days.",
        "risk": "Prices can drop after a climb. On WiseCub you only use pretend rupees.",
    },
    "downward": {
        "title": "Sliding lately",
        "kid": "This classroom chart has been moving down in the practice window. A fall is a chance to pause, not a rule to tap Sell on your pretend bag.",
        "risk": "A drop can keep going or bounce. Nobody here can promise which. Virtual money only.",
    },
    "sideways": {
        "title": "Mostly sideways",
        "kid": "This classroom chart has been wobbling without a strong climb or fall. Sideways is a real market mood — it is not 'boring so buy'.",
        "risk": "Quiet charts can still jump. Practice waiting and reading, not chasing.",
    },
}


def explain(label: str) -> dict[str, str]:
    return COPY.get(label, COPY["sideways"])
