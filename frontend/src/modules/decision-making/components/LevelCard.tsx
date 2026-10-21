import type { LevelDefinition, LevelStatus } from "../types/decisionMaking";
import { LevelArt } from "./LevelArt";

type LevelCardProps = {
  level: LevelDefinition;
  status: LevelStatus;
  selected: boolean;
  onSelect: (id: number) => void;
};

function statusLabel(status: LevelStatus): string {
  if (status === "completed") return "Completed";
  if (status === "current") return "Next up";
  if (status === "available") return "Open";
  return "Locked";
}

export function LevelCard({ level, status, selected, onSelect }: LevelCardProps) {
  return (
    <button
      type="button"
      className={`level-card is-${status}${selected ? " is-selected" : ""}`}
      onClick={() => onSelect(level.id)}
      aria-pressed={selected}
      aria-label={`Level ${level.id}: ${level.title}. ${statusLabel(status)}.`}
    >
      <div className="level-card-top">
        <span className="level-num" aria-hidden="true">
          {status === "completed" ? "✓" : level.id}
        </span>
        <span className="level-status">
          {status === "completed" ? "Completed" : null}
          {status === "current" ? "Next up" : null}
          {status === "available" ? "Open" : null}
          {status === "locked" ? "Locked" : null}
        </span>
      </div>
      <div className="level-art">
        <LevelArt icon={level.icon} size={72} />
      </div>
      <h2>{level.title}</h2>
      <p>{level.description}</p>
    </button>
  );
}
