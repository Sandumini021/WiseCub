import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { SiteTopBar } from "../../../components/layout/SiteTopBar";
import { readCubLanguage } from "../../../pages/auth/demoSession";
import "../../../styles/dashboard-long.css";
import "../../../styles/market-home.css";
import "../../../styles/market-dashboard.css";
import { CubCoachCard } from "../components/CubCoachCard";
import { pickCoach, type CoachCard } from "../data/decisionCoach";
import {
  DEMO_COMPANIES,
  LESSONS,
  PRACTICE_CASH_LKR,
  isLessonUnlocked,
  readLesson1Complete,
  readLessonComplete,
} from "../data/demoMarket";
import { readBook } from "../data/demoPortfolio";
import { buildQuotes, sliceHistory, type Quote } from "../data/syntheticPrices";

const SIDE_LINKS: Array<{
  to: string;
  label: string;
  icon: string;
  end: boolean;
  hash?: string;
}> = [
  { to: "/market", label: "Market Home", icon: "▤", end: true },
  { to: "/market/terminal", label: "Market Terminal", icon: "⌘", end: false },
  { to: "/market/portfolio", label: "My Portfolio", icon: "☰", end: false },
  { to: "/market/portfolio", label: "Trade History", icon: "⟳", end: false, hash: "history" },
  { to: "/market/lessons/1", label: "Lessons", icon: "▣", end: false },
  { to: "/progress", label: "Leaderboard", icon: "♛", end: false },
];

const COMPANY_MARK = {
  SUNTEA: "🍃",
  LNKBNK: "🏦",
  CEYPOW: "⚡",
  HARBOR: "🚢",
  GRNNRG: "🌱",
} as const;

function rupees(value: number) {
  return `Rs ${Math.round(value).toLocaleString("en-LK")}`;
}

function OverviewChart({ points }: { points: number[] }) {
  const width = 520;
  const height = 160;
  if (points.length < 2) {
    return <p className="muted">No chart points.</p>;
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const coords = points.map((value, index) => {
    const x = (index / (points.length - 1)) * width;
    const y = height - ((value - min) / span) * (height - 24) - 12;
    return `${x},${y}`;
  });
  const line = coords.join(" ");
  const area = `0,${height} ${line} ${width},${height}`;
  return (
    <svg className="mkt-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Synthetic market overview">
      <defs>
        <linearGradient id="mktFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill="url(#mktFill)" points={area} />
      <polyline fill="none" stroke="#10b981" strokeWidth="3" points={line} />
    </svg>
  );
}

export function MarketHomePage() {
  const quotes = useMemo(() => buildQuotes(), []);
  const [lesson1Done, setLesson1Done] = useState(() => readLesson1Complete());
  const [finished, setFinished] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(LESSONS.map((lesson) => [lesson.n, readLessonComplete(lesson.n)])),
  );
  const [range, setRange] = useState<"1D" | "1W" | "1M" | "1Y">("1W");
  const [coach, setCoach] = useState<CoachCard | null>(null);
  const book = readBook();
  const lang = readCubLanguage();

  useEffect(() => {
    setLesson1Done(readLesson1Complete());
    setFinished(
      Object.fromEntries(LESSONS.map((lesson) => [lesson.n, readLessonComplete(lesson.n)])),
    );
    setCoach(pickCoach({ lang: readCubLanguage(), path: "home" }));
  }, []);

  const prices = Object.fromEntries(quotes.map((item) => [item.ticker, item.price]));
  const invested = book.holdings.reduce(
    (sum, row) => sum + row.shares * (prices[row.ticker] ?? row.avgPrice),
    0,
  );
  const dayPnl = book.holdings.reduce((sum, row) => {
    const quote = quotes.find((item) => item.ticker === row.ticker);
    if (!quote) {
      return sum;
    }
    return sum + row.shares * quote.price * (quote.changePct / 100);
  }, 0);
  const dayPct = invested ? (dayPnl / invested) * 100 : 0;
  const listed = quotes.slice(0, 4);
  const gainer = [...quotes].sort((a, b) => b.changePct - a.changePct)[0] as Quote;
  const loser = [...quotes].sort((a, b) => a.changePct - b.changePct)[0] as Quote;
  const overview = quotes.find((item) => item.ticker === "SUNTEA") ?? quotes[0];
  const tradeTo = lesson1Done ? "/market/terminal" : "/market/lessons/1";

  return (
    <div className="mkt-shell">
      <SiteTopBar />
      <div className="mkt-body">
        <aside className="mkt-side" aria-label="Market pages">
          {SIDE_LINKS.map((item) => (
            <NavLink
              key={item.label}
              to={item.hash ? `${item.to}#${item.hash}` : item.to}
              end={item.end}
              className={({ isActive }) => (isActive && !item.hash ? "is-on" : undefined)}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </aside>

        <div className="mkt-main" id="main">
          {coach ? <CubCoachCard card={coach} lang={lang} onDismiss={() => setCoach(null)} /> : null}
          <section className="mkt-hero" aria-labelledby="market-hero-title">
            <div className="mkt-hero-art">
              <img src="/images/dash/cub-hero.png" alt="Cub exploring the market" />
              <p className="mkt-speech">
                Let’s explore the stock market together!
              </p>
            </div>
            <div className="mkt-hero-copy">
              <h1 id="market-hero-title">
                A real market.
                <br />
                Fake money. No regrets.
              </h1>
              <p>
                {lang === "si"
                  ? `අභ්‍යාස රුපියල් ${PRACTICE_CASH_LKR.toLocaleString()} සමඟ කොටස් පුරුදු වෙන්න. මිල උඩට හෝ පහළට යන්න පුළුවන්. ඇත්ත බැංකුවක් නැහැ.`
                  : `Practise with Rs ${PRACTICE_CASH_LKR.toLocaleString()} of virtual money. Prices can rise or fall. Cub checks your thinking before you confirm.`}
              </p>
            </div>
            <aside className="mkt-wallet">
              <div className="mkt-wallet-head">
                <strong>Your Practice Account</strong>
                <span>Virtual Money</span>
              </div>
              <p className="mkt-cash">{rupees(book.cash)}</p>
              <dl>
                <div>
                  <dt>Invested</dt>
                  <dd>{rupees(invested)}</dd>
                </div>
                <div>
                  <dt>Available Cash</dt>
                  <dd>{rupees(book.cash)}</dd>
                </div>
                <div>
                  <dt>Today’s Gain / Loss</dt>
                  <dd className={dayPnl >= 0 ? "up" : "down"}>
                    {rupees(dayPnl)} ({dayPct.toFixed(0)}%)
                  </dd>
                </div>
              </dl>
              <Link className="mkt-start" to={tradeTo}>
                {lesson1Done ? "Start Trading" : "Start Lesson 1"} →
              </Link>
            </aside>
          </section>

          <section className="mkt-lessons" aria-labelledby="lessons-title">
            <div className="mkt-lessons-head">
              <h2 id="lessons-title">Ten short lessons</h2>
              <p>Tap through buy, sell, decisions, and drops. Lesson 1 still opens the terminal.</p>
            </div>
            <ol>
              {LESSONS.map((lesson) => {
                const open = isLessonUnlocked(lesson.n);
                const complete = Boolean(finished[lesson.n]);
                return (
                  <li key={lesson.n} className={open ? "is-open" : "is-locked"}>
                    <span className={`mkt-lesson-ico ico-${lesson.icon}`} aria-hidden="true">
                      {lesson.n}
                    </span>
                    <strong>{lesson.title}</strong>
                    <p>{lesson.blurb}</p>
                    {open ? (
                      <Link to={`/market/lessons/${lesson.n}`}>
                        {complete ? "Review Lesson" : "Start Lesson"}
                      </Link>
                    ) : (
                      <span className="mkt-lock" aria-label="Locked">
                        Locked
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>

          <div className="mkt-grid">
            <section className="mkt-card" aria-labelledby="companies-title">
              <div className="mkt-card-head">
                <h2 id="companies-title">Popular Companies</h2>
                <Link to="/market/terminal">View All</Link>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Price (LKR)</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {listed.map((quote) => {
                    const company = DEMO_COMPANIES.find((item) => item.ticker === quote.ticker);
                    const up = quote.changePct >= 0;
                    return (
                      <tr key={quote.ticker}>
                        <td>
                          <Link to={`/market/terminal?ticker=${quote.ticker}`}>
                            <span aria-hidden="true">{COMPANY_MARK[quote.ticker]}</span>
                            <b>{quote.ticker}</b>
                            <em>{company?.name}</em>
                          </Link>
                        </td>
                        <td>{quote.price.toFixed(2)}</td>
                        <td className={up ? "up" : "down"}>
                          {up ? "▲" : "▼"} {Math.abs(quote.changePct).toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>

            <section className="mkt-card" aria-labelledby="overview-title">
              <div className="mkt-card-head">
                <h2 id="overview-title">Market Overview</h2>
                <div className="mkt-ranges" role="group" aria-label="Chart range">
                  {(["1D", "1W", "1M", "1Y"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={item === range ? "is-on" : undefined}
                      onClick={() => setRange(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <OverviewChart points={sliceHistory(overview.history, range)} />
              <ul className="mkt-days" aria-hidden="true">
                <li>Mon</li>
                <li>Tue</li>
                <li>Wed</li>
                <li>Thu</li>
                <li>Fri</li>
              </ul>
              <div className="mkt-stats">
                <p>
                  Market Status <b className="up">Open</b>
                </p>
                <p>
                  Top Gainer{" "}
                  <b className="up">
                    {gainer.ticker} +{gainer.changePct.toFixed(1)}%
                  </b>
                </p>
                <p>
                  Top Loser{" "}
                  <b className="down">
                    {loser.ticker} {loser.changePct.toFixed(1)}%
                  </b>
                </p>
              </div>
            </section>

            <section className="mkt-card mkt-tip" aria-labelledby="cub-tip-title">
              <div className="mkt-tip-head">
                <img src="/images/dash/cub-logo.png" alt="" />
                <h2 id="cub-tip-title">Cub’s Tip</h2>
              </div>
              <p>
                Company names are fictional stand-ins for now. Focus on learning, not profit ranking.
              </p>
              <p className="mkt-measure-title">What gets measured?</p>
              <ul className="mkt-measure">
                <li>Patience after a drop</li>
                <li>Spreading money</li>
                <li>Reading before buying</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
