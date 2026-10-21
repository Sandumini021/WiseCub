import { childId } from "../../../pages/auth/demoSession";
import { saveModuleState } from "../../../services/apiClient";

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
    beats: [
      { t: "One slice", d: "A share is one piece of the cake — not the bakery." },
      { t: "Price can move", d: "The slice can be worth more or less later." },
      { t: "Pretend rupees", d: "Nothing here buys real tea or a real bank account." },
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
    beats: [
      { t: "Wobble", d: "Up yesterday does not mean up today." },
      { t: "Bigger jump", d: "Names that fly can also drop hard." },
      { t: "Practice only", d: "A fall here is a drill, never a real bill." },
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
    beats: [
      { t: "One basket", d: "All cash in SUNTEA means one headline shakes everything." },
      { t: "Split", d: "Tea + bank + power + harbour — one story cannot knock all." },
      { t: "Cub warn", d: "Near 40% in one name, Cub taps you on the shoulder." },
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
    finishHint: "Next: how a tiny pretend gain can grow if you leave it — and how a loss can grow too.",
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
    beats: [
      { t: "Leave it", d: "A small gain can grow on top of itself if you wait." },
      { t: "Both ways", d: "A drop can shrink the pile the same way. Time is not a shield." },
      { t: "No promise", d: "This is practice math, never a real-wealth guarantee." },
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
    finishHint: "Next: what actually happens when you tap Buy.",
  },
  {
    n: 5 as const,
    title: "How a Buy Works",
    blurb: "Cash leaves. Slices land in your bag. Nothing real is purchased.",
    duration: "4 min",
    icon: "buy",
    caption: "Buy = swap virtual cash for slices at today’s pretend price.",
    script:
      "When you buy, practice cash leaves your wallet and slices of that company land in your bag. You pay today’s pretend price, not yesterday’s. Cub will still ask why you chose that name. No real shop, bank, or tea is involved.",
    story: [
      "Tap Buy on SUNTEA. Cub checks your thinking. After confirm, cash goes down and SUNTEA shares go up. That is the whole swap.",
    ],
    points: [
      "You pay the price on the screen right now.",
      "Cash falls. Holdings rise. The bag updates.",
      "You can still walk away before confirm.",
    ],
    beats: [
      { t: "Cash out", d: "Virtual rupees leave the wallet. Nothing hits a real bank." },
      { t: "Slices in", d: "Those rupees become shares in My bag — tea, bank, power, and so on." },
      { t: "Today’s price", d: "Ten shares × today’s number. Yesterday’s price does not apply." },
    ],
    check: {
      question: "You buy 10 SUNTEA slices. What happened?",
      options: [
        { id: "a", label: "A real tea shop sent you tea" },
        { id: "b", label: "Practice cash went down and you now hold 10 slices" },
        { id: "c", label: "Cub froze the price so you cannot lose" },
      ],
      correct: "b",
      yes: "Yes. Buy is a swap: cash down, slices up, at today’s pretend price.",
      no: "Look again. No real goods move, and the price can still change after you buy.",
    },
    finishHint: "Next: selling — how cash comes back, and when waiting can be wiser.",
  },
  {
    n: 6 as const,
    title: "Selling Wisely",
    blurb: "A sell locks today’s price. A red day is not a rule to tap Sell.",
    duration: "5 min",
    icon: "sell",
    caption: "Sell = give the slices back and take today’s cash. That gap vs what you paid is locked in.",
    script:
      "Selling gives your slices back to the practice market and returns cash at today’s price. If you paid more than today, the drop is locked in. If you paid less, the gain is locked in. A red day is a signal to pause, not an order to sell. Cub will still ask why.",
    story: [
      "You still hold 24 SUNTEA. The number on the chart can bounce. Selling now turns that bounce off — cash is back, the story of those slices is finished.",
    ],
    points: [
      "You get today’s price, not the best price of the week.",
      "After a sell, that gain or loss is locked. Holding stays ‘paper’.",
      "Fear of a red candle is not a plan.",
    ],
    beats: [
      { t: "Cash back", d: "Slices leave the bag. Virtual cash returns at today’s print." },
      { t: "Locked", d: "The gap versus what you paid is now done. You cannot unsell the bounce." },
      { t: "Pause first", d: "A drop is practice. Ask Cub, compare another name, then decide." },
    ],
    check: {
      question: "SUNTEA fell today. What is the wise first move?",
      options: [
        { id: "a", label: "Sell at once so you ‘don’t lose more’" },
        { id: "b", label: "Pause — a red day is not a rule to sell" },
        { id: "c", label: "Ask Cub to send real money to cover it" },
      ],
      correct: "b",
      yes: "Right. Pause. Selling locks today’s number. Waiting keeps it as paper, which can still move.",
      no: "Try again. Panic-selling is a habit we practise not doing. Cub never sends real cash.",
    },
    finishHint: "Next: a simple decision path you can tap through before every order.",
  },
  {
    n: 7 as const,
    title: "How to Decide",
    blurb: "Pause, compare, answer Cub. Friends and green arrows are not a plan.",
    duration: "5 min",
    icon: "think",
    caption: "A good practice order is slow: look, compare, say why, then tap.",
    script:
      "A decision is a small checklist, not a feeling. Look at the company note. Compare at least one other name. Answer Cub’s questions: why this, what supports it, what could go wrong, how much of your bag. Then confirm. Copying a friend or chasing a green arrow skips the lesson.",
    story: [
      "Before Place practice order, Cub asks four questions. They are not a test score. They slow you down so the tap is yours, not the crowd’s.",
    ],
    points: [
      "Why this company — in your words.",
      "What could go wrong — a drop is allowed.",
      "How big a slice of the bag — Cub warns near 40%.",
    ],
    beats: [
      { t: "Look", d: "Read Why it moved. It is a demo story, not a hot tip." },
      { t: "Compare", d: "Open another ticker. Two names beat one impulse." },
      { t: "Answer Cub", d: "Why / support / wrong / risk. Then confirm — or walk away." },
    ],
    check: {
      question: "Best habit before you tap Buy?",
      options: [
        { id: "a", label: "Copy whoever bought SUNTEA in the crowd drill" },
        { id: "b", label: "Pause, compare, and answer Cub’s questions" },
        { id: "c", label: "Buy extra because the line is green" },
      ],
      correct: "b",
      yes: "That’s the path. Slow taps are the skill. Green is not permission.",
      no: "Not that one. Crowd cues and green candles are drills, not instructions.",
    },
    finishHint: "Next: why ‘everyone bought it’ is a made-up cue, not advice.",
  },
  {
    n: 8 as const,
    title: "Don’t Copy the Crowd",
    blurb: "Herd drills are fake. A popular name can still drop.",
    duration: "4 min",
    icon: "crowd",
    caption: "‘8 in 10 demo traders bought SUNTEA’ is a classroom cue — not real people.",
    script:
      "The crowd banner is a drill. Those demo traders are not classmates and not a reason to buy. Popular can still fall. Cub wants you to notice the pull, then choose with your own checklist. We never rank who copied fastest.",
    story: [
      "If eight pretend traders buy tea, your brain wants to join. That itch is the lesson. You can still open LNKBNK and walk away.",
    ],
    points: [
      "Made-up crowd, on purpose.",
      "Joining late is not safer.",
      "Your bag is not a popularity contest.",
    ],
    beats: [
      { t: "Fake crowd", d: "The 8-in-10 line is written for class. Nobody real bought." },
      { t: "Itch", d: "Wanting to join is normal. Noticing it is the skill." },
      { t: "Your tap", d: "Compare, or skip. Cub will not score you for missing a ‘hot’ name." },
    ],
    check: {
      question: "Cub says 8 in 10 demo traders bought SUNTEA. What should you do?",
      options: [
        { id: "a", label: "Buy SUNTEA so you are not left out" },
        { id: "b", label: "Treat it as a drill — decide with your own checklist" },
        { id: "c", label: "It must be a real CSE tip" },
      ],
      correct: "b",
      yes: "Yes. Herd text is a drill. Your checklist still wins.",
      no: "Look again. That banner is made-up and never a CSE tip.",
    },
    finishHint: "Next: paper gains versus locked-in gains after you sell.",
  },
  {
    n: 9 as const,
    title: "Paper vs Locked",
    blurb: "A number that is still in the bag can still vanish. A sell locks it.",
    duration: "4 min",
    icon: "lock",
    caption: "Paper = you still hold it. Locked = you already sold.",
    script:
      "Paper profit or loss is the gap while you still hold the slices. It can rise or fall tomorrow. Locked means you sold, so that gap is finished and cash is back. Cub shows both so you do not treat a green bag as money in your pocket.",
    story: [
      "Your bag says SUNTEA is up. That is paper. Spend it in your head and a drop can snatch it. Sell, and the story of those slices ends at today’s print.",
    ],
    points: [
      "Paper can disappear without a sell.",
      "Locked will not bounce with the old slices.",
      "We never rank children by either number.",
    ],
    beats: [
      { t: "Paper", d: "Still in the bag. The chart can take it back." },
      { t: "Locked", d: "You sold. Cash is in the wallet. That chapter is closed." },
      { t: "Not pocket money", d: "A green tile is practice maths, not rupees to spend." },
    ],
    check: {
      question: "SUNTEA is up, but you still hold it. Is that profit locked?",
      options: [
        { id: "a", label: "Yes — green means the cash is yours" },
        { id: "b", label: "No — it is paper until you sell, and it can still fall" },
        { id: "c", label: "Cub moves it to a real bank overnight" },
      ],
      correct: "b",
      yes: "Correct. Paper stays shaky until a sell locks it — still virtual either way.",
      no: "Try again. Green while you hold is paper, and nothing goes to a real bank.",
    },
    finishHint: "Last new habit: what to do when a price drops on purpose in the drill.",
  },
  {
    n: 10 as const,
    title: "When Prices Drop",
    blurb: "A drop drill is practice. Pause. Selling locks the fall.",
    duration: "4 min",
    icon: "pause",
    caption: "SUNTEA can fall about 9% in the drill. That is a pause light, not a siren.",
    script:
      "Sometimes the terminal shows a sharp pretend drop. That is a classroom drill. First move is pause. Read the note. You may hold, compare, or sell — but selling locks the fall. Cub is checking that you noticed, not that you ‘won’ the bounce.",
    story: [
      "A −9% banner looks loud. Loud is the point. Breathe, then choose. Walking away is a valid tap.",
    ],
    points: [
      "Notice the drop before you tap.",
      "Holding keeps it as paper.",
      "Selling is allowed — after a pause, not as a reflex.",
    ],
    beats: [
      { t: "Pause", d: "Read the drop banner. No real bill is attached." },
      { t: "Hold or sell", d: "Hold = still paper. Sell = lock today’s lower cash." },
      { t: "No rank", d: "Cub scores noticing, never who bought the dip fastest." },
    ],
    check: {
      question: "The drill shows SUNTEA −9%. First wise move?",
      options: [
        { id: "a", label: "Sell instantly so the red stops" },
        { id: "b", label: "Pause, read, then choose hold or sell on purpose" },
        { id: "c", label: "Buy as much as you can because it must bounce" },
      ],
      correct: "b",
      yes: "That’s it. Pause is the skill. Drops are not orders, and bounces are not promises.",
      no: "Not a reflex. Instant sells and ‘must bounce’ buys skip the lesson.",
    },
    finishHint: "All ten lessons are open to review. Keep practising on the terminal with virtual money only.",
  },
];

export const LESSON_COUNT = LESSONS.length;

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
  const completed = LESSONS.filter((lesson) => readLessonComplete(lesson.n)).map((lesson) => lesson.n);
  void saveModuleState(childId(), "market_lessons", {
    completed,
    last: n,
    at: new Date().toISOString(),
  }).catch(() => {
    /* keep the local unlock if Mongo is down */
  });
  void import("./behaviourEvents").then(({ recordMarketEvent }) => {
    recordMarketEvent({ type: "lesson_completed", reason: `lesson_${n}` });
  });
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
