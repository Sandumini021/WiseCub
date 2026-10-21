import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CubFace } from "../../../components/cub-assistant/CubFace";
import type { CubLang } from "../../../components/cub-assistant/cubAssistantTypes";
import {
  expressionForPattern,
  patternMessage,
  tipMessage,
  type CubExpression,
} from "../../../components/cub-assistant/cubExpressions";
import { speakCub, stopCubSpeech } from "../../../components/cub-assistant/cubSpeech";
import type { BehaviourReport } from "../../../services/apiClient";
import { recordMarketEvent } from "../data/behaviourEvents";
import type { HabitFlags } from "../data/sessionReview";

const SEEN_KEY = "wisecub.habitPopupSeen";

type Card = {
  id: string;
  emoji: string;
  title: string;
  flagged: boolean;
  message: string;
  tryNext: string;
  to: string;
  expression: CubExpression;
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

function buildCards(report: BehaviourReport | null, flags: HabitFlags, lang: CubLang): Card[] {
  const fromApi =
    report?.indicators.filter((item) => item.level !== "insufficient_evidence") ?? [];
  const seen = new Set(fromApi.map((item) => item.behaviour));
  const cards: Card[] = fromApi.map((item) => {
    const kid = KID[item.behaviour] ?? {
      emoji: "🐻",
      title: item.behaviour.split("_").join(" "),
      tryNext: item.suggested_activity,
      to: "/market/lessons/7",
    };
    const flagged = item.level === "worth_reviewing";
    const coach = report?.coaching.find((line) => line.behaviour === item.behaviour)?.text;
    return {
      id: item.behaviour,
      emoji: kid.emoji,
      title: kid.title,
      flagged,
      message: flagged
        ? coach ?? patternMessage(item.behaviour, item.level, lang)
        : patternMessage(item.behaviour, item.level, lang),
      tryNext: kid.tryNext,
      to: kid.to,
      expression: expressionForPattern(item.behaviour, item.level),
    };
  });

  if (flags.concentrated && !seen.has("poor_diversification")) {
    cards.push({
      id: "poor_diversification",
      emoji: "🧺",
      title: "One big basket",
      flagged: true,
      message: patternMessage("poor_diversification", "worth_reviewing", lang),
      tryNext: KID.poor_diversification.tryNext,
      to: KID.poor_diversification.to,
      expression: "thinking",
    });
  }
  if (flags.quickSells >= 2 && !seen.has("panic_selling")) {
    cards.push({
      id: "panic_selling",
      emoji: "🌧️",
      title: "Sold in a hurry",
      flagged: true,
      message: patternMessage("panic_selling", "worth_reviewing", lang),
      tryNext: KID.panic_selling.tryNext,
      to: KID.panic_selling.to,
      expression: "concerned",
    });
  }
  if (flags.listenedToWarning) {
    cards.push({
      id: "listened",
      emoji: "👍",
      title: "You slowed down",
      flagged: false,
      message:
        lang === "si"
          ? "Cubගේ අනතුරු ඇඟවීමෙන් පස්සේ කොටස් අඩු කළා. ඒක අවදානම දැකපු එකයි."
          : "You chose fewer shares after Cub’s warning. That is noticing risk.",
      tryNext: "Keep pausing before the next tap.",
      to: "/market/lessons/7",
      expression: "celebrating",
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
      message: tip.message,
      tryNext: review.tryNext,
      to: review.to,
      expression: tip.expression,
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
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<string | null>(null);

  useEffect(() => {
    if (flagged.length === 0) {
      return;
    }
    if (window.sessionStorage.getItem(SEEN_KEY) === "1") {
      return;
    }
    window.sessionStorage.setItem(SEEN_KEY, "1");
    setPick(flagged[0].id);
    setOpen(true);
    recordMarketEvent({ type: "habit_popup_opened", reason: flagged[0].id });
  }, [flagged.length]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        stopCubSpeech();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const chosen = cards.find((card) => card.id === pick) ?? flagged[0] ?? cards[0];
  const count = flagged.length;

  function openPopup(id?: string) {
    const next = id ?? flagged[0]?.id ?? cards[0]?.id ?? null;
    setPick(next);
    setOpen(true);
    recordMarketEvent({ type: "habit_popup_opened", reason: next ?? "habit_check" });
  }

  function closePopup() {
    setOpen(false);
    stopCubSpeech();
  }

  return (
    <>
      <button
        type="button"
        className={`habit-launch${count ? " is-hot" : ""}`}
        onClick={() => openPopup()}
      >
        <span aria-hidden="true">🐻</span>
        {count ? `Cub noticed ${count} habit${count === 1 ? "" : "s"}` : "Cub’s habit check"}
      </button>

      {open && chosen ? (
        <div className="habit-back" onClick={closePopup} role="presentation">
          <div
            className="habit-pop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="habit-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="habit-kicker">This session only · never a grade</p>
            <h2 id="habit-title">What Cub noticed</h2>
            <CubFace expression={chosen.expression} message={chosen.message} size={120} lang={lang} />
            <div className="habit-cards" role="list">
              {cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  role="listitem"
                  className={`habit-card${pick === card.id ? " is-on" : ""}${card.flagged ? " is-flag" : ""}`}
                  onClick={() => {
                    setPick(card.id);
                    recordMarketEvent({ type: "habit_card_tapped", reason: card.id });
                  }}
                >
                  <span aria-hidden="true">{card.emoji}</span>
                  <strong>{card.title}</strong>
                  {card.flagged ? <em>look</em> : <em>ok</em>}
                </button>
              ))}
            </div>
            <p className="habit-try">
              <strong>Try next</strong> {chosen.tryNext}
            </p>
            <div className="habit-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => speakCub(chosen.message, lang)}
              >
                Hear Cub
              </button>
              <Link className="btn-gold" to={chosen.to} onClick={closePopup}>
                Practise this
              </Link>
              <button type="button" className="btn-ghost" onClick={closePopup}>
                Got it
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
