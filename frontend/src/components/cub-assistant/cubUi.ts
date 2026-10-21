import type { CubLang } from "./cubAssistantTypes";

type Triple = { en: string; si: string; sg: string };

const UI: Record<string, Triple> = {
  ask: { en: "Ask Cub", si: "Cubගෙන් අහන්න", sg: "Cubgen ahanne" },
  hide: { en: "Hide", si: "සඟවන්න", sg: "Sangawanna" },
  send: { en: "Send", si: "යවන්න", sg: "Yawanna" },
  typeHere: { en: "Type here…", si: "මෙහෙ ලියන්න…", sg: "Mehe liyanna…" },
  you: { en: "You", si: "ඔයා", sg: "Oya" },
  cubVoice: { en: "Cub voice", si: "Cub හඬ", sg: "Cub handa" },
  replay: { en: "Replay", si: "නැවත අසන්න", sg: "Nawatha asanna" },
  stop: { en: "Stop", si: "නවත්වන්න", sg: "Nawathwanna" },
  mic: { en: "Speak to Cub", si: "Cubට කතා කරන්න", sg: "Cubta katha karanna" },
  listening: {
    en: "Listening… speak, then tap Mic to stop.",
    si: "අහනවා… කතා කරලා ආයෙත් Mic එක තියන්න.",
    sg: "Ahanawa… katha karala ayeth Mic eka thiyanna.",
  },
  transcribing: { en: "Hearing that…", si: "අහනවා, ටිකක් ඉන්න…", sg: "Ahanawa, tikak inna…" },
  transcribeFail: {
    en: "I could not turn that into words. Tap Mic and try again, or type a short question like “open the market”.",
    si: "වචන බවට හරවන්න බැරි වුණා. ආයෙත් Mic එක තියන්න, නැත්නම් “වෙළෙඳපොළට යන්න” ලියන්න.",
    sg: "Wachana bawata harawanna baeri una. Ayeth Mic eka thiyanna, nathnam “wela'ndapolata yanna” liyanna.",
  },
  apiDown: {
    en: "Cub could not reach the hearing server. Type instead, or start the API on port 8000 and tap Mic again.",
    si: "Cubට හඬ සර්වර් එකට යන්න බැරි වුණා. ලියලා යවන්න, නැත්නම් API එක port 8000 එකේ අරලා ආයෙත් Mic එක තියන්න.",
    sg: "Cubta handa server ekata yanna baeri una. Liyala yawanna, nathnam API eka port 8000 eke arala ayeth Mic eka thiyanna.",
  },
  noSpeechHeard: {
    en: "I did not catch words. Tap Mic, speak closer, then tap Mic again.",
    si: "වචන ඇහුණේ නැහැ. Mic එක තියලා ළඟින් කතා කරලා ආයෙත් Mic එක තියන්න.",
    sg: "Wachana ahune naehae. Mic eka thiyala langin katha karala ayeth Mic eka thiyanna.",
  },
  heard: { en: "I heard", si: "ඇහුණේ", sg: "Ahune" },
  stopListen: { en: "Stop listening", si: "අහන එක නවත්වන්න", sg: "Ahana eka nawathwanna" },
  noMic: {
    en: "This browser cannot hear the mic. Type your message instead.",
    si: "මේ browser එකට මයික් එක ඇහෙන්නේ නැහැ. ලියලා යවන්න.",
    sg: "Me browser ekata mic eka ahenne naehae. Liyala yawanna.",
  },
  micFail: {
    en: "Mic did not start. Type your message instead.",
    si: "මයික් එක පටන් ගත්තේ නැහැ. ලියලා යවන්න.",
    sg: "Mic eka patan gatte naehae. Liyala yawanna.",
  },
  noSpeech: {
    en: "This browser cannot speak. You can still read Cub’s words.",
    si: "මේ browser එකට කතා කරන්න බැහැ. Cubගේ වචන කියවන්න පුළුවන්.",
    sg: "Me browser ekata katha karanna baehae. Cubge wachana kiyawanna puluwan.",
  },
  noSinhalaVoice: {
    en: "Sinhala text is ready, but this device has no Sinhala voice. Read the words on screen.",
    si: "සිංහල අකුරු තියෙනවා, නමුත් මේ උපාංගයේ සිංහල හඬක් නැහැ. තිරයේ වචන කියවන්න.",
    sg: "Sinhala akuru thiyenawa, namuth me upaangaye Sinhala handak naehae. Thiraye wachana kiyawanna.",
  },
  blurb: {
    en: "Talk or type. A small classroom classifier may guess the intent. It is not research-validated. Routes stay role-safe.",
    si: "කතා කරන්න හෝ ලියන්න. පන්ති classifier එකක් intent එක අනුමාන කරන්න පුළුවන්. පර්යේෂණයෙන් තහවුරු වූ එකක් නෙවෙයි. මාර්ග role අනුව ආරක්ෂිතයි.",
    sg: "Katha karanna ho liyanna. Panthi classifier ekak intent eka anumaana karanna puluwan. Paryeshanayen thahawuru wu ekak newei.",
  },
  english: { en: "English", si: "English", sg: "English" },
  sinhala: { en: "සිංහල", si: "සිංහල", sg: "Sinhala" },
  singlish: { en: "Singlish", si: "Singlish", sg: "Singlish" },
  yesLeave: { en: "yes", si: "ඔව්", sg: "ow" },
};

export function cubUi(lang: CubLang, key: keyof typeof UI) {
  return UI[key][lang];
}
