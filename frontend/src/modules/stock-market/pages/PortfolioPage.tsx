import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CubMascot } from "../../../components/cub-assistant/CubMascot";
import { DEMO_COMPANIES } from "../data/demoMarket";
import { readBook, totalEquity, type DemoBook } from "../data/demoPortfolio";
import { cubNoticed, reviewHabits } from "../data/sessionReview";
import { buildQuotes } from "../data/syntheticPrices";
import "../../../styles/market-dashboard.css";

export function PortfolioPage() {
  const quotes = useMemo(() => buildQuotes(), []);
  const prices = Object.fromEntries(quotes.map((item) => [item.ticker, item.price]));
  const [book, setBook] = useState<DemoBook | null>(null);

  useEffect(() => {
    setBook(readBook());
  }, []);

  if (!book) {
    return <p>Loading practice account…</p>;
  }

  const equity = totalEquity(book, prices);
  const flags = reviewHabits(book, prices);
  const falling = flags.valueChangePct < 0;
  const today = book.trades.slice(0, 8);

  return (
    <div className="portfolio-page">
      <p className="muted">
        <Link to="/market/terminal">← Terminal</Link> · Practice · {flags.tradeCount} trades ·
        virtual only
      </p>
      <div className="terminal-head">
        <h1>My portfolio</h1>
        <Link className="btn-ghost" to="/market/terminal">
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
            <p className="muted">since you started with Rs 100,000 virtual</p>
          </section>

          <section className="panel">
            <h2>How your money is spread</h2>
            {book.holdings.length === 0 ? (
              <p className="muted">All cash. Buy slices on the terminal to see a spread.</p>
            ) : (
              <ul className="spread-list">
                {book.holdings.map((row) => {
                  const price = prices[row.ticker] ?? row.avgPrice;
                  const value = row.shares * price;
                  const pct = equity > 0 ? (value / equity) * 100 : 0;
                  const name = DEMO_COMPANIES.find((c) => c.ticker === row.ticker)?.name;
                  return (
                    <li key={row.ticker}>
                      <div className="spread-row">
                        <strong>
                          {row.ticker} ×{row.shares}
                        </strong>
                        <span>
                          Rs {value.toLocaleString(undefined, { maximumFractionDigits: 0 })} ·{" "}
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <p className="muted">{name}</p>
                      <div className="spread-bar" aria-hidden="true">
                        <span style={{ width: `${Math.min(100, pct)}%` }} />
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
                    {trade.side === "buy" ? "Bought" : "Sold"} {trade.ticker} ×{trade.shares} at Rs{" "}
                    {trade.price.toFixed(2)}
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
              <strong>What Cub noticed</strong>
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
            <p className="muted">This never ranks you against other children.</p>
          </section>
          <section className="panel">
            <h2>Lesson 2 — later</h2>
            <p>Risk and return stays locked until we build that lesson.</p>
            <Link to="/market">Back to Market Floor</Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
