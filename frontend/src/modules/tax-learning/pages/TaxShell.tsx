import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { CubFace } from "../../../components/cub-assistant/CubFace";
import { speakCub } from "../../../components/cub-assistant/cubSpeech";
import { SiteTopBar } from "../../../components/layout/SiteTopBar";
import { useLang } from "../../../i18n/useLang";
import { childId, readCubLanguage } from "../../../pages/auth/demoSession";
import { loadModuleState, saveModuleState } from "../../../services/apiClient";
import type { TaxRule } from "../data/applyTax";
import { localTaxPack } from "../data/taxPack";
import { loadTaxLab, type TaxLesson, type TaxQuizItem, type TaxScenario } from "../taxApi";
import "../styles/tax-lab.css";

export type TaxProgress = {
  lessons: string[];
  quizPoints: number;
  badges: string[];
};

type Pack = {
  lang: "en" | "si";
  lessons: TaxLesson[];
  scenarios: TaxScenario[];
  quiz: TaxQuizItem[];
  disclaimer: string;
  rules: TaxRule[];
  offline: boolean;
  progress: TaxProgress;
  saveProgress: (next: TaxProgress) => void;
  cubSay: (text: string) => void;
};

const TaxCtx = createContext<Pack | null>(null);
const PROGRESS_KEY = "wisecub.taxProgress";

export function useTaxLab() {
  const ctx = useContext(TaxCtx);
  if (!ctx) {
    throw new Error("useTaxLab needs TaxShell");
  }
  return ctx;
}

const LINKS = [
  { to: "/tax", key: "tax.lab", end: true },
  { to: "/tax/learn", key: "tax.learn" },
  { to: "/tax/simulate", key: "tax.sim" },
  { to: "/tax/challenge", key: "tax.challenge" },
  { to: "/tax/decisions", key: "tax.decisions" },
  { to: "/tax/quiz", key: "tax.quiz" },
  { to: "/tax/sri-lanka", key: "tax.lk" },
];

function readLocalProgress(): TaxProgress {
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) {
      return { lessons: [], quizPoints: 0, badges: [] };
    }
    const parsed = JSON.parse(raw) as TaxProgress;
    return {
      lessons: parsed.lessons ?? [],
      quizPoints: parsed.quizPoints ?? 0,
      badges: parsed.badges ?? [],
    };
  } catch {
    return { lessons: [], quizPoints: 0, badges: [] };
  }
}

export function TaxShell() {
  const { t } = useLang();
  const lang = readCubLanguage();
  const [pack, setPack] = useState<Omit<Pack, "saveProgress" | "cubSay" | "progress">>(() => ({
    ...localTaxPack(lang),
    offline: true,
  }));
  const [progress, setProgress] = useState<TaxProgress>(readLocalProgress);

  useEffect(() => {
    let live = true;
    void loadTaxLab(lang).then((next) => {
      if (live) {
        setPack(next);
      }
    });
    loadModuleState<TaxProgress>(childId(), "tax_learning")
      .then((doc) => {
        if (doc?.data) {
          const remote = {
            lessons: doc.data.lessons ?? [],
            quizPoints: doc.data.quizPoints ?? 0,
            badges: doc.data.badges ?? [],
          };
          setProgress(remote);
          window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(remote));
        }
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [lang]);

  function saveProgress(next: TaxProgress) {
    setProgress(next);
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
    void saveModuleState(childId(), "tax_learning", next).catch(() => undefined);
  }

  const value = useMemo(
    () => ({
      ...pack,
      progress,
      saveProgress,
      cubSay: (text: string) => speakCub(text, lang),
    }),
    [pack, progress, lang],
  );

  return (
    <div className="tax-lab">
      <SiteTopBar />
      <header className="tax-head">
        <p className="tax-kicker">
          <Link to="/home">← Home</Link>
          <span>{t("tax.kicker")}</span>
        </p>
        <h1>{t("tax.title")}</h1>
        <nav className="tax-nav" aria-label="Tax lab">
          {LINKS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              {t(item.key)}
            </NavLink>
          ))}
        </nav>
      </header>
      {pack?.offline ? (
        <p className="tax-note">{t("tax.offline")}</p>
      ) : null}
      <TaxCtx.Provider value={value}>
        <Outlet />
      </TaxCtx.Provider>
      <p className="tax-foot">{pack?.disclaimer}</p>
    </div>
  );
}

export function TaxCub({ text }: { text: string }) {
  const { t } = useLang();
  const { lang, cubSay } = useTaxLab();
  return (
    <aside className="tax-cub">
      <CubFace expression="giving-tip" message={text} size={88} lang={lang} />
      <button type="button" className="btn-ghost" onClick={() => cubSay(text)}>
        {t("tax.hear")}
      </button>
    </aside>
  );
}
