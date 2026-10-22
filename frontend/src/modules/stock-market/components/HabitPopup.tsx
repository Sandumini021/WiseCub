import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CubFace } from "../../../components/cub-assistant/CubFace";
import type { CubLang } from "../../../components/cub-assistant/cubAssistantTypes";
import {
  expressionForPattern,
  patternMessage,
  tipMessage,
  type CubExpression,
} from "../../../components/cub-assistant/cubExpressions";
import { speakCub } from "../../../components/cub-assistant/cubSpeech";
import type { BehaviourReport } from "../../../services/apiClient";
import { recordMarketEvent } from "../data/behaviourEvents";
import type { HabitFlags } from "../data/sessionReview";

type Card = {
  id: string;
  emoji: string;
  title: string;
  flagged: boolean;
  sample: boolean;
  calm: boolean;
  count: number;
  message: string;
  tryNext: string;
  to: string;
  expression: CubExpression;
  badge: string;
};

const KID: Record<string, { emoji: string; title: string; tryNext: string; to: string }> = {
  herd_behaviour: {
    emoji: "🐑",
    title: "Following the crowd",
    tryNext: "Open another company before you tap Buy.",
    to: "/market/lessons/8",
  },
  poor_diversification: {
    emoji: "🧺",
    title: "One big basket",
    tryNext: "Practise a small slice of a second name.",
    to: "/market/lessons/3",
  },
  impulsive_investing: {
    emoji: "⚡",
    title: "Super-fast taps",
    tryNext: "Pause, read Why it moved, then decide.",
    to: "/market/lessons/7",
  },
  panic_selling: {
    emoji: "🌧️",
    title: "Sold in a hurry",
    tryNext: "A red day is not a rule to sell.",
    to: "/market/lessons/6",
  },
  overconfidence: {
    emoji: "🌟",
    title: "One green day",
    tryNext: "A win is not a shield. Check bag size.",
    to: "/market/lessons/7",
  },
  insufficient_research: {
    emoji: "🔍",
    title: "Skipped the note",
    tryNext: "Open the chart and Why it moved first.",
    to: "/market/terminal",
  },
};

function badgeFor(level: string, flagged: boolean, sample: boolean) {
  if (sample) {
    return "Tiny sample";
  }
  if (flagged) {
    return "Look closer";
  }
  if (level === "not_observed") {
    return "Looking good";
  }
  return "Tracked";
}

function buildCards(report: BehaviourReport | null, flags: HabitFlags, lang: CubLang): Card[] {
  const fromApi = report?.indicators ?? [];
  const seen = new Set(fromApi.map((item) => item.behaviour));
  const cards: Card[] = fromApi.map((item) => {
    const kid = KID[item.behaviour] ?? {
      emoji: "🐻",
      title: item.behaviour.split("_").join(" "),
      tryNext: item.suggested_activity,
      to: "/market/lessons/7",
    };
    const flagged = item.level === "worth_reviewing";
    const sample = item.level === "insufficient_evidence";
    const coach = report?.coaching.find((line) => line.behaviour === item.behaviour)?.text;
    return {
      id: item.behaviour,
      emoji: kid.emoji,
      title: kid.title,
      flagged,
      sample,
      calm: item.level === "not_observed",
      count: item.occurrences,
      message: sample
        ? lang === "si"
          ? "තවම පුරුදු ටිකයි. Cub මේක ලකුණු කරනවා — තව පුරුදු trades වලින් පැහැදිලි වෙනවා."
          : "Only a tiny sample so far. Cub is tracking this, not grading you."
        : flagged
          ? coach ?? patternMessage(item.behaviour, item.level, lang)
          : patternMessage(item.behaviour, item.level, lang),
      tryNext: kid.tryNext,
      to: kid.to,
      expression: expressionForPattern(item.behaviour, item.level),
      badge: badgeFor(item.level, flagged, sample),
    };
  });

  if (flags.concentrated && !seen.has("poor_diversification")) {
    cards.push({
      id: "poor_diversification",
      emoji: "🧺",
      title: "One big basket",
      flagged: true,
      sample: false,
      calm: false,
      count: 1,
      message: patternMessage("poor_diversification", "worth_reviewing", lang),
      tryNext: KID.poor_diversification.tryNext,
      to: KID.poor_diversification.to,
      expression: "thinking",
      badge: "Look closer",
    });
  }
  if (flags.quickSells >= 2 && !seen.has("panic_selling")) {
    cards.push({
      id: "panic_selling",
      emoji: "🌧️",
      title: "Sold in a hurry",
      flagged: true,
      sample: false,
      calm: false,
      count: flags.quickSells,
      message: patternMessage("panic_selling", "worth_reviewing", lang),
      tryNext: KID.panic_selling.tryNext,
      to: KID.panic_selling.to,
      expression: "concerned",
      badge: "Look closer",
    });
  }
  if (flags.listenedToWarning) {
    cards.push({
      id: "listened",
      emoji: "👍",
      title: "You slowed down",
      flagged: false,
      sample: false,
      calm: true,
      count: 1,
      message:
        lang === "si"
          ? "Cubගේ අනතුරු ඇඟවීමෙන් පස්සේ කොටස් අඩු කළා. ඒක අවදානම දැකපු එකයි."
          : "You chose fewer shares after Cub’s warning. That is noticing risk.",
      tryNext: "Keep pausing before the next tap.",
      to: "/market/lessons/7",
      expression: "celebrating",
      badge: "Looking good",
    });
  }
  if (flags.tradeCount > 0 && flags.tradeCount < 5 && !cards.some((card) => card.sample)) {
    cards.push({
      id: "tiny_sample",
      emoji: "🌱",
      title: "Still collecting",
      flagged: false,
      sample: true,
      calm: false,
      count: flags.tradeCount,
      message:
        lang === "si"
          ? "පුරුදු taps ටිකයි. Habits පෙන්වන්න තව trades ඕනේ — මේක score එකක් නෙවෙයි."
          : "Only a few practice taps so far. Habits get clearer after more trades — this is not a score.",
      tryNext: "Do two more small practice trades, then come back.",
      to: "/market/terminal",
      expression: "listening",
      badge: "Tiny sample",
    });
  }

  const review = cards.find((card) => card.flagged);
  if (review) {
    const tip = tipMessage(lang, review.tryNext);
    cards.push({
      id: "learning_tip",
      emoji: "💡",
      title: lang === "si" ? "Cub ඉඟිය" : "Cub’s tip",
      flagged: true,
      sample: false,
      calm: false,
      count: 1,
      message: tip.message,
      tryNext: review.tryNext,
      to: review.to,
      expression: tip.expression,
      badge: "Try next",
    });
  }
  return cards;
}

export function HabitPopup({
  report,
  flags,
  lang,
}: {
  report: BehaviourReport | null;
  flags: HabitFlags;
  lang: CubLang;
}) {
  const cards = useMemo(() => buildCards(report, flags, lang), [report, flags, lang]);
  const flagged = cards.filter((card) => card.flagged);
  const [pick, setPick] = useState<string | null>(flagged[0]?.id ?? cards[0]?.id ?? null);
  const chosen = cards.find((card) => card.id === pick) ?? flagged[0] ?? cards[0];
  const taps = report?.event_count ?? flags.tradeCount;
  const coachRef = useRef<HTMLDivElement>(null);

  function selectCard(id: string) {
    setPick(id);
    recordMarketEvent({ type: "habit_card_tapped", reason: id });
    if (window.matchMedia("(max-width: 980px)").matches) {
      coachRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  return (
    <section className="pf-track" aria-labelledby="habit-title">
      <div className="pf-track-head">
        <p className="habit-kicker">Behaviour tracking · this session only · never a grade</p>
        <h2 id="habit-title">What Cub noticed</h2>
        <p className="pf-track-meta">
          {taps === 1 ? "1 practice tap" : `${taps} practice taps`}
          {report?.engine ? ` · ${report.engine}` : ""}
        </p>
      </div>

      {cards.length === 0 ? (
        <p className="pf-quiet">Cub is still collecting. A few practice trades will show habits here.</p>
      ) : (
        <div className="pf-track-split">
          <div className="habit-cards pf-track-cards">
            {cards.map((card) => (
              <button
                key={card.id}
                type="button"
                className={`habit-card${pick === card.id ? " is-on" : ""}${card.flagged ? " is-flag" : ""}${card.sample ? " is-sample" : ""}${card.calm ? " is-calm" : ""}`}
                onClick={() => selectCard(card.id)}
              >
                <span aria-hidden="true">{card.emoji}</span>
                <span className="habit-card-copy">
                  <strong>{card.title}</strong>
                  <em>
                    {card.badge}
                    {card.count > 1 ? ` · ${card.count}` : ""}
                  </em>
                </span>
              </button>
            ))}
          </div>

          {chosen ? (
            <aside className="pf-track-coach" ref={coachRef} aria-live="polite">
              <p className="habit-kicker">{chosen.title}</p>
              <CubFace expression={chosen.expression} message={chosen.message} size={112} lang={lang} />
              <p className="habit-try">
                <strong>Try next</strong> {chosen.tryNext}
              </p>
              <div className="habit-actions">
                <button type="button" className="btn-ghost" onClick={() => speakCub(chosen.message, lang)}>
                  Hear Cub
                </button>
                <Link className="btn-gold" to={chosen.to}>
                  Practise this
                </Link>
              </div>
            </aside>
          ) : null}
        </div>
      )}
    </section>
  );
}
