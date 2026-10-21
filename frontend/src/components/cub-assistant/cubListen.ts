import type { CubLang } from "./cubAssistantTypes";

type SpeechRec = SpeechRecognitionLike & {
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecResultEvent) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecResultEvent = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal?: boolean;
    0: { transcript: string };
  }>;
};

export function browserCanListen() {
  const SpeechWindow = window as Window & {
    SpeechRecognition?: new () => SpeechRec;
    webkitSpeechRecognition?: new () => SpeechRec;
  };
  return Boolean(SpeechWindow.SpeechRecognition ?? SpeechWindow.webkitSpeechRecognition);
}

export function makeRecognizer(): SpeechRec | null {
  const SpeechWindow = window as Window & {
    SpeechRecognition?: new () => SpeechRec;
    webkitSpeechRecognition?: new () => SpeechRec;
  };
  const Ctor = SpeechWindow.SpeechRecognition ?? SpeechWindow.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export function listenLang(lang: CubLang) {
  return lang === "si" ? "si-LK" : "en-US";
}

/** Chrome often fails si-LK with a fake "network" error. Fall back to English STT. */
export function listenLangCandidates(lang: CubLang) {
  if (lang === "si") {
    return ["si-LK", "si", "en-US"];
  }
  return ["en-US", "en-GB"];
}

export function canRetryListenError(code: string | undefined, attempt: number, total: number) {
  if (attempt >= total - 1) {
    return false;
  }
  return code === "network" || code === "language-not-supported" || code === "service-not-allowed";
}

export function listenOnce(
  lang: CubLang,
  timeoutMs = 6500,
  signal?: AbortSignal,
): Promise<{ text: string; error?: string }> {
  return new Promise((resolve) => {
    const rec = makeRecognizer();
    if (!rec) {
      resolve({ text: "", error: "unavailable" });
      return;
    }
    const langs = listenLangCandidates(lang);
    let attempt = 0;
    let settled = false;
    let pending = "";
    let timer = 0;
    const finish = (payload: { text: string; error?: string }) => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timer);
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
      resolve(payload);
    };
    const onAbort = () => finish({ text: pending.trim(), error: pending.trim() ? undefined : "aborted" });
    signal?.addEventListener("abort", onAbort, { once: true });
    const startAttempt = () => {
      if (settled) {
        return;
      }
      rec.lang = langs[attempt];
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.onresult = (event) => {
        let spoken = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          spoken += event.results[index]?.[0]?.transcript ?? "";
        }
        pending = spoken.trim() || pending;
        const last = event.results[event.results.length - 1];
        if (pending && last?.isFinal) {
          finish({ text: pending });
        }
      };
      rec.onerror = (event) => {
        const code = event.error;
        if (canRetryListenError(code, attempt, langs.length)) {
          attempt += 1;
          try {
            rec.stop();
          } catch {
            /* retry */
          }
          window.setTimeout(startAttempt, 80);
          return;
        }
        finish({ text: pending, error: code });
      };
      rec.onend = () => {
        if (!settled) {
          finish({ text: pending, error: pending ? undefined : "no-speech" });
        }
      };
      try {
        rec.start();
      } catch {
        finish({ text: "", error: "audio-capture" });
      }
    };
    timer = window.setTimeout(() => finish({ text: pending, error: pending ? undefined : "no-speech" }), timeoutMs);
    startAttempt();
  });
}

export function errorNote(
  code: string | undefined,
  lang: CubLang,
  options?: { online?: boolean },
) {
  if (code === "not-allowed") {
    return lang === "si"
      ? "මයික් එකට අවසර දුන්නේ නැහැ. Browser එකේ Allow එක තියලා ආයෙත් Mic එක තියන්න."
      : "Microphone permission was blocked. Allow the mic, then tap Mic again.";
  }
  if (code === "no-speech") {
    return lang === "si"
      ? "කතාවක් ඇහුණේ නැහැ. Mic එක තියලා ළඟින්, පැහැදිලිව කතා කරන්න."
      : "I did not hear speech. Tap Mic and speak clearly, then pause.";
  }
  if (code === "aborted") {
    return "";
  }
  const online = options?.online;
  if (code === "network" && online === false) {
    return lang === "si"
      ? "හඬ තේරවීමට internet එක ඕනේ. සම්බන්ධය පරීක්ෂා කරලා ආයෙත් උත්සාහ කරන්න."
      : "Voice typing needs internet in this browser. Check the connection and try again.";
  }
  if (code === "network" || code === "language-not-supported" || code === "service-not-allowed") {
    return lang === "si"
      ? "මේ browser එකේ සිංහල හඬ තේරවීම නැහැ. English වලින් කතා කරන්න, නැත්නම් ලියලා යවන්න."
      : "This browser could not start voice typing. Speak English after tapping Mic, or type instead.";
  }
  return lang === "si" ? "ඇහුණේ නැහැ. ලියලා යවන්නත් පුළුවන්." : "I could not hear that. You can type instead.";
}
