import React, { useState } from 'react';
import { CompetencyProfile, CoreCompetencyDimension } from '../../types/competency.types';
import { MissionProgress } from '../../types/progress.types';
import { DecisionLogger } from '../../services/decisionLogger';
import { AdaptiveLearningEngine } from '../../engine/adaptiveLearningEngine';

interface LearningAnalyticsModalProps {
  missionProgress: MissionProgress;
  competencyProfile: CompetencyProfile;
  onClose: () => void;
  onResetDemo: () => void;
}

export const LearningAnalyticsModal: React.FC<LearningAnalyticsModalProps> = ({
  missionProgress,
  competencyProfile,
  onClose,
  onResetDemo,
}) => {
  const [copied, setCopied] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  const recommendation = AdaptiveLearningEngine.deriveAdaptiveRecommendation(
    missionProgress,
    competencyProfile
  );

  const dimensionsList: Array<{ key: CoreCompetencyDimension; label: string }> = [
    { key: 'budgetingSkill', label: 'Budgeting Skill' },
    { key: 'spendingDiscipline', label: 'Spending Discipline' },
    { key: 'savingBehavior', label: 'Saving Behavior' },
    { key: 'investmentAwareness', label: 'Value & Investment' },
    { key: 'goalAchievement', label: 'Goal Achievement' },
  ];

  const handleExportJson = () => {
    const jsonStr = DecisionLogger.exportEventsAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wisecub_cdemf_learning_events_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    const jsonStr = DecisionLogger.exportEventsAsJson();
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const allEvents = DecisionLogger.getAllEvents();

  return (
    <div className="analytics-modal-backdrop" onClick={onClose}>
      <div className="analytics-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="analytics-header">
          <div>
            <h2 className="analytics-title">Research & Learning Analytics</h2>
            <p className="analytics-subtitle">
              Competency-Driven Emotional Mission Framework (CDEMF) Evaluation Dashboard
            </p>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Overall Mastery Pill */}
        <div className="mastery-summary-banner">
          <div className="mastery-badge-group">
            <span className="mastery-label">Demonstrated Mastery Tier:</span>
            <span className={`mastery-pill tier-${competencyProfile.overallMasteryLevel.toLowerCase()}`}>
              {competencyProfile.overallMasteryLevel}
            </span>
          </div>
          <div className="events-count-stat">
            <span>Logged ML Learning Events: <strong>{allEvents.length}</strong></span>
          </div>
        </div>

        {/* 5 Core Dimensions */}
        <div className="analytics-section">
          <h3>Core Financial Competency Radar / Bars</h3>
          <div className="analytics-bars-grid">
            {dimensionsList.map((dim) => {
              const score = competencyProfile[dim.key] || 50;
              return (
                <div key={dim.key} className="analytics-bar-row">
                  <div className="bar-labels">
                    <span className="bar-name">{dim.label}</span>
                    <span className="bar-value">{score} / 100</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${score}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Adaptive Pedagogical Engine Insights (Local Prototype Baseline) */}
        <div className="analytics-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3>Local Prototype Baseline Heuristics (Rule-Based)</h3>
            <span style={{ fontSize: '0.75rem', color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px' }}>
              Prototype Rule Engine
            </span>
          </div>
          <p className="section-note" style={{ marginBottom: '8px', fontSize: '0.8rem', color: '#6b7280' }}>
            Evaluated via client-side threshold heuristics on current mission attempts. For global, machine-learning-driven adaptive support across all missions, consult the <strong>My Money Journey</strong> dashboard.
          </p>
          <div className="adaptive-insight-card">
            <div className="insight-row">
              <span className="insight-tag">Scaffolding Adjustment:</span>
              <strong>{recommendation.challengeAdjustment}</strong>
            </div>
            <div className="insight-row">
              <span className="insight-tag">Suggested Practice Focus:</span>
              <strong>{recommendation.suggestedPracticeType}</strong>
            </div>
            {recommendation.learningGapIdentified && (
              <div className="insight-row text-alert">
                <span className="insight-tag">Behavioral Gap Detected:</span>
                <span>{recommendation.learningGapIdentified}</span>
              </div>
            )}
            <p className="insight-rationale">"{recommendation.pedagogicalRationale}"</p>
          </div>
        </div>

        {/* ML Data Export Pipeline */}
        <div className="analytics-section">
          <h3>ML-Ready Decision Recording Pipeline (Local Prototype)</h3>
          <p className="section-note">
            Events are structured with anonymous session IDs, timestamp, financial inputs, outcomes,
            and competency evidence for future offline AI model training.
          </p>
          <div className="export-buttons-row">
            <button type="button" className="btn-export" onClick={handleExportJson}>
              📥 Download ML Training Dataset (JSON)
            </button>
            <button type="button" className="btn-copy" onClick={handleCopyJson}>
              {copied ? '✓ Copied to Clipboard!' : '📋 Copy JSON Stream'}
            </button>
            <button
              type="button"
              className="btn-toggle-preview"
              onClick={() => setShowJsonPreview(!showJsonPreview)}
            >
              {showJsonPreview ? 'Hide Raw JSON' : 'Preview Raw JSON'}
            </button>
          </div>

          {showJsonPreview && (
            <pre className="json-preview-box">
              {DecisionLogger.exportEventsAsJson()}
            </pre>
          )}
        </div>

        {/* Footer Reset & Close */}
        <div className="analytics-footer">
          <button type="button" className="btn-danger-reset" onClick={onResetDemo}>
            ⚠️ Reset Prototype Demo Data
          </button>
          <button type="button" className="btn-secondary-action" onClick={onClose}>
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
