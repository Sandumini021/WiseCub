import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../../../components/common/Button";
import { Card } from "../../../components/common/Card";
import { getOrCreateSessionId } from "../services/researchSession";
import { logDrillAction, type DrillAction } from "../services/researchLog";
import {
  CATEGORY_ORDER,
  PASSING_PERCENTAGE,
  calculateScorePercent,
  getCategoryStatus,
  getNextCategory,
  isCategoryPassing,
  loadScamProgress,
  saveCategoryProgress,
  type CategoryId,
} from "../services/scamProgress";
import {
  getLessonSectionsForCategory,
  getScenariosForCategory,
  type AnswerChoice,
  type CategoryScenario,
  type Concept,
} from "../data/smsScenarios";

// ─────────────────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────────────────

type PhishingScenario = CategoryScenario;

// Legacy five-scenario type (for the existing "practice" and "drill" flows)
type Scenario = {
  id: number;
  title: string;
  message: string;
  correctAnswer: AnswerChoice;
  warningSigns: string[];
  explanation: string;
};

/**
 * All views in the Scam Safety module.
 *
 * "home"           — main landing screen (six categories + Shield Score)
 * "practice"       — legacy five-scenario global quiz
 * "results"        — legacy round results
 * "drill"          — Tier 2 mock phishing email research simulation
 * "cat-learn"      — Stage A: learn lesson for active category
 * "cat-practice"   — Stage B/C: adaptive practice for active category
 * "cat-results"    — Stage D: category results / mastery verdict
 */
type View =
  | "home"
  | "practice"
  | "results"
  | "drill"
  | "cat-learn"
  | "cat-practice"
  | "cat-results";

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const WALLET_START = 100;
const DEDUCTION_PER_SCAM = 10;
const DRILL_PENALTY_DISPLAY = 15;

type CategoryMeta = {
  id: CategoryId;
  label: string;
  icon: string;
  description: string;
  unlockHint: string;       // Shown when locked
  comingSoon: boolean;      // True when only nav/unlock is implemented
};

const CATEGORY_META: CategoryMeta[] = [
  {
    id: "phishing",
    label: "Phishing emails",
    icon: "📧",
    description: "Learn to spot fake emails trying to steal your information.",
    unlockHint: "This is your starting level — begin here!",
    comingSoon: false,
  },
  {
    id: "sms",
    label: "Scam text messages",
    icon: "💬",
    description: "Recognise suspicious text messages on your phone.",
    unlockHint: "Complete Phishing emails to unlock this level.",
    comingSoon: false,
  },
  {
    id: "qr",
    label: "Fake QR-code offers",
    icon: "📷",
    description: "Spot dangerous QR codes used to trick people.",
    unlockHint: "Complete Scam text messages to unlock this level.",
    comingSoon: true,
  },
  {
    id: "prize",
    label: "Prize and giveaway scams",
    icon: "🎁",
    description: "Learn why too-good-to-be-true prizes are often scams.",
    unlockHint: "Complete Fake QR-code offers to unlock this level.",
    comingSoon: true,
  },
  {
    id: "impersonation",
    label: "Impersonation scams",
    icon: "🎭",
    description: "Identify when scammers pretend to be someone you trust.",
    unlockHint: "Complete Prize and giveaway scams to unlock this level.",
    comingSoon: true,
  },
  {
    id: "financial",
    label: "Deceptive financial offers",
    icon: "💰",
    description: "Spot fake investment and financial offers.",
    unlockHint: "Complete Impersonation scams to unlock this level.",
    comingSoon: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  ADAPTIVE ENGINE (pure, no React dependency)
// ─────────────────────────────────────────────────────────────────────────────

type ConceptScore = Record<Concept, { correct: number; attempted: number }>;

function emptyConceptScore(): ConceptScore {
  return {
    sender:      { correct: 0, attempted: 0 },
    urgency:     { correct: 0, attempted: 0 },
    link:        { correct: 0, attempted: 0 },
    credentials: { correct: 0, attempted: 0 },
    prize:       { correct: 0, attempted: 0 },
    general:     { correct: 0, attempted: 0 },
  };
}

/**
 * Picks the next scenario using transparent deterministic rules.
 *
 * Rules (in priority order):
 * 1. Never repeat a scenario already shown in this session.
 * 2. If the learner just got a concept wrong, prefer a simpler scenario
 *    targeting that same concept (remediation).
 * 3. If the learner has answered all attempted scenarios correctly, prefer a
 *    harder one.
 * 4. Otherwise, pick by round-robin through remaining scenarios.
 */
function pickNextScenario(
  scenariosList: CategoryScenario[],
  shownIds: number[],
  conceptScores: ConceptScore,
  lastConcept: Concept | null,
  lastWasCorrect: boolean
): CategoryScenario | null {
  const remaining = scenariosList.filter((s) => !shownIds.includes(s.id));
  if (remaining.length === 0) return null;

  // 2. Remediation: last answer wrong → prefer same concept, easier
  if (lastConcept !== null && !lastWasCorrect) {
    const remediation = remaining
      .filter((s) => s.concept === lastConcept && s.difficulty === "easy")
      .sort((a, b) => a.id - b.id);
    if (remediation.length > 0) return remediation[0];

    // Fall back to any same-concept scenario
    const sameConcept = remaining
      .filter((s) => s.concept === lastConcept)
      .sort((a, b) => a.id - b.id);
    if (sameConcept.length > 0) return sameConcept[0];
  }

  // 3. Advancement: performing well → prefer harder
  const totalCorrect = Object.values(conceptScores).reduce((s, v) => s + v.correct, 0);
  const totalAttempted = Object.values(conceptScores).reduce((s, v) => s + v.attempted, 0);
  if (totalAttempted >= 2 && totalCorrect / totalAttempted >= 0.8) {
    const harder = remaining
      .filter((s) => s.difficulty === "hard")
      .sort((a, b) => a.id - b.id);
    if (harder.length > 0) return harder[0];
  }

  // 4. Default: next in order
  return remaining.sort((a, b) => a.id - b.id)[0];
}

/** Returns which concepts need review (accuracy < 70 % with at least one attempt). */
function weakConcepts(conceptScores: ConceptScore): Concept[] {
  return (Object.keys(conceptScores) as Concept[]).filter((c) => {
    const { correct, attempted } = conceptScores[c];
    return attempted > 0 && correct / attempted < 0.7;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  LEGACY SCENARIOS (existing five-scenario global practice)
// ─────────────────────────────────────────────────────────────────────────────

const scenarios: Scenario[] = [
  {
    id: 1,
    title: "Fake prize alert",
    message:
      "URGENT! You have won a free prize worth 50,000 rupees. Click now to claim your reward before 5:00 PM today or the prize will expire! Reply YES to get your secret code.",
    correctAnswer: "Suspicious",
    warningSigns: [
      "It creates urgency and pushes you to act fast.",
      "It promises a prize with no clear reason.",
      "It asks for personal details or a reply.",
    ],
    explanation:
      "This message is fake because it tries to scare you and rush your decision. Real organisations do not promise large prizes in a random text and ask for personal information.",
  },
  {
    id: 2,
    title: "School update",
    message:
      "Hi student, your class teacher has shared a reminder. Please open this official link to check your project deadline before 9 AM.",
    correctAnswer: "Looks Safe",
    warningSigns: [
      "This one is fictional and does not ask for money or a reward.",
      "It sounds like a normal reminder from a known setting.",
      "It does not pressure you to click immediately.",
    ],
    explanation:
      "This example is made to look safe because it is calm and general. Still, children should always check who sent it and only open links from a trusted source.",
  },
  {
    id: 3,
    title: "Fake bank security alert",
    message:
      "Your bank account has been locked due to suspicious activity. To unlock it right now, reply with your 4-digit PIN and your mother's maiden name.",
    correctAnswer: "Suspicious",
    warningSigns: [
      "Creates panic and urgency.",
      "Requests sensitive personal information.",
      "Pretends to be a bank but uses informal wording.",
    ],
    explanation:
      "Banks never ask for your PIN or personal details via text. This message tries to scare you into giving away private information.",
  },
  {
    id: 4,
    title: "Gaming reward giveaway",
    message:
      "Congrats! You have earned an ultra-rare skin in GameX. Click the link now to claim your reward before it disappears in 10 minutes!",
    correctAnswer: "Suspicious",
    warningSigns: [
      "Urgent short-time limit.",
      "Promises valuable in-game item you didn't earn.",
      "Requests you to click an unknown link.",
    ],
    explanation:
      "Legitimate game rewards are given through the game itself, not via random messages. Be cautious of unexpected offers that demand you click a link.",
  },
  {
    id: 5,
    title: "Fake giveaway prize",
    message:
      "You have been selected for a free tablet giveaway! Respond with your address and a copy of your ID to receive it within 24 hours.",
    correctAnswer: "Suspicious",
    warningSigns: [
      "Requests personal address and ID details.",
      "Promises a high-value prize without any contest.",
      "Pressures you to reply quickly.",
    ],
    explanation:
      "Real giveaways never ask for personal identification through text. This is a classic scam trying to collect your private information.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  DRILL CONTENT (mock research simulation — preserved from previous increment)
// ─────────────────────────────────────────────────────────────────────────────

const DRILL_EMAIL = {
  sender: "SafeNet Community Rewards <no-reply@example.invalid>",
  subject: "Your gaming bonus is waiting!",
  body: "Hi Player! A special bonus has been added to your account. Visit the link below to check the details before your bonus expires.",
  displayUrl: "example.invalid/bonus-check",
  warningSigns: [
    "The sender address uses a domain you cannot verify.",
    "It offers an unexpected reward you did not sign up for.",
    "It creates a sense of urgency with 'before your bonus expires'.",
    "A real service would not ask you to click an unknown link for a reward.",
  ],
  explanation:
    "This is a fictional practice email. In real life, unexpected reward emails like this are often phishing attempts. The safest action is to ignore or report them through a trusted channel.",
};

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getResultMessage(correct: number, total: number): string {
  const pct = total === 0 ? 0 : Math.round((correct / total) * 100);
  if (pct === 100) return "Amazing! You spotted every scam. You are a true Scam Safety Champion!";
  if (pct >= 80) return "Great work! You caught most of the scams. Keep practising to reach 100%!";
  if (pct >= 60) return "Good effort! You are getting better at spotting scams. Review the explanations and try again!";
  if (pct >= 40) return "Nice try! Scams can be tricky. Read the warning signs carefully and give it another go!";
  return "Keep going! Scams are designed to fool people. Review the tips and try again - you can do it!";
}

function didFallForScam(
  answer: AnswerChoice,
  correctAnswer: AnswerChoice
): boolean {
  return correctAnswer === "Suspicious" && answer === "Looks Safe";
}

function getDrillFeedback(action: DrillAction): {
  heading: string;
  body: string;
  penaltyNote: string | null;
  colour: string;
  borderColour: string;
} {
  switch (action) {
    case "clicked":
      return {
        heading: "Let's learn from this.",
        body: "Clicking links in unexpected reward messages can be risky. Scammers design these messages to look real. If you are unsure, the safest choice is not to click.",
        penaltyNote: `In this simulation, clicking an unverified link would cost you ${DRILL_PENALTY_DISPLAY} virtual learning coins. In real life, it could expose your device or personal information.`,
        colour: "#fff0f0",
        borderColour: "#e3b5b5",
      };
    case "ignored":
      return {
        heading: "Good thinking!",
        body: "Choosing not to interact with an unexpected reward message is a smart and safe decision. You cannot be harmed by a message you do not engage with.",
        penaltyNote: null,
        colour: "#f0f8ff",
        borderColour: "#cce4ff",
      };
    case "reported":
      return {
        heading: "Excellent choice!",
        body: "Reporting suspicious messages through a trusted channel — such as telling a parent, teacher, or a platform's report feature — is the strongest response. It helps protect you and others.",
        penaltyNote: null,
        colour: "#eaf8ef",
        borderColour: "#9fd3b0",
      };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function ScamHomePage() {
  const [view, setView] = useState<View>("home");

  // ── Category progress (persisted to localStorage via scamProgress) ─
  const [completedCategories, setCompletedCategories] = useState<CategoryId[]>(
    () => loadScamProgress().completedCategories
  );
  const [, setCategoryScores] = useState<Partial<Record<CategoryId, number>>>(
    () => loadScamProgress().categoryScores
  );
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null);

  // ── Phishing category lesson state ────────────────────────────────
  const [lessonSectionIndex, setLessonSectionIndex] = useState(0);

  // ── Phishing adaptive practice state ─────────────────────────────
  const [phishingShownIds, setPhishingShownIds] = useState<number[]>([]);
  const [phishingConceptScores, setPhishingConceptScores] = useState<ConceptScore>(emptyConceptScore);
  const [phishingCurrentScenario, setPhishingCurrentScenario] = useState<PhishingScenario | null>(null);
  const [phishingSelectedAnswer, setPhishingSelectedAnswer] = useState<AnswerChoice | null>(null);
  const [phishingTotal, setPhishingTotal] = useState(0);
  const [phishingCorrect, setPhishingCorrect] = useState(0);
  const [phishingLastConcept, setPhishingLastConcept] = useState<Concept | null>(null);
  const [phishingLastCorrect, setPhishingLastCorrect] = useState(false);
  // Max scenarios per attempt (gives enough data for mastery check)
  const PHISHING_MAX_SCENARIOS = 5;

  // ── Legacy practice-round state ───────────────────────────────────
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerChoice | null>(null);
  const [roundTotal, setRoundTotal] = useState(0);
  const [roundCorrect, setRoundCorrect] = useState(0);
  const [answeredIds, setAnsweredIds] = useState<number[]>([]);
  const [walletBalance, setWalletBalance] = useState(WALLET_START);
  const [roundCoinsLost, setRoundCoinsLost] = useState(0);

  // ── Lifetime Shield Score (shown on home screen) ──────────────────
  const [lifetimeTotal, setLifetimeTotal] = useState(0);
  const [lifetimeCorrect, setLifetimeCorrect] = useState(0);

  // ── Drill state ───────────────────────────────────────────────────
  const [sessionId] = useState<string | null>(() => getOrCreateSessionId());
  const [drillAction, setDrillAction] = useState<DrillAction | null>(null);

  // ── Derived values (legacy practice) ─────────────────────────────
  const scenario = useMemo(() => scenarios[scenarioIndex], [scenarioIndex]);
  const isCorrect = selectedAnswer === scenario.correctAnswer;
  const isLastScenario = scenarioIndex === scenarios.length - 1;
  const fellForScam =
    selectedAnswer !== null && didFallForScam(selectedAnswer, scenario.correctAnswer);

  // ─────────────────────────────────────────────────────────────────
  //  HANDLERS — legacy practice
  // ─────────────────────────────────────────────────────────────────

  function handleAnswer(answer: AnswerChoice) {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answer);

    if (!answeredIds.includes(scenario.id)) {
      setRoundTotal((prev) => prev + 1);
      if (answer === scenario.correctAnswer) setRoundCorrect((prev) => prev + 1);
      setAnsweredIds((prev) => [...prev, scenario.id]);

      if (didFallForScam(answer, scenario.correctAnswer)) {
        setWalletBalance((prev) => Math.max(0, prev - DEDUCTION_PER_SCAM));
        setRoundCoinsLost((prev) => prev + DEDUCTION_PER_SCAM);
      }
    }
  }

  function handleNextScenario() {
    setSelectedAnswer(null);
    setScenarioIndex((prev) => prev + 1);
  }

  function handleViewResults() {
    setLifetimeTotal((prev) => prev + roundTotal);
    setLifetimeCorrect((prev) => prev + roundCorrect);
    setView("results");
  }

  function resetRound() {
    setScenarioIndex(0);
    setSelectedAnswer(null);
    setRoundTotal(0);
    setRoundCorrect(0);
    setAnsweredIds([]);
    setWalletBalance(WALLET_START);
    setRoundCoinsLost(0);
  }

  function handleStartPractice() {
    resetRound();
    setView("practice");
  }

  function handlePracticeAgain() {
    resetRound();
    setView("practice");
  }

  function handleOpenDrill() {
    setDrillAction(null);
    setView("drill");
  }

  function handleDrillChoice(action: DrillAction) {
    if (drillAction !== null) return;
    setDrillAction(action);
    logDrillAction(sessionId, action);
  }

  // ─────────────────────────────────────────────────────────────────
  //  HANDLERS — category system
  // ─────────────────────────────────────────────────────────────────

  function handleOpenCategory(catId: CategoryId) {
    const status = getCategoryStatus(catId, completedCategories);
    if (status === "locked") return; // Guard — UI also prevents clicks

    setActiveCategory(catId);
    // Reset lesson and practice state for a fresh attempt
    setLessonSectionIndex(0);
    resetCategoryPractice(catId);
    setView("cat-learn");
  }

  function resetCategoryPractice(catId: CategoryId | null) {
    setPhishingShownIds([]);
    setPhishingConceptScores(emptyConceptScore());
    setPhishingSelectedAnswer(null);
    setPhishingTotal(0);
    setPhishingCorrect(0);
    setPhishingLastConcept(null);
    setPhishingLastCorrect(false);

    // Seed the first scenario
    const list = getScenariosForCategory(catId);
    const first = pickNextScenario(list, [], emptyConceptScore(), null, true);
    setPhishingCurrentScenario(first);
    if (first) setPhishingShownIds([first.id]);
  }

  // Called when "Start practice" clicked from the lesson view
  function handleStartCategoryPractice() {
    resetCategoryPractice(activeCategory);
    setView("cat-practice");
  }

  function handlePhishingAnswer(answer: AnswerChoice) {
    if (phishingSelectedAnswer !== null || phishingCurrentScenario === null) return;

    const correct = answer === phishingCurrentScenario.correctAnswer;
    setPhishingSelectedAnswer(answer);
    setPhishingTotal((prev) => prev + 1);
    if (correct) setPhishingCorrect((prev) => prev + 1);

    // Update concept score
    const concept = phishingCurrentScenario.concept;
    setPhishingConceptScores((prev) => ({
      ...prev,
      [concept]: {
        correct: prev[concept].correct + (correct ? 1 : 0),
        attempted: prev[concept].attempted + 1,
      },
    }));

    setPhishingLastConcept(concept);
    setPhishingLastCorrect(correct);
  }

  const handleFinishPhishingPractice = useCallback(() => {
    if (activeCategory) {
      const pct = calculateScorePercent(phishingCorrect, phishingTotal);
      const updated = saveCategoryProgress(activeCategory, pct);
      setCompletedCategories(updated.completedCategories);
      setCategoryScores(updated.categoryScores);
    }
    setView("cat-results");
  }, [activeCategory, phishingCorrect, phishingTotal]);

  const handlePhishingNext = useCallback(() => {
    if (phishingCurrentScenario === null) return;

    const newShownIds = [...phishingShownIds, phishingCurrentScenario.id].filter(
      (id, i, arr) => arr.indexOf(id) === i
    );

    // Check if round is complete
    if (phishingTotal >= PHISHING_MAX_SCENARIOS) {
      handleFinishPhishingPractice();
      return;
    }

    const list = getScenariosForCategory(activeCategory);
    const next = pickNextScenario(
      list,
      newShownIds,
      phishingConceptScores,
      phishingLastConcept,
      phishingLastCorrect
    );

    if (next === null || phishingTotal >= PHISHING_MAX_SCENARIOS) {
      handleFinishPhishingPractice();
      return;
    }

    setPhishingCurrentScenario(next);
    setPhishingShownIds([...newShownIds, next.id]);
    setPhishingSelectedAnswer(null);
  }, [
    activeCategory,
    phishingCurrentScenario,
    phishingShownIds,
    phishingTotal,
    phishingConceptScores,
    phishingLastConcept,
    phishingLastCorrect,
    handleFinishPhishingPractice,
  ]);

  useEffect(() => {
    if (view === "cat-results" && activeCategory) {
      const pct = calculateScorePercent(phishingCorrect, phishingTotal);
      if (isCategoryPassing(pct) && !completedCategories.includes(activeCategory)) {
        const updated = saveCategoryProgress(activeCategory, pct);
        setCompletedCategories(updated.completedCategories);
        setCategoryScores(updated.categoryScores);
      }
    }
  }, [view, activeCategory, phishingCorrect, phishingTotal, completedCategories]);

  function handleContinueToNextLevel() {
    if (!activeCategory) {
      setView("home");
      return;
    }
    const nextCat = getNextCategory(activeCategory);
    if (nextCat) {
      handleOpenCategory(nextCat);
    } else {
      setView("home");
    }
  }

  function handleCategoryRetry() {
    setLessonSectionIndex(0);
    setView("cat-learn");
  }

  // ══════════════════════════════════════════════════════════════════
  //  RENDER — HOME SCREEN
  // ══════════════════════════════════════════════════════════════════
  if (view === "home") {
    const allComplete = CATEGORY_ORDER.every((id) => completedCategories.includes(id));

    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1.5rem" }}>
        <p className="muted" style={{ marginBottom: "0.5rem" }}>Stay safe · Scam Alley</p>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>Scam safety practice</h1>
        <p style={{ marginBottom: "1.5rem" }}>
          Welcome! Learn to recognise warning signs in six scam categories.
        </p>

        {/* All categories complete banner */}
        {allComplete && (
          <div
            style={{
              background: "#eaf8ef",
              border: "1px solid #9fd3b0",
              borderRadius: "12px",
              padding: "1rem 1.25rem",
              marginBottom: "1.5rem",
            }}
          >
            <p style={{ margin: 0, fontWeight: "700", fontSize: "1.1rem" }}>
              🏆 You completed all six Scam Safety levels!
            </p>
            <p style={{ margin: "0.35rem 0 0" }}>
              Amazing work! You can revisit any category below to review your knowledge.
            </p>
          </div>
        )}

        {/* Six category cards with lock/unlock/complete states */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1.25rem",
            marginBottom: "2rem",
          }}
        >
          {CATEGORY_META.map((cat) => {
            const status = getCategoryStatus(cat.id, completedCategories);
            const isLocked = status === "locked";
            const isDone = status === "completed";
            const isAvail = status === "available";

            return (
              <div
                key={cat.id}
                onClick={() => !isLocked && handleOpenCategory(cat.id)}
                role={isLocked ? undefined : "button"}
                tabIndex={isLocked ? undefined : 0}
                onKeyDown={(e) => {
                  if (!isLocked && (e.key === "Enter" || e.key === " ")) {
                    handleOpenCategory(cat.id);
                  }
                }}
                style={{
                  borderRadius: "12px",
                  border: `2px solid ${
                    isDone ? "#9fd3b0" : isAvail ? "#3b82f6" : "#e2e8f0"
                  }`,
                  background: isDone
                    ? "#f0fdf4"
                    : isAvail
                    ? "#f0f8ff"
                    : "#f8fafc",
                  padding: "1.1rem",
                  cursor: isLocked ? "default" : "pointer",
                  opacity: isLocked ? 0.65 : 1,
                  transition: "box-shadow 0.15s",
                  position: "relative",
                }}
                aria-label={
                  isLocked
                    ? `${cat.label} — locked`
                    : isDone
                    ? `${cat.label} — completed`
                    : `${cat.label} — available, start learning`
                }
              >
                {/* Status badge */}
                <div
                  style={{
                    position: "absolute",
                    top: "0.65rem",
                    right: "0.75rem",
                    fontSize: "1.1rem",
                  }}
                >
                  {isDone ? "✅" : isLocked ? "🔒" : "▶️"}
                </div>

                <p style={{ fontSize: "1.5rem", margin: "0 0 0.4rem" }}>
                  {cat.icon}
                </p>
                <p style={{ fontWeight: "700", margin: "0 0 0.3rem" }}>
                  {cat.label}
                </p>
                <p
                  style={{
                    margin: "0 0 0.5rem",
                    fontSize: "0.88rem",
                    color: "#475569",
                  }}
                >
                  {isLocked ? cat.unlockHint : cat.description}
                </p>

                {isDone && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.8rem",
                      color: "#16a34a",
                      fontWeight: "600",
                    }}
                  >
                    Completed ✓
                  </p>
                )}
                {isAvail && !isDone && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.8rem",
                      color: "#1d4ed8",
                      fontWeight: "600",
                    }}
                  >
                    Tap to start →
                  </p>
                )}
              </div>
            );
          })}
        </section>

        {/* Lifetime Shield Score */}
        <section
          style={{
            background: "#f0f8ff",
            border: "1px solid #cce4ff",
            borderRadius: "12px",
            padding: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <p style={{ margin: 0, fontWeight: "600" }}>
            Scam Safety Shield Score:{" "}
            {lifetimeTotal === 0
              ? "Not assessed yet - complete a practice round to see your score"
              : `${Math.round((lifetimeCorrect / lifetimeTotal) * 100)}%`}
          </p>
          {lifetimeTotal > 0 && (
            <p style={{ marginTop: "0.25rem" }}>
              {lifetimeCorrect} correct out of {lifetimeTotal} answered across all rounds
            </p>
          )}
          <p className="muted" style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
            (Practice indicator only - not a formal assessment)
          </p>
        </section>

        <Button variant="primary" onClick={handleStartPractice} style={{ width: "100%" }}>
          Start practice scenario
        </Button>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  //  RENDER — CATEGORY LESSON (Stage A)
  // ══════════════════════════════════════════════════════════════════
  if (view === "cat-learn") {
    if (activeCategory !== "phishing" && activeCategory !== "sms") {
      return (
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "1.5rem" }}>
          <p className="muted">Stay safe · Scam Alley</p>
          <h1>
            {CATEGORY_META.find((c) => c.id === activeCategory)?.icon}{" "}
            {CATEGORY_META.find((c) => c.id === activeCategory)?.label}
          </h1>
          <Card title="Coming soon">
            <p>
              This level's lesson content is being prepared. Check back soon! You can
              return to Scam Safety Home and try a different level.
            </p>
            <Button variant="secondary" onClick={() => setView("home")}>
              Back to Scam Safety Home
            </Button>
          </Card>
        </div>
      );
    }

    const sections = getLessonSectionsForCategory(activeCategory);
    const catMeta = CATEGORY_META.find((c) => c.id === activeCategory);
    const section = sections[lessonSectionIndex] ?? sections[0];
    const isLastSection = lessonSectionIndex === sections.length - 1;

    return (
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "1.5rem" }}>
        <p className="muted">Stay safe · Scam Alley · {catMeta?.label ?? "Lesson"}</p>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>
          {catMeta?.icon} {catMeta?.label} — Learn
        </h1>
        <p style={{ marginBottom: "1.25rem", color: "#64748b", fontSize: "0.9rem" }}>
          Section {lessonSectionIndex + 1} of {sections.length}
        </p>

        {/* Section progress bar */}
        <div
          style={{
            height: "6px",
            background: "#e5e7eb",
            borderRadius: "999px",
            marginBottom: "1.5rem",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${((lessonSectionIndex + 1) / sections.length) * 100}%`,
              background: "#3b82f6",
              borderRadius: "999px",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <Card title={section.heading}>
          <p style={{ lineHeight: "1.7", fontSize: "1rem" }}>{section.body}</p>
        </Card>

        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            marginTop: "1.25rem",
          }}
        >
          {lessonSectionIndex > 0 && (
            <Button
              variant="secondary"
              onClick={() => setLessonSectionIndex((prev) => prev - 1)}
            >
              ← Previous
            </Button>
          )}
          {!isLastSection ? (
            <Button
              variant="primary"
              onClick={() => setLessonSectionIndex((prev) => prev + 1)}
            >
              Next →
            </Button>
          ) : (
            <Button variant="primary" onClick={handleStartCategoryPractice}>
              Start practice ▶
            </Button>
          )}
          <Button variant="secondary" onClick={() => setView("home")}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  //  RENDER — CATEGORY ADAPTIVE PRACTICE (Stage B/C)
  // ══════════════════════════════════════════════════════════════════
  if (view === "cat-practice") {
    if (phishingCurrentScenario === null) {
      return (
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "1.5rem" }}>
          <p className="muted">Stay safe · Scam Alley · Phishing emails</p>
          <p>Loading practice scenario…</p>
          <Button variant="secondary" onClick={() => setView("home")}>Back to Home</Button>
        </div>
      );
    }

    const pScenario = phishingCurrentScenario;
    const pAnswered = phishingSelectedAnswer !== null;
    const pIsCorrect = phishingSelectedAnswer === pScenario.correctAnswer;
    const pFellForScam =
      phishingSelectedAnswer !== null &&
      didFallForScam(phishingSelectedAnswer, pScenario.correctAnswer);
    const isLastPractice = phishingTotal >= PHISHING_MAX_SCENARIOS;

    const catMeta = CATEGORY_META.find((c) => c.id === activeCategory);
    const catLabel = catMeta?.label ?? "Practice";

    return (
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "1.5rem" }}>
        <p className="muted">Stay safe · Scam Alley · {catLabel}</p>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>
          {catMeta?.icon} {catLabel} — Practice
        </h1>

        {/* Adaptive practice note */}
        <div
          style={{
            background: "#f0f8ff",
            border: "1px solid #cce4ff",
            borderRadius: "8px",
            padding: "0.5rem 0.85rem",
            marginBottom: "1rem",
            fontSize: "0.85rem",
            color: "#1d4ed8",
          }}
        >
          Adaptive practice based on your answers — the next question is chosen to match your learning needs.
        </div>

        {/* Progress */}
        <p style={{ marginBottom: "0.25rem", fontWeight: "600", color: "#555" }}>
          Question {Math.min(phishingTotal + 1, PHISHING_MAX_SCENARIOS)} of {PHISHING_MAX_SCENARIOS}
        </p>
        <div
          style={{
            height: "6px",
            background: "#e5e7eb",
            borderRadius: "999px",
            marginBottom: "1.25rem",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(phishingTotal / PHISHING_MAX_SCENARIOS) * 100}%`,
              background: "#3b82f6",
              borderRadius: "999px",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        {/* Simulated scenario card (SMS or Email) */}
        <Card
          title={
            activeCategory === "sms"
              ? "Inspect this text message carefully"
              : "Read this email carefully"
          }
        >
          {activeCategory === "sms" ? (
            <div
              style={{
                maxWidth: "420px",
                margin: "0 auto 1.25rem",
                background: "#f8fafc",
                borderRadius: "18px",
                padding: "1rem",
                border: "1px solid #cbd5e1",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              {/* Phone message header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #e2e8f0",
                  paddingBottom: "0.5rem",
                  marginBottom: "0.75rem",
                  fontSize: "0.82rem",
                  color: "#64748b",
                }}
              >
                <span>💬 SMS Message</span>
                <span style={{ fontWeight: "700", color: "#1e293b" }}>
                  {pScenario.sender ?? "Unknown Sender"}
                </span>
                <span>Today</span>
              </div>

              {/* Message Bubble */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px 14px 14px 4px",
                  padding: "0.85rem 1rem",
                  lineHeight: "1.6",
                  fontSize: "0.95rem",
                  color: "#0f172a",
                  wordBreak: "break-word",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
                aria-label="Simulated text message body"
              >
                <p style={{ margin: 0 }}>{pScenario.body}</p>
              </div>
            </div>
          ) : (
            <>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginBottom: "0.75rem",
                  fontSize: "0.88rem",
                }}
              >
                <tbody>
                  <tr>
                    <td
                      style={{
                        fontWeight: "600",
                        paddingRight: "0.75rem",
                        paddingBottom: "0.3rem",
                        whiteSpace: "nowrap",
                        color: "#64748b",
                      }}
                    >
                      From:
                    </td>
                    <td style={{ paddingBottom: "0.3rem", wordBreak: "break-all" }}>
                      {pScenario.from}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        fontWeight: "600",
                        paddingRight: "0.75rem",
                        paddingBottom: "0.3rem",
                        color: "#64748b",
                      }}
                    >
                      Subject:
                    </td>
                    <td style={{ paddingBottom: "0.3rem" }}>{pScenario.subject}</td>
                  </tr>
                </tbody>
              </table>

              <div
                style={{
                  background: "#fff8ef",
                  border: "1px solid #f1d3a1",
                  borderRadius: "10px",
                  padding: "0.85rem",
                  marginBottom: "1rem",
                  lineHeight: "1.65",
                }}
                aria-label="Simulated email body"
              >
                <p style={{ margin: 0 }}>{pScenario.body}</p>
              </div>
            </>
          )}

          <p style={{ fontWeight: "600", marginBottom: "0.65rem" }}>
            {activeCategory === "sms"
              ? "Does this text message look suspicious or safe?"
              : "Does this email look suspicious or safe?"}
          </p>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Button
              variant="primary"
              onClick={() => handlePhishingAnswer("Suspicious")}
              disabled={pAnswered}
            >
              Suspicious
            </Button>
            <Button
              variant="secondary"
              onClick={() => handlePhishingAnswer("Looks Safe")}
              disabled={pAnswered}
            >
              Looks Safe
            </Button>
          </div>

          {/* Feedback */}
          {pAnswered && (
            <div
              style={{
                marginTop: "1.25rem",
                padding: "1rem",
                borderRadius: "12px",
                background: pIsCorrect ? "#eaf8ef" : "#fff0f0",
                border: `1px solid ${pIsCorrect ? "#9fd3b0" : "#e3b5b5"}`,
              }}
              aria-live="polite"
            >
              <p style={{ marginBottom: "0.5rem" }}>
                <strong>{pIsCorrect ? "Correct!" : "Not quite."}</strong>{" "}
                The best answer is <strong>{pScenario.correctAnswer}</strong>.
              </p>

              {pFellForScam && (
                <p
                  style={{
                    marginBottom: "0.75rem",
                    padding: "0.5rem 0.75rem",
                    background: "#fef3c7",
                    border: "1px solid #fbbf24",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                  }}
                >
                  {activeCategory === "sms"
                    ? "This was a scam text message. In real life, clicking links or replying to messages like this could compromise your phone, accounts, or personal safety."
                    : "This was a phishing email. In real life, clicking links like this could expose your personal information."}
                </p>
              )}

              {!pIsCorrect && !pFellForScam && (
                <p
                  style={{
                    marginBottom: "0.75rem",
                    padding: "0.5rem 0.75rem",
                    background: "#f0f8ff",
                    border: "1px solid #cce4ff",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                  }}
                >
                  {activeCategory === "sms"
                    ? "This text message was actually safe. It is good to be alert, but reading the message calmly and checking what it asks for helps you tell the difference."
                    : "This email was actually safe. It is good to be careful, but reading the email calmly can help you tell the difference."}
                </p>
              )}

              <p style={{ fontWeight: "600", marginBottom: "0.4rem" }}>
                Warning signs to look for:
              </p>
              <ul style={{ margin: "0 0 0.75rem 1.2rem", padding: 0 }}>
                {pScenario.warningSigns.map((w) => (
                  <li key={w} style={{ marginBottom: "0.2rem" }}>
                    {w}
                  </li>
                ))}
              </ul>
              <p style={{ marginBottom: "0.5rem" }}>{pScenario.explanation}</p>
              <p
                style={{
                  margin: 0,
                  padding: "0.5rem 0.75rem",
                  background: "#f0f8ff",
                  border: "1px solid #cce4ff",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                }}
              >
                💡 <strong>Real-life tip:</strong> {pScenario.tip}
              </p>
            </div>
          )}

          {pAnswered && (
            <div style={{ marginTop: "1rem" }}>
              {!isLastPractice ? (
                <Button variant="secondary" onClick={handlePhishingNext}>
                  Next question →
                </Button>
              ) : (
                <Button variant="primary" onClick={handleFinishPhishingPractice}>
                  View my results
                </Button>
              )}
            </div>
          )}
        </Card>

        <div style={{ marginTop: "1rem" }}>
          <Button variant="secondary" onClick={() => setView("home")}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  //  RENDER — CATEGORY RESULTS (Stage D)
  // ══════════════════════════════════════════════════════════════════
  if (view === "cat-results") {
    const pct = calculateScorePercent(phishingCorrect, phishingTotal);
    const passed = isCategoryPassing(pct);
    const weak = weakConcepts(phishingConceptScores);
    const catLabel =
      CATEGORY_META.find((c) => c.id === activeCategory)?.label ?? "Category";

    return (
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "1.5rem" }}>
        <p className="muted">Stay safe · Scam Alley · {catLabel}</p>
        <h1 style={{ fontSize: "1.9rem", marginBottom: "1rem" }}>
          {passed ? "🎉 Level complete!" : "📝 Practice round complete"}
        </h1>

        <Card title="Your results">
          <div style={{ textAlign: "center", padding: "0.5rem 0 1.25rem" }}>
            <p
              style={{
                fontSize: "3rem",
                fontWeight: "800",
                margin: 0,
                color: passed ? "#16a34a" : "#b91c1c",
              }}
            >
              {pct}%
            </p>
            <p style={{ fontSize: "1.05rem", marginTop: "0.25rem" }}>
              {phishingCorrect} correct out of {phishingTotal} questions
            </p>
            <p
              style={{
                marginTop: "0.35rem",
                fontSize: "0.9rem",
                color: "#64748b",
              }}
            >
              Mastery threshold: {PASSING_PERCENTAGE}%
            </p>
          </div>

          {/* Pass / Fail message */}
          <div
            style={{
              background: passed ? "#eaf8ef" : "#fff0f0",
              border: `1px solid ${passed ? "#9fd3b0" : "#e3b5b5"}`,
              borderRadius: "10px",
              padding: "0.85rem 1rem",
              marginBottom: "1.25rem",
            }}
          >
            {passed ? (
              <p style={{ margin: 0 }}>
                <strong>Well done!</strong> You have shown a strong understanding
                of {catLabel.toLowerCase()} warning signs.{" "}
                {(() => {
                  const next = getNextCategory(activeCategory ?? "phishing");
                  if (next) {
                    const nextLabel =
                      CATEGORY_META.find((c) => c.id === next)?.label ?? "Next level";
                    return `${nextLabel} is now unlocked!`;
                  }
                  return "You have completed all levels in Scam Alley!";
                })()}
              </p>
            ) : (
              <p style={{ margin: 0 }}>
                <strong>Good effort!</strong> You are building your skills. Review
                the lesson and try again — you can always improve!
              </p>
            )}
          </div>

          {/* Concept breakdown */}
          <p style={{ fontWeight: "600", marginBottom: "0.5rem" }}>
            What you understand:
          </p>
          <ul style={{ margin: "0 0 0.75rem 1.2rem", padding: 0 }}>
            {(Object.keys(phishingConceptScores) as Concept[])
              .filter((c) => phishingConceptScores[c].attempted > 0)
              .map((c) => {
                const { correct, attempted } = phishingConceptScores[c];
                const ok = correct === attempted;
                return (
                  <li key={c} style={{ marginBottom: "0.25rem" }}>
                    {ok ? "✅" : "⚠️"}{" "}
                    <strong>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </strong>
                    {" — "}
                    {correct}/{attempted} correct
                  </li>
                );
              })}
          </ul>

          {weak.length > 0 && (
            <>
              <p style={{ fontWeight: "600", marginBottom: "0.4rem" }}>
                Concepts to practise more:
              </p>
              <ul style={{ margin: "0 0 0.75rem 1.2rem", padding: 0 }}>
                {weak.map((c) => (
                  <li key={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)} — review
                    the lesson section on this topic
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="muted" style={{ fontSize: "0.85rem" }}>
            (Practice indicator only — not a formal assessment)
          </p>
        </Card>

        {/* Navigation */}
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            marginTop: "1.25rem",
          }}
        >
          {passed ? (
            <Button variant="primary" onClick={handleContinueToNextLevel}>
              {getNextCategory(activeCategory ?? "phishing")
                ? "Continue to next level →"
                : "🏆 Back to Scam Alley"}
            </Button>
          ) : (
            <>
              <Button variant="primary" onClick={handleCategoryRetry}>
                Review lesson
              </Button>
              <Button variant="secondary" onClick={handleStartCategoryPractice}>
                Try practice again
              </Button>
            </>
          )}
          <Button variant="secondary" onClick={() => setView("home")}>
            Back to Scam Safety Home
          </Button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  //  RENDER — LEGACY RESULTS SCREEN
  // ══════════════════════════════════════════════════════════════════
  if (view === "results") {
    const pct = roundTotal === 0 ? 0 : Math.round((roundCorrect / roundTotal) * 100);
    return (
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "1.5rem" }}>
        <p className="muted" style={{ marginBottom: "0.5rem" }}>Stay safe · Scam Alley</p>
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Practice Round Complete!</h1>

        <Card title="Your results">
          <div style={{ textAlign: "center", padding: "0.5rem 0 1.25rem" }}>
            <p style={{ fontSize: "3rem", fontWeight: "800", margin: "0" }}>{pct}%</p>
            <p style={{ fontSize: "1.1rem", marginTop: "0.25rem" }}>
              {roundCorrect} out of {scenarios.length} correct
            </p>
          </div>

          <div
            style={{
              background: "#f0f8ff",
              border: "1px solid #cce4ff",
              borderRadius: "10px",
              padding: "0.85rem 1rem",
              marginBottom: "1.25rem",
            }}
          >
            <p style={{ margin: 0 }}>{getResultMessage(roundCorrect, roundTotal)}</p>
          </div>

          <p className="muted" style={{ fontSize: "0.9rem", marginBottom: "1.25rem" }}>
            (Practice indicator only - not a formal assessment)
          </p>
        </Card>

        {/* Virtual Safety Wallet summary */}
        <div style={{ marginTop: "1.25rem" }}>
          <Card title="Virtual Safety Wallet — Round Summary">
            <p className="muted" style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              This is a fictional wallet used only for educational simulation. No real money is
              involved.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "0.75rem",
                textAlign: "center",
                marginBottom: "0.5rem",
              }}
            >
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "0.75rem",
                }}
              >
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                  Starting balance
                </p>
                <p style={{ margin: "0.25rem 0 0", fontWeight: "700", fontSize: "1.3rem" }}>
                  {WALLET_START} coins
                </p>
              </div>

              <div
                style={{
                  background: roundCoinsLost > 0 ? "#fff0f0" : "#eaf8ef",
                  border: `1px solid ${roundCoinsLost > 0 ? "#e3b5b5" : "#9fd3b0"}`,
                  borderRadius: "10px",
                  padding: "0.75rem",
                }}
              >
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>Coins lost</p>
                <p
                  style={{
                    margin: "0.25rem 0 0",
                    fontWeight: "700",
                    fontSize: "1.3rem",
                    color: roundCoinsLost > 0 ? "#b91c1c" : "#16a34a",
                  }}
                >
                  -{roundCoinsLost}
                </p>
              </div>

              <div
                style={{
                  background:
                    walletBalance === WALLET_START
                      ? "#eaf8ef"
                      : walletBalance >= 70
                      ? "#f0f8ff"
                      : "#fff8ef",
                  border: `1px solid ${
                    walletBalance === WALLET_START
                      ? "#9fd3b0"
                      : walletBalance >= 70
                      ? "#cce4ff"
                      : "#f1d3a1"
                  }`,
                  borderRadius: "10px",
                  padding: "0.75rem",
                }}
              >
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>Final balance</p>
                <p
                  style={{
                    margin: "0.25rem 0 0",
                    fontWeight: "700",
                    fontSize: "1.3rem",
                    color:
                      walletBalance === WALLET_START
                        ? "#16a34a"
                        : walletBalance >= 70
                        ? "#1d4ed8"
                        : "#92400e",
                  }}
                >
                  {walletBalance} coins
                </p>
              </div>
            </div>

            {roundCoinsLost > 0 && (
              <p
                style={{
                  marginTop: "0.75rem",
                  padding: "0.65rem 0.85rem",
                  background: "#fff8ef",
                  border: "1px solid #f1d3a1",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                }}
              >
                You lost virtual coins by falling for scam messages. In real life, scammers
                can cause serious financial harm. Practise again to protect your virtual wallet!
              </p>
            )}
          </Card>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.25rem" }}>
          <Button variant="primary" onClick={handlePracticeAgain}>
            Practice Again
          </Button>
          <Button variant="secondary" onClick={handleOpenDrill}>
            Try Email Safety Challenge
          </Button>
          <Button variant="secondary" onClick={() => setView("home")}>
            Back to Scam Safety Home
          </Button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  //  RENDER — DRILL SCREEN (Tier 2 mock phishing research simulation)
  // ══════════════════════════════════════════════════════════════════
  if (view === "drill") {
    const feedback = drillAction !== null ? getDrillFeedback(drillAction) : null;

    return (
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "1.5rem" }}>
        <p className="muted">Stay safe · Scam Alley</p>
        <h1>Email Safety Challenge</h1>

        <div
          style={{
            background: "#fef3c7",
            border: "1px solid #fbbf24",
            borderRadius: "10px",
            padding: "0.65rem 1rem",
            marginBottom: "1.25rem",
            fontSize: "0.9rem",
          }}
          role="note"
        >
          <strong>Practice simulation only</strong> — this message was never sent from a real
          email address. This exercise is fictional and stays entirely inside WiseCub.
        </div>

        <Card title="Simulated email — read it carefully">
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "1rem",
              fontSize: "0.9rem",
            }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    fontWeight: "600",
                    paddingRight: "0.75rem",
                    paddingBottom: "0.35rem",
                    whiteSpace: "nowrap",
                    color: "#64748b",
                  }}
                >
                  From:
                </td>
                <td style={{ paddingBottom: "0.35rem" }}>{DRILL_EMAIL.sender}</td>
              </tr>
              <tr>
                <td
                  style={{
                    fontWeight: "600",
                    paddingRight: "0.75rem",
                    paddingBottom: "0.35rem",
                    color: "#64748b",
                  }}
                >
                  Subject:
                </td>
                <td style={{ paddingBottom: "0.35rem" }}>{DRILL_EMAIL.subject}</td>
              </tr>
            </tbody>
          </table>

          <div
            style={{
              background: "#fff8ef",
              border: "1px solid #f1d3a1",
              borderRadius: "10px",
              padding: "1rem",
              marginBottom: "1rem",
              lineHeight: "1.6",
            }}
            aria-label="Simulated email message body"
          >
            <p style={{ margin: "0 0 0.75rem" }}>{DRILL_EMAIL.body}</p>
            <p
              style={{
                margin: 0,
                fontFamily: "monospace",
                fontSize: "0.9rem",
                color: "#64748b",
                background: "#f1f5f9",
                padding: "0.35rem 0.6rem",
                borderRadius: "6px",
                display: "inline-block",
              }}
              aria-label="Fictional example URL — not a real link"
            >
              {DRILL_EMAIL.displayUrl}
            </p>
            <p
              style={{
                margin: "0.5rem 0 0",
                fontSize: "0.8rem",
                color: "#94a3b8",
                fontStyle: "italic",
              }}
            >
              (This is a fictional address — no link is active)
            </p>
          </div>

          {drillAction === null && (
            <>
              <p style={{ fontWeight: "600", marginBottom: "0.75rem" }}>
                What would you do if you received this email?
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Button variant="primary" onClick={() => handleDrillChoice("clicked")}>
                  I would click the link
                </Button>
                <Button variant="secondary" onClick={() => handleDrillChoice("ignored")}>
                  I would ignore the message
                </Button>
                <Button variant="secondary" onClick={() => handleDrillChoice("reported")}>
                  I would report it as a scam
                </Button>
              </div>
            </>
          )}

          {feedback !== null && drillAction !== null && (
            <div
              style={{
                marginTop: "1.25rem",
                padding: "1rem",
                borderRadius: "12px",
                background: feedback.colour,
                border: `1px solid ${feedback.borderColour}`,
              }}
              aria-live="polite"
            >
              <p style={{ marginBottom: "0.5rem" }}>
                <strong>{feedback.heading}</strong>
              </p>
              <p style={{ marginBottom: "0.75rem" }}>{feedback.body}</p>

              {feedback.penaltyNote !== null && (
                <p
                  style={{
                    marginBottom: "0.75rem",
                    padding: "0.5rem 0.75rem",
                    background: "#fef3c7",
                    border: "1px solid #fbbf24",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                  }}
                >
                  {feedback.penaltyNote}
                </p>
              )}

              <p style={{ fontWeight: "600", marginBottom: "0.4rem" }}>
                Warning signs in this email:
              </p>
              <ul style={{ margin: "0 0 0.75rem 1.2rem", padding: 0 }}>
                {DRILL_EMAIL.warningSigns.map((sign) => (
                  <li key={sign} style={{ marginBottom: "0.25rem" }}>
                    {sign}
                  </li>
                ))}
              </ul>
              <p style={{ marginBottom: 0 }}>{DRILL_EMAIL.explanation}</p>
            </div>
          )}
        </Card>

        <div style={{ marginTop: "1.25rem" }}>
          <Button variant="secondary" onClick={() => setView("results")}>
            Back to Results
          </Button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  //  RENDER — LEGACY PRACTICE SCREEN
  // ══════════════════════════════════════════════════════════════════
  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "1.5rem" }}>
      <p className="muted">Stay safe · Scam Alley</p>
      <h1>Scam safety practice</h1>

      {/* Virtual Safety Wallet — live display */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "0.65rem 1rem",
          marginBottom: "1rem",
        }}
      >
        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
          Virtual Safety Wallet{" "}
          <span style={{ fontStyle: "italic" }}>(simulation only — no real money)</span>
        </span>
        <span
          style={{
            fontWeight: "700",
            fontSize: "1.05rem",
            color:
              walletBalance === WALLET_START
                ? "#16a34a"
                : walletBalance >= 70
                ? "#1d4ed8"
                : "#b91c1c",
          }}
        >
          {walletBalance} / {WALLET_START} coins
        </span>
      </div>

      <Card title={scenario.title}>
        <p style={{ marginBottom: "0.25rem", fontWeight: "600", color: "#555" }}>
          Scenario {scenarioIndex + 1} of {scenarios.length}
        </p>

        <div
          style={{
            height: "6px",
            background: "#e5e7eb",
            borderRadius: "999px",
            marginBottom: "1rem",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${((scenarioIndex + 1) / scenarios.length) * 100}%`,
              background: "#3b82f6",
              borderRadius: "999px",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <p>Read the message below and decide whether it looks safe or suspicious.</p>

        <div
          style={{
            background: "#fff8ef",
            border: "1px solid #f1d3a1",
            borderRadius: "12px",
            padding: "1rem",
            margin: "1rem 0",
          }}
          aria-live="polite"
        >
          <strong>Simulated message:</strong>
          <p style={{ marginTop: "0.5rem", marginBottom: 0 }}>{scenario.message}</p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
          <Button
            variant="primary"
            onClick={() => handleAnswer("Suspicious")}
            disabled={selectedAnswer !== null}
          >
            Suspicious
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleAnswer("Looks Safe")}
            disabled={selectedAnswer !== null}
          >
            Looks Safe
          </Button>
        </div>

        {selectedAnswer !== null && (
          <div
            style={{
              marginTop: "1.25rem",
              padding: "1rem",
              borderRadius: "12px",
              background: isCorrect ? "#eaf8ef" : "#fff0f0",
              border: `1px solid ${isCorrect ? "#9fd3b0" : "#e3b5b5"}`,
            }}
          >
            <p style={{ marginBottom: "0.5rem" }}>
              <strong>{isCorrect ? "Correct!" : "Not quite."}</strong>{" "}
              The best answer is <strong>{scenario.correctAnswer}</strong>.
            </p>

            {fellForScam && (
              <p
                style={{
                  marginBottom: "0.75rem",
                  padding: "0.5rem 0.75rem",
                  background: "#fef3c7",
                  border: "1px solid #fbbf24",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                }}
              >
                You trusted a scam message. In this simulation, you lost{" "}
                <strong>{DEDUCTION_PER_SCAM} virtual coins</strong> from your Safety Wallet.
                In real life, scammers can cause real financial harm — always check before you
                act!
              </p>
            )}

            {!isCorrect && !fellForScam && (
              <p
                style={{
                  marginBottom: "0.75rem",
                  padding: "0.5rem 0.75rem",
                  background: "#f0f8ff",
                  border: "1px solid #cce4ff",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                }}
              >
                This message was safe, but you marked it as suspicious. It is fine to be
                cautious, but try to read messages carefully so you do not accidentally ignore
                genuine communications. No coins were deducted.
              </p>
            )}

            <p style={{ marginBottom: "0.5rem" }}>
              <strong>Warning signs:</strong>
            </p>
            <ul style={{ margin: "0 0 0.75rem 1.2rem", padding: 0 }}>
              {scenario.warningSigns.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
            <p style={{ marginBottom: 0 }}>{scenario.explanation}</p>
          </div>
        )}

        <div style={{ marginTop: "1.25rem" }}>
          <p>
            <strong>Round score:</strong>{" "}
            {roundTotal === 0
              ? "Not assessed yet"
              : `${roundCorrect} correct out of ${roundTotal} answered (${Math.round(
                  (roundCorrect / roundTotal) * 100
                )}%)`}
          </p>
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            (Practice indicator only - not a formal assessment)
          </p>

          {selectedAnswer !== null && (
            <div style={{ marginTop: "0.75rem" }}>
              {!isLastScenario ? (
                <Button variant="secondary" onClick={handleNextScenario}>
                  Next Scenario
                </Button>
              ) : (
                <Button variant="primary" onClick={handleViewResults}>
                  View Practice Results
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
