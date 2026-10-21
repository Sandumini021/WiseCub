import type { CubLang } from "./cubAssistantTypes";

export const CUB_EXPRESSIONS = [
  "happy-welcome",
  "excited",
  "talking",
  "listening",
  "thinking",
  "confused",
  "concerned",
  "surprised",
  "sad",
  "encouraging",
  "explaining-risk",
  "giving-tip",
  "celebrating",
  "apologetic",
  "good-advice",
] as const;

export type CubExpression = (typeof CUB_EXPRESSIONS)[number];

export const CUB_EXPRESSION_FALLBACK = "/images/cub-wave.png";

export const CUB_EXPRESSION_SRC: Record<CubExpression, string> = {
  "happy-welcome": "/images/cub/expressions/happy-welcome.png",
  excited: "/images/cub/expressions/excited.png",
  talking: "/images/cub/expressions/talking.png",
  listening: "/images/cub/expressions/listening.png",
  thinking: "/images/cub/expressions/thinking.png",
  confused: "/images/cub/expressions/confused.png",
  concerned: "/images/cub/expressions/concerned.png",
  surprised: "/images/cub/expressions/surprised.png",
  sad: "/images/cub/expressions/sad.png",
  encouraging: "/images/cub/expressions/encouraging.png",
  "explaining-risk": "/images/cub/expressions/explaining-risk.png",
  "giving-tip": "/images/cub/expressions/giving-tip.png",
  celebrating: "/images/cub/expressions/celebrating.png",
  apologetic: "/images/cub/expressions/apologetic.png",
  "good-advice": "/images/cub/expressions/good-advice.png",
};

export const CUB_EXPRESSION_ALT: Record<CubExpression, { en: string; si: string }> = {
  "happy-welcome": { en: "Cub waving hello", si: "Cub අත වනනවා" },
  excited: { en: "Cub looking excited", si: "Cub උද්යෝගයෙන්" },
  talking: { en: "Cub explaining", si: "Cub පැහැදිලි කරනවා" },
  listening: { en: "Cub listening", si: "Cub අහනවා" },
  thinking: { en: "Cub thinking", si: "Cub හිතනවා" },
  confused: { en: "Cub looking unsure", si: "Cub අවිනිශ්චිතයි" },
  concerned: { en: "Cub looking concerned", si: "Cub කනස්සල්ලෙන්" },
  surprised: { en: "Cub looking surprised", si: "Cub පුදුමයෙන්" },
  sad: { en: "Cub looking upset", si: "Cub තරහකින් නැතිව අමාරුවෙන්" },
  encouraging: { en: "Cub encouraging you", si: "Cub දිරිගන්වනවා" },
  "explaining-risk": { en: "Cub explaining a risk", si: "Cub අවදානමක් පහදනවා" },
  "giving-tip": { en: "Cub giving a tip", si: "Cub ඉඟියක් දෙනවා" },
  celebrating: { en: "Cub celebrating", si: "Cub සතුටු වෙනවා" },
  apologetic: { en: "Cub saying oops", si: "Cub කණගාටුවෙන්" },
  "good-advice": { en: "Cub sharing advice", si: "Cub උපදෙසක් දෙනවා" },
};

const PATTERN_EXPRESSION: Record<string, CubExpression> = {
  herd_behaviour: "thinking",
  impulsive_investing: "concerned",
  panic_selling: "concerned",
  overconfidence: "thinking",
  poor_diversification: "thinking",
  insufficient_research: "thinking",
};

type PatternCopy = { en: string; si: string; sg?: string };

function copyAt(copy: PatternCopy, lang: CubLang) {
  if (lang === "sg") {
    return copy.sg ?? copy.en;
  }
  return lang === "si" ? copy.si : copy.en;
}

const PATTERN_REVIEW: Record<string, PatternCopy> = {
  herd_behaviour: {
    en: "A crowd cue is not a reason by itself. Open the company note before you tap buy.",
    si: "රැළේ යන්න එක විතරක් හේතුවක් නෙවෙයි. ගන්න කලින් සමාගමේ note එක කියවන්න.",
  },
  impulsive_investing: {
    en: "Fast taps can skip the plan. Pause, read, then place the next practice order.",
    si: "ඉක්මන් tap වලින් plan එක මඟ හැරෙන්න පුළුවන්. ටිකක් නවතිලා කියවලා ඊළඟ order එක දාන්න.",
  },
  panic_selling: {
    en: "A labelled drop can feel scary. Selling a big slice very fast is worth a second look.",
    si: "මිල බැස්සම බයක් දැනෙන්න පුළුවන්. ඉක්මනට විශාල කොටසක් විකුණන එක ආයෙත් බලන්න ඕනේ.",
  },
  overconfidence: {
    en: "One win is not a shield. Check size and how much sits in one name.",
    si: "එක ජයක් ආරක්ෂාවක් නෙවෙයි. ප්‍රමාණය සහ එක නමකට කොච්චරද කියලා බලන්න.",
  },
  poor_diversification: {
    en: "If most practice money sits in one company, a bad day hits harder. Spreading can soften that.",
    si: "අභ්‍යාස මුදල් බොහොමයක් එක සමාගමක නම්, නරක දවසක් වැඩියෙන් වද්දනවා. බෙදීමෙන් ඒක අඩු වෙන්න පුළුවන්.",
  },
  insufficient_research: {
    en: "Two quick orders without an in-app note means we cannot see a check. Open the company page first.",
    si: "Note එකක් නැතුව ඉක්මන් order දෙකක් තියෙනවා නම්, බැලුවා කියලා පෙන්නන්නේ නැහැ. පළමුව සමාගමේ පිටුව අරින්න.",
  },
};

const PATTERN_NOT_SEEN: PatternCopy = {
  en: "Not seen in this session’s taps. Missing taps are not a good-character score.",
  si: "මේ session එකේ tap වල මේක පේන්නේ නැහැ. Tap නැති එක හොඳ චරිතයක් කියලා නෙවෙයි.",
};

export function expressionSrc(expression: CubExpression) {
  return CUB_EXPRESSION_SRC[expression] ?? CUB_EXPRESSION_FALLBACK;
}

export function expressionForPattern(behaviour: string, level: string): CubExpression {
  if (level === "not_observed") {
    return "listening";
  }
  if (level !== "worth_reviewing") {
    return "listening";
  }
  return PATTERN_EXPRESSION[behaviour] ?? "thinking";
}

export function patternTitle(behaviour: string) {
  return behaviour.split("_").join(" ");
}

export function patternMessage(behaviour: string, level: string, lang: CubLang): string {
  if (level === "not_observed") {
    return copyAt(PATTERN_NOT_SEEN, lang);
  }
  if (level !== "worth_reviewing") {
    return copyAt(PATTERN_NOT_SEEN, lang);
  }
  return copyAt(PATTERN_REVIEW[behaviour] ?? PATTERN_NOT_SEEN, lang);
}

export function defaultDecisionCub(options: {
  hasReview: boolean;
  hasVisiblePatterns: boolean;
  lang: CubLang;
}): { expression: CubExpression; message: string } {
  if (options.hasReview) {
    return {
      expression: "encouraging",
      message:
        options.lang === "si"
          ? "කාඩ් එකක් තියන්න. මම ඒ session එකේ tap විතරක් ගැන කතා කරනවා — රෝග විනිශ්චයක් නෙවෙයි."
          : "Tap a card. I only talk about this session’s taps — never a diagnosis.",
    };
  }
  if (options.hasVisiblePatterns) {
    return {
      expression: "celebrating",
      message:
        options.lang === "si"
          ? "මේ session එකේ review කරන්න තරම් සාක්ෂි නැහැ. ඒක නිකන්, ලකුණක් නෙවෙයි."
          : "Nothing here reached “worth reviewing”. That is not a grade. Keep practising slowly.",
    };
  }
  return {
    expression: "happy-welcome",
    message:
      options.lang === "si"
        ? "Practice trades කරලා portfolio එකට ආයෙත් එන්න. Evidence ඕනේ තරම් නැත්නම් මම pattern එකක් නම් කරන්නේ නැහැ."
        : "Make a few practice trades, then come back. I will not name a pattern without enough taps.",
  };
}

export function tipMessage(lang: CubLang, activity: string): { expression: CubExpression; message: string } {
  return {
    expression: "giving-tip",
    message:
      lang === "si"
        ? `උත්සාහයක්: ${activity}`
        : `A practice idea: ${activity}`,
  };
}
