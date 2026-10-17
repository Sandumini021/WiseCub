import { PRACTICE_CASH_LKR } from "./demoMarket";
import type { Ticker } from "./syntheticPrices";

export type Holding = {
  ticker: Ticker;
  shares: number;
  avgPrice: number;
};

export type DemoTrade = {
  id: string;
  side: "buy" | "sell";
  ticker: Ticker;
  shares: number;
  price: number;
  at: string;
  reducedAfterWarning?: boolean;
};

export type DemoBook = {
  cash: number;
  holdings: Holding[];
  trades: DemoTrade[];
};

const KEY = "wisecub.marketDemoBook";

export function emptyBook(): DemoBook {
  return { cash: PRACTICE_CASH_LKR, holdings: [], trades: [] };
}

export function readBook(): DemoBook {
  const raw = window.localStorage.getItem(KEY);
  if (!raw) {
    return emptyBook();
  }
  try {
    const parsed = JSON.parse(raw) as DemoBook;
    if (typeof parsed.cash !== "number") {
      return emptyBook();
    }
    return parsed;
  } catch {
    return emptyBook();
  }
}

export function writeBook(book: DemoBook) {
  window.localStorage.setItem(KEY, JSON.stringify(book));
}

export function holdingOf(book: DemoBook, ticker: Ticker) {
  return book.holdings.find((row) => row.ticker === ticker);
}

export function applyTrade(
  book: DemoBook,
  input: {
    side: "buy" | "sell";
    ticker: Ticker;
    shares: number;
    price: number;
    reducedAfterWarning?: boolean;
  },
): { ok: true; book: DemoBook } | { ok: false; error: string } {
  const shares = Math.floor(input.shares);
  if (!Number.isFinite(shares) || shares < 1) {
    return { ok: false, error: "Choose at least 1 share." };
  }
  const cost = shares * input.price;
  const next: DemoBook = {
    cash: book.cash,
    holdings: book.holdings.map((row) => ({ ...row })),
    trades: [...book.trades],
  };
  const row = next.holdings.find((item) => item.ticker === input.ticker);

  if (input.side === "buy") {
    if (cost > next.cash + 0.001) {
      return { ok: false, error: "Not enough virtual cash for that many shares." };
    }
    next.cash = Math.round((next.cash - cost) * 100) / 100;
    if (row) {
      const total = row.shares * row.avgPrice + cost;
      row.shares += shares;
      row.avgPrice = total / row.shares;
    } else {
      next.holdings.push({ ticker: input.ticker, shares, avgPrice: input.price });
    }
  } else {
    if (!row || row.shares < shares) {
      return { ok: false, error: "You do not own that many shares to sell." };
    }
    next.cash = Math.round((next.cash + cost) * 100) / 100;
    row.shares -= shares;
    if (row.shares === 0) {
      next.holdings = next.holdings.filter((item) => item.ticker !== input.ticker);
    }
  }

  next.trades.unshift({
    id: `${Date.now()}`,
    side: input.side,
    ticker: input.ticker,
    shares,
    price: input.price,
    at: new Date().toISOString(),
    reducedAfterWarning: input.reducedAfterWarning,
  });
  return { ok: true, book: next };
}

export function holdingValue(book: DemoBook, ticker: Ticker, price: number) {
  const row = holdingOf(book, ticker);
  return (row?.shares ?? 0) * price;
}

export function totalEquity(book: DemoBook, prices: Record<string, number>) {
  const holdings = book.holdings.reduce(
    (sum, row) => sum + row.shares * (prices[row.ticker] ?? row.avgPrice),
    0,
  );
  return book.cash + holdings;
}

export function concentrationAfter(
  book: DemoBook,
  input: { side: "buy" | "sell"; ticker: Ticker; shares: number; price: number },
  prices: Record<string, number>,
) {
  const preview = applyTrade(book, input);
  if (!preview.ok) {
    return { error: preview.error, percent: 0 };
  }
  const equity = totalEquity(preview.book, { ...prices, [input.ticker]: input.price });
  const value = holdingValue(preview.book, input.ticker, input.price);
  const percent = equity <= 0 ? 0 : (value / equity) * 100;
  return { percent, error: undefined as string | undefined, cashAfter: preview.book.cash };
}
