import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { readCubLanguage } from "../../../pages/auth/demoSession";
import { CubCoachCard } from "../components/CubCoachCard";
import { pickCoach, type CoachCard } from "../data/decisionCoach";
import { flushQueuedEvents, recordMarketEvent } from "../data/behaviourEvents";
import { CROWD_SCENARIO, DROP_SCENARIO } from "../data/crowdScenarios";
import { DEMO_COMPANIES, readLesson1Complete } from "../data/demoMarket";
import {
  concentrationAfter,
  holdingOf,
  readBook,
  type DemoBook,
} from "../data/demoPortfolio";
import {
  buildQuotes,
  sliceHistory,
  type Quote,
  type Ticker,
} from "../data/syntheticPrices";
import { StockPriceChart } from "../components/StockPriceChart";
import "../../../styles/market-dashboard.css";

const RANGES = ["1D", "1W", "1M", "1Y"] as const;

const MARK: Record<string, string> = {
  SUNTEA: "🍃",
  LNKBNK: "🏦",
  CEYPOW: "⚡",
  HARBOR: "🚢",
  GRNNRG: "🌱",
};

function rupees(value: number) {
  return `Rs ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function MiniSpark({ points, down }: { points: number[]; down: boolean }) {
  if (points.length < 2) {
    return null;
  }
  const w = 72;
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
    <svg className="tk-spark" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline fill="none" stroke={down ? "#dc2626" : "#16a34a"} strokeWidth="2.5" points={line} />
    </svg>
  );
}

export function MarketTerminalPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const quotes = useMemo(() => buildQuotes(), []);
  const lang = readCubLanguage();
  const [unlocked, setUnlocked] = useState(false);
  const [book, setBook] = useState<DemoBook | null>(null);
  const requested = params.get("ticker") as Ticker | null;
  const [ticker, setTicker] = useState<Ticker>(
    requested && quotes.some((item) => item.ticker === requested) ? requested : "SUNTEA",
  );
  const [range, setRange] = useState<(typeof RANGES)[number]>("1W");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [shares, setShares] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [crowdSeen, setCrowdSeen] = useState(false);
  const [dropSeen, setDropSeen] = useState(false);
  const [viewed, setViewed] = useState<Ticker[]>(["SUNTEA"]);
  const [coach, setCoach] = useState<CoachCard | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);

  useEffect(() => {
    setUnlocked(readLesson1Complete());
    setBook(readBook());
    void flushQueuedEvents();
  }, []);

  useEffect(() => {
    if (!unlocked || crowdSeen) {
      return;
    }
    recordMarketEvent({
      type: "market_trend_viewed",
      ticker: CROWD_SCENARIO.ticker,
      scenarioId: CROWD_SCENARIO.scenarioId,
    });
    setCrowdSeen(true);
  }, [unlocked, crowdSeen]);

  useEffect(() => {
    if (!unlocked || side !== "sell" || ticker !== DROP_SCENARIO.ticker || dropSeen) {
      return;
    }
    recordMarketEvent({
      type: "price_drop_observed",
      ticker: DROP_SCENARIO.ticker,
      scenarioId: DROP_SCENARIO.scenarioId,
      changePct: DROP_SCENARIO.changePct,
    });
    setDropSeen(true);
  }, [unlocked, side, ticker, dropSeen]);

  const quote = quotes.find((item) => item.ticker === ticker) as Quote;
  const prices = Object.fromEntries(quotes.map((item) => [item.ticker, item.price]));
  const company = DEMO_COMPANIES.find((item) => item.ticker === ticker);
  const falling = quote.changePct < 0;
  const cost = shares * quote.price;
  const preview = book
    ? concentrationAfter(book, { side, ticker, shares, price: quote.price }, prices)
    : { percent: 0, error: "Loading…", cashAfter: 0 };
  const owned = book ? (holdingOf(book, ticker)?.shares ?? 0) : 0;
  const compared = viewed.length >= 2;
  const others = quotes.filter((item) => item.ticker !== ticker);

  useEffect(() => {
    if (!book || !unlocked) {
      return;
    }
    setCoach(
      pickCoach({
        lang,
        path: "terminal",
        changePct: quote.changePct,
        concentration: preview.percent,
        side,
        tradeCount: book.trades.length,
        viewedCompany: viewed.includes(ticker),
        dropSell: side === "sell" && ticker === DROP_SCENARIO.ticker,
        compared,
      }),
    );
  }, [book, unlocked, quote.changePct, preview.percent, side, ticker, viewed, compared, lang]);

  function openTicker(next: Ticker, price: number) {
    setTicker(next);
    setWhyOpen(false);
    setViewed((current) => (current.includes(next) ? current : [...current, next]));
    recordMarketEvent({ type: "company_viewed", ticker: next, price });
  }

  function placeOrder() {
    if (!book) {
      return;
    }
    if (preview.error) {
      setError(preview.error);
      return;
    }
    if (shares < 1) {
      setError("Choose at least 1 share.");
      return;
    }
    setError(null);
    navigate("/market/confirm", {
      state: {
        side,
        ticker,
        shares,
        price: quote.price,
        concentration: preview.percent,
        cashAfter: preview.cashAfter,
        owned,
        crowdScenario: crowdSeen ? CROWD_SCENARIO.scenarioId : undefined,
        dropScenario: dropSeen && side === "sell" ? DROP_SCENARIO.scenarioId : undefined,
      },
    });
  }

  if (!unlocked) {
    return (
      <section className="panel">
        <h1>Market is closed</h1>
        <p>Finish Lesson 1 first. The wireframe keeps the floor shut until you know what a share is.</p>
        <Link className="btn-gold cub-send" to="/market/lessons/1">
          Go to Lesson 1
        </Link>
      </section>
    );
  }

  if (!book) {
    return <p>Loading practice account…</p>;
  }

  const cashAfter = preview.error ? "—" : rupees(preview.cashAfter ?? 0);
  const concWarn = preview.percent >= 40 && !preview.error && side === "buy";

  return (
    <div className="terminal tk-shell">
      <header className="tk-top">
        <p className="tk-crumb">
          <Link to="/market">← Floor</Link>
          <span>Practice · virtual</span>
        </p>
        <h1>Terminal</h1>
        <p className="cash-pill">Cash {rupees(book.cash)}</p>
        <Link className="btn-ghost" to="/market/portfolio">
          Bag
        </Link>
      </header>

      {coach ? (
        <CubCoachCard compact card={coach} lang={lang} onDismiss={() => setCoach(null)} />
      ) : null}
      {crowdSeen ? (
        <p className="tk-banner" role="status">
          Crowd drill · 8 in 10 demo buys on SUNTEA (made-up)
        </p>
      ) : null}
      {side === "sell" && ticker === DROP_SCENARIO.ticker ? (
        <p className="tk-banner is-drop" role="status">
          Drop drill · SUNTEA −9% pretend price
        </p>
      ) : null}

      <div className="tk-tape" role="list">
        {quotes.map((item) => {
          const down = item.changePct < 0;
          return (
            <button
              key={item.ticker}
              type="button"
              role="listitem"
              className={`tk-chip${item.ticker === ticker ? " is-on" : ""}${down ? " is-down" : " is-up"}`}
              onClick={() => openTicker(item.ticker, item.price)}
            >
              <span aria-hidden="true">{MARK[item.ticker]}</span>
              <strong>{item.ticker}</strong>
              <em>
                {down ? "▼" : "▲"} {Math.abs(item.changePct).toFixed(1)}%
              </em>
            </button>
          );
        })}
      </div>

      <div className="terminal-grid tk-grid">
        <section className="tk-board">
          <div className={`tk-quote${falling ? " is-down" : " is-up"}`}>
            <p className="tk-sector">
              {MARK[quote.ticker]} {company?.sector} · demo
            </p>
            <h2>
              {company?.name} <span>{quote.ticker}</span>
            </h2>
            <p className="px">
              Rs {quote.price.toFixed(2)}
              <small>
                {falling ? "▼" : "▲"} {Math.abs(quote.changePct).toFixed(1)}%
              </small>
            </p>
          </div>
          <div className="range-row">
            {RANGES.map((item) => (
              <button
                key={item}
                type="button"
                className={`chip-btn${range === item ? " is-on" : ""}`}
                onClick={() => setRange(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <StockPriceChart points={sliceHistory(quote.history, range)} falling={falling} />
          <dl className="key-nums">
            <div>
              <dt>Open</dt>
              <dd>Rs {quote.open.toFixed(2)}</dd>
            </div>
            <div>
              <dt>High</dt>
              <dd>Rs {quote.high.toFixed(2)}</dd>
            </div>
            <div>
              <dt>Low</dt>
              <dd>Rs {quote.low.toFixed(2)}</dd>
            </div>
            <div>
              <dt>Vol</dt>
              <dd>{quote.volume.toLocaleString()}</dd>
            </div>
          </dl>

          <button type="button" className={`tk-why${whyOpen ? " is-open" : ""}`} onClick={() => setWhyOpen((v) => !v)}>
            <span>Why it moved</span>
            <em>demo story</em>
          </button>
          {whyOpen ? <p className="tk-why-body">{quote.why}</p> : null}

          <div className="tk-compare" aria-label="Compare another company">
            <p className="tk-label">Tap to compare · 10 shares</p>
            <div className="tk-compare-row">
              {others.map((item) => {
                const down = item.changePct < 0;
                return (
                  <button
                    key={item.ticker}
                    type="button"
                    className="tk-vs"
                    onClick={() => openTicker(item.ticker, item.price)}
                  >
                    <span className="tk-vs-head">
                      {MARK[item.ticker]} {item.ticker}
                    </span>
                    <MiniSpark points={item.history.slice(-12)} down={down} />
                    <strong className={down ? "is-down" : "is-up"}>
                      {down ? "▼" : "▲"} {Math.abs(item.changePct).toFixed(1)}%
                    </strong>
                    <small>{rupees(10 * item.price)}</small>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="tk-side">
          <section className={`tk-ticket is-${side}`}>
            <p className="tk-label">Order · no real money</p>
            <div className="side-toggle tk-toggle">
              <button type="button" className={side === "buy" ? "is-on is-buy" : ""} onClick={() => setSide("buy")}>
                Buy
              </button>
              <button type="button" className={side === "sell" ? "is-on is-sell" : ""} onClick={() => setSide("sell")}>
                Sell
              </button>
            </div>
            <p className="tk-own">
              {MARK[quote.ticker]} You hold <strong>{owned}</strong>
            </p>
            <label className="tk-shares">
              Shares
              <span className="stepper">
                <button type="button" onClick={() => setShares((n) => Math.max(1, n - 1))}>
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={shares}
                  onChange={(event) => setShares(Number(event.target.value))}
                />
                <button type="button" onClick={() => setShares((n) => n + 1)}>
                  +
                </button>
              </span>
            </label>
            <div className="tk-meter">
              <div>
                <span>Cost</span>
                <strong>{rupees(cost)}</strong>
              </div>
              <div>
                <span>Cash after</span>
                <strong>{cashAfter}</strong>
              </div>
            </div>
            {concWarn ? (
              <p className="tk-conc" role="status">
                ~{preview.percent.toFixed(0)}% would sit in one name
              </p>
            ) : null}
            {error || preview.error ? <p className="live-note is-try">{error ?? preview.error}</p> : null}
            <button className="btn-gold tk-go" type="button" onClick={placeOrder}>
              {side === "buy" ? "Buy" : "Sell"} {shares} {quote.ticker}
            </button>
          </section>

          <section className="tk-pos">
            <p className="tk-label">Positions</p>
            {book.holdings.length === 0 ? (
              <p className="tk-empty">Empty bag. Buy a slice to practise.</p>
            ) : (
              <ul className="tk-pos-list">
                {book.holdings.map((row) => {
                  const live = quotes.find((item) => item.ticker === row.ticker);
                  const down = (live?.changePct ?? 0) < 0;
                  return (
                    <li key={row.ticker}>
                      <button
                        type="button"
                        className={row.ticker === ticker ? "is-on" : ""}
                        onClick={() => live && openTicker(row.ticker, live.price)}
                      >
                        <span>
                          {MARK[row.ticker]} {row.ticker}
                        </span>
                        <em>×{row.shares}</em>
                        {live ? (
                          <small className={down ? "is-down" : "is-up"}>
                            {down ? "▼" : "▲"} {Math.abs(live.changePct).toFixed(1)}%
                          </small>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
