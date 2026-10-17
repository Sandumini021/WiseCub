import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CubMascot } from "../../../components/cub-assistant/CubMascot";
import { DEMO_COMPANIES } from "../data/demoMarket";
import { readBook, totalEquity, type DemoBook } from "../data/demoPortfolio";
import { cubNoticed, reviewHabits } from "../data/sessionReview";
import { buildQuotes } from "../data/syntheticPrices";
import "../../../styles/market-dashboard.css";

function tradeTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function PortfolioPage() {
  const quotes = useMemo(() => buildQuotes(), []);
  const prices = Object.fromEntries(quotes.map((item) => [item.ticker, item.price]));
  const [book] = useState<DemoBook>(() => readBook());

  const equity = totalEquity(book, prices);
  const flags = reviewHabits(book, prices);
  const falling = flags.valueChangePct < 0;
  const cashPct = equity > 0 ? (book.cash / equity) * 100 : 100;
  const today = book.trades.slice(0, 8);

  return (
    <div className="portfolio-page">
      <p className="muted">
        <Link to="/market/terminal">← Terminal</Link> · Practice · {flags.tradeCount}{" "}
        {flags.tradeCount === 1 ? "trade" : "trades"} today · virtual only
      </p>
      <div className="terminal-head">
        <h1>My portfolio</h1>
        <Link className="btn-gold cub-send" to="/market/terminal">
          Trade again
        </Link>
      </div>

      <div className="terminal-grid">
        <div>
          <section className="panel">
            <p className="muted">Total value</p>
            <p className={`px ${falling ? "is-down" : "is-up"}`}>
              Rs {equity.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
              {falling ? "▼" : "▲"} {Math.abs(flags.valueChangePct).toFixed(1)}%
            </p>
            <p className="muted">value since you started with Rs 100,000 virtual</p>
          </section>

          <section className="panel">
            <h2>How your money is spread</h2>
            <p className="spread-chips">
              {book.holdings.map((row) => {
                const value = row.shares * (prices[row.ticker] ?? row.avgPrice);
                const pct = equity > 0 ? (value / equity) * 100 : 0;
                return (
                  <span key={row.ticker}>
                    {row.ticker} {pct.toFixed(0)}
                  </span>
                );
              })}
              <span>CASH {cashPct.toFixed(0)}</span>
            </p>
          </section>

          <section className="panel">
            <h2>Holdings</h2>
            {book.holdings.length === 0 ? (
              <p className="muted">
                No slices yet.{" "}
                <Link to="/market/terminal">Open the terminal</Link> to buy practice shares.
              </p>
            ) : (
              <ul className="spread-list">
                {book.holdings.map((row) => {
                  const price = prices[row.ticker] ?? row.avgPrice;
                  const value = row.shares * price;
                  const change = ((price - row.avgPrice) / row.avgPrice) * 100;
                  const down = change < 0;
                  const name = DEMO_COMPANIES.find((c) => c.ticker === row.ticker)?.name;
                  return (
                    <li key={row.ticker}>
                      <div className="spread-row">
                        <strong>
                          {row.ticker}
                          <span className="muted"> · {name}</span>
                        </strong>
                        <span className={down ? "is-down" : "is-up"}>
                          {down ? "▼" : "▲"} {Math.abs(change).toFixed(1)}%
                        </span>
                      </div>
                      <p>
                        {row.shares} shares · Rs{" "}
                        {value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <div className="spread-bar" aria-hidden="true">
                        <span style={{ width: `${Math.min(100, (value / equity) * 100)}%` }} />
                      </div>
                    </li>
                  );
                })}
                <li>
                  <div className="spread-row">
                    <strong>Cash</strong>
                    <span>Rs {book.cash.toLocaleString()}</span>
                  </div>
                </li>
              </ul>
            )}
          </section>

          <section className="panel">
            <h2>Today’s trades</h2>
            {today.length === 0 ? (
              <p className="muted">None yet.</p>
            ) : (
              <ul className="holding-list">
                {today.map((trade) => (
                  <li key={trade.id}>
                    {trade.side === "buy" ? "Bought" : "Sold"} {trade.ticker} ×{trade.shares}{" "}
                    <span className="muted">{tradeTime(trade.at)}</span>
                    {trade.reducedAfterWarning ? " · reduced after Cub’s warning" : ""}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside>
          <section className="panel cub-says">
            <CubMascot size={72} />
            <div>
              <strong>What Cub noticed today</strong>
              <p>{cubNoticed(flags)}</p>
            </div>
          </section>
          <section className="panel">
            <h2>Habits, not returns</h2>
            <ul className="measure-list">
              <li>Patience {flags.quickSells >= 2 ? "— try waiting longer" : "— no rush-sells spotted"}</li>
              <li>Spread {flags.concentrated ? "— one name is large" : "— not piled into one name"}</li>
              <li>
                Research{" "}
                {flags.listenedToWarning ? "— you used Cub’s warning" : "— read Cub before big buys"}
              </li>
            </ul>
          </section>
          <section className="panel">
            <h2>Goes to the parent report</h2>
            <p>
              Risk behaviour and reasoning only — never a profit ranking against other children.
            </p>
          </section>
          <section className="panel">
            <h2>Lesson 2 — risk and return</h2>
            <p>Locked until we build that lesson. The market stays a practice account.</p>
            <Link to="/market">Back to Market Floor</Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
