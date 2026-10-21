import { applyTaxRule, type TaxRule } from "./applyTax";
import type { TaxLesson, TaxQuizItem, TaxScenario } from "../taxApi";

const PRACTICE: TaxRule = {
  id: "practice_simple",
  mode: "hypothetical",
  title: "Practice lab (made-up numbers)",
  year_of_assessment: null,
  personal_relief: "50000",
  bands: [
    { width: "50000", rate: "0.06" },
    { width: "50000", rate: "0.18" },
    { width: null, rate: "0.24" },
  ],
  interest_ait_rate: null,
  expired: false,
  is_current: false,
  sources: [],
  notes: ["These amounts are invented for class.", "They are not Inland Revenue rates."],
  valid_from: "2000-01-01",
  valid_to: "2099-12-31",
  verification_date: null,
};

const LK: TaxRule = {
  id: "lk_pit_2025_2026",
  mode: "verified",
  title: "Sri Lanka personal income tax — YA 2025/2026",
  year_of_assessment: "2025/2026",
  personal_relief: "1800000",
  bands: [
    { width: "1000000", rate: "0.06" },
    { width: "500000", rate: "0.18" },
    { width: "500000", rate: "0.24" },
    { width: "500000", rate: "0.30" },
    { width: null, rate: "0.36" },
  ],
  interest_ait_rate: "0.10",
  expired: true,
  is_current: false,
  sources: [
    {
      title: "IRD tax chart 2025/2026",
      url: "https://www.ird.gov.lk/en/publications/SitePages/tax_chart_2526.aspx",
    },
    {
      title: "IRD Public Notice PN/IT/2025-01 (26 Mar 2025)",
      url: "https://www.ird.gov.lk/en/Lists/Latest%20News%20%20Notices/Attachments/666/PN_IT_2025-01_26032025_E.pdf",
    },
  ],
  notes: [
    "Personal relief of Rs 1,800,000 applies to resident individuals and non-resident citizens.",
    "Bands apply to taxable income after reliefs, not to the whole amount at the top rate.",
    "Not a substitute for professional tax advice.",
  ],
  valid_from: "2025-04-01",
  valid_to: "2026-03-31",
  verification_date: "2026-10-21",
};

export const LOCAL_RULES: TaxRule[] = [PRACTICE, LK];

type Copy = { en: string; si: string };

function pick(block: Copy, lang: string) {
  if (lang === "si") {
    return block.si;
  }
  return block.en;
}

const LESSONS_SRC = [
  {
    id: "what-are-taxes",
    title: { en: "What are taxes?", si: "බදු කියන්නේ මොකක්ද?" },
    blurb: {
      en: "Why governments collect a slice — and why WiseCub only practises with pretend rupees.",
      si: "රජය කොටසක් එකතු කරන්නේ ඇයි — WiseCub අභ්‍යාස රුපියල්වලින් විතරයි.",
    },
    beats: [
      {
        t: { en: "A share for everyone", si: "හැමෝටම කොටසක්" },
        d: {
          en: "Tax is money people and businesses pay so roads, schools, and hospitals can be funded. Cub never sends a real tax bill.",
          si: "බදු කියන්නේ පාරවල්, පාසල්, රෝහල් වගේ දේවල්ට මුදල් යන විදිහ. Cub ඇත්ත බදු බිලක් යවන්නේ නැහැ.",
        },
      },
      {
        t: { en: "Not a fine", si: "දඩයක් නෙවෙයි" },
        d: {
          en: "Tax is not a punishment. It is a sharing rule written in law. Children practise the idea here, not a real filing.",
          si: "බදු දඬුවමක් නෙවෙයි. නීතියේ තියෙන බෙදාගැනීමේ රීතියක්.",
        },
      },
    ],
    check: {
      q: { en: "Why do governments collect tax?", si: "රජය බදු එකතු කරන්නේ ඇයි?" },
      options: [
        { id: "a", en: "To punish everyone who saves", si: "ඉතිරි කරන හැමෝටම දඬුවම් කරන්න" },
        { id: "b", en: "To help pay for shared things like schools and roads", si: "පාසල්, පාරවල් වගේ එකට පාවිච්චි කරන දේවල්ට" },
        { id: "c", en: "Because Cub needs real rupees", si: "Cub ට ඇත්ත රුපියල් ඕනේ නිසා" },
      ],
      correct: "b",
    },
  },
  {
    id: "direct-indirect",
    title: { en: "Direct and indirect tax", si: "සෘජු සහ වක්‍ර බදු" },
    blurb: { en: "Who the bill is named for.", si: "බිලේ නම කාගේද." },
    beats: [
      {
        t: { en: "Direct", si: "සෘජු" },
        d: { en: "Income tax is direct: it is worked out from income.", si: "ආදායම් බදු සෘජුයි: ආදායමෙන් ගණනය කරනවා." },
      },
      {
        t: { en: "Indirect", si: "වක්‍ර" },
        d: { en: "VAT on a snack is indirect: it is baked into the price.", si: "කෑමක VAT වක්‍රයි: මිල ඇතුළේ තියෙනවා." },
      },
    ],
    check: {
      q: { en: "VAT on a juice is…", si: "ජූස් එකක VAT එක…" },
      options: [
        { id: "a", en: "Direct income tax", si: "සෘජු ආදායම් බද්ද" },
        { id: "b", en: "An indirect tax in the price", si: "මිලේ තියෙන වක්‍ර බද්දක්" },
        { id: "c", en: "A Cub badge", si: "Cub බැජ් එකක්" },
      ],
      correct: "b",
    },
  },
  {
    id: "kinds-of-income",
    title: { en: "Kinds of income", si: "ආදායම් වර්ග" },
    blurb: { en: "Job, tutoring, business profit, and interest are different stories.", si: "රැකියාව, ඉගැන්වීම, ව්‍යාපාර ලාභය, පොලිය වෙනස්." },
    beats: [
      {
        t: { en: "Earned", si: "උපයන" },
        d: { en: "Wages and tutoring fees are money you earn.", si: "වැටුප් සහ ඉගැන්වීමේ ගාස්තු උපයන මුදල්." },
      },
      {
        t: { en: "Interest", si: "පොලිය" },
        d: {
          en: "Interest is extra the bank may add. The pile you already saved is not automatically a tax bill.",
          si: "පොලිය බැංකුව එකතු කරන අමතරයි. ඉතිරි කරපු ගොඩ ඒකෙන්ම බදු බිලක් නෙවෙයි.",
        },
      },
    ],
    check: {
      q: { en: "Rs 10,000 sitting in a savings account is…", si: "ඉතිරි ගිණුමේ තියෙන රු. 10,000…" },
      options: [
        { id: "a", en: "Automatically a full income-tax bill this year", si: "ඒකෙන්ම මේ අවුරුද්දේ ආදායම් බදු බිලක්" },
        { id: "b", en: "Saved money — interest on it might be income, the pile is not", si: "ඉතිරි මුදල් — පොලිය ආදායමක් වෙන්න පුළුවන්, ගොඩ නෙවෙයි" },
        { id: "c", en: "Cub’s salary", si: "Cub ගේ වැටුප" },
      ],
      correct: "b",
    },
  },
  {
    id: "gross-taxable-payable",
    title: { en: "Gross, taxable, payable", si: "මුළු, බදු යටතේ, ගෙවිය යුතු" },
    blurb: { en: "Three different numbers.", si: "අංක තුනක්." },
    beats: [
      { t: { en: "Gross", si: "මුළු ආදායම" }, d: { en: "Gross is what arrived.", si: "ආපු මුදල." } },
      {
        t: { en: "Relief then taxable", si: "සහනය ඊට පස්සේ බදු යටතේ" },
        d: { en: "A personal relief can come off first. What is left may be taxable income.", si: "පෞද්ගලික සහනයක් අඩු කරන්න පුළුවන්." },
      },
      {
        t: { en: "Payable", si: "ගෙවිය යුතු" },
        d: { en: "Tax payable is the estimate after bands. Net is gross minus that estimate.", si: "ගෙවිය යුතු බද්ද තීරුවලින් ආපු ඇස්තමේන්තුව." },
      },
    ],
    check: {
      q: { en: "If relief is bigger than income, taxable income is…", si: "සහනය ආදායමට වඩා වැඩි නම් බදු යටතේ ආදායම…" },
      options: [
        { id: "a", en: "The whole income at the highest band", si: "මුළු ආදායම උසස්ම තීරුවෙන්" },
        { id: "b", en: "Zero in this simple lab", si: "මේ lab එකේ ශුන්‍යයි" },
        { id: "c", en: "Cub’s secret number", si: "Cub ගේ රහස් අංකය" },
      ],
      correct: "b",
    },
  },
  {
    id: "bands",
    title: { en: "Thresholds and bands", si: "සීමා සහ තීරු" },
    blurb: { en: "Crossing a line does not re-tax the whole cake at the new rate.", si: "රේඛාව ඉක්මවුවා කියලා මුළු කේක් එක අළුත් rate එකෙන් නැහැ." },
    beats: [
      {
        t: { en: "Only the extra slice", si: "අමතර කෑල්ල විතරයි" },
        d: {
          en: "In a progressive system, the new rate applies to income in that band. Earlier slices keep their own rates.",
          si: "ප්‍රගතිශීලී ක්‍රමයකදී අළුත් rate එක ඒ තීරුවේ කොටසට.",
        },
      },
    ],
    check: {
      q: { en: "When income crosses into a higher band…", si: "ආදායම උසස් තීරුවකට ගියාම…" },
      options: [
        { id: "a", en: "Every rupee is taxed at the new top rate", si: "හැම රුපියලක්ම අළුත් උසස් rate එකෙන්" },
        { id: "b", en: "Only the part in the new band uses that rate", si: "අළුත් තීරුවේ කොටස විතරයි ඒ rate එකෙන්" },
        { id: "c", en: "Tax becomes zero", si: "බද්ද ශුන්‍ය වෙනවා" },
      ],
      correct: "b",
    },
  },
  {
    id: "not-advice",
    title: { en: "Practice, not advice", si: "පුහුණුව, උපදෙස් නෙවෙයි" },
    blurb: { en: "Real tax depends on type of income, reliefs, and the year of assessment.", si: "ඇත්ත බද්ද ආදායම් වර්ගය, සහන, තක්සේරු වර්ෂය අනුව." },
    beats: [
      {
        t: { en: "Two modes", si: "මාදිලි දෙකක්" },
        d: {
          en: "Yellow practice numbers are made-up. Sri Lanka mode shows IRD-backed 2025/2026 figures with sources.",
          si: "කහ අංක අභ්‍යාසයි. ශ්‍රී ලංකා මාදිලිය IRD 2025/2026 රූප සමඟ.",
        },
      },
    ],
    check: {
      q: { en: "This lab is…", si: "මේ lab එක…" },
      options: [
        { id: "a", en: "A replacement for an accountant", si: "ගණකාධිකාරීවරයෙකුට ආදේශකයක්" },
        { id: "b", en: "A learning simulator with pretend or labelled official figures", si: "ඉගෙනුම් simulator එකක්" },
        { id: "c", en: "A real IRD login", si: "ඇත්ත IRD login එකක්" },
      ],
      correct: "b",
    },
  },
];

const SCENARIOS_SRC = [
  {
    id: "tutoring",
    income_kind: "tutoring",
    title: { en: "Tutoring", si: "ඉගැන්වීම" },
    story: { en: "Amal helps younger students with maths after school.", si: "අමල් පාසලෙන් පස්සේ ගණිතය උගන්වනවා." },
    default_income: "80000",
    suggested_rule: "practice_simple",
  },
  {
    id: "employment",
    income_kind: "employment",
    title: { en: "A job", si: "රැකියාවක්" },
    story: { en: "Nisha’s first full-time job pays a yearly salary (practice figure).", si: "නිශාගේ පළමු සම්පූර්ණ රැකියාවේ වාර්ෂික වැටුප." },
    default_income: "2400000",
    suggested_rule: "lk_pit_2025_2026",
  },
  {
    id: "business",
    income_kind: "business",
    title: { en: "Small business profit", si: "කුඩා ව්‍යාපාර ලාභය" },
    story: { en: "A home bakery’s profit after ingredients (not the full till).", si: "ගෙදර බේකරියක ද්‍රව්‍ය වියදම් අඩු කරපු ලාභය." },
    default_income: "120000",
    suggested_rule: "practice_simple",
  },
  {
    id: "savings_interest",
    income_kind: "savings_interest",
    title: { en: "Savings + interest", si: "ඉතිරි + පොලිය" },
    story: { en: "Rs 80,000 stays in an account. Only the interest slider is treated as income here.", si: "රු. 80,000 ගිණුමේ තියෙනවා. මෙහෙ ආදායම විදිහට ගන්නේ පොලිය විතරයි." },
    default_income: "2000",
    suggested_rule: "practice_simple",
    saved_pile: "80000",
  },
];

const QUIZ_SRC = [
  {
    id: "q1",
    kind: "mcq" as const,
    q: { en: "Gross income is…", si: "මුළු ආදායම කියන්නේ…" },
    options: [
      { id: "a", en: "Money that arrived before reliefs and tax", si: "සහන සහ බදු කලින් ආපු මුදල" },
      { id: "b", en: "Always the tax bill", si: "හැම වෙලේම බදු බිල" },
      { id: "c", en: "Cub’s pocket money", si: "Cub ගේ පොකට් මුදල්" },
    ],
    correct: "a",
    points: 10,
  },
  {
    id: "q2",
    kind: "mcq" as const,
    q: { en: "A progressive band means…", si: "ප්‍රගතිශීලී තීරුවක් කියන්නේ…" },
    options: [
      { id: "a", en: "The new rate hits only that slice", si: "අළුත් rate එක ඒ කොටසට විතරයි" },
      { id: "b", en: "The whole income jumps to the top rate", si: "මුළු ආදායම උසස්ම rate එකට යනවා" },
      { id: "c", en: "Saving is illegal", si: "ඉතිරි කිරීම නීති විරෝධීයි" },
    ],
    correct: "a",
    points: 10,
  },
  {
    id: "q3",
    kind: "calc" as const,
    rule_id: "practice_simple",
    income: "40000",
    income_kind: "tutoring",
    q: {
      en: "Practice rule: relief Rs 50,000. Tutoring Rs 40,000. Estimated tax?",
      si: "අභ්‍යාස රීතිය: සහන රු. 50,000. ඉගැන්වීම රු. 40,000. ඇස්තමේන්තු බද්ද?",
    },
    points: 15,
  },
  {
    id: "q4",
    kind: "mcq" as const,
    q: { en: "Setting money aside for a possible tax bill in this lab is…", si: "මේ lab එකේ බදු බිලකට මුදල් වෙන් කිරීම…" },
    options: [
      { id: "a", en: "A budgeting exercise, not a law that always applies", si: "අයවැය අභ්‍යාසයක් — හැම විටම නීතියක් නෙවෙයි" },
      { id: "b", en: "Required for every child in Sri Lanka", si: "ශ්‍රී ලංකාවේ හැම ළමයෙකුටම අනිවාර්යයි" },
      { id: "c", en: "Cub taking your cash", si: "Cub ඔයාගේ මුදල් ගන්න එක" },
    ],
    correct: "a",
    points: 10,
  },
  {
    id: "q5",
    kind: "mcq" as const,
    q: { en: "Sri Lanka figures in this lab…", si: "මේ lab එකේ ශ්‍රී ලංකා රූප…" },
    options: [
      { id: "a", en: "Are labelled with YA 2025/2026 and IRD sources", si: "YA 2025/2026 සහ IRD මූලාශ්‍ර සමඟ ලේබල්" },
      { id: "b", en: "Are Cub’s guesses with no source", si: "මූලාශ්‍රයක් නැති Cub අනුමාන" },
      { id: "c", en: "Replace an IRD return", si: "IRD return එකට ආදේශකයි" },
    ],
    correct: "a",
    points: 10,
  },
];

export function localLessons(lang: string): TaxLesson[] {
  return LESSONS_SRC.map((lesson) => ({
    id: lesson.id,
    title: pick(lesson.title, lang),
    blurb: pick(lesson.blurb, lang),
    beats: lesson.beats.map((beat) => ({ t: pick(beat.t, lang), d: pick(beat.d, lang) })),
    check: {
      q: pick(lesson.check.q, lang),
      options: lesson.check.options.map((opt) => ({ id: opt.id, label: pick(opt, lang) })),
      correct: lesson.check.correct,
    },
  }));
}

export function localScenarios(lang: string): TaxScenario[] {
  return SCENARIOS_SRC.map((item) => ({
    id: item.id,
    income_kind: item.income_kind,
    title: pick(item.title, lang),
    story: pick(item.story, lang),
    default_income: item.default_income,
    suggested_rule: item.suggested_rule,
    saved_pile: "saved_pile" in item ? item.saved_pile : null,
  }));
}

export function localQuiz(lang: string): TaxQuizItem[] {
  return QUIZ_SRC.map((item) => {
    const row: TaxQuizItem = {
      id: item.id,
      kind: item.kind,
      q: pick(item.q, lang),
      points: item.points,
    };
    if (item.kind === "mcq") {
      row.options = item.options.map((opt) => ({ id: opt.id, label: pick(opt, lang) }));
    } else {
      row.rule_id = item.rule_id;
      row.income = item.income;
      row.income_kind = item.income_kind;
    }
    return row;
  });
}

export function localDisclaimer(lang: string) {
  return lang === "si"
    ? "අභ්‍යාසයි. බදු උපදෙස් නෙවෙයි. නිල රූප වර්ෂය සහ මූලාශ්‍රය සමඟ."
    : "Practice only. Not tax advice. Official numbers are labelled with year and source.";
}

export function localTaxPack(lang: string) {
  const picked = lang === "si" ? "si" : "en";
  return {
    lang: picked as "en" | "si",
    lessons: localLessons(picked),
    scenarios: localScenarios(picked),
    quiz: localQuiz(picked),
    disclaimer: localDisclaimer(picked),
    rules: LOCAL_RULES,
  };
}

export function gradeTaxLocal(body: { question_id: string; choice?: string; amount?: string }) {
  const item = QUIZ_SRC.find((row) => row.id === body.question_id);
  if (!item) {
    return { ok: false, points: 0, hint: "Unknown question." };
  }
  if (item.kind === "mcq") {
    const ok = body.choice === item.correct;
    return {
      ok,
      points: ok ? item.points : 0,
      hint: ok ? "Cub: nice noticing." : "Try another yellow card.",
      correct: item.correct,
    };
  }
  const rule = LOCAL_RULES.find((row) => row.id === item.rule_id) ?? PRACTICE;
  const expected = applyTaxRule(rule, Number(item.income), item.income_kind).tax;
  const given = Number(body.amount ?? "0");
  const ok = Number.isFinite(given) && given === expected;
  return {
    ok,
    points: ok ? item.points : 0,
    hint: ok ? "Cub: the relief ate the whole amount." : `Estimated tax is Rs ${expected} with the practice rule.`,
    correct_amount: String(expected),
  };
}
