import { childId } from "../../../pages/auth/demoSession";
import { postMarketEvent } from "../../../services/apiClient";
import type { DemoBook } from "./demoPortfolio";
import { DEMO_COMPANIES } from "./demoMarket";

export type MarketEventType =
  | "company_viewed"
  | "market_trend_viewed"
  | "risk_explanation_viewed"
  | "price_drop_observed"
  | "buy_order_placed"
  | "sell_order_placed"
  | "order_modified"
  | "order_cancelled"
  | "portfolio_reviewed"
  | "trade_reason_submitted"
  | "coaching_shown"
  | "coaching_response"
  | "habit_popup_opened"
  | "habit_card_tapped"
  | "lesson_completed";

export type MarketEventInput = {
  type: MarketEventType;
  ticker?: string;
  scenarioId?: string;
  price?: number;
  side?: "buy" | "sell";
  shares?: number;
  cash?: number;
  concentrationPct?: number;
  soldFraction?: number;
  changePct?: number;
  reason?: string;
  orderId?: string;
  modified?: boolean;
  book?: DemoBook;
  prices?: Record<string, number>;
};

const SESSION_KEY = "wisecub.marketSessionId";
const QUEUE_KEY = "wisecub.marketEventQueue";

export function marketSessionId(): string {
  let id = window.sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = window.crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function holdingsFrom(book?: DemoBook, prices?: Record<string, number>) {
  if (!book) {
    return undefined;
  }
  return book.holdings.map((row) => {
    const price = prices?.[row.ticker] ?? row.avgPrice;
    const sector = DEMO_COMPANIES.find((item) => item.ticker === row.ticker)?.sector;
    return {
      ticker: row.ticker,
      shares: row.shares,
      value: row.shares * price,
      sector,
    };
  });
}

export function recordMarketEvent(input: MarketEventInput) {
  const payload = {
    child_id: childId(),
    session_id: marketSessionId(),
    type: input.type,
    at: new Date().toISOString(),
    ticker: input.ticker,
    scenario_id: input.scenarioId,
    price: input.price,
    side: input.side,
    shares: input.shares,
    cash: input.cash ?? input.book?.cash,
    concentration_pct: input.concentrationPct,
    sold_fraction: input.soldFraction,
    change_pct: input.changePct,
    reason: input.reason,
    order_id: input.orderId,
    modified: input.modified,
    holdings: holdingsFrom(input.book, input.prices),
  };
  void postMarketEvent(payload).catch(() => {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    const queue = raw ? (JSON.parse(raw) as unknown[]) : [];
    queue.push(payload);
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-200)));
  });
}

export async function flushQueuedEvents() {
  const raw = window.localStorage.getItem(QUEUE_KEY);
  if (!raw) {
    return;
  }
  try {
    const queue = JSON.parse(raw) as Record<string, unknown>[];
    for (const item of queue) {
      await postMarketEvent(item);
    }
    window.localStorage.removeItem(QUEUE_KEY);
  } catch {
    // Keep the queue if Mongo is still down.
  }
}
