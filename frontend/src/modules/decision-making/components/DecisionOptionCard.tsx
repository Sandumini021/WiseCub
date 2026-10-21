import type { DecisionOption } from "../types/decisionMaking";

type DecisionOptionCardProps = {
  option: DecisionOption;
  selected: boolean;
  onSelect: (id: DecisionOption["id"]) => void;
};

export function DecisionOptionCard({
  option,
  selected,
  onSelect,
}: DecisionOptionCardProps) {
  return (
    <button
      type="button"
      className={`option-card${selected ? " is-selected" : ""}`}
      onClick={() => onSelect(option.id)}
      aria-pressed={selected}
    >
      <p className="choice-kicker">Option {option.id}</p>
      <h3>{option.title}</h3>
      <p>{option.summary}</p>
      <ul>
        {option.bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
      {selected ? <p className="level-status">Selected</p> : null}
    </button>
  );
}
