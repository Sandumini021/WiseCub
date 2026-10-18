import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

export function MarketTerminalPage() {
  const navigate = useNavigate();
  const quotes = useMemo(() => buildQuotes(), []);
  const [unlocked, setUnlocked] = useState(false);
  const [book, setBook] = useState<DemoBook | null>(null);
  const [ticker, setTicker] = useState<Ticker>("SUNTEA");
  const [range, setRange] = useState<(typeof RANGES)[number]>("1W");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [shares, setShares] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [crowdSeen, setCrowdSeen] = useState(false);
  const [dropSeen, setDropSeen] = useState(false);

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

  return (
    <div className="terminal">
      <p className="muted">
        <Link to="/market">← Market Floor</Link> · Practice account · OPEN · virtual only
      </p>
      <div className="terminal-head">
        <h1>Market terminal</h1>
        <p className="cash-pill">Cash Rs {book.cash.toLocaleString()}</p>
        <Link className="btn-ghost" to="/market/portfolio">
          My portfolio
        </Link>
      </div>

      {crowdSeen ? (
        <p className="warn-box" role="status">
          {CROWD_SCENARIO.text}
        </p>
      ) : null}
      {side === "sell" && ticker === DROP_SCENARIO.ticker ? (
        <p className="warn-box" role="status">
          {DROP_SCENARIO.text}
        </p>
      ) : null}

      <div className="ticker-bar" role="list">
        {quotes.map((item) => (
          <button
            key={item.ticker}
            type="button"
            role="listitem"
            className={`ticker-btn${item.ticker === ticker ? " is-on" : ""}`}
            onClick={() => {
              setTicker(item.ticker);
              recordMarketEvent({ type: "company_viewed", ticker: item.ticker, price: item.price });
            }}
          >
            {item.ticker} {item.changePct >= 0 ? "▲" : "▼"}
          </button>
        ))}
      </div>

      <div className="terminal-grid">
        <section className="panel">
          <p className="muted">{company?.sector} · fictional name</p>
          <h2>
            {company?.name} ({quote.ticker})
          </h2>
          <p className={`px ${falling ? "is-down" : "is-up"}`}>
            Rs {quote.price.toFixed(2)} {falling ? "▼" : "▲"} {Math.abs(quote.changePct).toFixed(1)}%
            today
          </p>
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
              <dt>Volume</dt>
              <dd>{quote.volume.toLocaleString()}</dd>
            </div>
          </dl>
          <p>
            <strong>Why it moved (age 13 version):</strong> {quote.why}
          </p>
        </section>

        <aside>
          <section className="panel">
            <h2>Order ticket</h2>
            <div className="side-toggle">
              <button type="button" className={side === "buy" ? "is-on" : ""} onClick={() => setSide("buy")}>
                Buy
              </button>
              <button type="button" className={side === "sell" ? "is-on" : ""} onClick={() => setSide("sell")}>
                Sell
              </button>
            </div>
            <label>
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
            <p>Est. cost Rs {cost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            <p>
              Cash after {preview.error ? "—" : `Rs ${preview.cashAfter?.toLocaleString()}`}
            </p>
            <p>You own {owned} {quote.ticker} now.</p>
            {preview.percent >= 40 && !preview.error && side === "buy" ? (
              <p className="warn-box">
                Cub: this would put about {preview.percent.toFixed(0)}% of your practice money in one
                company.
              </p>
            ) : null}
            {error || preview.error ? <p className="live-note is-try">{error ?? preview.error}</p> : null}
            <button className="btn-gold" type="button" onClick={placeOrder}>
              Place practice order
            </button>
            <p className="muted">No real money moves.</p>
          </section>
          <section className="panel">
            <h2>My positions</h2>
            {book.holdings.length === 0 ? (
              <p className="muted">None yet. Buy a few slices to practise.</p>
            ) : (
              <ul className="holding-list">
                {book.holdings.map((row) => (
                  <li key={row.ticker}>
                    {row.ticker} ×{row.shares}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
