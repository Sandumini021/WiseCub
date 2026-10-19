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

export function errorNote(code: string | undefined, lang: CubLang) {
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
  if (code === "network") {
    return lang === "si"
      ? "හඬ තේරවීමට internet එක ඕනේ. සම්බන්ධය පරීක්ෂා කරලා ආයෙත් උත්සාහ කරන්න."
      : "Voice typing needs internet in this browser. Check the connection and try again.";
  }
  return lang === "si" ? "ඇහුණේ නැහැ. ලියලා යවන්නත් පුළුවන්." : "I could not hear that. You can type instead.";
}
