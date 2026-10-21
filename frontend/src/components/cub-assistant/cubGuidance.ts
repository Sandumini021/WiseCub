import type { CubLang, CubReply, CubRole } from "./cubAssistantTypes";
import { canOpenRoute, safeHome, shouldWarnBeforeLeave } from "./cubRoutes";

type Copy = { en: string; si: string };

function pick(lang: CubLang, copy: Copy) {
  return copy[lang];
}

const PAGE_TIPS: Record<string, Copy> = {
  "/student/dashboard": {
    en: "This is your home. Cub stays with you. Open Missions, Market, Safety, or Life Choices when you are ready.",
    si: "මේක ඔයාගේ මුල් පිටුව. Cub එක්කම ඉන්නවා. Missions, Market, Safety, හෝ Life Choices විවෘත කරන්න.",
  },
  "/home": {
    en: "This is your home. Cub stays with you. Open Missions, Market, Safety, or Life Choices when you are ready.",
    si: "මේක ඔයාගේ මුල් පිටුව. Cub එක්කම ඉන්නවා. Missions, Market, Safety, හෝ Life Choices විවෘත කරන්න.",
  },
  "/teacher/dashboard": {
    en: "Teacher home. Classes and quizzes are labelled stubs until later phases. You cannot open another teacher’s class.",
    si: "ගුරු මුල් පිටුව. පන්ති සහ ප්‍රශ්නාවලි පසුව එනවා. වෙනත් ගුරුවරයෙකුගේ පන්තිය බලන්න බැහැ.",
  },
  "/guardian/dashboard": {
    en: "Guardian home. Linked children use an invite later. You cannot guess another child’s username.",
    si: "භාරකාර මුල් පිටුව. දරුවන් සම්බන්ධ කිරීම පසුව. වෙනත් දරුවෙකුගේ නම අනුමාන කරන්න බැහැ.",
  },
  "/market": {
    en: "Market Floor. Pretend money only. Ten short lessons. Lesson 1 opens the terminal. Ask how to sell, or how to decide.",
    si: "වෙළෙඳපොළ. මේක අභ්‍යාස මුදල් විතරයි. කෙටි පාඩම් දහයක්. පාඩම 1 terminal එක අරිනවා. විකුණන්නේ කොහොමද කියලා අහන්න.",
  },
  "/market/lessons/1": {
    en: "Lesson 1. A share is one slice of a company. Read the pie, then the quick check.",
    si: "පාඩම 1. කොටසක් කියන්නේ සමාගමක කුඩා කොටසක්. පයි රූපය කියවලා කුඩා ප්‍රශ්නයට උත්තර දෙන්න.",
  },
  "/market/lessons/2": {
    en: "Lesson 2. Risk and return. A bigger possible gain often means a bigger possible drop. Pretend money only.",
    si: "පාඩම 2. අවදානම සහ ලාභය. වැඩි ලාභයකට බොහෝ විට වැඩි අවදානමක් තියෙනවා. අභ්‍යාස මුදල් විතරයි.",
  },
  "/market/lessons/3": {
    en: "Lesson 3. Spreading money. One company can have a bad day. Several names share the bump.",
    si: "පාඩම 3. මුදල් බෙදීම. එක සමාගමකට නරක දවසක් එන්න පුළුවන්. කිහිපයක් තියාගන්න ආරක්ෂිතයි.",
  },
  "/market/lessons/4": {
    en: "Lesson 4. Compounding. A small pretend gain can grow if you leave it — and a loss can grow too.",
    si: "පාඩම 4. සංයුක්ත වර්ධනය. කුඩා ලාභයක් තියාගත්තොත් වැඩිවෙන්න පුළුවන්. පාඩුවත් වැඩිවෙන්න පුළුවන්.",
  },
  "/market/lessons/5": {
    en: "Lesson 5. How a buy works. Cash leaves, slices land in the bag, at today’s pretend price.",
    si: "පාඩම 5. මිලදී ගැනීම. මුදල් අඩු වෙනවා, කොටස් බෑග් එකට එනවා. අද මිලට.",
  },
  "/market/lessons/6": {
    en: "Lesson 6. Selling wisely. A sell locks today’s price. A red day is not a rule to sell.",
    si: "පාඩම 6. නුවණින් විකුණන එක. විකුණුවොත් අද මිල lock වෙනවා. රතු දවසක් විකුණන්න ඕනේ කියලා නෙවෙයි.",
  },
  "/market/lessons/7": {
    en: "Lesson 7. How to decide. Pause, compare another name, then answer Cub before you tap.",
    si: "පාඩම 7. තීරණ ගන්නේ කොහොමද. ඉන්න, compare කරන්න, Cub එකට උත්තර දීලා ඊට පස්සේ tap කරන්න.",
  },
  "/market/lessons/8": {
    en: "Lesson 8. Don’t copy the crowd. The 8-in-10 banner is a drill, not real people.",
    si: "පාඩම 8. රැළට යන්න එපා. 8න් 10ක් කියන එක drill එකක්. ඇත්ත අය නෙවෙයි.",
  },
  "/market/lessons/9": {
    en: "Lesson 9. Paper vs locked. A green bag can still fall until you sell.",
    si: "පාඩම 9. Paper සහ locked. තියාගෙන ඉන්නකම් කොළ ලාභයක් නැතිවෙන්නත් පුළුවන්.",
  },
  "/market/lessons/10": {
    en: "Lesson 10. When prices drop. Pause first. Selling locks the fall. Holding keeps it paper.",
    si: "පාඩම 10. මිල බැස්සම. මුලින් ඉන්න. විකුණුවොත් අඩු මිල lock වෙනවා.",
  },
  "/market/terminal": {
    en: "Practice terminal. Prices are made for class. Confirm before you buy or sell. No real money.",
    si: "අභ්‍යාස terminal එක. මිල පන්තියට හදපු ඒවා. මිලදී ගන්න කලින් තහවුරු කරන්න. ඇත්ත මුදල් නැහැ.",
  },
  "/market/confirm": {
    en: "Read the warning before you confirm. You may buy fewer shares, or confirm anyway. The point is noticing the risk.",
    si: "තහවුරු කරන්න කලින් අනතුරු ඇඟවීම කියවන්න. අඩු කොටස් ගන්නත් පුළුවන්. අරමුණ අවදානම දකින එකයි.",
  },
  "/market/portfolio": {
    en: "Practice portfolio. We look at patience and spreading money — never a profit rank against other children.",
    si: "අභ්‍යාස portfolio එක. ඉවසීම සහ මුදල් බෙදීම බලනවා. අනිත් දරුවන් එක්ක ලාභ තරඟයක් නැහැ.",
  },
  "/choices": {
    en: "Life Choices. Walk a scenario and see how education, spending, and saving can shape a future.",
    si: "ජීවිත තීරණ. අධ්‍යාපනය, වියදම්, ඉතිරි කිරීම අනාගතයට කොහොමද බලපාන්නේ කියලා බලන්න.",
  },
  "/missions": {
    en: "Missions. Practise needs versus wants, budgets, and saving goals with virtual coins.",
    si: "Missions. අවශ්‍යතා සහ කැමැත්ත, අයවැය, ඉතිරි ඉලක්ක අභ්‍යාස කාසිවලින් පුරුදු වෙන්න.",
  },
  "/safety": {
    en: "Scam Safety. Drills stay inside WiseCub. We never send real messages or ask for real passwords.",
    si: "වංචා ආරක්ෂාව. පුහුණුව WiseCub ඇතුළේ විතරයි. ඇත්ත පණිවිඩ හෝ මුරපද ඉල්ලන්නේ නැහැ.",
  },
  "/progress": {
    en: "Progress shows learning habits, not who made more pretend money.",
    si: "ප්‍රගතිය පෙන්වන්නේ ඉගෙනුම් පුරුදු. අභ්‍යාස මුදල් වැඩි කාටද කියලා නෙවෙයි.",
  },
  "/profile": {
    en: "Profile. Students can change the practice avatar. Passwords stay hashed on the server.",
    si: "පැතිකඩ. සිසුන්ට avatar එක වෙනස් කරන්න පුළුවන්. මුරපද server එකේ hash විදිහට තියෙනවා.",
  },
  "/teacher/classes": {
    en: "Classes come in a later phase. You will make a join code then.",
    si: "පන්ති පසුව එනවා. එතකොට join code එකක් හදනවා.",
  },
  "/guardian/children": {
    en: "Linked children need an invite code later. No guessing usernames.",
    si: "සම්බන්ධ දරුවන්ට පසුව invite code එකක් ඕනේ. නම් අනුමාන කරන්න එපා.",
  },
};

export function greetingFor(path: string, lang: CubLang = "en"): string {
  if (PAGE_TIPS[path]) {
    return pick(lang, PAGE_TIPS[path]);
  }
  if (path.startsWith("/market/lessons")) {
    return pick(lang, PAGE_TIPS["/market/lessons/1"]);
  }
  if (path.startsWith("/teacher")) {
    return pick(lang, PAGE_TIPS["/teacher/dashboard"]);
  }
  if (path.startsWith("/guardian")) {
    return pick(lang, PAGE_TIPS["/guardian/dashboard"]);
  }
  return pick(lang, {
    en: "I’m Cub. I can explain this page or take you to an allowed room. Try “open the market”.",
    si: "මම Cub. මේ පිටුව පහදන්න හෝ අවසර තියෙන කාමරයකට ගෙනියන්න පුළුවන්. “වෙළෙඳපොළට යන්න” කියන්න.",
  });
}

export function suggestionsFor(path: string, lang: CubLang = "en"): string[] {
  const enMarket = ["What is a share?", "Start lesson 1", "Is this real money?", "Go to Safety"];
  const siMarket = ["කොටසක් කියන්නේ මොකක්ද?", "පාඩම 1 අරඹන්න", "මේක ඇත්ත මුදල්ද?", "Safety එකට යන්න"];
  if (path === "/market" || path.startsWith("/market/lessons")) {
    return lang === "si" ? siMarket : enMarket;
  }
  if (path.startsWith("/teacher")) {
    return lang === "si"
      ? ["මේ පිටුව පහදන්න", "පන්තිවලට යන්න", "උදව්"]
      : ["Explain this page", "Open classes", "Help"];
  }
  if (path.startsWith("/guardian")) {
    return lang === "si"
      ? ["මේ පිටුව පහදන්න", "දරුවන්ට යන්න", "උදව්"]
      : ["Explain this page", "Linked children", "Help"];
  }
  return lang === "si"
    ? ["වෙළෙඳපොළට යන්න", "මේක ඇත්ත මුදල්ද?", "මේ පිටුව පහදන්න", "ගෙදරට යන්න"]
    : ["Open the market", "Is this real money?", "Explain this page", "Go home"];
}

function go(lang: CubLang, path: string, text: Copy, role: CubRole | undefined, fromPath: string): CubReply {
  if (!canOpenRoute(role, path)) {
    return {
      text: pick(lang, {
        en: "That page is for a different role. I can take you to your own dashboard.",
        si: "ඒ පිටුව වෙනත් භූමිකාවකට. මම ඔයාගේම dashboard එකට ගෙනියන්නම්.",
      }),
      path: safeHome(role),
    };
  }
  if (shouldWarnBeforeLeave(fromPath, path)) {
    return {
      text: pick(lang, {
        en: "You have a trade to confirm. Say yes to leave, or stay and finish the warning.",
        si: "තහවුරු කරන්න තියෙන වෙළෙඳාමක් තියෙනවා. යන්න නම් yes කියන්න. නැත්නම් මෙහෙම ඉන්න.",
      }),
      path,
      needsConfirm: true,
    };
  }
  return { text: pick(lang, text), path };
}

export function detectSpokenLang(raw: string, fallback: CubLang): CubLang {
  if (/[\u0D80-\u0DFF]/.test(raw)) {
    return "si";
  }
  if (/[a-z]/i.test(raw)) {
    return "en";
  }
  return fallback;
}

function normalizeHeard(raw: string) {
  return raw
    .toLowerCase()
    .trim()
    .replace(/වෙළඳපොල/g, "වෙළෙඳපොළ")
    .replace(/වෙළඳපොළ/g, "වෙළෙඳපොළ")
    .replace(/කොටස් වෙළෙඳ/g, "වෙළෙඳපොළ");
}

export function matchPriorityCubIntent(
  raw: string,
  lang: CubLang,
  ctx: { path: string; role?: CubRole },
): CubReply | null {
  const text = normalizeHeard(raw);
  const role = ctx.role;
  const from = ctx.path;

  if (/(real money|real bank|broker|ඇත්ත මුදල්|බැංකු)/.test(text)) {
    return {
      text: pick(lang, {
        en: "No real money is used. The rupees you see are virtual practice money. Nothing connects to a bank.",
        si: "ඇත්ත මුදල් යොදා ගන්නේ නැහැ. ඔයාට පේන රුපියල් අභ්‍යාස මුදල්. බැංකුවකට සම්බන්ධයක් නැහැ.",
      }),
    };
  }
  if (/(are scams real|ඇත්තටම scam|පණිවිඩ යවනවද)/.test(text)) {
    return {
      text: pick(lang, {
        en: "Drills stay on this website. I will not send emails, SMS, or calls. Fake messages only appear inside WiseCub.",
        si: "පුහුණුව මේ වෙබ් එකේ විතරයි. ඊමේල්, SMS, හෝ ඇමතුම් යවන්නේ නැහැ. ව්‍යාජ පණිවිඩ WiseCub ඇතුළේ විතරයි.",
      }),
    };
  }
  const numbered = text.match(/(?:start )?lesson\s*(\d+)|පාඩම\s*(\d+)/);
  if (numbered) {
    const n = Number(numbered[1] || numbered[2]);
    if (n >= 1 && n <= 10) {
      return go(lang, `/market/lessons/${n}`, { en: `Opening Lesson ${n}.`, si: `පාඩම ${n} අරඹනවා.` }, role, from);
    }
  }
  return null;
}

export function matchCubIntent(
  raw: string,
  lang: CubLang,
  ctx: { path: string; role?: CubRole },
): CubReply {
  const priority = matchPriorityCubIntent(raw, lang, ctx);
  if (priority) {
    return priority;
  }
  const text = normalizeHeard(raw);
  const role = ctx.role;
  const from = ctx.path;

  if (/(explain this page|මේ පිටුව|this page|what is this page)/.test(text)) {
    return { text: greetingFor(from, lang), speakPage: true };
  }
  if (/^(hi|hello|hey cub|හායි|ආයුබෝවන්|කොහොමද)\b/.test(text)) {
    return {
      text: pick(lang, {
        en: "Hi! I am Cub. Ask me about this page, shares, or say open the market.",
        si: "හායි! මම Cub. මේ පිටුව ගැන, කොටස් ගැන අහන්න, නැත්නම් වෙළෙඳපොළට යන්න කියන්න.",
      }),
    };
  }
  if (/(what can you do|help|උදව්|කොහොමද උදව්)/.test(text)) {
    return {
      text: pick(lang, {
        en: "I can explain this page, remind you it is pretend money, and take you to allowed rooms. Say “open the market” or “I want to go to trading”.",
        si: "මේ පිටුව පහදන්න පුළුවන්, අභ්‍යාස මුදල් කියලා මතක් කරන්න පුළුවන්, අවසර තියෙන කාමරවලට ගෙනියන්න පුළුවන්. “වෙළෙඳපොළට යන්න” කියන්න.",
      }),
    };
  }
  if (/(what is a share|what's a share|කොටසක් කියන්නේ|කොටස් (කියන්නේ|මොකක්)|share is)/.test(text)) {
    return {
      text: pick(lang, {
        en: "A share is one small slice of a company. If the company does well, your slice can be worth more. We only practise with pretend rupees.",
        si: "කොටසක් කියන්නේ සමාගමක කුඩා කෑල්ලක්. සමාගම හොඳට වැඩ කළොත් ඒ කෑල්ලේ වටිනාකම වැඩිවෙන්න පුළුවන්. අපි අභ්‍යාස රුපියල්වලින් විතරයි පුරුදු වෙන්නේ.",
      }),
    };
  }
  if (/(needs vs wants|needs versus|අවශ්‍යතා)/.test(text)) {
    return {
      text: pick(lang, {
        en: "A need is something you must have, like food or the bus. A want is nice extra, like a new game. Missions help you practise the difference.",
        si: "අවශ්‍යතාවක් කියන්නේ ඕනේ දෙයක් — කෑම, බස් එක. කැමැත්තක් කියන්නේ අමතර දෙයක් — අළුත් ගේම් එකක්. Missions එකේ මේක පුරුදු වෙනවා.",
      }),
    };
  }
  const numbered = text.match(/(?:start )?lesson\s*(\d+)|පාඩම\s*(\d+)/);
  if (numbered) {
    const n = Number(numbered[1] || numbered[2]);
    if (n >= 1 && n <= 10) {
      return go(lang, `/market/lessons/${n}`, { en: `Opening Lesson ${n}.`, si: `පාඩම ${n} අරඹනවා.` }, role, from);
    }
  }
  if (/(what is risk)/.test(text)) {
    return go(lang, "/market/lessons/2", { en: "Opening Lesson 2.", si: "පාඩම 2 අරඹනවා." }, role, from);
  }
  if (/(how to sell|when (do i|to) sell|selling wise|විකුණන්නේ)/.test(text)) {
    return go(lang, "/market/lessons/6", { en: "Opening the sell lesson.", si: "විකුණුම් පාඩම අරඹනවා." }, role, from);
  }
  if (/(how to decide|how do i decide|before i (buy|sell)|pause and compare)/.test(text)) {
    return go(lang, "/market/lessons/7", { en: "Opening how to decide.", si: "තීරණ පාඩම අරඹනවා." }, role, from);
  }
  if (/(portfolio|holdings|මගේ portfolio)/.test(text)) {
    return go(
      lang,
      "/market/portfolio",
      { en: "Opening your practice portfolio.", si: "අභ්‍යාස portfolio එක අරිනවා." },
      role,
      from,
    );
  }
  if (/(go to trading|want to (go to )?trad|open trading|trading floor|stock trading|කොටස් වෙළෙඳ)/.test(text)) {
    return go(
      lang,
      "/market",
      { en: "Opening the Market Floor. Virtual money only.", si: "වෙළෙඳපොළ අරිනවා. අභ්‍යාස මුදල් විතරයි." },
      role,
      from,
    );
  }
  if (/(terminal|\bbuy\b|\bsell\b)/.test(text) && !/real/.test(text)) {
    return go(
      lang,
      "/market/terminal",
      { en: "Opening the practice terminal.", si: "අභ්‍යාස terminal එක අරිනවා." },
      role,
      from,
    );
  }
  if (/(stock market|වෙළෙඳපොළ|open the market|go to (the )?market|take me to (the )?market|market floor|කොටස්)/.test(text)) {
    return go(
      lang,
      "/market",
      { en: "Opening the Market Floor. Virtual money only.", si: "වෙළෙඳපොළ අරිනවා. අභ්‍යාස මුදල් විතරයි." },
      role,
      from,
    );
  }
  if (/(choice|decision|life choices|තීරණ)/.test(text)) {
    return go(lang, "/choices", { en: "Opening Life Choices.", si: "ජීවිත තීරණ අරිනවා." }, role, from);
  }
  if (/(mission|budget|මෙහෙයුම්)/.test(text)) {
    return go(lang, "/missions", { en: "Opening Missions.", si: "Missions අරිනවා." }, role, from);
  }
  if (/(safety|scam|වංචා|ආරක්ෂා)/.test(text)) {
    return go(lang, "/safety", { en: "Opening Scam Safety.", si: "වංචා ආරක්ෂාව අරිනවා." }, role, from);
  }
  if (/(progress|ප්‍රගති)/.test(text)) {
    return go(lang, "/progress", { en: "Opening My Progress.", si: "ප්‍රගතිය අරිනවා." }, role, from);
  }
  if (/(profile|avatar|පැතිකඩ)/.test(text)) {
    return go(lang, "/profile", { en: "Opening your profile.", si: "පැතිකඩ අරිනවා." }, role, from);
  }
  if (/(classes|පන්ති)/.test(text)) {
    return go(lang, "/teacher/classes", { en: "Opening classes.", si: "පන්ති අරිනවා." }, role, from);
  }
  if (/(linked children|දරුවන්)/.test(text)) {
    return go(lang, "/guardian/children", { en: "Opening linked children.", si: "සම්බන්ධ දරුවන් අරිනවා." }, role, from);
  }
  if (/(home|dashboard|ගෙදර|මුල් පිටු)/.test(text)) {
    return go(
      lang,
      safeHome(role),
      { en: "Taking you to your dashboard.", si: "ඔයාගේ මුල් පිටුවට යනවා." },
      role,
      from,
    );
  }

  return {
    text: pick(lang, {
      en: "I didn’t catch that yet. Try a yellow button, or say “open the market”, “how do I buy a stock”, or “mage portfolio eka pennanna”.",
      si: "තේරුණේ නැහැ. කහ බොත්තමක් තියන්න, නැත්නම් “වෙළෙඳපොළට යන්න”, “කොටසක් ගන්නේ කොහොමද”, “මගේ portfolio එක පෙන්වන්න” කියන්න.",
    }),
  };
}
