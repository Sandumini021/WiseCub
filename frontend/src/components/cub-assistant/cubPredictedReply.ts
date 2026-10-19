import type { CubLang, CubReply, CubRole } from "./cubAssistantTypes";
import { greetingFor } from "./cubGuidance";
import { canOpenRoute, safeHome, shouldWarnBeforeLeave } from "./cubRoutes";

export type CubIntentPrediction = {
  model_ready: boolean;
  used_model: boolean;
  model_note: string;
  intent: string | null;
  confidence: number;
  reliable: boolean;
  suggested_route: string | null;
  navigation_blocked: boolean;
  blocked_reason: string | null;
  needs_confirm: boolean;
};

const COPY: Record<string, { en: string; si: string }> = {
  ASK_ABOUT_NEEDS_WANTS: {
    en: "A need is something you must have, like food or the bus. A want is nice extra, like a new game. Missions help you practise the difference.",
    si: "අවශ්‍යතාවක් කියන්නේ ඕනේ දෙයක් — කෑම, බස් එක. කැමැත්තක් කියන්නේ අමතර දෙයක් — අළුත් ගේම් එකක්. Missions එකේ මේක පුරුදු වෙනවා.",
  },
  ASK_ABOUT_SAVING: {
    en: "Saving is keeping some practice rupees for later. A small habit beats a one-time leftover.",
    si: "ඉතිරි කිරීම කියන්නේ අභ්‍යාස රුපියල් කොටසක් පසුවට තියාගැනීම. පුංචි පුරුද්දක් වැඩියි.",
  },
  ASK_FOR_HELP: {
    en: "I can explain this page, remind you it is pretend money, and take you to allowed rooms. This is a small classroom classifier, not a research-validated model.",
    si: "මේ පිටුව පහදන්න පුළුවන්, අභ්‍යාස මුදල් කියලා මතක් කරන්න පුළුවන්, අවසර තියෙන කාමරවලට ගෙනියන්න පුළුවන්. මේක පන්ති classifier එකක්, පර්යේෂණයෙන් තහවුරු වූ මොඩලයක් නෙවෙයි.",
  },
  CHANGE_LANGUAGE_ENGLISH: {
    en: "Okay — I will answer in English.",
    si: "හරි — දැන් English වලින් උත්තර දෙනවා.",
  },
  CHANGE_LANGUAGE_SINHALA: {
    en: "Okay — I will answer in Sinhala.",
    si: "හරි — දැන් සිංහලෙන් උත්තර දෙනවා.",
  },
  EXPLAIN_BUDGETING: {
    en: "A budget is a plan: some for needs, some for saving, some for wants. Missions let you try that with virtual coins.",
    si: "අයවැයක් කියන්නේ සැලැස්මක්: අවශ්‍යතා, ඉතිරි කිරීම, කැමැත්ත. Missions එකේ අභ්‍යාස කාසිවලින් උත්සාහ කරන්න පුළුවන්.",
  },
  EXPLAIN_DIVERSIFICATION: {
    en: "Spreading practice money across more than one company can soften a bad day for one name. It is not a promise of profit.",
    si: "අභ්‍යාස මුදල් එක සමාගමකට වඩා බෙදීමෙන් එක නමකට නරක දවසක් ආවොත් බලපෑම අඩු වෙන්න පුළුවන්. ලාභයක් පොරොන්දුවක් නෙවෙයි.",
  },
  EXPLAIN_RISK: {
    en: "Risk means the practice value can go down, not only up. Bigger possible gain often means a bigger possible drop. Pretend money only.",
    si: "අවදානම කියන්නේ අභ්‍යාස වටිනාකම පහළ යන්නත් පුළුවන් කියන එක. වැඩි ලාභයකට බොහෝ විට වැඩි අවදානමක් තියෙනවා. අභ්‍යාස මුදල් විතරයි.",
  },
  EXPLAIN_SHARE: {
    en: "A share is one small slice of a company. If the company does well, your slice can be worth more. We only practise with pretend rupees.",
    si: "කොටසක් කියන්නේ සමාගමක කුඩා කෑල්ලක්. සමාගම හොඳට වැඩ කළොත් ඒ කෑල්ලේ වටිනාකම වැඩිවෙන්න පුළුවන්. අපි අභ්‍යාස රුපියල්වලින් විතරයි පුරුදු වෙන්නේ.",
  },
  OPEN_DECISION_MAKING: { en: "Opening Life Choices.", si: "ජීවිත තීරණ අරිනවා." },
  OPEN_GAMIFIED_LEARNING: { en: "Opening Missions.", si: "Missions අරිනවා." },
  OPEN_GUARDIAN_PROGRESS: { en: "Opening guardian progress.", si: "භාරකාර ප්‍රගතිය අරිනවා." },
  OPEN_HOME: { en: "Taking you to your dashboard.", si: "ඔයාගේ මුල් පිටුවට යනවා." },
  OPEN_PORTFOLIO: { en: "Opening your practice portfolio.", si: "අභ්‍යාස portfolio එක අරිනවා." },
  OPEN_QUIZZES: { en: "Opening quizzes.", si: "ප්‍රශ්නාවලි අරිනවා." },
  OPEN_SCAM_SAFETY: { en: "Opening Scam Safety.", si: "වංචා ආරක්ෂාව අරිනවා." },
  OPEN_STOCK_MARKET: { en: "Opening the Market Floor. Virtual money only.", si: "වෙළෙඳපොළ අරිනවා. අභ්‍යාස මුදල් විතරයි." },
  OPEN_TEACHER_CLASSES: { en: "Opening classes.", si: "පන්ති අරිනවා." },
  OUT_OF_SCOPE: {
    en: "That’s outside WiseCub. I only guide pages and money words here. Try a yellow button, or say open the market.",
    si: "ඒක WiseCub එළියේ. මම මෙහෙ පිටු සහ මුදල් වචන විතරයි. කහ බොත්තමක් තියන්න, නැත්නම් වෙළෙඳපොළට යන්න කියන්න.",
  },
};

function pick(lang: CubLang, copy: { en: string; si: string }) {
  return copy[lang];
}

export function replyFromPrediction(
  prediction: CubIntentPrediction,
  lang: CubLang,
  ctx: { path: string; role?: CubRole },
): CubReply | null {
  if (!prediction.used_model || !prediction.reliable || !prediction.intent) {
    return null;
  }
  const intent = prediction.intent;
  const role = ctx.role;
  const from = ctx.path;

  if (intent === "EXPLAIN_CURRENT_PAGE") {
    return { text: greetingFor(from, lang), speakPage: true };
  }
  if (intent === "OPEN_QUIZZES" && !prediction.suggested_route) {
    return {
      text: pick(lang, {
        en: "Student quizzes are not a page yet. Teachers and guardians have their own quiz screens.",
        si: "සිසු ප්‍රශ්නාවලි පිටුව තාම නැහැ. ගුරු සහ භාරකාර තිර තියෙනවා.",
      }),
    };
  }
  if (prediction.navigation_blocked) {
    return {
      text: pick(lang, {
        en: "That page is for a different role. I can take you to your own dashboard.",
        si: "ඒ පිටුව වෙනත් භූමිකාවකට. මම ඔයාගේම dashboard එකට ගෙනියන්නම්.",
      }),
      path: canOpenRoute(role, prediction.suggested_route ?? "") ? prediction.suggested_route : safeHome(role),
    };
  }

  const copy = COPY[intent] ?? COPY.OUT_OF_SCOPE;
  const path = prediction.suggested_route ?? undefined;
  if (intent === "CHANGE_LANGUAGE_ENGLISH" || intent === "CHANGE_LANGUAGE_SINHALA") {
    return { text: pick(lang, copy), languageIntent: intent };
  }
  if (path && !canOpenRoute(role, path)) {
    return {
      text: pick(lang, {
        en: "That page is for a different role. I can take you to your own dashboard.",
        si: "ඒ පිටුව වෙනත් භූමිකාවකට. මම ඔයාගේම dashboard එකට ගෙනියන්නම්.",
      }),
      path: safeHome(role),
    };
  }
  if (path && shouldWarnBeforeLeave(from, path)) {
    return {
      text: pick(lang, {
        en: "You have a trade to confirm. Say yes to leave, or stay and finish the warning.",
        si: "තහවුරු කරන්න තියෙන වෙළෙඳාමක් තියෙනවා. යන්න නම් yes කියන්න. නැත්නම් මෙහෙම ඉන්න.",
      }),
      path,
      needsConfirm: true,
    };
  }
  return { text: pick(lang, copy), path, languageIntent: intent };
}
