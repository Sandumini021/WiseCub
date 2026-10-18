import type { CubLang } from "./cubAssistantTypes";

const UI = {
  ask: { en: "Ask Cub", si: "Cubගෙන් අහන්න" },
  hide: { en: "Hide", si: "සඟවන්න" },
  send: { en: "Send", si: "යවන්න" },
  typeHere: { en: "Type here…", si: "මෙහෙ ලියන්න…" },
  you: { en: "You", si: "ඔයා" },
  cubVoice: { en: "Cub voice", si: "Cub හඬ" },
  replay: { en: "Replay", si: "නැවත අසන්න" },
  stop: { en: "Stop", si: "නවත්වන්න" },
  mic: { en: "Speak to Cub", si: "Cubට කතා කරන්න" },
  listening: {
    en: "Listening… speak in English, then pause. Cub will answer.",
    si: "අහනවා… සිංහලෙන් කතා කරලා ටිකක් නවත්තන්න. Cub උත්තර දෙනවා.",
  },
  heard: { en: "I heard", si: "ඇහුණේ" },
  stopListen: { en: "Stop listening", si: "අහන එක නවත්වන්න" },
  noMic: {
    en: "This browser cannot hear the mic. Type your message instead.",
    si: "මේ browser එකට මයික් එක ඇහෙන්නේ නැහැ. ලියලා යවන්න.",
  },
  micFail: { en: "Mic did not start. Type your message instead.", si: "මයික් එක පටන් ගත්තේ නැහැ. ලියලා යවන්න." },
  noSpeech: {
    en: "This browser cannot speak. You can still read Cub’s words.",
    si: "මේ browser එකට කතා කරන්න බැහැ. Cubගේ වචන කියවන්න පුළුවන්.",
  },
  noSinhalaVoice: {
    en: "Sinhala text is ready, but this device has no Sinhala voice. Read the words on screen.",
    si: "සිංහල අකුරු තියෙනවා, නමුත් මේ උපාංගයේ සිංහල හඬක් නැහැ. තිරයේ වචන කියවන්න.",
  },
  blurb: {
    en: "Talk or type. A small classroom classifier may guess the intent. It is not research-validated. Routes stay role-safe.",
    si: "කතා කරන්න හෝ ලියන්න. පන්ති classifier එකක් intent එක අනුමාන කරන්න පුළුවන්. පර්යේෂණයෙන් තහවුරු වූ එකක් නෙවෙයි. මාර්ග role අනුව ආරක්ෂිතයි.",
  },
  english: { en: "English", si: "English" },
  sinhala: { en: "සිංහල", si: "සිංහල" },
  yesLeave: { en: "yes", si: "ඔව්" },
} as const;

export function cubUi(lang: CubLang, key: keyof typeof UI) {
  return UI[key][lang];
}
