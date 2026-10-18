import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CubMascot } from "../../../components/cub-assistant/CubMascot";
import { childId } from "../../../pages/auth/demoSession";
import { getMarketBehaviour, type BehaviourReport } from "../../../services/apiClient";
import { marketSessionId, recordMarketEvent } from "../data/behaviourEvents";
import { TRADE_REASONS } from "../data/crowdScenarios";
import { applyTrade, readBook, writeBook } from "../data/demoPortfolio";
import type { Ticker } from "../data/syntheticPrices";
import "../../../styles/market-dashboard.css";

type ConfirmState = {
  side: "buy" | "sell";
  ticker: Ticker;
  shares: number;
  price: number;
  concentration: number;
  cashAfter: number;
  owned?: number;
  crowdScenario?: string;
  dropScenario?: string;
};

export function TradeConfirmationPage() {
  const location = useLocation();
  const draft = location.state as ConfirmState | null;
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filled, setFilled] = useState<ConfirmState | null>(null);
  const [reason, setReason] = useState("");
  const [report, setReport] = useState<BehaviourReport | null>(null);
  const quoteCost = useMemo(() => {
    if (!draft) {
      return 0;
    }
    return draft.shares * draft.price;
  }, [draft]);

  const warn = Boolean(draft && draft.side === "buy" && draft.concentration >= 40);
  const dropWarn = Boolean(draft && draft.side === "sell" && draft.dropScenario);

  useEffect(() => {
    if (!draft) {
      return;
    }
    if (warn || dropWarn) {
      recordMarketEvent({
        type: "risk_explanation_viewed",
        ticker: draft.ticker,
        scenarioId: draft.dropScenario ?? draft.crowdScenario,
      });
    }
  }, [draft, warn, dropWarn]);

  if (!draft) {
    return (
      <section className="panel">
        <h1>No order to confirm</h1>
        <p>Start from the terminal so Cub can check the size of the trade.</p>
        <Link className="btn-gold cub-send" to="/market/terminal">
          Open terminal
        </Link>
      </section>
    );
  }

  function commit(shares: number, reducedAfterWarning: boolean) {
    const order = draft;
    if (!order) {
      return;
    }
    const book = readBook();
    const result = applyTrade(book, {
      side: order.side,
      ticker: order.ticker,
      shares,
      price: order.price,
      reducedAfterWarning,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    writeBook(result.book);
    const owned = order.owned ?? 0;
    const soldFraction = order.side === "sell" && owned > 0 ? shares / owned : undefined;
    recordMarketEvent({
      type: order.side === "buy" ? "buy_order_placed" : "sell_order_placed",
      ticker: order.ticker,
      side: order.side,
      shares,
      price: order.price,
      concentrationPct: order.concentration,
      soldFraction,
      scenarioId: order.dropScenario ?? order.crowdScenario,
      reason: reason || undefined,
      modified: reducedAfterWarning,
      book: result.book,
    });
    if (reason) {
      recordMarketEvent({
        type: "trade_reason_submitted",
        ticker: order.ticker,
        reason,
      });
    }
    if (reducedAfterWarning) {
      recordMarketEvent({
        type: "order_modified",
        ticker: order.ticker,
        shares,
        side: order.side,
      });
    }
    setFilled({ ...order, shares, cashAfter: result.book.cash });
    setDone(true);
    void getMarketBehaviour(childId(), marketSessionId())
      .then((next) => {
        setReport(next);
        next.coaching.forEach((line) => {
          recordMarketEvent({ type: "coaching_shown", reason: line.behaviour });
        });
      })
      .catch(() => {
        setReport(null);
      });
  }

  if (done && filled) {
    return (
      <section className="panel">
        <h1>Practice order filled</h1>
        <p>
          {filled.shares} {filled.ticker} shares are yours on paper. Paid about Rs{" "}
          {(filled.shares * filled.price).toLocaleString()}. Cash left Rs{" "}
          {filled.cashAfter.toLocaleString()}.
        </p>
        {report?.coaching[0] ? (
          <div className="cub-says panel">
            <CubMascot size={64} />
            <p>{report.coaching[0].text}</p>
          </div>
        ) : (
          <p>Come back later and see whether waiting was calmer than reacting.</p>
        )}
        <p className="muted">{report?.disclaimer}</p>
        <div className="lesson-actions">
          <Link className="btn-gold cub-send" to="/market/terminal">
            Back to terminal
          </Link>
          <Link className="btn-ghost" to="/market/portfolio">
            My portfolio
          </Link>
        </div>
      </section>
    );
  }

  const fewer = Math.max(1, Math.floor(draft.shares / 2));

  return (
    <div className="confirm-page">
      <p className="muted">
        <Link to="/market/terminal">← Terminal</Link> · confirm step · virtual only
      </p>
      <h1>
        {draft.side === "buy" ? "Buy" : "Sell"} {draft.shares} {draft.ticker}
      </h1>
      <section className="panel cub-says">
        <CubMascot size={80} />
        <div>
          <strong>Cub asks before confirming</strong>
          <p>
            {warn
              ? `This puts about ${draft.concentration.toFixed(0)}% of your practice money into one company. What happens if that story goes badly?`
              : dropWarn
                ? "A practice drop can feel worrying. Would you like to review the company information before deciding?"
                : `You are about to ${draft.side} ${draft.shares} slices at Rs ${draft.price.toFixed(2)} each. No real money moves.`}
          </p>
        </div>
      </section>
      <p>
        Est. {draft.side === "buy" ? "cost" : "credit"} Rs {quoteCost.toLocaleString()}. Cash after Rs{" "}
        {draft.cashAfter.toLocaleString()}.
      </p>
      <label>
        Optional: why this trade? (practice only)
        <select value={reason} onChange={(event) => setReason(event.target.value)}>
          <option value="">Choose if you like</option>
          {TRADE_REASONS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      {error ? <p className="live-note is-try">{error}</p> : null}
      <div className="lesson-actions">
        {warn ? (
          <button className="btn-ghost" type="button" onClick={() => commit(fewer, true)}>
            Buy fewer shares ({fewer})
          </button>
        ) : null}
        <button className="btn-gold" type="button" onClick={() => commit(draft.shares, false)}>
          {warn || dropWarn ? "Confirm anyway" : "Confirm practice order"}
        </button>
      </div>
      <p className="muted">Confirming is allowed — the point is that the risk was noticed.</p>
    </div>
  );
}
