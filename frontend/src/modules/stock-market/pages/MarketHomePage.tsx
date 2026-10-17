import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CubMascot } from "../../../components/cub-assistant/CubMascot";
import {
  DEMO_COMPANIES,
  LESSONS,
  LESSON_ONE_SCRIPT,
  PRACTICE_CASH_LKR,
  readLesson1Complete,
} from "../data/demoMarket";
import "../../../styles/market-dashboard.css";

export function MarketHomePage() {
  const [lesson1Done, setLesson1Done] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setLesson1Done(readLesson1Complete());
  }, []);

  function hearLesson() {
    if (!("speechSynthesis" in window)) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(LESSON_ONE_SCRIPT);
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="market-dash">
      <div className="market-main">
        <section className="market-hero" aria-labelledby="market-hero-title">
          <div className="market-hero-copy">
            <CubMascot size={150} />
            <div>
              <h1 id="market-hero-title">
                A real market.
                <br />
                Fake money. No regrets.
              </h1>
              <p>
                You trade listed companies at pretend prices with Rs{" "}
                {PRACTICE_CASH_LKR.toLocaleString()} of virtual money. Cub
                explains every move before it is confirmed.
              </p>
            </div>
          </div>
          <div className="hero-tickers" aria-hidden="true">
            {DEMO_COMPANIES.slice(0, 3).map((company) => (
              <span className={`ticker-pill tone-${company.tone}`} key={company.ticker}>
                {company.ticker}
              </span>
            ))}
          </div>
        </section>

        <section className="panel" aria-labelledby="lessons-title">
          <h2 id="lessons-title">Four lessons — the market unlocks after the first</h2>
          <ol className="lesson-track">
            {LESSONS.map((lesson) => (
              <li
                key={lesson.n}
                className={`lesson-step${lesson.status === "open" ? " is-open" : " is-locked"}`}
              >
                <span className="lesson-num">{lesson.n}</span>
                <strong>{lesson.title}</strong>
                <span>
                  {lesson.n === 1 && lesson1Done
                    ? "Done"
                    : lesson.status === "open"
                      ? "Open now"
                      : "Locked"}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="panel lesson-detail" aria-labelledby="lesson-one-title">
          <div className="lesson-detail-head">
            <h2 id="lesson-one-title">Lesson 1 — What is a share?</h2>
            <span className="time-chip">4 min</span>
          </div>
          <div className="lesson-detail-grid">
            <div className="share-diagram">
              <div className="pie" aria-hidden="true" />
              <p>
                <strong>SUNTEA</strong>
                <br />
                Sunrise Tea PLC
                <br />
                <span className="muted">One company, split into slices</span>
              </p>
            </div>
            <ul className="lesson-points">
              <li>One short diagram, one quick check, then the market opens.</li>
              <li>Voice playback for readers who need it.</li>
              <li>Company names are fictional stand-ins for now.</li>
            </ul>
          </div>
          <div className="lesson-actions">
            <Link className="btn-gold cub-send" to="/market/lessons/1">
              {lesson1Done ? "Review lesson 1" : "Start lesson 1"}
            </Link>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={hearLesson}
              aria-pressed={speaking}
            >
              Hear it aloud
            </button>
          </div>
          {lesson1Done ? (
            <p className="live-note" role="status">
              Lesson 1 is complete. The practice market is open.
              <Link className="btn-gold cub-send" to="/market/terminal">
                Open the market terminal
              </Link>
              <Link className="btn-ghost" to="/market/portfolio">
                My portfolio
              </Link>
            </p>
          ) : null}
        </section>

        <section className="panel" aria-labelledby="companies-title">
          <h2 id="companies-title">Fictional companies you’ll trade later</h2>
          <ul className="company-row">
            {DEMO_COMPANIES.map((company) => (
              <li className={`company-chip tone-${company.tone}`} key={company.ticker}>
                <strong>{company.ticker}</strong>
                <span>{company.name}</span>
                <em>{company.sector}</em>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="market-side">
        <section className="wallet-card">
          <p className="wallet-label">Practice account</p>
          <p className="wallet-value">
            Rs {PRACTICE_CASH_LKR.toLocaleString()}
            <span>VIRTUAL</span>
          </p>
          <dl>
            <div>
              <dt>Own money at risk</dt>
              <dd>Rs 0</dd>
            </div>
            <div>
              <dt>Price data</dt>
              <dd>Demo / synthetic</dd>
            </div>
          </dl>
        </section>

        <section className="side-card">
          <h2>The one rule</h2>
          <p>No real money, ever. Nothing here connects to a bank.</p>
        </section>

        <section className="side-card">
          <h2>What gets measured</h2>
          <ul className="measure-list">
            <li>Patience after a drop</li>
            <li>Spreading money</li>
            <li>Reading before buying</li>
            <li>Habits, never profit ranking</li>
          </ul>
        </section>

        <section className="cub-says">
          <CubMascot size={72} />
          <div>
            <strong>Cub says</strong>
            <p>
              Company names are fictional stand-ins for now. Let’s learn how
              shares work!
            </p>
          </div>
        </section>
      </aside>
    </div>
  );
}
