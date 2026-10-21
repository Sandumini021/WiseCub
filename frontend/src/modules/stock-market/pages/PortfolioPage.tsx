import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CubFace } from "../../../components/cub-assistant/CubFace";
import { defaultDecisionCub } from "../../../components/cub-assistant/cubExpressions";
import { childId, readCubLanguage } from "../../../pages/auth/demoSession";
import { getMarketBehaviour, type BehaviourReport } from "../../../services/apiClient";
import { portfolioAllocation } from "../data/allocation";
import { marketSessionId, recordMarketEvent } from "../data/behaviourEvents";
import { DEMO_COMPANIES } from "../data/demoMarket";
import { readBook, realizedPnL, totalEquity, type DemoBook, unrealizedPnL } from "../data/demoPortfolio";
import { CubCoachCard } from "../components/CubCoachCard";
import { HabitPopup } from "../components/HabitPopup";
import { pickCoach, type CoachCard } from "../data/decisionCoach";
import { cubNoticed, reviewHabits } from "../data/sessionReview";
import { buildQuotes, type Quote } from "../data/syntheticPrices";
import "../../../styles/market-dashboard.css";
import "../../../styles/market-habit.css";

const MARK: Record<string, string> = {
  SUNTEA: "🍃",
  LNKBNK: "🏦",
  CEYPOW: "⚡",
  HARBOR: "🚢",
  GRNNRG: "🌱",
  CASH: "💵",
};

const RING: Record<string, string> = {
  SUNTEA: "#f5c400",
  LNKBNK: "#3b82f6",
  CEYPOW: "#8b5cf6",
  HARBOR: "#06b6d4",
  GRNNRG: "#22c55e",
  CASH: "#94a3b8",
};

function rupees(value: number) {
  return `Rs ${Math.round(value).toLocaleString("en-LK")}`;
}

function MiniSpark({ points, down }: { points: number[]; down: boolean }) {
  if (points.length < 2) {
    return null;
  }
  const w = 88;
  const h = 28;
  const min = Math.min(...points);
  const span = Math.max(...points) - min || 1;
  const line = points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * w;
      const y = h - ((value - min) / span) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg className="pf-spark" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline fill="none" stroke={down ? "#dc2626" : "#16a34a"} strokeWidth="2.5" points={line} />
    </svg>
  );
}

function AllocationRing({
  slices,
  selected,
  onPick,
}: {
  slices: Array<{ key: string; pct: number }>;
  selected: string | null;
  onPick: (key: string) => void;
}) {
  const size = 168;
  const r = 58;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg className="pf-ring" viewBox="0 0 168 168" role="img" aria-label="How your bag is split">
      <circle cx="84" cy="84" r={r} fill="none" stroke="#eef2f8" strokeWidth="22" />
      {slices
        .filter((slice) => slice.pct > 0.4)
        .map((slice) => {
          const dash = (slice.pct / 100) * c;
          const gap = c - dash;
          const el = (
            <circle
              key={slice.key}
              cx="84"
              cy="84"
              r={r}
              fill="none"
              stroke={RING[slice.key] ?? "#64748b"}
              strokeWidth={selected === slice.key ? 26 : 22}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 84 84)"
              className="pf-ring-seg"
              onClick={() => onPick(slice.key)}
            />
          );
          offset += dash;
          return el;
        })}
      <text x="84" y="80" textAnchor="middle" className="pf-ring-label">
        {selected ?? "BAG"}
      </text>
      <text x="84" y="100" textAnchor="middle" className="pf-ring-sub">
        {slices.find((slice) => slice.key === selected)?.pct.toFixed(0) ?? ""}
        {selected ? "%" : ""}
      </text>
    </svg>
  );
}

function tradeTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function PortfolioPage() {
  const quotes = useMemo(() => buildQuotes(), []);
  const prices = useMemo(
    () => Object.fromEntries(quotes.map((item) => [item.ticker, item.price])),
    [quotes],
  );
  const quoteMap = useMemo(
    () => Object.fromEntries(quotes.map((item) => [item.ticker, item])) as Record<string, Quote>,
    [quotes],
  );
  const [book] = useState<DemoBook>(() => readBook());
  const [report, setReport] = useState<BehaviourReport | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [tab, setTab] = useState<"bag" | "activity">("bag");
  const [coach, setCoach] = useState<CoachCard | null>(null);
  const lang = readCubLanguage();

  const equity = totalEquity(book, prices);
  const mix = portfolioAllocation(book, prices);
  const flags = reviewHabits(book, prices);
  const falling = flags.valueChangePct < 0;
  const cashPct = mix.cashPct ?? (equity > 0 ? (book.cash / equity) * 100 : 100);
  const today = book.trades.slice(0, 10);
  const paper = unrealizedPnL(book, prices);
  const locked = realizedPnL(book);
  const slices = [
    ...mix.companies.map((row) => ({ key: row.ticker, pct: row.pct })),
    { key: "CASH", pct: cashPct },
  ];

  useEffect(() => {
    recordMarketEvent({ type: "portfolio_reviewed", book, prices, cash: book.cash });
    setCoach(pickCoach({ lang: readCubLanguage(), path: "portfolio", tradeCount: readBook().trades.length }));
    void getMarketBehaviour(childId(), marketSessionId())
      .then(setReport)
      .catch(() => setReport(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="portfolio-page pf-page">
      <header className="pf-hero">
        <div>
          <p className="pf-kicker">
            <Link to="/market/terminal">← Terminal</Link>
            <span>Practice · virtual</span>
          </p>
          <h1>My bag</h1>
          <p className={`pf-total ${falling ? "is-down" : "is-up"}`}>
            {rupees(equity)}
            <small>
              {falling ? "▼" : "▲"} {Math.abs(flags.valueChangePct).toFixed(1)}%
            </small>
          </p>
        </div>
        <div className="pf-stat-row">
          <button type="button" className="pf-stat" onClick={() => setFocus("CASH")}>
            <span>Cash</span>
            <b>{rupees(book.cash)}</b>
          </button>
          <button type="button" className={`pf-stat ${paper < 0 ? "is-down" : "is-up"}`} onClick={() => setTab("bag")}>
            <span>Paper</span>
            <b>
              {paper >= 0 ? "+" : "−"}
              {rupees(Math.abs(paper))}
            </b>
          </button>
          <button type="button" className={`pf-stat ${locked < 0 ? "is-down" : "is-up"}`} onClick={() => setTab("activity")}>
            <span>Locked in</span>
            <b>
              {locked >= 0 ? "+" : "−"}
              {rupees(Math.abs(locked))}
            </b>
          </button>
        </div>
        <Link className="btn-gold cub-send pf-trade" to="/market/terminal">
          Trade
        </Link>
      </header>

      {coach ? (
        <CubCoachCard compact card={coach} lang={lang} onDismiss={() => setCoach(null)} />
      ) : null}

      <div className="pf-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "bag"} className={tab === "bag" ? "is-on" : ""} onClick={() => setTab("bag")}>
          Bag
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "activity"}
          className={tab === "activity" ? "is-on" : ""}
          onClick={() => setTab("activity")}
        >
          Activity
        </button>
      </div>

      {tab === "bag" ? (
        <div className="pf-grid">
          <section className="pf-card pf-mix">
            <AllocationRing slices={slices} selected={focus} onPick={setFocus} />
            <ul className="pf-legend">
              {slices.map((slice) => (
                <li key={slice.key}>
                  <button
                    type="button"
                    className={focus === slice.key ? "is-on" : ""}
                    onClick={() => setFocus(slice.key)}
                  >
                    <i style={{ background: RING[slice.key] }} />
                    {MARK[slice.key]} {slice.key}
                    <b>{slice.pct.toFixed(0)}%</b>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="pf-card">
            <div className="pf-card-head">
              <h2>Holdings</h2>
              <span className="pf-count">{book.holdings.length}</span>
            </div>
            {book.holdings.length === 0 ? (
              <Link className="pf-empty" to="/market/terminal">
                <span>👜</span>
                <strong>Empty bag</strong>
                Buy a small practice slice
              </Link>
            ) : (
              <ul className="pf-holds">
                {book.holdings.map((row) => {
                  const price = prices[row.ticker] ?? row.avgPrice;
                  const value = row.shares * price;
                  const change = ((price - row.avgPrice) / row.avgPrice) * 100;
                  const down = change < 0;
                  const open = focus === row.ticker;
                  const quote = quoteMap[row.ticker];
                  return (
                    <li key={row.ticker}>
                      <button
                        type="button"
                        className={`pf-hold${open ? " is-on" : ""}`}
                        onClick={() => setFocus(open ? null : row.ticker)}
                      >
                        <span className="pf-mark">{MARK[row.ticker]}</span>
                        <span>
                          <strong>{row.ticker}</strong>
                          <em>{row.shares} sh</em>
                        </span>
                        {quote ? <MiniSpark points={quote.history.slice(-12)} down={down} /> : null}
                        <span className={down ? "is-down" : "is-up"}>
                          {down ? "▼" : "▲"} {Math.abs(change).toFixed(1)}%
                        </span>
                      </button>
                      {open ? (
                        <div className="pf-hold-more">
                          <span>{rupees(value)}</span>
                          <span>Avg {rupees(row.avgPrice)}</span>
                          <Link to={`/market/terminal?ticker=${row.ticker}`}>Open chart</Link>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <aside className="pf-card pf-cub">
            <DecisionCubPanel report={report} fallback={cubNoticed(flags)} lang={lang} />
            <HabitPopup report={report} flags={flags} lang={lang} />
          </aside>
        </div>
      ) : (
        <section className="pf-card" id="history">
          <div className="pf-card-head">
            <h2>Today</h2>
            <span className="pf-count">{today.length}</span>
          </div>
          {today.length === 0 ? (
            <p className="pf-quiet">No taps yet.</p>
          ) : (
            <ol className="pf-activity">
              {today.map((trade) => (
                <li key={trade.id}>
                  <span className={`pf-side ${trade.side}`}>{trade.side === "buy" ? "B" : "S"}</span>
                  <div>
                    <strong>
                      {trade.ticker} ×{trade.shares}
                    </strong>
                    <em>
                      {tradeTime(trade.at)}
                      {trade.reducedAfterWarning ? " · smaller after Cub" : ""}
                    </em>
                  </div>
                  <b>
                    {trade.realized != null && trade.side === "sell"
                      ? `${trade.realized >= 0 ? "+" : ""}${rupees(trade.realized)}`
                      : rupees(trade.shares * trade.price)}
                  </b>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}

function DecisionCubPanel({
  report,
  fallback,
  lang,
}: {
  report: BehaviourReport | null;
  fallback: string;
  lang: "en" | "si";
}) {
  const visible = report?.indicators.filter((item) => item.level !== "insufficient_evidence") ?? [];
  const review = visible.filter((item) => item.level === "worth_reviewing");
  const expression = report
    ? defaultDecisionCub({
        hasReview: review.length > 0,
        hasVisiblePatterns: visible.length > 0,
        lang,
      })
    : { expression: "listening" as const, message: fallback };
  const teaser =
    lang === "si"
      ? "කහ බොත්තම තියන්න. Cub පුරුදු ගැන popup එකකින් කියනවා."
      : "Tap the yellow button. Cub pops up about this session’s habits — never a grade.";

  return (
    <div className="pf-cub-face">
      <CubFace
        expression={expression.expression}
        message={review.length ? teaser : expression.message}
        size={88}
        lang={lang}
      />
    </div>
  );
}
