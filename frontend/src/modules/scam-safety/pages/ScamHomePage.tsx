import { useMemo, useState } from "react";
import { Button } from "../../../components/common/Button";
import { Card } from "../../../components/common/Card";

type Scenario = {
  id: number;
  title: string;
  message: string;
  correctAnswer: "Suspicious" | "Looks Safe";
  warningSigns: string[];
  explanation: string;
};

const categories: string[] = [
  "Phishing emails",
  "Scam text messages",
  "Fake QR-code offers",
  "Prize and giveaway scams",
  "Impersonation scams",
  "Deceptive financial offers",
];

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

function getResultMessage(correct: number, total: number): string {
  const pct = total === 0 ? 0 : Math.round((correct / total) * 100);
  if (pct === 100) return "Amazing! You spotted every scam. You are a true Scam Safety Champion!";
  if (pct >= 80) return "Great work! You caught most of the scams. Keep practising to reach 100%!";
  if (pct >= 60) return "Good effort! You are getting better at spotting scams. Review the explanations and try again!";
  if (pct >= 40) return "Nice try! Scams can be tricky. Read the warning signs carefully and give it another go!";
  return "Keep going! Scams are designed to fool people. Review the tips and try again - you can do it!";
}

type View = "home" | "practice" | "results";

export function ScamHomePage() {
  const [view, setView] = useState<View>("home");

  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<"Suspicious" | "Looks Safe" | null>(null);
  const [roundTotal, setRoundTotal] = useState(0);
  const [roundCorrect, setRoundCorrect] = useState(0);
  const [answeredIds, setAnsweredIds] = useState<number[]>([]);

  const [lifetimeTotal, setLifetimeTotal] = useState(0);
  const [lifetimeCorrect, setLifetimeCorrect] = useState(0);

  const scenario = useMemo(() => scenarios[scenarioIndex], [scenarioIndex]);
  const isCorrect = selectedAnswer === scenario.correctAnswer;
  const isLastScenario = scenarioIndex === scenarios.length - 1;

  function handleAnswer(answer: "Suspicious" | "Looks Safe") {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answer);
    if (!answeredIds.includes(scenario.id)) {
      setRoundTotal((prev) => prev + 1);
      if (answer === scenario.correctAnswer) {
        setRoundCorrect((prev) => prev + 1);
      }
      setAnsweredIds((prev) => [...prev, scenario.id]);
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

  function handleStartPractice() {
    setScenarioIndex(0);
    setSelectedAnswer(null);
    setRoundTotal(0);
    setRoundCorrect(0);
    setAnsweredIds([]);
    setView("practice");
  }

  function handlePracticeAgain() {
    setScenarioIndex(0);
    setSelectedAnswer(null);
    setRoundTotal(0);
    setRoundCorrect(0);
    setAnsweredIds([]);
    setView("practice");
  }

  if (view === "home") {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1.5rem" }}>
        <p className="muted" style={{ marginBottom: "0.5rem" }}>Stay safe · Scam Alley</p>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>Scam safety practice</h1>
        <p style={{ marginBottom: "1.5rem" }}>
          Welcome! Learn to recognise warning signs in six scam categories.
        </p>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1.25rem",
            marginBottom: "2rem",
          }}
        >
          {categories.map((cat) => (
            <Card key={cat} title={cat}>
              <p style={{ margin: 0 }}>Learn about {cat.toLowerCase()}.</p>
            </Card>
          ))}
        </section>

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

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Button variant="primary" onClick={handlePracticeAgain}>
              Practice Again
            </Button>
            <Button variant="secondary" onClick={() => setView("home")}>
              Back to Scam Safety Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "1.5rem" }}>
      <p className="muted">Stay safe · Scam Alley</p>
      <h1>Scam safety practice</h1>

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
