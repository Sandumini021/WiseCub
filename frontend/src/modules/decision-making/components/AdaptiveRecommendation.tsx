import { Link } from "react-router-dom";
import type { AdaptiveRecommendation as Rec } from "../types/decisionMaking";

type AdaptiveRecommendationProps = {
  items: Rec[];
};

export function AdaptiveRecommendation({ items }: AdaptiveRecommendationProps) {
  return (
    <section className="profile-card" aria-labelledby="rec-title">
      <h2 id="rec-title">Suggested next practice</h2>
      <p>
        These ideas come from a simple, visible rule set. They are not a medical,
        psychological, or intelligence judgement.
      </p>
      <div className="rec-list">
        {items.map((item) => (
          <article className="rec-card" key={item.id}>
            <h3>{item.title}</h3>
            <p>{item.reason}</p>
            <small>
              {item.basedOn === "pattern"
                ? "Based on a pattern across several completed scenarios."
                : "Based on this single response — not yet a long-term pattern."}
            </small>
            {item.id !== "one-answer-note" ? (
              <p>
                <Link to={`/choices/levels/${item.suggestedLevelId}`}>Open this level</Link>
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
