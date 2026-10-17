import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CubMascot } from "./CubMascot";
import { greetingFor, matchCubIntent, suggestionsFor } from "./cubGuidance";

type Line = {
  id: string;
  from: "cub" | "child";
  text: string;
};

type SpeechRec = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
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

function speakCub(text: string) {
  if (!("speechSynthesis" in window)) {
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

let lineId = 0;

export function CubChatPanel() {
  const location = useLocation();
  const navigate = useNavigate();
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [draft, setDraft] = useState("");
  const [micNote, setMicNote] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const voiceOnRef = useRef(voiceOn);
  const lastPath = useRef<string | null>(null);
  voiceOnRef.current = voiceOn;

  useEffect(() => {
    if (lastPath.current === location.pathname) {
      return;
    }
    lastPath.current = location.pathname;
    const hello = greetingFor(location.pathname);
    setLines((current) => [...current, { id: `g-${++lineId}`, from: "cub", text: hello }]);
    if (voiceOnRef.current) {
      speakCub(hello);
    }
  }, [location.pathname]);

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: "smooth" });
  }, [lines, open]);

  function addCub(text: string, path?: string) {
    setLines((current) => [...current, { id: `c-${++lineId}`, from: "cub", text }]);
    if (voiceOn) {
      speakCub(text);
    }
    if (path && path !== location.pathname) {
      navigate(path);
    }
  }

  function handleChildText(raw: string) {
    const text = raw.trim();
    if (!text) {
      return;
    }
    setLines((current) => [...current, { id: `u-${++lineId}`, from: "child", text }]);
    const reply = matchCubIntent(text);
    if (reply.speakPage) {
      addCub(`${reply.text} ${greetingFor(location.pathname)}`);
      return;
    }
    addCub(reply.text, reply.path);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    handleChildText(draft);
    setDraft("");
  }

  function startMic() {
    const rec = getRecognizer();
    if (!rec) {
      setMicNote("This browser cannot hear the mic. Type your message instead — that always works.");
      return;
    }
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      const said = event.results[0]?.[0]?.transcript ?? "";
      if (said) {
        handleChildText(said);
      }
    };
    rec.onerror = () => {
      setListening(false);
      setMicNote("I could not hear that. You can type instead.");
    };
    rec.onend = () => setListening(false);
    try {
      rec.start();
      setListening(true);
      setMicNote("Listening… speak now, then pause.");
    } catch {
      setMicNote("Mic did not start. Type your message instead.");
    }
  }

  const chips = suggestionsFor(location.pathname);

  return (
    <div className={`cub-chat${open ? " is-open" : ""}`}>
      {open ? (
        <section className="cub-chat-panel" aria-label="Cub chat">
          <header className="cub-chat-head">
            <CubMascot size={52} />
            <div>
              <strong>Cub</strong>
              <p>Talk or type. I only guide inside WiseCub.</p>
            </div>
            <button type="button" className="cub-icon-btn" onClick={() => setOpen(false)}>
              Hide
            </button>
          </header>
          <div className="cub-chat-log" ref={listRef} role="log" aria-live="polite">
            {lines.map((line) => (
              <p key={line.id} className={`cub-bubble cub-bubble-${line.from}`}>
                <span className="cub-who">{line.from === "cub" ? "Cub" : "You"}</span>
                {line.text}
              </p>
            ))}
          </div>
          <div className="cub-chips" aria-label="Suggested things to say">
            {chips.map((chip) => (
              <button key={chip} type="button" className="cub-chip" onClick={() => handleChildText(chip)}>
                {chip}
              </button>
            ))}
          </div>
          <form className="cub-chat-form" onSubmit={onSubmit}>
            <label className="visually-hidden" htmlFor="cub-text">
              Type a message to Cub
            </label>
            <input
              id="cub-text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type here…"
              autoComplete="off"
            />
            <button
              type="button"
              className={`cub-mic${listening ? " is-live" : ""}`}
              onClick={startMic}
              aria-pressed={listening}
              aria-label={listening ? "Listening" : "Speak to Cub"}
            >
              Mic
            </button>
            <button type="submit" className="btn-gold cub-send">
              Send
            </button>
          </form>
          <div className="cub-chat-tools">
            <label>
              <input
                type="checkbox"
                checked={voiceOn}
                onChange={(event) => setVoiceOn(event.target.checked)}
              />{" "}
              Cub voice
            </label>
            {micNote ? <span className="muted">{micNote}</span> : null}
          </div>
        </section>
      ) : (
        <button type="button" className="cub-open-btn" onClick={() => setOpen(true)}>
          <CubMascot size={56} />
          <span>Ask Cub</span>
        </button>
      )}
    </div>
  );
}
