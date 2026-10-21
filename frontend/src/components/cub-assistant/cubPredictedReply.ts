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
  example_questions?: string[];
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
    en: "I can explain this page, remind you it is pretend money, and take you to allowed rooms. Try “open the market”, “how do I buy a stock”, or “mage portfolio eka pennanna”.",
    si: "මේ පිටුව පහදන්න පුළුවන්, අභ්‍යාස මුදල් කියලා මතක් කරන්න පුළුවන්, අවසර තියෙන කාමරවලට ගෙනියන්න පුළුවන්. “වෙළෙඳපොළට යන්න” හෝ “කොටසක් ගන්නේ කොහොමද” කියන්න.",
  },
  HOW_TO_TRADE: {
    en: "Practice trading is three steps: open the Market Floor, pick a company, then Buy or Sell in the terminal. It uses virtual rupees only. I will not quote a real price.",
    si: "අභ්‍යාස වෙළෙඳාම පියවර තුනයි: වෙළෙඳපොළ අරින්න, සමාගමක් තෝරන්න, ඊට පස්සේ terminal එකේ Buy හෝ Sell. අභ්‍යාස රුපියල් විතරයි. ඇත්ත මිලක් කියන්නේ නැහැ.",
  },
  HOW_TO_BUY: {
    en: "To buy: open the terminal, choose Buy, pick how many practice shares, then read the warning and confirm. Nothing is sent to a real broker.",
    si: "ගන්න නම්: terminal එක අරින්න, Buy තෝරන්න, අභ්‍යාස කොටස් ගණන දාන්න, අනතුරු ඇඟවීම කියවලා confirm කරන්න. ඇත්ත බ්‍රෝකර් කෙනෙකුට යන්නේ නැහැ.",
  },
  HOW_TO_SELL: {
    en: "To sell: open the terminal, choose Sell, enter how many practice shares you hold, then confirm. You can only sell what is already in this pretend portfolio.",
    si: "විකුණන්න නම්: terminal එක අරින්න, Sell තෝරන්න, තියෙන අභ්‍යාස කොටස් ගණන දාන්න, confirm කරන්න. මේ පෙන්නන portfolio එකේ තියෙන ඒවා විතරයි විකුණන්න පුළුවන්.",
  },
  HOW_TO_CANCEL_ORDER: {
    en: "If you have not confirmed yet, leave the confirm page or tap back. After a practice fill, this classroom app does not send a live cancel to a real exchange.",
    si: "තහවුරු කරලා නැත්නම් confirm පිටුවෙන් යන්න හෝ back තියන්න. Fill වුණාට පස්සේ ඇත්ත exchange එකකට cancel යවන්නේ නැහැ.",
  },
  ASK_ABOUT_CHART: {
    en: "The chart is a picture of practice prices over time. Up usually means a higher last price; down usually means a lower one. I will not invent a number — read the figure on this screen.",
    si: "චාට් එක කියන්නේ අභ්‍යාස මිල කාලයත් එක්ක. උඩට නම් අන්තිම මිල වැඩි; පහළට නම් අඩු. මම ඉලක්කමක් හදන්නේ නැහැ — මේ තිරේ තියෙන එක කියවන්න.",
  },
  ASK_ABOUT_PRICE: {
    en: "I do not invent prices. Look at the number next to the company on this page. It is a classroom figure, not a live Colombo quote.",
    si: "මම මිලක් හදන්නේ නැහැ. මේ පිටුවේ සමාගම අසල ඉලක්කම බලන්න. ඒක පන්ති අංකයක්, ජීවී කොළඹ quote එකක් නෙවෙයි.",
  },
  ASK_ABOUT_COMPANY: {
    en: "Open the company card on the Market Floor. The note there is classroom story, not investment advice. I will not make up extra facts.",
    si: "වෙළෙඳපොළේ සමාගම් කාඩ් එක අරින්න. ඒ සටහන පන්ති කතාවක්, ආයෝජන උපදෙසක් නෙවෙයි. මම අමතර කරුණු හදන්නේ නැහැ.",
  },
  ASK_ABOUT_PORTFOLIO_MONEY: {
    en: "Your practice cash, holdings, and profit or loss are on the portfolio page. I will not guess a balance — I can take you there so you can read the numbers.",
    si: "අභ්‍යාස මුදල්, කොටස්, ලාභය හෝ පාඩුව portfolio පිටුවේ තියෙනවා. මම ශේෂයක් අනුමාන කරන්නේ නැහැ — ඒ පිටුවට ගෙනියන්නම්.",
  },
  MARKET_DROP_WHAT_TO_DO: {
    en: "A drop can feel scary. In class we pause, look at the chart, and remember it is pretend money. Selling only because it went red is a panic habit — Decision Patterns on the portfolio page talk about that.",
    si: "මිල බැස්සම බයක් දැනෙන්න පුළුවන්. පන්තියේදී නවත්වලා චාට් එක බලනවා. අභ්‍යාස මුදල් විතරයි. රතු උනා කියලා විතරක් විකුණන එක panic පුරුද්දක් — portfolio එකේ Decision Patterns ඒ ගැන.",
  },
  FOLLOW_UP_EXPLAIN: {
    en: "Tell me which bit was unclear — buying, selling, the chart, or your portfolio — and I will say it more slowly.",
    si: "මොකද්ද අවුල් — ගන්න එක, විකුණන එක, චාට් එක, නැත්නම් portfolio එක — හෙමින් කියනවා.",
  },
  CLARIFY_CONFUSION: {
    en: "That’s okay. Try a short question like “how do I buy a stock”, “explain this chart”, or “show my portfolio”.",
    si: "කමක් නැහැ. කෙටි ප්‍රශ්නයක් අහන්න: “කොටසක් ගන්නේ කොහොමද”, “චාට් එක පහදන්න”, “මගේ portfolio එක පෙන්වන්න”.",
  },
  OPEN_TERMINAL: {
    en: "Opening the practice terminal. Virtual money only.",
    si: "අභ්‍යාස terminal එක අරිනවා. අභ්‍යාස මුදල් විතරයි.",
  },
  ASK_BEHAVIOUR_LESSON: {
    en: "Decision Patterns on the portfolio page flag classroom habits like panic selling or herding — only when the session shows evidence. I will not invent a label.",
    si: "Portfolio පිටුවේ Decision Patterns, session එකේ සාක්ෂි තියෙනකොට විතරයි panic selling වගේ පුරුදු පෙන්වනවා. මම ලේබල් එකක් හදන්නේ නැහැ.",
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

export function exampleLine(lang: CubLang, examples?: string[]) {
  const list = (examples && examples.length ? examples : ["open the market", "how do I buy a stock", "mata therenne naha"]).slice(0, 3);
  const joined = list.map((item) => `“${item}”`).join(", ");
  return pick(lang, {
    en: `Try ${joined}.`,
    si: `මේවා උත්සාහ කරන්න: ${joined}.`,
  });
}

export function lowConfidenceReply(lang: CubLang, _path: string, examples?: string[]): CubReply {
  return {
    intent: "LOW_CONFIDENCE",
    text: pick(lang, {
      en: `I am not sure yet. Please say it another way. ${exampleLine(lang, examples)}`,
      si: `තේරුණේ නැහැ. වෙන විදිහකට කියන්න. ${exampleLine(lang, examples)}`,
    }),
  };
}

export function replyFromPrediction(
  prediction: CubIntentPrediction,
  lang: CubLang,
  ctx: { path: string; role?: CubRole; lastIntent?: string | null },
): CubReply | null {
  if (!prediction.used_model || !prediction.intent) {
    return null;
  }
  if (!prediction.reliable) {
    return lowConfidenceReply(lang, ctx.path, prediction.example_questions);
  }
  const intent = prediction.intent;
  const role = ctx.role;
  const from = ctx.path;
  const lastIntent = ctx.lastIntent;

  if (intent === "EXPLAIN_CURRENT_PAGE") {
    return { text: greetingFor(from, lang), speakPage: true, intent };
  }
  if (intent === "FOLLOW_UP_EXPLAIN" && lastIntent && lastIntent !== "FOLLOW_UP_EXPLAIN" && COPY[lastIntent]) {
    return {
      intent,
      text: pick(lang, {
        en: `Saying it again, slower. ${COPY[lastIntent].en}`,
        si: `ආයෙත් හෙමින්. ${COPY[lastIntent].si}`,
      }),
    };
  }
  if (intent === "CLARIFY_CONFUSION") {
    return {
      intent,
      text: `${greetingFor(from, lang)} ${pick(lang, COPY.CLARIFY_CONFUSION)}`,
      speakPage: true,
    };
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
    return { text: pick(lang, copy), languageIntent: intent, intent };
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
  return { text: pick(lang, copy), path, languageIntent: intent, intent };
}
