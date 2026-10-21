import { FormEvent, useEffect, useState } from "react";
import { REASONING_MAX_CHARS, REASONING_MIN_CHARS } from "../data/phoneScenario";

type SpeechRec = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getRecognizer(): SpeechRec | null {
  const SpeechWindow = window as Window & {
    SpeechRecognition?: new () => SpeechRec;
    webkitSpeechRecognition?: new () => SpeechRec;
  };
  const Ctor = SpeechWindow.SpeechRecognition ?? SpeechWindow.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

type ReasoningFormProps = {
  value: string;
  optionTitle: string;
  error: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
};

export function ReasoningForm({
  value,
  optionTitle,
  error,
  onChange,
  onSubmit,
  onBack,
}: ReasoningFormProps) {
  const [micNote, setMicNote] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const voiceAvailable = Boolean(getRecognizer());

  useEffect(() => {
    return () => {
      getRecognizer()?.stop();
    };
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  function useVoice() {
    const rec = getRecognizer();
    if (!rec) {
      setMicNote("Voice typing is not available in this browser. You can type instead.");
      return;
    }
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (event) => {
      const spoken = event.results[0]?.[0]?.transcript ?? "";
      onChange(`${value} ${spoken}`.trim().slice(0, REASONING_MAX_CHARS));
    };
    rec.onerror = () => {
      setListening(false);
      setMicNote("The microphone could not be used. Please type your answer.");
    };
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  }

  return (
    <form className="reason-card" onSubmit={handleSubmit}>
      <h2>Why did you choose this option?</h2>
      <p>
        You chose <strong>{optionTitle}</strong>. Tell Cub what you were thinking.
        Consider your needs, savings, borrowing, and what might happen later.
      </p>
      <label htmlFor="reasoning-input" className="visually-hidden">
        Explain your decision
      </label>
      <textarea
        id="reasoning-input"
        className="reason-field"
        value={value}
        maxLength={REASONING_MAX_CHARS}
        placeholder="I chose this because..."
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="char-row">
        <span>
          {value.trim().length < REASONING_MIN_CHARS
            ? `Write at least ${REASONING_MIN_CHARS} characters.`
            : "Looking good — keep going if you have more to add."}
        </span>
        <span>
          {value.length}/{REASONING_MAX_CHARS}
        </span>
      </div>
      {error ? (
        <p className="locked-msg" role="alert">
          {error}
        </p>
      ) : null}
      {micNote ? <p role="status">{micNote}</p> : null}
      <div className="choice-actions">
        <button type="button" className="btn-ghost-choice" onClick={onBack}>
          Back to choices
        </button>
        {voiceAvailable ? (
          <button type="button" className="btn-ghost-choice" onClick={useVoice}>
            {listening ? "Listening…" : "Speak instead"}
          </button>
        ) : null}
        <button type="submit" className="btn-gold">
          Continue
        </button>
      </div>
    </form>
  );
}
