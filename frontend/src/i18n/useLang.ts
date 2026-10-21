import { useEffect, useState } from "react";
import { readCubLanguage, writeCubLanguage } from "../pages/auth/demoSession";
import type { CubLang } from "../components/cub-assistant/cubAssistantTypes";
import { t } from "./t";

const SESSION_EVENT = "wisecub-session";

export function useLang() {
  const [lang, setLangState] = useState<CubLang>(() => readCubLanguage());

  useEffect(() => {
    const refresh = () => setLangState(readCubLanguage());
    window.addEventListener("storage", refresh);
    window.addEventListener(SESSION_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(SESSION_EVENT, refresh);
    };
  }, []);

  function setLang(next: CubLang) {
    writeCubLanguage(next);
    setLangState(next);
  }

  return {
    lang,
    setLang,
    t: (path: string, vars?: Record<string, string | number>) => t(lang, path, vars),
  };
}
