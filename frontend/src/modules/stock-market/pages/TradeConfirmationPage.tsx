import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CubMascot } from "../../../components/cub-assistant/CubMascot";
import { speakCub } from "../../../components/cub-assistant/cubSpeech";
import { childId, readCubLanguage } from "../../../pages/auth/demoSession";
import { getMarketBehaviour, type BehaviourReport } from "../../../services/apiClient";
import { marketSessionId, recordMarketEvent } from "../data/behaviourEvents";
import {
  DECISION_QUESTIONS,
  REFLECT_OPTIONS,
  feedbackAfterTrade,
  pnlWords,
} from "../data/decisionCoach";
import { applyTrade, holdingOf, readBook, writeBook } from "../data/demoPortfolio";
import { buildQuotes, type Ticker } from "../data/syntheticPrices";
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
  const [why, setWhy] = useState("");
  const [support, setSupport] = useState("");
  const [wrong, setWrong] = useState("");
  const [risk, setRisk] = useState("");
  const [reflect, setReflect] = useState("");
  const [report, setReport] = useState<BehaviourReport | null>(null);
  const lang = readCubLanguage();
  const quotes = useMemo(() => buildQuotes(), []);
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
      reason: why || undefined,
      modified: reducedAfterWarning,
      book: result.book,
    });
    if (why) {
      recordMarketEvent({
        type: "trade_reason_submitted",
        ticker: order.ticker,
        reason: why,
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
    const bookNow = readBook();
    const prices = Object.fromEntries(quotes.map((item) => [item.ticker, item.price]));
    const last = bookNow.trades[0];
    const holding = holdingOf(bookNow, filled.ticker);
    const paper = holding ? (prices[filled.ticker] - holding.avgPrice) * holding.shares : 0;
    const cubLine =
      report?.coaching[0]?.text ??
      feedbackAfterTrade(lang, {
        reducedAfterWarning: Boolean(last?.reducedAfterWarning),
        concentration: filled.concentration,
        dropSell: Boolean(filled.dropScenario),
        why,
        support,
        reflect,
      });
    return (
      <section className="panel">
        <h1>{lang === "si" ? "අභ්‍යාස ඕඩර් එක fill උනා" : "Practice order filled"}</h1>
        <p>
          {filled.shares} {filled.ticker} · {filled.side === "buy" ? "cost" : "credit"} Rs{" "}
          {(filled.shares * filled.price).toLocaleString()}.{" "}
          {lang === "si" ? "ඉතිරි මුදල්" : "Cash left"} Rs {filled.cashAfter.toLocaleString()}.
        </p>
        {filled.side === "sell" && last?.realized !== undefined ? (
          <p>{pnlWords(lang, "realized", last.realized)}</p>
        ) : (
          <p>{pnlWords(lang, "unrealized", paper)}</p>
        )}
        <div className="cub-says panel">
          <CubMascot size={64} />
          <p>{cubLine}</p>
          <button type="button" className="btn-ghost" onClick={() => speakCub(cubLine, lang)}>
            {lang === "si" ? "අසන්න" : "Hear Cub"}
          </button>
        </div>
        <fieldset className="decision-q">
          <legend>{lang === "si" ? "මේ තීරණය ගැන හිතෙන්නේ කොහොමද?" : "How does this decision feel?"}</legend>
          {REFLECT_OPTIONS.map((item) => (
            <label key={item.id}>
              <input
                type="radio"
                name="reflect"
                checked={reflect === item.id}
                onChange={() => setReflect(item.id)}
              />{" "}
              {item[lang]}
            </label>
          ))}
        </fieldset>
        <p className="muted">{report?.disclaimer}</p>
        <div className="lesson-actions">
          <Link className="btn-gold cub-send" to="/market/terminal">
            {lang === "si" ? "ටර්මිනල් එකට" : "Back to terminal"}
          </Link>
          <Link className="btn-ghost" to="/market/portfolio">
            {lang === "si" ? "Portfolio එක" : "My portfolio"}
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
      {(
        [
          ["why", why, setWhy],
          ["support", support, setSupport],
          ["wrong", wrong, setWrong],
          ["risk", risk, setRisk],
        ] as const
      ).map(([key, value, setter]) => {
        const group = DECISION_QUESTIONS[key];
        return (
          <fieldset key={key} className="decision-q">
            <legend>{group[lang]}</legend>
            {group.options.map((item) => (
              <label key={item.id}>
                <input type="radio" name={key} checked={value === item.id} onChange={() => setter(item.id)} />{" "}
                {item[lang]}
              </label>
            ))}
          </fieldset>
        );
      })}
      {error ? <p className="live-note is-try">{error}</p> : null}
      <div className="lesson-actions">
        {warn ? (
          <button
            className="btn-ghost"
            type="button"
            disabled={!why || !support || !wrong || !risk}
            onClick={() => commit(fewer, true)}
          >
            Buy fewer shares ({fewer})
          </button>
        ) : null}
        <button
          className="btn-gold"
          type="button"
          disabled={!why || !support || !wrong || !risk}
          onClick={() => commit(draft.shares, false)}
        >
          {warn || dropWarn ? "Confirm anyway" : "Confirm practice order"}
        </button>
      </div>
      <p className="muted">Confirming is allowed — the point is that the risk was noticed.</p>
    </div>
  );
}
