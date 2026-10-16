
import { useState } from "react";
import { Card } from "../../../components/common/Card";

type Choice = {
  id: string;
  title: string;
  description: string;
  spent: number;
  saved: number;
  flexible: number;
  feedback: string;
};

const choices: Choice[] = [
  {
    id: "save",
    title: "Save all your coins",
    description: "Skip the snack and save everything for later.",
    spent: 0,
    saved: 100,
    flexible: 0,
    feedback:
      "You are making progress towards your future goal. You keep all your coins for later.",
  },
  {
    id: "snack",
    title: "Buy the snack",
    description: "Spend 30 coins on a snack and save the rest.",
    spent: 30,
    saved: 70,
    flexible: 0,
    feedback:
      "You enjoy a snack today and still save 70 coins. Consider how this supports your future goal.",
  },
  {
    id: "plan",
    title: "Make a spending plan",
    description:
      "Buy the snack, save 50 coins, and keep 20 flexible.",
    spent: 30,
    saved: 50,
    flexible: 20,
    feedback:
      "You enjoyed a snack, saved 50 coins, and kept 20 available for another choice. Planning can help balance different needs.",
  },
  {
    id: "shop-save",
    title: "Buy one item and save",
    description: "Spend 80 coins on one item and save 120 coins.",
    spent: 80,
    saved: 120,
    flexible: 0,
    feedback:
      "You bought one item and saved 120 coins for later.",
  },
  {
    id: "shop-plan",
    title: "Plan before shopping",
    description: "Spend 50 coins, save 100, and keep 50 flexible.",
    spent: 50,
    saved: 100,
    flexible: 50,
    feedback:
      "You planned your spending and kept some coins available for other needs.",
  },
];

export function LevelsPage() {
  const [selectedChoice, setSelectedChoice] =
    useState<Choice | null>(null);
    const [currentLevel, setCurrentLevel] = useState(1);

  return (
    <div>
      <p className="muted">Learn · Choice Town · Level 1</p>

      
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          type="button"
          onClick={() => {
            setCurrentLevel(1);
            setSelectedChoice(null);
          }}
          style={{ padding: "10px 16px", cursor: "pointer" }}
        >
          Level 1
        </button>

        <button
          type="button"
          onClick={() => {
            setCurrentLevel(2);
            setSelectedChoice(null);
          }}
          style={{ padding: "10px 16px", cursor: "pointer" }}
        >
          Level 2
        </button>
      </div>


      <h1>{currentLevel === 1 ? "The Saturday Choice" : "The Smart Shopper"}</h1>

      <p>
        You have 100 virtual coins. You want a snack today,
        but you are also saving for something you want later.
        What will you do?
      </p>

      <Card title="Your virtual wallet">
        <p>
          Starting balance: <strong>100 coins</strong>
        </p>
        <p className="muted">
          These coins are for practice only. They are not real money.
        </p>
      </Card>

      <div
        style={{
          display: "grid",
          gap: "12px",
          marginTop: "20px",
        }}
      >
        <h2>Choose your action</h2>

        {choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            onClick={() => setSelectedChoice(choice)}
            aria-pressed={selectedChoice?.id === choice.id}
            style={{
              display: "block",
              width: "100%",
              padding: "16px",
              textAlign: "left",
              font: "inherit",
              color: "inherit",
              background:
                selectedChoice?.id === choice.id
                  ? "#fff0e5"
                  : "#ffffff",
              border:
                selectedChoice?.id === choice.id
                  ? "2px solid #e87935"
                  : "1px solid #ded6ca",
              borderRadius: "12px",
              cursor: "pointer",
            }}
          >
            <strong>{choice.title}</strong>
            <p style={{ marginBottom: 0 }}>
              {choice.description}
            </p>
          </button>
        ))}
      </div>

      {selectedChoice && (
        <div
          aria-live="polite"
          style={{ marginTop: "24px" }}
        >
          <Card title="Your outcome">
            <p>{selectedChoice.feedback}</p>

            <ul>
              <li>Coins spent: {selectedChoice.spent}</li>
              <li>Coins saved: {selectedChoice.saved}</li>
              <li>
                Coins kept flexible: {selectedChoice.flexible}
              </li>
              <li>
                Total:{" "}
                {selectedChoice.spent +
                  selectedChoice.saved +
                  selectedChoice.flexible}{" "}
                coins
              </li>
            </ul>

            <h3>Think about your decision</h3>
            <p>
              What mattered most to you: enjoying something today,
              saving for later, or balancing both?
            </p>

            <button
              type="button"
              onClick={() => setSelectedChoice(null)}
              style={{
                padding: "10px 16px",
                border: "none",
                borderRadius: "8px",
                background: "#e87935",
                color: "#ffffff",
                font: "inherit",
                cursor: "pointer",
              }}
            >
              Try another choice
            </button>
          </Card>
        </div>
      )}
    </div>
  );
}
