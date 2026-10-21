import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useLang } from "../../../i18n/useLang";
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
  const { t } = useLang();
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
        {t("choices.banner")}
      </p>
      <header className="choice-hero">
        <div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <CubMascot size={92} />
            <div>
              <h1>{t("choices.title")}</h1>
              <p className="choice-kicker">{t("choices.kicker")}</p>
            </div>
          </div>
          <p className="lede">{t("choices.lede")}</p>
        </div>
        <aside className="progress-card" aria-label={t("choices.progress")}>
          <strong>{t("choices.done", { done: completedCount, total: TOTAL_LEVELS })}</strong>
          <div className="progress-meta">
            <span>{t("choices.progress")}</span>
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
