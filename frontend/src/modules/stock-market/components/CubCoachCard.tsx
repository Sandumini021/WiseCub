import { CubFace } from "../../../components/cub-assistant/CubFace";
import type { CubLang } from "../../../components/cub-assistant/cubAssistantTypes";
import { speakCub } from "../../../components/cub-assistant/cubSpeech";
import type { CoachCard } from "../data/decisionCoach";
import { dismissCoach } from "../data/decisionCoach";

export function CubCoachCard({
  card,
  lang,
  onDismiss,
  compact = false,
}: {
  card: CoachCard;
  lang: CubLang;
  onDismiss?: () => void;
  compact?: boolean;
}) {
  return (
    <aside className={`cub-coach${compact ? " is-compact" : ""}`} role="status">
      <CubFace expression="giving-tip" size={72} lang={lang} />
      <div>
        <strong>{card.title}</strong>
        {compact ? null : <p>{card.body}</p>}
        <div className="cub-coach-actions">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => speakCub(card.body, lang)}
          >
            {lang === "si" ? "අසන්න" : "Hear Cub"}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              dismissCoach(card.id);
              onDismiss?.();
            }}
          >
            {lang === "si" ? "හරි, තේරුණා" : "Got it"}
          </button>
        </div>
      </div>
    </aside>
  );
}
