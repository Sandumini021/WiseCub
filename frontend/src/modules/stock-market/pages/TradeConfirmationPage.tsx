import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CubMascot } from "../../../components/cub-assistant/CubMascot";
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
};

export function TradeConfirmationPage() {
  const location = useLocation();
  const draft = location.state as ConfirmState | null;
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filled, setFilled] = useState<ConfirmState | null>(null);
  const quoteCost = useMemo(() => {
    if (!draft) {
      return 0;
    }
    return draft.shares * draft.price;
  }, [draft]);

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
    setFilled({ ...order, shares, cashAfter: result.book.cash });
    setDone(true);
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
        <p>Come back later and see whether waiting was calmer than reacting.</p>
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

  const warn = draft.side === "buy" && draft.concentration >= 40;
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
              : `You are about to ${draft.side} ${draft.shares} slices at Rs ${draft.price.toFixed(2)} each. No real money moves.`}
          </p>
        </div>
      </section>
      <p>
        Est. {draft.side === "buy" ? "cost" : "credit"} Rs {quoteCost.toLocaleString()}. Cash after Rs{" "}
        {draft.cashAfter.toLocaleString()}.
      </p>
      {error ? <p className="live-note is-try">{error}</p> : null}
      <div className="lesson-actions">
        {warn ? (
          <button className="btn-ghost" type="button" onClick={() => commit(fewer, true)}>
            Buy fewer shares ({fewer})
          </button>
        ) : null}
        <button className="btn-gold" type="button" onClick={() => commit(draft.shares, false)}>
          {warn ? "Confirm anyway" : "Confirm practice order"}
        </button>
      </div>
      <p className="muted">Confirming is allowed — the point is that the risk was noticed.</p>
    </div>
  );
}
