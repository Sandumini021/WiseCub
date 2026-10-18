import React from 'react';
import { LevelDefinition, LevelMasteryResult } from '../../types/mission.types';

interface RetrySupportPanelProps {
  level: LevelDefinition;
  masteryResult: LevelMasteryResult;
  attemptNumber: number;
  onRetry: () => void;
  onBackToMap: () => void;
}

export const RetrySupportPanel: React.FC<RetrySupportPanelProps> = ({
  level,
  masteryResult,
  attemptNumber,
  onRetry,
  onBackToMap,
}) => {
  const scaffolding = level.remediationScaffolding;
  const isMultipleAttempts = attemptNumber >= 2;

  return (
    <div className="retry-support-card">
      <div className="retry-header">
        <span className="retry-badge-pill">Attempt #{attemptNumber} · Remediation Support</span>
        <h3 className="retry-title">Let’s Master This Financial Concept Together</h3>
        <p className="retry-subtitle">
          In WiseCub, making mistakes is a natural part of learning! Study the guidance below to
          adjust your strategy.
        </p>
      </div>

      {/* Lock Notice */}
      <div className="retry-lock-notice">
        🔒 <strong>Level Gate Enforced:</strong> Level {level.levelNumber + 1} remains locked.
        You must fulfill all competency standards for Level {level.levelNumber} to unlock the next chapter.
        {masteryResult.failureReasons.length > 0 && (
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            {masteryResult.failureReasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Rule & Concept Explanation */}
      <div className="scaffolding-box">
        <h4>💡 Key Financial Principle:</h4>
        <p className="scaffolding-rule">{scaffolding.ruleExplanation}</p>
      </div>

      {/* Guiding Questions */}
      <div className="guiding-questions-card">
        <h4>🤔 Questions to Ask Before Your Next Choice:</h4>
        <ul className="questions-list">
          {scaffolding.guidingQuestions.map((q, idx) => (
            <li key={idx}>{q}</li>
          ))}
        </ul>
      </div>

      {/* Scaffolding Hint for multiple attempts */}
      {isMultipleAttempts && (
        <div className="guided-scaffolding-alert">
          <strong>🎯 Extra Scaffolding Activated:</strong> {scaffolding.suggestedFocus}
        </div>
      )}

      {/* Hints List */}
      <div className="level-hints-card">
        <h4>📌 Story Hints for Barnaby:</h4>
        <ul>
          {level.hints.map((hint, idx) => (
            <li key={idx}>{hint}</li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="retry-actions-row">
        <button type="button" className="btn-secondary-action" onClick={onBackToMap}>
          ← Return to Level Map
        </button>
        <button type="button" className="btn-confirm-decision btn-retry-now" onClick={onRetry}>
          🔄 Retry Level {level.levelNumber} Now
        </button>
      </div>
    </div>
  );
};
