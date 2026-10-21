import { Link } from "react-router-dom";
import type { LevelDefinition, LevelStatus } from "../types/decisionMaking";
import { LevelArt } from "./LevelArt";

type LevelPreviewProps = {
  level: LevelDefinition;
  status: LevelStatus;
};

export function LevelPreview({ level, status }: LevelPreviewProps) {
  const locked = status === "locked";
  const startLabel = status === "completed" ? "Review level" : "Start level";

  return (
    <section className="preview-panel" aria-labelledby="preview-title">
      <div>
        <p className="choice-kicker">
          Level {level.id} ·{" "}
          {status === "completed"
            ? "Completed"
            : status === "current"
              ? "Next up"
              : status === "available"
                ? "Open"
                : "Locked"}
        </p>
        <h2 id="preview-title">{level.title}</h2>
        <p className="choice-lead">{level.preview}</p>
        <div className="cub-suggest">
          <span aria-hidden="true">💡</span>
          <p>
            <strong>Cub suggests:</strong> {level.cubHint}
          </p>
        </div>
        {locked ? (
          <p className="locked-msg" role="status">
            This level is locked. Complete the earlier required level first.
          </p>
        ) : null}
        {level.playable && !locked ? (
          <Link className="btn-gold" to={`/choices/levels/${level.id}`}>
            {startLabel}
          </Link>
        ) : (
          <button type="button" className="btn-gold" disabled>
            {locked ? "Level locked" : "Scenario not ready"}
          </button>
        )}
      </div>
      <div className="preview-art" aria-hidden="true">
        <LevelArt icon={level.icon} size={160} />
      </div>
    </section>
  );
}
