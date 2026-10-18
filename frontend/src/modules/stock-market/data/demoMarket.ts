export const PRACTICE_CASH_LKR = 100_000;

export const DEMO_COMPANIES = [
  { ticker: "SUNTEA", name: "Sunrise Tea PLC", sector: "Tea", tone: "tea" },
  { ticker: "LNKBNK", name: "Link Bank PLC", sector: "Banks", tone: "bank" },
  { ticker: "CEYPOW", name: "Ceylon Power PLC", sector: "Power", tone: "power" },
  { ticker: "HARBOR", name: "Harbor Holdings", sector: "Logistics", tone: "logistics" },
  { ticker: "GRNNRG", name: "Green Energy PLC", sector: "Energy", tone: "energy" },
] as const;

export const LESSONS = [
  {
    n: 1 as const,
    title: "What is a Share?",
    blurb: "Learn the basics of shares and companies.",
    duration: "4 min",
    icon: "pie",
    caption: "SUNTEA is one fictional company, split into slices.",
    script:
      "A share is one small slice of a company. If the company does well, your slice can become worth more. If it does badly, the slice can be worth less. You only practise with pretend rupees on WiseCub. Company names such as Sunrise Tea are fictional stand-ins.",
    story: [
      "Imagine Sunrise Tea PLC as a round cake. Each slice is a share. If you own one slice, you own a tiny part of that company — not the whole bakery, and not real money in a bank.",
    ],
    points: [
      "If the company does well, your slice can be worth more.",
      "If it does badly, your slice can be worth less.",
      "On WiseCub you only practise with virtual rupees.",
    ],
    check: {
      question: "You buy 1 of 100 slices of SUNTEA (Sunrise Tea PLC). What do you own?",
      options: [
        { id: "a", label: "The whole tea company" },
        { id: "b", label: "One share — one small slice of the company" },
        { id: "c", label: "A real bank account and real tea" },
      ],
      correct: "b",
      yes: "Yes. One slice = one share. You did not buy the whole company, and nothing real was purchased.",
      no: "Not quite — try again. Think of the pie: each coloured piece is one share. There is no real bank involved.",
    },
    finishHint: "The practice terminal is open after this lesson. Lesson 2 is unlocked next.",
  },
  {
    n: 2 as const,
    title: "Risk and Return",
    blurb: "Understand how prices go up and down.",
    duration: "5 min",
    icon: "bars",
    caption: "Prices wiggle. A bigger possible gain often means a bigger possible drop.",
    script:
      "Risk means the pretend price can fall. Return means it can rise. A company that jumps a lot can also drop a lot. On WiseCub the numbers are synthetic, so you can practise staying calm. No real money is at risk.",
    story: [
      "Yesterday SUNTEA’s pretend price went up. Today it might go down. That wobble is risk. The chance it grows is return. You cannot have only the up days.",
      "A calm company may move slowly. A jumpy one can look exciting and then fall. Cub cares that you notice the drop — not that you “win”.",
    ],
    points: [
      "Prices move both ways. A rise is not a promise.",
      "More possible return usually means more possible loss.",
      "On WiseCub a drop is practice, never a real bill.",
    ],
    check: {
      question: "If your SUNTEA slice falls from Rs 480 to Rs 400, what is true?",
      options: [
        { id: "a", label: "WiseCub owes you the missing rupees in real cash" },
        { id: "b", label: "Your slice is worth less for now — that is risk" },
        { id: "c", label: "The company must bounce back tomorrow" },
      ],
      correct: "b",
      yes: "Right. A lower price means your slice is worth less right now. It might recover, or not. That uncertainty is risk.",
      no: "Try again. A drop does not send real money, and nobody can promise it will bounce back.",
    },
    finishHint: "Next, learn why spreading virtual money across companies can soften one bad drop.",
  },
  {
    n: 3 as const,
    title: "Spreading Money",
    blurb: "Learn why diversification matters.",
    duration: "5 min",
    icon: "trend",
    caption: "Four fictional companies. One drop hurts less if you did not put everything in one name.",
    script:
      "Spreading money means buying more than one fictional company. If SUNTEA has a bad day, LNKBNK or CEYPOW might be fine. Putting every virtual rupee in one ticker is like carrying all your eggs in one basket. Habits matter more than a high score.",
    story: [
      "You have Rs 100,000 of practice cash. If you buy only SUNTEA, one tea headline can shake the whole bag. If you split across tea, a bank, power and a harbour, one story cannot knock everything at once.",
      "This is called diversification. It does not make you “safe forever”. It just means one mistake is smaller.",
    ],
    points: [
      "One company can have a bad week. Several names share the bump.",
      "Cub will warn you if one ticker becomes too large a slice of your bag.",
      "We measure spreading — never who made the most pretend profit.",
    ],
    check: {
      question: "You spend all your virtual cash on SUNTEA only. What is the habit problem?",
      options: [
        { id: "a", label: "Nothing — one name is always safest" },
        { id: "b", label: "Your practice bag is concentrated, so one drop hits everything" },
        { id: "c", label: "Cub will send real money to fix it" },
      ],
      correct: "b",
      yes: "Yes. All eggs in one basket. Spreading across fictional companies is the habit we practise.",
      no: "Look again. One ticker is not automatically safe, and Cub never sends real rupees.",
    },
    finishHint: "Last lesson: how small pretend gains can grow if you leave them — and how losses can grow too.",
  },
  {
    n: 4 as const,
    title: "Compounding",
    blurb: "See how small gains can grow big over time.",
    duration: "6 min",
    icon: "coins",
    caption: "A little, left alone, can grow. A little loss can grow too. Time is the engine.",
    script:
      "Compounding means a gain can earn another gain if you leave it. Ten pretend rupees that grow, then grow again, become more than adding ten each year. The same idea works on the way down, so patience still matters. This is a demo, not a promise of real wealth.",
    story: [
      "Think of a coin stack. Year one you add a little. Year two you add a little on top of that little. The stack is not just taller by the same step — it can speed up.",
      "If the stack shrinks, the next drop can bite a smaller pile. Time works both ways. Cub wants you to wait and notice, not to chase a rank.",
    ],
    points: [
      "Leaving a gain in place can help it grow again.",
      "Rushing to sell after one green day skips that practice.",
      "Nothing here is a real investment or a guaranteed return.",
    ],
    check: {
      question: "You leave a small pretend gain in SUNTEA for years. What can happen?",
      options: [
        { id: "a", label: "Cub pays you real rupees each birthday" },
        { id: "b", label: "The amount can grow on top of itself — or shrink if prices fall" },
        { id: "c", label: "The price is frozen so you cannot lose" },
      ],
      correct: "b",
      yes: "Exactly. Compounding can help a pile grow, and a falling price can still cut it. Time is not a shield.",
      no: "Try again. There is no real payout and no frozen price. Gains and losses can both stack over time.",
    },
    finishHint: "All four lessons are open to review. Keep practising on the terminal with virtual money only.",
  },
];

export const LESSON_ONE_SCRIPT = LESSONS[0].script;

export const LESSON1_STORAGE_KEY = "wisecub.lesson1Complete";

export function lessonStorageKey(n: number) {
  return n === 1 ? LESSON1_STORAGE_KEY : `wisecub.lesson${n}Complete`;
}

export function readLessonComplete(n: number): boolean {
  return window.localStorage.getItem(lessonStorageKey(n)) === "true";
}

export function saveLessonComplete(n: number) {
  window.localStorage.setItem(lessonStorageKey(n), "true");
}

export function readLesson1Complete(): boolean {
  return readLessonComplete(1);
}

export function saveLesson1Complete() {
  saveLessonComplete(1);
}

export function isLessonUnlocked(n: number): boolean {
  if (n <= 1) {
    return true;
  }
  return readLessonComplete(n - 1);
}

export function getLesson(n: number) {
  return LESSONS.find((lesson) => lesson.n === n);
}
