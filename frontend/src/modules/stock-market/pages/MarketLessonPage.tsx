import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CubMascot } from "../../../components/cub-assistant/CubMascot";
import {
  getLesson,
  isLessonUnlocked,
  LESSON_COUNT,
  saveLessonComplete,
} from "../data/demoMarket";
import "../../../styles/market-dashboard.css";
import "../../../styles/market-lesson.css";

function LessonArt({ icon }: { icon: string }) {
  if (icon === "bars") {
    return (
      <div className="lesson-art" aria-hidden="true">
        <div className="bars">
          <i />
          <i />
          <i />
        </div>
      </div>
    );
  }
  if (icon === "trend") {
    return (
      <div className="lesson-art" aria-hidden="true">
        <div className="spread-row">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }
  if (icon === "coins") {
    return (
      <div className="lesson-art" aria-hidden="true">
        <div className="coins">
          <b />
          <b />
          <b />
          <b />
        </div>
      </div>
    );
  }
  if (icon === "buy") {
    return (
      <div className="lesson-art ls-glyph is-buy" aria-hidden="true">
        <span>↓ cash</span>
        <strong>Buy</strong>
        <span>↑ slices</span>
      </div>
    );
  }
  if (icon === "sell") {
    return (
      <div className="lesson-art ls-glyph is-sell" aria-hidden="true">
        <span>↑ cash</span>
        <strong>Sell</strong>
        <span>↓ slices</span>
      </div>
    );
  }
  if (icon === "think") {
    return (
      <div className="lesson-art ls-steps" aria-hidden="true">
        <i>1</i>
        <i>2</i>
        <i>3</i>
      </div>
    );
  }
  if (icon === "crowd") {
    return (
      <div className="lesson-art ls-crowd" aria-hidden="true">
        <b />
        <b />
        <b />
        <b />
        <em>you</em>
      </div>
    );
  }
  if (icon === "lock") {
    return (
      <div className="lesson-art ls-lock" aria-hidden="true">
        <span>paper</span>
        <strong>🔒</strong>
        <span>locked</span>
      </div>
    );
  }
  if (icon === "pause") {
    return (
      <div className="lesson-art ls-pause" aria-hidden="true">
        <strong>⏸</strong>
        <span>drop drill</span>
      </div>
    );
  }
  return <div className="pie" aria-hidden="true" />;
}

export function MarketLessonPage() {
  const { n: raw } = useParams();
  const n = Number(raw);
  const lesson = getLesson(n);
  const [picked, setPicked] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [done, setDone] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    setPicked(null);
    setChecked(false);
    setDone(false);
    setSpeaking(false);
    setBeat(0);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [n]);

  if (!lesson) {
    return (
      <section className="panel">
        <h1>Lesson not found</h1>
        <Link to="/market">Back to Market Floor</Link>
      </section>
    );
  }

  if (!isLessonUnlocked(n)) {
    return (
      <section className="panel">
        <h1>{lesson.title} is locked</h1>
        <p>Finish lesson {n - 1} first. Each lesson opens the next one.</p>
        <Link className="btn-gold cub-send" to={`/market/lessons/${n - 1}`}>
          Go to lesson {n - 1}
        </Link>
      </section>
    );
  }

  const isCorrect = picked === lesson.check.correct;
  const nextN = n < LESSON_COUNT ? n + 1 : null;
  const openBeat = lesson.beats[beat] ?? lesson.beats[0];

  function hearAloud() {
    if (!("speechSynthesis" in window) || !lesson) {
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(lesson.script);
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  function finish() {
    saveLessonComplete(n);
    setDone(true);
  }

  return (
    <div className="lesson-page ls-shell">
      <p className="muted">
        <Link to="/market">← Market Floor</Link> · {n} / {LESSON_COUNT} · {lesson.duration}
      </p>
      <h1>{lesson.title}</h1>

      <section className="panel lesson-story">
        <div className="share-diagram big">
          <LessonArt icon={lesson.icon} />
          <p>
            <strong>{lesson.caption}</strong>
          </p>
        </div>
        <div>
          <p className="ls-lead">{lesson.story[0]}</p>
          <div className="ls-beats" role="tablist" aria-label="Lesson beats">
            {lesson.beats.map((item, index) => (
              <button
                key={item.t}
                type="button"
                role="tab"
                aria-selected={beat === index}
                className={beat === index ? "is-on" : ""}
                onClick={() => setBeat(index)}
              >
                {item.t}
              </button>
            ))}
          </div>
          <p className="ls-beat-body" role="tabpanel">
            {openBeat.d}
          </p>
          <button className="btn btn-ghost" type="button" onClick={hearAloud} aria-pressed={speaking}>
            {speaking ? "Stop" : "Hear it aloud"}
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="check-title">
        <h2 id="check-title">Quick check</h2>
        <p className="ls-q">{lesson.check.question}</p>
        <div className="check-options" role="radiogroup" aria-label="Choose one answer">
          {lesson.check.options.map((option) => (
            <label
              key={option.id}
              className={`check-option${picked === option.id ? " is-picked" : ""}`}
            >
              <input
                type="radio"
                name={`lesson-${n}-check`}
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
            {lesson.check.yes}
          </p>
        ) : null}
        {checked && !isCorrect ? (
          <p className="live-note is-try" role="status">
            {lesson.check.no}
          </p>
        ) : null}
      </section>

      {checked && isCorrect && !done ? (
        <button className="btn-gold" type="button" onClick={finish}>
          Finish lesson {n}
        </button>
      ) : null}

      {done ? (
        <section className="panel cub-says">
          <CubMascot size={72} />
          <div>
            <strong>Lesson {n} complete</strong>
            <p>
              Saved on this device (demo profile). {lesson.finishHint} Virtual money only.
            </p>
            {nextN ? (
              <Link className="btn-gold cub-send" to={`/market/lessons/${nextN}`}>
                Start lesson {nextN}
              </Link>
            ) : null}
            <Link className="btn-gold cub-send" to="/market/terminal">
              Open the market terminal
            </Link>
            <Link className="btn-ghost" to="/market">
              Back to Market Floor
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
