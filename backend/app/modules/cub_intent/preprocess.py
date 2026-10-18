from __future__ import annotations

import re
import unicodedata

PREFIX_RE = re.compile(
    r"^(please |can you |could you |i want to |i need to |help me |i would like to |"
    r"let's |show me how to |take me to |i want you to |would you |can we |"
    r"please help me |i need help to |i'd like to |would you please |"
    r"karunakara |mata |oya puluwanda |help karanna,?\s*|"
    r"කරුණාකර\s+|මට පුළුවන්ද\s+|මට අවශ්‍යයි\s+|මට\s+)+",
    re.IGNORECASE,
)
SUFFIX_RE = re.compile(
    r"\s+(please|for me|now|in wisecub|on this app|to get started|so i can learn|"
    r"and guide me|step by step|on this page|කරුණාකර|මට|දැන්|මේ යෙදුමේ)$",
    re.IGNORECASE,
)


def preprocess(text: str) -> str:
    cleaned = unicodedata.normalize("NFC", text or "")
    cleaned = cleaned.replace("\u200d", "")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    lowered = []
    for char in cleaned:
        if char.isascii():
            lowered.append(char.lower())
        else:
            lowered.append(char)
    return "".join(lowered)


def canonical_stem(text: str) -> str:
    stem = PREFIX_RE.sub("", preprocess(text))
    stem = SUFFIX_RE.sub("", stem)
    return stem.strip()


def quality_flags(text: str, language: str) -> list[str]:
    flags: list[str] = []
    if language == "en":
        if re.search(r"take me to (explain|ask|what is|help)", text, re.I):
            flags.append("unnatural_en_template")
        elif re.search(r"please please|would you please please", text, re.I):
            flags.append("unnatural_en_template")
        elif re.search(r"i want to please |i need to please |help me please ", text, re.I):
            flags.append("unnatural_en_template")
        elif re.search(r"i want to help me please|let's help me please|can we help me please", text, re.I):
            flags.append("unnatural_en_template")
    if language == "singlish" and re.search(r"mට", text):
        flags.append("mixed_script_mata")
    if language == "singlish" and re.match(r"(?i)please ", text):
        flags.append("english_wrapper_on_singlish")
    return flags
