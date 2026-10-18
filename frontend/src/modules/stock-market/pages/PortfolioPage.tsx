import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CubMascot } from "../../../components/cub-assistant/CubMascot";
import { childId } from "../../../pages/auth/demoSession";
import { getMarketBehaviour, type BehaviourReport } from "../../../services/apiClient";
import { portfolioAllocation } from "../data/allocation";
import { marketSessionId, recordMarketEvent } from "../data/behaviourEvents";
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
  const prices = useMemo(
    () => Object.fromEntries(quotes.map((item) => [item.ticker, item.price])),
    [quotes],
  );
  const [book] = useState<DemoBook>(() => readBook());
  const [report, setReport] = useState<BehaviourReport | null>(null);

  const equity = totalEquity(book, prices);
  const mix = portfolioAllocation(book, prices);
  const flags = reviewHabits(book, prices);
  const falling = flags.valueChangePct < 0;
  const cashPct = mix.cashPct ?? (equity > 0 ? (book.cash / equity) * 100 : 100);
  const today = book.trades.slice(0, 8);

  useEffect(() => {
    recordMarketEvent({ type: "portfolio_reviewed", book, prices, cash: book.cash });
    void getMarketBehaviour(childId(), marketSessionId())
      .then(setReport)
      .catch(() => setReport(null));
    // Load once per visit; quotes are synthetic and stable for the session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            <p className="muted">Percent of cash + holdings. Zero bags are not scored as “well spread”.</p>
            <p className="spread-chips">
              {mix.companies.map((row) => (
                <span key={row.ticker}>
                  {row.ticker} {row.pct.toFixed(0)}
                </span>
              ))}
              <span>CASH {cashPct.toFixed(0)}</span>
            </p>
            {mix.sectors.length ? (
              <p className="muted">
                Sectors:{" "}
                {mix.sectors.map((row) => `${row.sector} ${row.pct.toFixed(0)}%`).join(" · ")}
              </p>
            ) : null}
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
              <strong>What Cub noticed</strong>
              <p>{report?.coaching[0]?.text ?? cubNoticed(flags)}</p>
              <p className="muted">
                {report?.disclaimer ??
                  "Rule-based practice notes only. Not a diagnosis. We never rank profit."}
              </p>
            </div>
          </section>
          <section className="panel">
            <h2>Decision patterns (when evidence is enough)</h2>
            {report ? (
              <ul className="measure-list">
                {report.indicators
                  .filter((item) => item.level !== "insufficient_evidence")
                  .map((item) => (
                    <li key={item.behaviour}>
                      <strong>{item.behaviour.split("_").join(" ")}</strong>
                      {" — "}
                      {item.level === "worth_reviewing" ? item.explanation : "Not seen in this session’s taps."}
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="muted">
                Connect Mongo so Cub can load the event log. Local trades still work.
              </p>
            )}
            {report?.indicators.find((item) => item.level === "worth_reviewing") ? (
              <p>
                Try: {report.indicators.find((item) => item.level === "worth_reviewing")?.suggested_activity}
              </p>
            ) : null}
          </section>
          <section className="panel">
            <h2>Goes to the parent report</h2>
            <p>
              Habit notes and in-app evidence only — never a profit ranking against other children.
            </p>
          </section>
          <section className="panel">
            <h2>Lessons</h2>
            <p>Four market lessons unlock in order. Virtual money only.</p>
            <Link to="/market">Back to Market Floor</Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
