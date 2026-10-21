import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { CubMascot } from "../../../components/cub-assistant/CubMascot";
import { LevelCard } from "../components/LevelCard";
import { LevelPreview } from "../components/LevelPreview";
import { LEVELS, TOTAL_LEVELS } from "../data/levels";
import { refreshProgress } from "../services/decisionApi";
import {
  getLevelStatus,
  progressPercent,
  readProgress,
} from "../services/progressStore";
import "../styles/choice-town.css";

export function LevelsPage() {
  const location = useLocation();
  const [progress, setProgress] = useState(() => readProgress());
  const [selectedLevelId, setSelectedLevelId] = useState(progress.currentLevelId || 1);

  useEffect(() => {
    let cancelled = false;
    refreshProgress().then((next) => {
      if (!cancelled) {
        setProgress(next);
        setSelectedLevelId(next.currentLevelId || 1);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [location.key]);

  const selectedLevel = LEVELS.find((level) => level.id === selectedLevelId) ?? LEVELS[0];
  const selectedStatus = getLevelStatus(selectedLevel.id, progress);
  const completedCount = progress.completedLevelIds.length;
  const percent = progressPercent(progress);

  return (
    <div className="choice-town">
      <p className="choice-banner" role="note">
        Decisions and reasoning progress are persisted in MongoDB for your authenticated profile.
        If the server is offline, this browser keeps a local copy.
      </p>
      <header className="choice-hero">
        <div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <CubMascot size={92} />
            <div>
              <h1>Choice Town</h1>
              <p className="choice-kicker">Your decision journey</p>
            </div>
          </div>
          <p className="lede">
            Explore real-life situations, make choices, and learn from the outcomes.
          </p>
        </div>
        <aside className="progress-card" aria-label="Level progress">
          <strong>
            {completedCount} of {TOTAL_LEVELS} levels completed
          </strong>
          <div className="progress-meta">
            <span>Progress</span>
            <span>{percent}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
        </aside>
      </header>

      <section aria-label="Ten learning levels">
        <div className="level-grid">
          {LEVELS.map((level) => (
            <LevelCard
              key={level.id}
              level={level}
              status={getLevelStatus(level.id, progress)}
              selected={level.id === selectedLevel.id}
              onSelect={setSelectedLevelId}
            />
          ))}
        </div>
      </section>

      <LevelPreview level={selectedLevel} status={selectedStatus} />
    </div>
  );
}
