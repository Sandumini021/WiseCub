import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { CubFace } from "../../../components/cub-assistant/CubFace";
import { speakCub } from "../../../components/cub-assistant/cubSpeech";
import { SiteTopBar } from "../../../components/layout/SiteTopBar";
import { childId, readCubLanguage } from "../../../pages/auth/demoSession";
import { loadModuleState, saveModuleState } from "../../../services/apiClient";
import type { TaxRule } from "../data/applyTax";
import { loadTaxContent, loadTaxRules, type TaxLesson, type TaxQuizItem, type TaxScenario } from "../taxApi";
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
  progress: TaxProgress;
  saveProgress: (next: TaxProgress) => void;
  cubSay: (text: string) => void;
};

const TaxCtx = createContext<Pack | null>(null);

export function useTaxLab() {
  const ctx = useContext(TaxCtx);
  if (!ctx) {
    throw new Error("useTaxLab needs TaxShell");
  }
  return ctx;
}

const LINKS = [
  { to: "/tax", label: "Lab", end: true },
  { to: "/tax/learn", label: "Learn" },
  { to: "/tax/simulate", label: "Simulator" },
  { to: "/tax/challenge", label: "Challenge" },
  { to: "/tax/decisions", label: "Decisions" },
  { to: "/tax/quiz", label: "Quiz" },
  { to: "/tax/sri-lanka", label: "Sri Lanka" },
];

export function TaxShell() {
  const lang = readCubLanguage();
  const [pack, setPack] = useState<Omit<Pack, "saveProgress" | "cubSay"> | null>(null);
  const [progress, setProgress] = useState<TaxProgress>({ lessons: [], quizPoints: 0, badges: [] });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all([loadTaxContent(lang), loadTaxRules()])
      .then(([content, rules]) => {
        if (!live) {
          return;
        }
        setPack({
          lang: content.lang === "si" ? "si" : "en",
          lessons: content.lessons,
          scenarios: content.scenarios,
          quiz: content.quiz,
          disclaimer: content.disclaimer,
          rules: rules.rules,
          progress,
        });
      })
      .catch(() => setError("Tax lab needs the API (port 8000)."));
    loadModuleState<TaxProgress>(childId(), "tax_learning")
      .then((doc) => {
        if (doc?.data) {
          setProgress({
            lessons: doc.data.lessons ?? [],
            quizPoints: doc.data.quizPoints ?? 0,
            badges: doc.data.badges ?? [],
          });
        }
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [lang]);

  function saveProgress(next: TaxProgress) {
    setProgress(next);
    void saveModuleState(childId(), "tax_learning", next).catch(() => undefined);
  }

  const value = useMemo(() => {
    if (!pack) {
      return null;
    }
    return {
      ...pack,
      progress,
      saveProgress,
      cubSay: (text: string) => speakCub(text, lang),
    };
  }, [pack, progress, lang]);

  return (
    <div className="tax-lab">
      <SiteTopBar />
      <header className="tax-head">
        <p>
          <Link to="/home">← Home</Link> · Common area · not Market / Missions / Safety / Choices
        </p>
        <h1>Cub’s Tax Practice Lab</h1>
        <nav className="tax-nav">
          {LINKS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      {error ? <p className="tax-err">{error}</p> : null}
      {!value && !error ? <p className="tax-err">Loading tax lab…</p> : null}
      {value ? (
        <TaxCtx.Provider value={value}>
          <Outlet />
        </TaxCtx.Provider>
      ) : null}
      <p className="tax-foot">{pack?.disclaimer}</p>
    </div>
  );
}

export function TaxCub({ text }: { text: string }) {
  const { lang, cubSay } = useTaxLab();
  return (
    <aside className="tax-cub">
      <CubFace expression="giving-tip" message={text} size={88} lang={lang} />
      <button type="button" className="btn-ghost" onClick={() => cubSay(text)}>
        Hear Cub
      </button>
    </aside>
  );
}
