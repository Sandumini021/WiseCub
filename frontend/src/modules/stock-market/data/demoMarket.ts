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
    n: 1,
    title: "What is a Share?",
    blurb: "Learn the basics of shares and companies.",
    status: "open" as const,
    duration: "4 min",
    icon: "pie",
  },
  {
    n: 2,
    title: "Risk and Return",
    blurb: "Understand how prices go up and down.",
    status: "locked" as const,
    duration: "5 min",
    icon: "bars",
  },
  {
    n: 3,
    title: "Spreading Money",
    blurb: "Learn why diversification matters.",
    status: "locked" as const,
    duration: "5 min",
    icon: "trend",
  },
  {
    n: 4,
    title: "Compounding",
    blurb: "See how small gains can grow big over time.",
    status: "locked" as const,
    duration: "6 min",
    icon: "coins",
  },
];

export const LESSON_ONE_SCRIPT =
  "A share is one small slice of a company. If the company does well, your slice can become worth more. If it does badly, the slice can be worth less. You only practise with pretend rupees on WiseCub. Company names such as Sunrise Tea are fictional stand-ins.";

export const LESSON1_STORAGE_KEY = "wisecub.lesson1Complete";

export function readLesson1Complete(): boolean {
  return window.localStorage.getItem(LESSON1_STORAGE_KEY) === "true";
}

export function saveLesson1Complete() {
  window.localStorage.setItem(LESSON1_STORAGE_KEY, "true");
}
