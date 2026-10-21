import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { AdaptiveRecommendation } from "../components/AdaptiveRecommendation";
import { ConsequencesView } from "../components/ConsequencesView";
import { DecisionOptionCard } from "../components/DecisionOptionCard";
import { LevelArt } from "../components/LevelArt";
import { ReasoningForm } from "../components/ReasoningForm";
import { ReasoningProfile } from "../components/ReasoningProfile";
import { getLevel } from "../data/levels";
import { REASONING_MIN_CHARS } from "../data/phoneScenario";
import { getScenario } from "../data/scenarios";
import { buildConsequences } from "../services/consequenceEngine";
import {
  fetchScenario,
  persistCompletion,
  persistDecision,
  persistReasoning,
  refreshProgress,
} from "../services/decisionApi";
import {
  getLevelStatus,
  getSession,
  readProgress,
} from "../services/progressStore";
import type {
  AdaptiveRecommendation as Recommendation,
  DecisionOptionId,
  ScenarioDefinition,
} from "../types/decisionMaking";
import "../styles/choice-town.css";

const STEPS = ["decide", "reason", "outcomes", "profile"] as const;
type Step = (typeof STEPS)[number];

function isStep(value: string | undefined): value is Step {
  return STEPS.includes(value as Step);
}

export function ScenarioPage() {
  const { levelId = "5", step } = useParams();
  const navigate = useNavigate();
  const numericId = Number(levelId);
  const level = getLevel(numericId);
  const [scenario, setScenario] = useState<ScenarioDefinition | undefined>(() => getScenario(numericId));
  const progress = readProgress();
  const status = level ? getLevelStatus(level.id, progress) : "locked";
  const stored = getSession(numericId, progress);

  const [optionId, setOptionId] = useState<DecisionOptionId | undefined>(stored.optionId);
  const [reasoning, setReasoning] = useState(stored.reasoning ?? "");
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(stored.analysis);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(
    stored.recommendations ?? [],
  );
  const [saving, setSaving] = useState(false);
  const touched = useRef(false);
  const currentStep: Step = isStep(step) ? step : "decide";

  useEffect(() => {
    let cancelled = false;
    fetchScenario(numericId).then((data) => {
      if (!cancelled && data) {
        setScenario(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [numericId]);

  useEffect(() => {
    let cancelled = false;
    refreshProgress().then((remote) => {
      if (cancelled || touched.current) return;
      const session = getSession(numericId, remote);
      setOptionId(session.optionId);
      setReasoning(session.reasoning ?? "");
      setAnalysis(session.analysis);
      setRecommendations(session.recommendations ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [numericId]);

  const selectedOption = scenario?.options.find((item) => item.id === optionId);
  const consequences = useMemo(
    () => (scenario && optionId ? buildConsequences(scenario, optionId) : null),
    [scenario, optionId],
  );
  if (!level) {
    return <Navigate to="/choices" replace />;
  }

  if (status === "locked") {
    return (
      <div className="scenario-shell">
        <h1>{level.title} is locked</h1>
        <p>Complete the earlier required level before starting this scenario.</p>
        <Link className="btn-gold" to="/choices">
          Back to Choice Town
        </Link>
      </div>
    );
  }

  if (!level.playable || !scenario) {
    return (
      <div className="scenario-shell">
        <h1>{level.title}</h1>
        <p>This level does not have a scenario yet.</p>
        <Link className="btn-gold" to="/choices">
          Back to Choice Town
        </Link>
      </div>
    );
  }

  function go(next: Step) {
    navigate(`/choices/levels/${numericId}/${next}`);
  }

  async function continueFromDecision() {
    if (saving) return;
    if (!optionId) {
      setError("Choose one option before you continue.");
      return;
    }
    setSaving(true);
    await persistDecision(numericId, optionId);
    setSaving(false);
    setError("");
    go("reason");
  }

  async function continueFromReasoning() {
    if (!optionId || !selectedOption) {
      go("decide");
      return;
    }
    const trimmed = reasoning.trim();
    if (trimmed.length < REASONING_MIN_CHARS) {
      setError(`Please write at least ${REASONING_MIN_CHARS} characters in your own words.`);
      return;
    }
    setSaving(true);
    const result = await persistReasoning(numericId, selectedOption, trimmed);
    setAnalysis(result.analysis);
    setRecommendations(result.recommendations);
    setSaving(false);
    setError("");
    go("outcomes");
  }

  async function finishProfile() {
    if (saving) return;
    setSaving(true);
    await persistCompletion(numericId);
    navigate("/choices");
  }

  if (currentStep === "reason" && !optionId) {
    return <Navigate to={`/choices/levels/${numericId}/decide`} replace />;
  }
  if ((currentStep === "outcomes" || currentStep === "profile") && (!optionId || !analysis)) {
    return <Navigate to={`/choices/levels/${numericId}/decide`} replace />;
  }

  return (
    <div className="scenario-shell">
      <header className="scenario-head">
        <div>
          <p className="choice-kicker">Level {level.id}</p>
          <h1>{level.title}</h1>
        </div>
        <nav className="step-pills" aria-label="Scenario steps">
          {STEPS.map((item) => (
            <span key={item} className={`step-pill${item === currentStep ? " is-active" : ""}`}>
              {item === "decide" ? "1. Choose" : null}
              {item === "reason" ? "2. Explain" : null}
              {item === "outcomes" ? "3. Outcomes" : null}
              {item === "profile" ? "4. Profile" : null}
            </span>
          ))}
        </nav>
      </header>

      <p>
        <Link to="/choices">Back to Choice Town</Link>
        {" · "}Answers are saved to MongoDB when connected, and cached locally for your profile.
      </p>

      {currentStep === "decide" ? (
        <>
          <section className="story-card">
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
              <LevelArt icon={level.icon} size={120} />
              <div>
                <h2>The situation</h2>
                <p>{scenario.situation}</p>
              </div>
            </div>
            <div className="fact-grid">
              {scenario.facts.map((fact) => (
                <div className="fact-chip" key={fact.label}>
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </div>
              ))}
            </div>
            {scenario.waitAssumption ? (
              <p className="assumption-note">{scenario.waitAssumption}</p>
            ) : null}
          </section>
          <h2>What will you do?</h2>
          <p>No option is automatically the “right” one. Think about trade-offs.</p>
          <div className="option-grid">
            {scenario.options.map((option) => (
              <DecisionOptionCard
                key={option.id}
                option={option}
                selected={option.id === optionId}
                onSelect={(id) => {
                  touched.current = true;
                  setOptionId(id);
                  setError("");
                }}
              />
            ))}
          </div>
          {error ? (
            <p className="locked-msg" role="alert">
              {error}
            </p>
          ) : null}
          <div className="choice-actions">
            <Link className="btn-ghost-choice" to="/choices">
              Leave for now
            </Link>
            <button
              type="button"
              className="btn-gold"
              onClick={continueFromDecision}
              disabled={!optionId || saving}
            >
              Continue
            </button>
          </div>
        </>
      ) : null}

      {currentStep === "reason" && selectedOption ? (
        <ReasoningForm
          value={reasoning}
          optionTitle={selectedOption.title}
          error={error}
          onChange={(value) => {
            touched.current = true;
            setReasoning(value);
            setError("");
          }}
          onSubmit={continueFromReasoning}
          onBack={() => go("decide")}
        />
      ) : null}

      {currentStep === "outcomes" && consequences && analysis ? (
        <ConsequencesView
          scenario={scenario}
          pack={consequences}
          analysis={analysis}
          onBack={() => go("reason")}
          onContinue={() => go("profile")}
        />
      ) : null}

      {currentStep === "profile" && analysis ? (
        <>
          <ReasoningProfile analysis={analysis} />
          <AdaptiveRecommendation items={recommendations} />
          <div className="choice-actions">
            <button type="button" className="btn-ghost-choice" onClick={() => go("outcomes")}>
              Review outcomes
            </button>
            <button type="button" className="btn-gold" onClick={finishProfile} disabled={saving}>
              Save and return to Choice Town
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
