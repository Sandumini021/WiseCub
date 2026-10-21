import { formatRupees } from "../services/consequenceEngine";
import type {
  AnalysisResult,
  ConsequencePack,
  ScenarioDefinition,
} from "../types/decisionMaking";

type ConsequencesViewProps = {
  scenario: ScenarioDefinition;
  pack: ConsequencePack;
  analysis: AnalysisResult;
  onBack: () => void;
  onContinue: () => void;
};

export function ConsequencesView({
  scenario,
  pack,
  analysis,
  onBack,
  onContinue,
}: ConsequencesViewProps) {
  const option = scenario.options.find((item) => item.id === pack.optionId);
  const maxMoney = scenario.moneyScale;

  return (
    <section className="outcome-card" aria-labelledby="outcome-title">
      <p className="choice-kicker">What this choice can mean</p>
      <h2 id="outcome-title">{option?.title}</h2>
      <p>
        <strong>Immediate outcome:</strong> {pack.immediate}
      </p>
      <p>
        <strong>Possible future consideration:</strong> {pack.future}
      </p>

      <h3>Money snapshot (today)</h3>
      <div className="money-bar" aria-label="Money breakdown">
        <div className="money-row">
          <span>Savings</span>
          <div className="money-track">
            <div
              className="money-fill"
              style={{ width: `${(pack.selectedSnapshot.savings / maxMoney) * 100}%` }}
            />
          </div>
          <strong>{formatRupees(pack.selectedSnapshot.savings)}</strong>
        </div>
        <div className="money-row">
          <span>Amount owed</span>
          <div className="money-track">
            <div
              className="money-fill is-debt"
              style={{ width: `${(pack.selectedSnapshot.debt / maxMoney) * 100}%` }}
            />
          </div>
          <strong>{formatRupees(pack.selectedSnapshot.debt)}</strong>
        </div>
      </div>
      <p>
        {pack.selectedSnapshot.stateLabel}: {pack.selectedSnapshot.state}. {pack.selectedSnapshot.note}
      </p>

      <h3>About your explanation</h3>
      <p className="choice-lead">
        Feedback is based on the option you picked and the words you wrote. It does
        not grade you as a person. This uses a clear rule-based checker, not a trained AI model.
      </p>
      <ul className="feedback-list">
        {analysis.highlights.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {analysis.gaps.length > 0 ? (
        <>
          <p>
            <strong>Something to practise next:</strong>
          </p>
          <ul className="feedback-list">
            {analysis.gaps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      ) : null}

      <h3>Six months later — a comparison</h3>
      <p>
        These sketches compare your path with other options using the scenario
        assumptions below. They are not a promise of what will happen.
      </p>
      <div className="future-grid">
        <article className="future-card is-yours">
          <p className="choice-kicker">Your path</p>
          <h3>{pack.selectedSnapshot.label}</h3>
          <p>
            {pack.selectedSnapshot.stateLabel}: {pack.selectedSnapshot.state}
          </p>
          <p>Savings: {formatRupees(pack.selectedSnapshot.savings)}</p>
          <p>Owed: {formatRupees(pack.selectedSnapshot.debt)}</p>
        </article>
        {pack.alternativeSnapshots.map((snapshot) => (
          <article className="future-card" key={snapshot.label}>
            <p className="choice-kicker">Another path</p>
            <h3>{snapshot.label}</h3>
            <p>
              {snapshot.stateLabel}: {snapshot.state}
            </p>
            <p>Savings: {formatRupees(snapshot.savings)}</p>
            <p>Owed: {formatRupees(snapshot.debt)}</p>
            <p>{snapshot.note}</p>
          </article>
        ))}
      </div>
      <ul className="feedback-list">
        {pack.sixMonthAssumptions.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {scenario.waitAssumption ? (
        <p className="assumption-note">{scenario.waitAssumption}</p>
      ) : null}

      <div className="choice-actions">
        <button type="button" className="btn-ghost-choice" onClick={onBack}>
          Edit my explanation
        </button>
        <button type="button" className="btn-gold" onClick={onContinue}>
          See my reasoning profile
        </button>
      </div>
    </section>
  );
}
