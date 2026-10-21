import type { AnalysisResult } from "../types/decisionMaking";

type ReasoningProfileProps = {
  analysis: AnalysisResult;
};

export function ReasoningProfile({ analysis }: ReasoningProfileProps) {
  return (
    <section className="profile-card" aria-labelledby="profile-title">
      <h2 id="profile-title">Your reasoning profile</h2>
      <p>
        This snapshot is based on the explanation you just wrote for this level.
        Levels marked complete on the dashboard for the demo do not add extra
        scores unless you actually finish them here.
      </p>
      <div className="dimension-list">
        {analysis.dimensions.map((dimension) => (
          <div key={dimension.id}>
            <div className="dimension-head">
              <span>{dimension.label}</span>
              <strong>{dimension.score}%</strong>
            </div>
            <div className="progress-track" aria-hidden="true">
              <div className="progress-fill" style={{ width: `${dimension.score}%` }} />
            </div>
            <p className="choice-lead">{dimension.evidence}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
