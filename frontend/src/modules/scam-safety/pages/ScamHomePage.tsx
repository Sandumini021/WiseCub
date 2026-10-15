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
];

export function ScamHomePage() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<"Suspicious" | "Looks Safe" | null>(null);

  const scenario = useMemo(() => scenarios[scenarioIndex], [scenarioIndex]);
  const isCorrect = selectedAnswer === scenario.correctAnswer;

  function handleAnswer(answer: "Suspicious" | "Looks Safe") {
    setSelectedAnswer(answer);
  }

  function handleNextScenario() {
    setSelectedAnswer(null);
    setScenarioIndex((currentIndex) => (currentIndex + 1) % scenarios.length);
  }

  return (
    <div>
      <p className="muted">Stay safe · Scam Alley</p>
      <h1>Scam safety practice</h1>

      <Card title={scenario.title}>
        <p>
          Read the message below and decide whether it looks safe or suspicious.
        </p>

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
          <Button variant="primary" onClick={() => handleAnswer("Suspicious")}>
            Suspicious
          </Button>
          <Button variant="secondary" onClick={() => handleAnswer("Looks Safe")}>
            Looks Safe
          </Button>
        </div>

        {selectedAnswer ? (
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
              <strong>
                {isCorrect ? "Correct!" : "Not quite."}
              </strong>{" "}
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
        ) : null}

        <div style={{ marginTop: "1.25rem" }}>
          <Button variant="secondary" onClick={handleNextScenario}>
            Try another practice scenario
          </Button>
        </div>
      </Card>
    </div>
  );
}
