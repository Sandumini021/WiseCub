import type { CubLang } from "./cubAssistantTypes";

export type SpeakResult = {
  ok: boolean;
  reason?: "unsupported" | "no-sinhala-voice";
};

function synthesis(): SpeechSynthesis | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }
  return window.speechSynthesis;
}

export function listVoices(): SpeechSynthesisVoice[] {
  const api = synthesis();
  return api ? api.getVoices() : [];
}

export function pickVoice(lang: CubLang, voices = listVoices()): SpeechSynthesisVoice | null {
  const want = lang === "si" ? "si" : "en";
  const exact = voices.find((voice) => voice.lang.toLowerCase().startsWith(want === "si" ? "si" : "en"));
  return exact ?? null;
}

export function canSpeakSinhala(voices = listVoices()) {
  return Boolean(pickVoice("si", voices));
}

export function stopCubSpeech() {
  synthesis()?.cancel();
}

export function speakCub(text: string, lang: CubLang, voices = listVoices()): SpeakResult {
  const api = synthesis();
  if (!api) {
    return { ok: false, reason: "unsupported" };
  }
  const ready = voices.length ? voices : api.getVoices();
  const voice = pickVoice(lang, ready);
  if (lang === "si" && !voice) {
    return { ok: false, reason: "no-sinhala-voice" };
  }
  api.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.lang = lang === "si" ? "si-LK" : "en-GB";
  if (voice) {
    utterance.voice = voice;
  }
  api.speak(utterance);
  return { ok: true };
}
