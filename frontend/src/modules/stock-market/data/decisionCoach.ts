import type { CubLang } from "../../../components/cub-assistant/cubAssistantTypes";

export type CoachId =
  | "first-visit"
  | "rising-price"
  | "falling-price"
  | "concentration"
  | "drop-sell"
  | "first-trade"
  | "churn"
  | "compare"
  | "review-outcome";

export type CoachCard = {
  id: CoachId;
  title: string;
  body: string;
};

const DISMISS_KEY = "wisecub.marketCoachDismissed";

function pick(lang: CubLang, copy: { en: string; si: string }) {
  return copy[lang];
}

export function readDismissed(): string[] {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function dismissCoach(id: string) {
  const next = [...new Set([...readDismissed(), id])];
  window.localStorage.setItem(DISMISS_KEY, JSON.stringify(next));
}

export type CoachContext = {
  lang: CubLang;
  path: "home" | "terminal" | "confirm" | "portfolio";
  changePct?: number;
  concentration?: number;
  side?: "buy" | "sell";
  tradeCount?: number;
  viewedCompany?: boolean;
  dropSell?: boolean;
  compared?: boolean;
};

export function pickCoach(ctx: CoachContext, dismissed = readDismissed()): CoachCard | null {
  const cards: CoachCard[] = [];
  if (ctx.path === "portfolio" && (ctx.tradeCount ?? 0) > 0) {
    cards.push({
      id: "review-outcome",
      title: pick(ctx.lang, { en: "Look back, not just the total", si: "එකතුව විතරක් නෙවෙයි" }),
      body: pick(ctx.lang, {
        en: "Unrealized means the price moved but you still hold the shares. Realized means you already sold. Neither number is real money.",
        si: "Unrealized කියන්නේ තවමත් තියෙන කොටස්වල මිල වෙනස් වුණා. Realized කියන්නේ විකුණුවා. දෙකම ඇත්ත මුදල් නෙවෙයි.",
      }),
    });
  }
  if (ctx.path === "home") {
    cards.push({
      id: "first-visit",
      title: pick(ctx.lang, { en: "Cub’s market walk", si: "Cubගේ වෙළෙඳපොළ ඇවිදීම" }),
      body: pick(ctx.lang, {
        en: "A share is a tiny slice of a company. Your rupees here are pretend. Prices can go up or down. Open a company, read the chart, then decide — never rush because a number is green.",
        si: "කොටසක් කියන්නේ සමාගමක පුංචි කෑල්ලක්. මෙහෙ රුපියල් අභ්‍යාසයි. මිල උඩට හෝ පහළට යන්න පුළුවන්. සමාගමක් අරලා චාට් එක කියවලා තීරණය කරන්න — කොළ ඉලක්කමක් නිසා ඉක්මන් වෙන්න එපා.",
      }),
    });
  }
  if (ctx.path === "terminal" && (ctx.tradeCount ?? 0) === 0) {
    cards.push({
      id: "first-trade",
      title: pick(ctx.lang, { en: "First practice buy", si: "පළවෙනි අභ්‍යාස ගැනීම" }),
      body: pick(ctx.lang, {
        en: "Try a small number of shares after reading the company note. Keep most of your virtual cash. This is practice, not a race.",
        si: "සමාගම් සටහන කියවලා පුංචි කොටස් ගණනක් උත්සාහ කරන්න. අභ්‍යාස මුදල් බොහොමයක් තියාගන්න. මේක තරඟයක් නෙවෙයි.",
      }),
    });
  }
  if (ctx.path === "terminal" && !ctx.compared) {
    cards.push({
      id: "compare",
      title: pick(ctx.lang, { en: "Compare before you tap Buy", si: "Buy එකට කලින් සසඳන්න" }),
      body: pick(ctx.lang, {
        en: "Open two tickers. Look at today’s % and the chart. A popular name is not automatically a better practice choice.",
        si: "ටිකර් දෙකක් අරින්න. අද % සහ චාට් එක බලන්න. ජනප්‍රිය නමක් හොඳම අභ්‍යාස තේරීමක් කියලා නිර්ණයක් නැහැ.",
      }),
    });
  }
  if (ctx.path === "terminal" && (ctx.changePct ?? 0) > 1) {
    cards.push({
      id: "rising-price",
      title: pick(ctx.lang, { en: "Green is not a promise", si: "කොළ එක පොරොන්දුවක් නෙවෙයි" }),
      body: pick(ctx.lang, {
        en: "This pretend price rose. That does not mean it will keep rising. Read why it moved, then choose a size you can still sleep on.",
        si: "අභ්‍යාස මිල උඩට ගියා. ඊට පස්සේත් යයි කියලා නැහැ. ඇයි චලනය වුණේ කියලා කියවලා, තවමත් සන්සුන්ව ඉන්න පුළුවන් ගණනක් තෝරන්න.",
      }),
    });
  }
  if (ctx.path === "terminal" && (ctx.changePct ?? 0) < -1) {
    cards.push({
      id: "falling-price",
      title: pick(ctx.lang, { en: "A drop is a pause, not a panic", si: "බැසීමක් නවතින වෙලාවක්" }),
      body: pick(ctx.lang, {
        en: "The line went down. Pause. Selling only because it is red is a panic habit. Check the company note first.",
        si: "ඉර පහළට ගියා. නවත්වන්න. රතු නිසා විතරක් විකුණන එක panic පුරුද්දක්. පළමුව සමාගම් සටහන බලන්න.",
      }),
    });
  }
  if ((ctx.concentration ?? 0) >= 40 && ctx.side === "buy") {
    cards.push({
      id: "concentration",
      title: pick(ctx.lang, { en: "One basket is heavy", si: "එක බඳුනක් බරයි" }),
      body: pick(ctx.lang, {
        en: `About ${Math.round(ctx.concentration ?? 0)}% of your practice bag would sit in one company. If that story has a bad week, most of your virtual money wobbles together.`,
        si: `අභ්‍යාස බෑග් එකෙන් ආසන්න වශයෙන් ${Math.round(ctx.concentration ?? 0)}% එක සමාගමක. ඒ කතාවට නරක සතියක් ආවොත් වැඩි මුදල් එකට සෙලවෙනවා.`,
      }),
    });
  }
  if (ctx.dropSell) {
    cards.push({
      id: "drop-sell",
      title: pick(ctx.lang, { en: "Selling after a drill drop", si: "බැසීමකට පස්සේ විකුණනවා" }),
      body: pick(ctx.lang, {
        en: "This ticker has a practice drop cue. You may still sell — Cub just wants you to notice the feeling and the company note first.",
        si: "මේ ටිකර් එකට අභ්‍යාස බැසීමක් තියෙනවා. විකුණන්න පුළුවන් — Cubට ඕනේ ඒ හැඟීම සහ සටහන කලින් දැකගන්න.",
      }),
    });
  }
  if ((ctx.tradeCount ?? 0) >= 3 && ctx.viewedCompany === false) {
    cards.push({
      id: "churn",
      title: pick(ctx.lang, { en: "Slow down the taps", si: "තට්ටු අඩු කරන්න" }),
      body: pick(ctx.lang, {
        en: "Several practice trades landed quickly. Open a company chart and the note before the next tap. Speed is not a skill here.",
        si: "අභ්‍යාස ගනුදෙනු කිහිපයක් ඉක්මනින් උනා. ඊළඟ එකට කලින් චාට් එක සහ සටහන අරින්න. වේගය මෙහෙ කුසලතාවක් නෙවෙයි.",
      }),
    });
  }

  return cards.find((card) => !dismissed.includes(card.id)) ?? null;
}

export const DECISION_QUESTIONS = {
  why: {
    en: "Why do you want this practice trade?",
    si: "මේ අභ්‍යාස ගනුදෙනුවට හේතුව මොකක්ද?",
    options: [
      { id: "company-note", en: "I read the company note", si: "සමාගම් සටහන කියෙව්වා" },
      { id: "chart", en: "The chart made sense to me", si: "චාට් එක තේරුණා" },
      { id: "crowd", en: "Because of the crowd cue", si: "රැළේ ඉඟිය නිසා" },
      { id: "price-moved", en: "Only because the price moved", si: "මිල චලනය වුණා නිසා විතරයි" },
      { id: "practising", en: "I’m practising the buttons", si: "බොත්තම් පුරුදු වෙනවා" },
    ],
  },
  support: {
    en: "What information supports your decision?",
    si: "ඔයාගේ තීරණයට සහාය දෙන තොරතුරු මොකක්ද?",
    options: [
      { id: "note-and-chart", en: "Company note and chart", si: "සටහන සහ චාට් එක" },
      { id: "compared", en: "I compared more than one ticker", si: "ටිකර් එකකට වඩා සසඳලා" },
      { id: "today-only", en: "Only today’s % change", si: "අද % විතරයි" },
      { id: "guess", en: "I’m guessing", si: "අනුමානයක්" },
    ],
  },
  wrong: {
    en: "What could go wrong?",
    si: "වැරදි වෙන්න පුළුවන් මොකක්ද?",
    options: [
      { id: "price-fall", en: "The pretend price could fall", si: "අභ්‍යාස මිල බැසිය හැකියි" },
      { id: "need-cash", en: "I might want that cash later", si: "පසුවට ඒ මුදල් ඕනේ වෙන්න පුළුවන්" },
      { id: "story-wrong", en: "The company story might be wrong", si: "සමාගම් කතාව වැරදි වෙන්න පුළුවන්" },
      { id: "unsure", en: "I’m not sure yet", si: "තාම විශ්වාස නැහැ" },
    ],
  },
  risk: {
    en: "How much virtual money are you willing to put here?",
    si: "මෙහෙ දාන්න සූදානම් අභ්‍යාස මුදල් කොච්චරද?",
    options: [
      { id: "small", en: "A small slice — most cash stays free", si: "පුංචි කෑල්ලක් — වැඩි මුදල් ඉතිරියි" },
      { id: "half", en: "About half of this bag", si: "බෑග් එකෙන් බාගයක්" },
      { id: "most", en: "Almost all of my virtual cash", si: "අභ්‍යාස මුදල් බොහොමයක්" },
    ],
  },
} as const;

export const REFLECT_OPTIONS = [
  { id: "calm", en: "Calm — I checked the note", si: "සන්සුන්යි — සටහන බැලුවා" },
  { id: "excited", en: "Excited — I wanted to tap fast", si: "උද්යෝගයි — ඉක්මනින් තට්ටු කරන්න හිතුණා" },
  { id: "worried", en: "Worried — the price moved a lot", si: "කනස්සල්ලයි — මිල වැඩි චලනයක්" },
] as const;

export function feedbackAfterTrade(
  lang: CubLang,
  flags: {
    reducedAfterWarning: boolean;
    concentration: number;
    dropSell: boolean;
    why: string;
    support: string;
    reflect: string;
  },
): string {
  if (flags.reducedAfterWarning) {
    return pick(lang, {
      en: "You noticed the heavy basket and chose fewer shares. That pause is the habit Cub is measuring — not profit.",
      si: "බර බඳුන දැකලා කොටස් අඩු කළා. Cub මනින පුරුද්ද ඒ නැවතීම — ලාභය නෙවෙයි.",
    });
  }
  if (flags.concentration >= 40) {
    return pick(lang, {
      en: "You still placed a large slice in one name. Allowed in practice. If that ticker has a bad week, most of the bag moves together.",
      si: "තාම එක නමකට විශාල කෑල්ලක් දැම්මා. අභ්‍යාසයේදී ඉඩ තියෙනවා. ඒ ටිකර් එකට නරක සතියක් ආවොත් බෑග් එක වැඩිපුර සෙලවෙනවා.",
    });
  }
  if (flags.dropSell) {
    return pick(lang, {
      en: "You sold after a practice drop. That can be a plan — or a panic. Next time, write why before you confirm.",
      si: "අභ්‍යාස බැසීමකට පස්සේ විකුණුවා. ඒක සැලසුමක් වෙන්නත් පුළුවන්, panic එකක් වෙන්නත් පුළුවන්. ඊළඟ වතාවේ confirm එකට කලින් හේතුව ලියන්න.",
    });
  }
  if (flags.why === "crowd" || flags.support === "guess" || flags.support === "today-only") {
    return pick(lang, {
      en: "The trade went through. Next round, compare two companies and read the note — a crowd cue is not research.",
      si: "ගනුදෙනුව ගියා. ඊළඟ වටේ සමාගම් දෙකක් සසඳලා සටහන කියවන්න — රැළේ ඉඟියක් පර්යේෂණයක් නෙවෙයි.",
    });
  }
  if (flags.reflect === "calm" && (flags.support === "note-and-chart" || flags.support === "compared")) {
    return pick(lang, {
      en: "You used the note or a comparison, then confirmed. That is a thoughtful practice habit.",
      si: "සටහන හෝ සංසන්දනය භාවිතා කරලා confirm කළා. ඒක සිතාමතා අභ්‍යාස පුරුද්දක්.",
    });
  }
  return pick(lang, {
    en: "Filled on paper only. Check portfolio next: cash changed, and any gain or loss is still pretend.",
    si: "කඩදාසි මත විතරයි fill උනා. Portfolio එක බලන්න: මුදල් වෙනස් වුණා, ලාභය හෝ පාඩුව තවම අභ්‍යාසයි.",
  });
}

export function pnlWords(
  lang: CubLang,
  kind: "unrealized" | "realized",
  amount: number,
): string {
  const abs = Math.abs(Math.round(amount));
  if (kind === "realized") {
    if (amount > 0) {
      return pick(lang, {
        en: `Realized practice gain about Rs ${abs.toLocaleString()} — locked in because you sold. Not real cash.`,
        si: `විකුණුවා නිසා අභ්‍යාස ලාභය ආසන්න වශයෙන් Rs ${abs.toLocaleString()} — ඇත්ත මුදල් නෙවෙයි.`,
      });
    }
    if (amount < 0) {
      return pick(lang, {
        en: `Realized practice loss about Rs ${abs.toLocaleString()} — locked in because you sold. A lesson, not a bill.`,
        si: `විකුණුවා නිසා අභ්‍යාස පාඩුව ආසන්න වශයෙන් Rs ${abs.toLocaleString()} — බිලක් නෙවෙයි, පාඩමක්.`,
      });
    }
    return pick(lang, {
      en: "No realized gain or loss on that sell — the price matched your average.",
      si: "ඒ විකිණීමේදී ලාභයක් හෝ පාඩුවක් lock උනේ නැහැ — මිල සාමාන්‍යයට සමානයි.",
    });
  }
  if (amount > 0) {
    return pick(lang, {
      en: `Unrealized practice gain about Rs ${abs.toLocaleString()} — it can shrink if the price falls before you sell.`,
      si: `තවම විකුණලා නැති අභ්‍යාස ලාභය ආසන්න වශයෙන් Rs ${abs.toLocaleString()} — විකුණන්න කලින් මිල බැස්සොත් අඩු වෙන්න පුළුවන්.`,
    });
  }
  if (amount < 0) {
    return pick(lang, {
      en: `Unrealized practice loss about Rs ${abs.toLocaleString()} — it is on paper until you sell.`,
      si: `තවම විකුණලා නැති අභ්‍යාස පාඩුව ආසන්න වශයෙන් Rs ${abs.toLocaleString()} — විකුණනකම් කඩදාසි මතයි.`,
    });
  }
  return pick(lang, {
    en: "Unrealized change is about zero right now.",
    si: "දැන් unrealized වෙනස්කම බොහෝ දුරට ශුන්‍යයි.",
  });
}
