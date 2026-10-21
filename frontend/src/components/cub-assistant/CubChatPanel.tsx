import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { readCubLanguage, useDemoChild, writeCubLanguage } from "../../pages/auth/demoSession";
import { CubAssistantAvatar } from "./CubAssistantAvatar";
import type { CubLang, CubRole } from "./cubAssistantTypes";
import { detectSpokenLang, greetingFor, matchCubIntent, matchPriorityCubIntent, suggestionsFor } from "./cubGuidance";
import { fetchCubIntent } from "./cubIntentApi";
import { replyFromPrediction } from "./cubPredictedReply";
import { cubUi } from "./cubUi";
import { browserCanListen, errorNote, listenOnce } from "./cubListen";
import { browserCanRecord, openMicStream, startCaptureSession, transcribeWav, type CaptureSession } from "./cubMic";
import { canSpeakSinhala, speakCub, stopCubSpeech } from "./cubSpeech";

type Line = {
  id: string;
  from: "cub" | "child";
  text: string;
};

let lineId = 0;

export function CubChatPanel() {
  const location = useLocation();
  const navigate = useNavigate();
  const { child } = useDemoChild();
  const listRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<CaptureSession | null>(null);
  const listenAbortRef = useRef<AbortController | null>(null);
  const listenPromiseRef = useRef<Promise<{ text: string; error?: string }> | null>(null);
  const recordTimerRef = useRef<number | null>(null);
  const langRef = useRef<CubLang>("en");
  const pathRef = useRef(location.pathname);
  const roleRef = useRef<CubRole>("student");
  const pendingRef = useRef<string | null>(null);
  const lastIntentRef = useRef<string | null>(null);
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [lang, setLang] = useState<CubLang>(() => readCubLanguage());
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const role = (child?.role ?? "student") as CubRole;

  langRef.current = lang;
  pathRef.current = location.pathname;
  roleRef.current = role;
  pendingRef.current = pendingPath;

  useEffect(() => {
    setLang(readCubLanguage());
  }, [child?.language]);

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: "smooth" });
  }, [lines, open]);

  useEffect(() => {
    return () => {
      stopCubSpeech();
      listenAbortRef.current?.abort();
      void captureRef.current?.stop();
    };
  }, []);

  function talk(text: string, replyLang: CubLang, forceSpeak: boolean) {
    if (!forceSpeak && !voiceOn) {
      return;
    }
    const result = speakCub(text, replyLang);
    if (!result.ok) {
      setSpeaking(false);
      if (result.reason === "unsupported") {
        setNote(cubUi(replyLang, "noSpeech"));
      }
      if (result.reason === "no-sinhala-voice") {
        setNote(cubUi(replyLang, "noSinhalaVoice"));
      }
      return;
    }
    setSpeaking(true);
    window.setTimeout(() => setSpeaking(false), Math.min(9000, Math.max(2500, text.length * 70)));
  }

  function addCub(text: string, options?: { path?: string; replyLang?: CubLang; fromMic?: boolean }) {
    const replyLang = options?.replyLang ?? langRef.current;
    setLines((current) => [...current, { id: `c-${++lineId}`, from: "cub", text }]);
    talk(text, replyLang, Boolean(options?.fromMic));
    if (options?.path && options.path !== pathRef.current) {
      navigate(options.path);
    }
  }

  async function handleChildText(raw: string, fromMic = false) {
    const text = raw.trim();
    if (!text) {
      return;
    }
    let replyLang = detectSpokenLang(text, langRef.current);
    if (replyLang !== langRef.current) {
      setLang(replyLang);
      writeCubLanguage(replyLang);
    }
    setLines((current) => [...current, { id: `u-${++lineId}`, from: "child", text }]);
    if (fromMic) {
      setNote(`${cubUi(replyLang, "heard")}: “${text}”`);
    }
    if (pendingRef.current && /^(yes|ok|okay|ඔව්|oww)$/i.test(text)) {
      const dest = pendingRef.current;
      setPendingPath(null);
      addCub(replyLang === "si" ? "හරි, යනවා." : "Okay, leaving the confirm page.", {
        path: dest,
        replyLang,
        fromMic,
      });
      return;
    }
    const ctx = { path: pathRef.current, role: roleRef.current, lastIntent: lastIntentRef.current };
    const predicted = await fetchCubIntent(text, roleRef.current, pathRef.current);
    const classified = predicted ? replyFromPrediction(predicted, replyLang, ctx) : null;
    const guided = matchCubIntent(text, replyLang, ctx);
    const reply =
      matchPriorityCubIntent(text, replyLang, ctx) ??
      classified ??
      (guided.path || guided.speakPage ? guided : null) ??
      guided;
    if (
      reply.intent &&
      reply.intent !== "LOW_CONFIDENCE" &&
      reply.intent !== "FOLLOW_UP_EXPLAIN" &&
      reply.intent !== "CLARIFY_CONFUSION"
    ) {
      lastIntentRef.current = reply.intent;
    }
    if (reply.languageIntent === "CHANGE_LANGUAGE_ENGLISH") {
      replyLang = "en";
      setLang("en");
      writeCubLanguage("en");
    }
    if (reply.languageIntent === "CHANGE_LANGUAGE_SINHALA") {
      replyLang = "si";
      setLang("si");
      writeCubLanguage("si");
    }
    if (reply.needsConfirm && reply.path) {
      setPendingPath(reply.path);
      addCub(reply.text, { replyLang, fromMic });
      return;
    }
    addCub(reply.text, { path: reply.path, replyLang, fromMic });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    handleChildText(draft);
    setDraft("");
  }

  function changeLang(next: CubLang) {
    setLang(next);
    writeCubLanguage(next);
    setNote(next === "si" && !canSpeakSinhala() ? cubUi(next, "noSinhalaVoice") : null);
  }

  async function finishRecording() {
    if (recordTimerRef.current) {
      window.clearTimeout(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    setListening(false);
    setNote(cubUi(langRef.current, "transcribing"));
    listenAbortRef.current?.abort();
    const capture = captureRef.current;
    captureRef.current = null;
    try {
      const spoken = listenPromiseRef.current ? await listenPromiseRef.current : { text: "" };
      listenPromiseRef.current = null;
      if (spoken.text.trim()) {
        await handleChildText(spoken.text.trim(), true);
        try {
          await capture?.stop();
        } catch {
          /* mic already closed */
        }
        return;
      }
      const wav = capture ? await capture.stop() : null;
      if (!wav || wav.size < 2000) {
        setNote(cubUi(langRef.current, "noSpeechHeard"));
        return;
      }
      const result = await transcribeWav(wav, langRef.current);
      if (result.error === "api") {
        setNote(cubUi(langRef.current, "apiDown"));
        return;
      }
      const text = result.text.trim();
      if (!text) {
        setNote(cubUi(langRef.current, "noSpeechHeard"));
        return;
      }
      await handleChildText(text, true);
    } catch {
      setNote(cubUi(langRef.current, "transcribeFail"));
    }
  }

  async function startMic() {
    if (listening) {
      await finishRecording();
      return;
    }
    if (!browserCanRecord() && !browserCanListen()) {
      setNote(cubUi(lang, "noMic"));
      return;
    }
    stopCubSpeech();
    try {
      setListening(true);
      setNote(cubUi(langRef.current, "listening"));
      const abort = new AbortController();
      listenAbortRef.current = abort;
      if (browserCanListen()) {
        listenPromiseRef.current = listenOnce(langRef.current, 7000, abort.signal);
      } else {
        listenPromiseRef.current = Promise.resolve({ text: "" });
      }
      if (browserCanRecord()) {
        const stream = await openMicStream();
        captureRef.current = await startCaptureSession(stream);
      }
      recordTimerRef.current = window.setTimeout(() => {
        void finishRecording();
      }, 7000);
    } catch (error) {
      setListening(false);
      listenAbortRef.current?.abort();
      const blocked = error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "PermissionDeniedError");
      setNote(errorNote(blocked ? "not-allowed" : "audio-capture", lang));
    }
  }

  function replay() {
    const last = [...lines].reverse().find((line) => line.from === "cub");
    const text = last?.text ?? greetingFor(location.pathname, lang);
    talk(text, lang, true);
  }

  const chips = suggestionsFor(location.pathname, lang);
  const pageTip = greetingFor(location.pathname, lang);

  if (!open) {
    return (
      <div className="cub-chat">
        <button
          type="button"
          className="cub-open-btn"
          onClick={() => setOpen(true)}
          aria-label={`${cubUi(lang, "ask")} / ${cubUi(lang === "en" ? "si" : "en", "ask")}`}
        >
          <CubAssistantAvatar size={56} speaking={speaking} />
          <span>{cubUi(lang, "ask")}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="cub-chat is-open">
      <section className="cub-chat-panel" aria-label="Cub chat">
        <header className="cub-chat-head">
          <CubAssistantAvatar size={52} speaking={speaking} />
          <div>
            <strong>Cub</strong>
            <p>{cubUi(lang, "blurb")}</p>
          </div>
          <button type="button" className="cub-icon-btn" onClick={() => setOpen(false)}>
            {cubUi(lang, "hide")}
          </button>
        </header>
        <p className="cub-page-tip">{pageTip}</p>
        <div className="cub-lang" role="group" aria-label="Language">
          <button type="button" className={lang === "en" ? "is-on" : ""} onClick={() => changeLang("en")}>
            {cubUi(lang, "english")}
          </button>
          <button type="button" className={lang === "si" ? "is-on" : ""} onClick={() => changeLang("si")}>
            {cubUi(lang, "sinhala")}
          </button>
        </div>
        <div className="cub-chat-log" ref={listRef} role="log" aria-live="polite">
          {lines.map((line) => (
            <p key={line.id} className={`cub-bubble cub-bubble-${line.from}`}>
              <span className="cub-who">{line.from === "cub" ? "Cub" : cubUi(lang, "you")}</span>
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
            {cubUi(lang, "typeHere")}
          </label>
          <input
            id="cub-text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={listening ? cubUi(lang, "listening") : cubUi(lang, "typeHere")}
            autoComplete="off"
          />
          <button
            type="button"
            className={`cub-mic${listening ? " is-live" : ""}`}
            onClick={startMic}
            aria-pressed={listening}
            aria-label={listening ? cubUi(lang, "stopListen") : cubUi(lang, "mic")}
          >
            {listening ? "…" : "Mic"}
          </button>
          <button type="submit" className="btn-gold cub-send">
            {cubUi(lang, "send")}
          </button>
        </form>
        <div className="cub-chat-tools">
          <label>
            <input type="checkbox" checked={voiceOn} onChange={(event) => setVoiceOn(event.target.checked)} />{" "}
            {cubUi(lang, "cubVoice")}
          </label>
          <button type="button" className="cub-icon-btn" onClick={replay}>
            {cubUi(lang, "replay")}
          </button>
          <button
            type="button"
            className="cub-icon-btn"
            onClick={() => {
              stopCubSpeech();
              setSpeaking(false);
            }}
          >
            {cubUi(lang, "stop")}
          </button>
        </div>
        {note ? <p className="cub-note">{note}</p> : null}
      </section>
    </div>
  );
}
