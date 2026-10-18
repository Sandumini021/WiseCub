import { PRACTICE_CASH_LKR } from "./demoMarket";
import { totalEquity, type DemoBook } from "./demoPortfolio";

export type HabitFlags = {
  concentrated: boolean;
  quickSells: number;
  listenedToWarning: boolean;
  tradeCount: number;
  valueChangePct: number;
};

export function reviewHabits(book: DemoBook, prices: Record<string, number>): HabitFlags {
  const equity = totalEquity(book, prices);
  const concentrated = book.holdings.some((row) => {
    const value = row.shares * (prices[row.ticker] ?? row.avgPrice);
    return equity > 0 && value / equity >= 0.4;
  });

  let quickSells = 0;
  const sorted = [...book.trades].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    const gap = new Date(cur.at).getTime() - new Date(prev.at).getTime();
    if (cur.side === "sell" && gap <= 60_000) {
      quickSells += 1;
    }
  }

  return {
    concentrated,
    quickSells,
    listenedToWarning: book.trades.some((trade) => trade.reducedAfterWarning),
    tradeCount: book.trades.length,
    valueChangePct: ((equity - PRACTICE_CASH_LKR) / PRACTICE_CASH_LKR) * 100,
  };
}

export function cubNoticed(flags: HabitFlags): string {
  if (flags.tradeCount === 0) {
    return "No practice trades yet. Buy a few slices on the terminal, then come back. We look at habits, not who made more pretend money.";
  }
  if (flags.quickSells >= 2) {
    return "You sold more than once very soon after another trade. In a real market that can be panic. Here it is only practice — next time try waiting.";
  }
  if (flags.concentrated) {
    return "A large slice of your practice money is in one company. Spreading across a few names is usually calmer.";
  }
  if (flags.listenedToWarning) {
    return "You chose fewer shares after Cub’s warning. That is noticing risk, which is what we measure.";
  }
  return "You made practice trades. Come back later and see whether waiting felt better than reacting. We never rank children by profit.";
}
