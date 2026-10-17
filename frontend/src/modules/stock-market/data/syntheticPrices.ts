import { DEMO_COMPANIES } from "./demoMarket";

export type Ticker = (typeof DEMO_COMPANIES)[number]["ticker"];

export type Quote = {
  ticker: Ticker;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  changePct: number;
  why: string;
  history: number[];
};

const BASE: Record<Ticker, number> = {
  SUNTEA: 480,
  LNKBNK: 212,
  CEYPOW: 1050,
  HARBOR: 96,
  GRNNRG: 34,
};

const WHY: Record<Ticker, string> = {
  SUNTEA:
    "A made-up tea news story moved the pretend price. In a real market, weather and demand can do this. Here it is only a demo.",
  LNKBNK:
    "A fictional bank update nudged the price. Banks often move when people worry about loans. This number is synthetic.",
  CEYPOW:
    "Pretend power-usage news. Utility prices can look calm, then jump. These points are generated, not from the CSE.",
  HARBOR:
    "A fake shipping delay. Logistics stocks can wiggle when boats are late. Demo data only.",
  GRNNRG:
    "A made-up green-energy headline. New energy names can swing a lot. Still pretend.",
};

function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function hashTicker(ticker: string) {
  return [...ticker].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

export function buildQuotes(): Quote[] {
  return DEMO_COMPANIES.map((company) => {
    const random = seeded(hashTicker(company.ticker) * 97);
    const start = BASE[company.ticker];
    const history: number[] = [];
    let price = start;
    for (let i = 0; i < 36; i += 1) {
      const step = (random() - 0.48) * start * 0.025;
      price = Math.max(start * 0.6, price + step);
      history.push(Math.round(price * 100) / 100);
    }
    const last = history[history.length - 1];
    const open = history[0];
    const high = Math.max(...history);
    const low = Math.min(...history);
    const changePct = ((last - open) / open) * 100;
    return {
      ticker: company.ticker,
      price: last,
      open,
      high,
      low,
      volume: 8000 + Math.round(random() * 40000),
      changePct,
      why: WHY[company.ticker],
      history,
    };
  });
}

export function sliceHistory(history: number[], range: "1D" | "1W" | "1M" | "1Y") {
  const keep = { "1D": 8, "1W": 16, "1M": 24, "1Y": 36 }[range];
  return history.slice(-keep);
}
