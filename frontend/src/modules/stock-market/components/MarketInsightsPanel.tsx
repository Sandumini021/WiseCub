import { useEffect, useState } from "react";
import { ApiError, getMarketAnalysis, getMarketHistory, type MarketAnalysis } from "../../../services/apiClient";
import { StockPriceChart } from "./StockPriceChart";

export function MarketInsightsPanel({ ticker }: { ticker: string }) {
  const [data, setData] = useState<MarketAnalysis | null>(null);
  const [closes, setCloses] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([getMarketAnalysis(ticker), getMarketHistory(ticker, 90)])
      .then(([analysis, history]) => {
        if (cancelled) {
          return;
        }
        setData(analysis);
        setCloses(history.points.map((point) => point.close));
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        const status = err instanceof ApiError ? err.status : 0;
        if (status === 503) {
          setError("Cub’s index model is not loaded yet. Practice trades still work.");
        } else if (status === 404) {
          setError("No classroom index chart for this name.");
        } else {
          setError("Could not reach the index model. Your pretend bag is unchanged.");
        }
        setData(null);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  const falling = data?.trend === "downward";

  return (
    <section className="tk-ai" aria-label="Classroom market insights">
      <p className="tk-label">AI classroom insight · old index data</p>
      {loading ? <p className="tk-empty">Reading the index notebook…</p> : null}
      {error ? <p className="live-note is-try">{error}</p> : null}
      {data ? (
        <>
          <p className={`tk-trend is-${data.trend}`}>
            {data.title} · {data.symbol}
          </p>
          <p className="tk-ai-meta">
            {data.name} · {data.as_of} · last {data.last_close?.toFixed(0)} {data.currency}
          </p>
          {closes.length > 1 ? <StockPriceChart points={closes} falling={falling} /> : null}
          <p>{data.explanation}</p>
          <p className="tk-conc">{data.risk}</p>
          <dl className="key-nums">
            <div>
              <dt>1-day %</dt>
              <dd>{((data.indicators.ret_1 ?? 0) * 100).toFixed(2)}</dd>
            </div>
            <div>
              <dt>vs MA20</dt>
              <dd>{((data.indicators.close_ma20 ?? 0) * 100).toFixed(1)}%</dd>
            </div>
            <div>
              <dt>Wobble</dt>
              <dd>{((data.indicators.vol_20 ?? 0) * 100).toFixed(2)}</dd>
            </div>
            <div>
              <dt>Model F1</dt>
              <dd>{data.model.test_macro_f1 != null ? data.model.test_macro_f1.toFixed(2) : "—"}</dd>
            </div>
          </dl>
          <p className="muted">{data.disclaimer}</p>
        </>
      ) : null}
    </section>
  );
}
