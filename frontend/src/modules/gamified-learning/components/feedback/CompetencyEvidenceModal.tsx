import React from 'react';
import { CoreCompetencyDimension } from '../../types/competency.types';
import { LevelMasteryResult } from '../../types/mission.types';

interface CompetencyEvidenceModalProps {
  masteryResult: LevelMasteryResult;
  onProceed: () => void;
  onRetry: () => void;
}

export const CompetencyEvidenceModal: React.FC<CompetencyEvidenceModalProps> = ({
  masteryResult,
  onProceed,
  onRetry,
}) => {
  const { passed, dimensionScores, decisionOutcome, failureReasons, successSummary } =
    masteryResult;

  const dimensionsList: Array<{ key: CoreCompetencyDimension; label: string; icon: string }> = [
    { key: 'budgetingSkill', label: 'Budgeting Skill', icon: '📊' },
    { key: 'spendingDiscipline', label: 'Spending Discipline', icon: '🎯' },
    { key: 'savingBehavior', label: 'Saving Behavior', icon: '🐖' },
    { key: 'investmentAwareness', label: 'Value & Investment', icon: '⚖️' },
    { key: 'goalAchievement', label: 'Goal Achievement', icon: '🏆' },
  ];

  return (
    <div className="competency-evaluation-card">
      {/* Result Status Banner */}
      <div className={`eval-status-banner ${passed ? 'banner-passed' : 'banner-failed'}`}>
        <div className="status-icon">{passed ? '🎉' : '⚠️'}</div>
        <div className="status-text-group">
          <h3 className="status-title">
            {passed ? 'Level Passed — Competency Gate Cleared!' : 'Level Incomplete — Competency Gate Unmet'}
          </h3>
          <p className="status-blurb">
            {passed
              ? successSummary
              : 'You did not demonstrate the required financial standards for this level. Study the feedback below and retry to unlock the next level.'}
          </p>
        </div>
      </div>

      {/* 5-Dimension Competency Scores */}
      <div className="competency-grid-section">
        <h4 className="section-title">Core Financial Competency Breakdown</h4>
        <div className="competency-dimensions-cards">
          {dimensionsList.map((dim) => {
            const score = dimensionScores[dim.key] || 50;
            return (
              <div key={dim.key} className="dimension-score-box">
                <div className="dim-header">
                  <span className="dim-icon">{dim.icon}</span>
                  <span className="dim-label">{dim.label}</span>
                  <span className={`dim-score-badge ${score >= 70 ? 'score-high' : 'score-low'}`}>
                    {score}%
                  </span>
                </div>
                <div className="dim-track">
                  <div
                    className={`dim-fill ${score >= 70 ? 'fill-good' : 'fill-alert'}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Decision Evidence & Balance Summary */}
      <div className="eval-evidence-card">
        <h4>📋 Recorded Financial Evidence:</h4>
        <ul className="evidence-list">
          <li>
            <strong>Total Spent:</strong> Rs. {decisionOutcome.totalCostLKR.toLocaleString()}
          </li>
          <li>
            <strong>Discretionary / Optional Spending:</strong> Rs.{' '}
            {decisionOutcome.discretionarySpentLKR.toLocaleString()}
          </li>
          <li>
            <strong>Preserved Emergency Reserve:</strong> Rs.{' '}
            {decisionOutcome.reservePreservedLKR.toLocaleString()}
          </li>
          <li>
            <strong>Remaining Cash:</strong> Rs.{' '}
            {decisionOutcome.balanceRemainingLKR.toLocaleString()}
          </li>
          <li>
            <strong>Essentials Covered:</strong>{' '}
            {decisionOutcome.essentialNeedsCovered ? (
              <span className="text-ok">✓ All indispensable care items funded</span>
            ) : (
              <span className="text-warn">
                ✗ Missing essentials: {decisionOutcome.missedEssentialNames.join(', ')}
              </span>
            )}
          </li>
        </ul>
      </div>

      {/* Failure reasons or success note */}
      {!passed && failureReasons.length > 0 && (
        <div className="eval-remediation-box">
          <h4>⚠️ Unmet Requirements That Blocked Level Passage:</h4>
          <ul className="failure-reasons-list">
            {failureReasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Bottom Action Buttons */}
      <div className="eval-action-buttons">
        {passed ? (
          <button type="button" className="btn-confirm-decision btn-advance" onClick={onProceed}>
            Unlock Next Level & Continue Journey ➔
          </button>
        ) : (
          <button type="button" className="btn-confirm-decision btn-retry" onClick={onRetry}>
            🔄 Review Remediation & Retry Level
          </button>
        )}
      </div>
    </div>
  );
};
