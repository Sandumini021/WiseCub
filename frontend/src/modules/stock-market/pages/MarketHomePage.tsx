import { Button } from "../../../components/common/Button";
import { Card } from "../../../components/common/Card";

const lessons = [
  { n: 1, title: "What a share is", state: "Open next" },
  { n: 2, title: "Risk and return", state: "Locked" },
  { n: 3, title: "Spreading money", state: "Locked" },
  { n: 4, title: "Compounding", state: "Locked" },
];

export function MarketHomePage() {
  return (
    <div>
      <p className="muted">Invest · Market floor</p>
      <h1>A real-looking market. Fake money. No regrets.</h1>
      <p>
        You will trade fictional companies with virtual rupees. Cub will explain
        each move before it is confirmed. The live terminal, charts, and orders
        are not in this increment yet.
      </p>

      <Card title="The one rule">
        <p>
          No real money, ever. Nothing here connects to a bank or a brokerage.
        </p>
      </Card>

      <h2>Four lessons — the market unlocks after the first</h2>
      <div className="lesson-list">
        {lessons.map((lesson) => (
          <div className="lesson-chip" key={lesson.n}>
            <strong>
              {lesson.n}. {lesson.title}
            </strong>
            <span className="muted">{lesson.state}</span>
          </div>
        ))}
      </div>

      <p className="coming-next">
        Lesson screens and the market terminal come next. Company names will stay
        fictional.
      </p>
      <Button variant="secondary" disabled>
        Start lesson 1 — next increment
      </Button>
    </div>
  );
}
