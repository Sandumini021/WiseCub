import { useState } from "react";
import { Link } from "react-router-dom";
import { CubMascot } from "../../../components/cub-assistant/CubMascot";
import {
  LESSON_ONE_SCRIPT,
  saveLesson1Complete,
} from "../data/demoMarket";
import "../../../styles/market-dashboard.css";

const CHECK = {
  question: "You buy 1 of 100 slices of SUNTEA (Sunrise Tea PLC). What do you own?",
  options: [
    { id: "a", label: "The whole tea company" },
    { id: "b", label: "One share — one small slice of the company" },
    { id: "c", label: "A real bank account and real tea" },
  ],
  correct: "b",
} as const;

export function ShareLessonPage() {
  const [picked, setPicked] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [done, setDone] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const isCorrect = picked === CHECK.correct;

  function hearAloud() {
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

  function finish() {
    saveLesson1Complete();
    setDone(true);
  }

  return (
    <div className="lesson-page">
      <p className="muted">
        <Link to="/market">← Market Floor</Link> · Lesson 1 of 4 · 4 min
      </p>
      <h1>What is a share?</h1>

      <section className="panel lesson-story">
        <div className="share-diagram big">
          <div className="pie" aria-hidden="true" />
          <p>
            <strong>SUNTEA</strong> is one fictional company, split into slices.
          </p>
        </div>
        <div>
          <p>
            Imagine Sunrise Tea PLC as a round cake. Each slice is a{" "}
            <strong>share</strong>. If you own one slice, you own a tiny part of
            that company — not the whole bakery, and not real money in a bank.
          </p>
          <ul className="lesson-points">
            <li>If the company does well, your slice can be worth more.</li>
            <li>If it does badly, your slice can be worth less.</li>
            <li>On WiseCub you only practise with virtual rupees.</li>
          </ul>
          <button className="btn btn-ghost" type="button" onClick={hearAloud} aria-pressed={speaking}>
            Hear it aloud
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="check-title">
        <h2 id="check-title">Quick check — nothing is scored against other children</h2>
        <p>{CHECK.question}</p>
        <div className="check-options" role="radiogroup" aria-label="Choose one answer">
          {CHECK.options.map((option) => (
            <label
              key={option.id}
              className={`check-option${picked === option.id ? " is-picked" : ""}`}
            >
              <input
                type="radio"
                name="share-check"
                value={option.id}
                checked={picked === option.id}
                onChange={() => {
                  setPicked(option.id);
                  setChecked(false);
                }}
              />
              {option.label}
            </label>
          ))}
        </div>
        <button
          className="btn-gold"
          type="button"
          disabled={!picked}
          onClick={() => setChecked(true)}
        >
          Check my answer
        </button>
        {checked && isCorrect ? (
          <p className="live-note" role="status">
            Yes. One slice = one share. You did not buy the whole company, and
            nothing real was purchased.
          </p>
        ) : null}
        {checked && !isCorrect ? (
          <p className="live-note is-try" role="status">
            Not quite — try again. Think of the pie: each coloured piece is one
            share. There is no real bank involved.
          </p>
        ) : null}
      </section>

      {checked && isCorrect && !done ? (
        <button className="btn-gold" type="button" onClick={finish}>
          Finish lesson 1
        </button>
      ) : null}

      {done ? (
        <section className="panel cub-says">
          <CubMascot size={72} />
          <div>
            <strong>Lesson 1 complete</strong>
            <p>
              Saved on this device (demo profile). The live buy/sell terminal is
              the next page. Lesson 2 stays locked until we build it.
            </p>
            <Link className="btn-gold cub-send" to="/market/terminal">
              Open the market terminal
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
