import { DEMO_COMPANIES } from "./demoMarket";
import type { DemoBook } from "./demoPortfolio";

export type Allocation = {
  usable: boolean;
  total: number;
  cash: number;
  cashPct: number | null;
  companies: Array<{ ticker: string; shares: number; value: number; sector: string; pct: number }>;
  sectors: Array<{ sector: string; value: number; pct: number }>;
  largestCompanyPct: number | null;
  largestTicker: string | null;
};

function sectorOf(ticker: string) {
  return DEMO_COMPANIES.find((row) => row.ticker === ticker)?.sector ?? "Unknown";
}

export function portfolioAllocation(book: DemoBook, prices: Record<string, number>): Allocation {
  const cash = Number.isFinite(book.cash) ? Math.max(0, book.cash) : 0;
  const companies = book.holdings.map((row) => {
    const price = prices[row.ticker] ?? row.avgPrice;
    const value = row.shares * price;
    return {
      ticker: row.ticker,
      shares: row.shares,
      value,
      sector: sectorOf(row.ticker),
      pct: 0,
    };
  });
  const total = cash + companies.reduce((sum, row) => sum + row.value, 0);
  if (total <= 0) {
    return {
      usable: false,
      total: 0,
      cash,
      cashPct: null,
      companies: [],
      sectors: [],
      largestCompanyPct: null,
      largestTicker: null,
    };
  }
  for (const row of companies) {
    row.pct = (100 * row.value) / total;
  }
  const sectorsMap = new Map<string, number>();
  for (const row of companies) {
    sectorsMap.set(row.sector, (sectorsMap.get(row.sector) ?? 0) + row.value);
  }
  const sectors = [...sectorsMap.entries()]
    .map(([sector, value]) => ({ sector, value, pct: (100 * value) / total }))
    .sort((a, b) => b.value - a.value);
  const largest = companies.reduce(
    (best, row) => (row.value > best.value ? row : best),
    companies[0] ?? { ticker: null, value: 0, pct: 0 },
  );
  return {
    usable: true,
    total,
    cash,
    cashPct: (100 * cash) / total,
    companies,
    sectors,
    largestCompanyPct: companies.length ? largest.pct : 0,
    largestTicker: companies.length ? (largest as { ticker: string }).ticker : null,
  };
}
