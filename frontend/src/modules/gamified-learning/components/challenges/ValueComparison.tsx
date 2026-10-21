import React, { useEffect, useState } from 'react';
import { LevelDefinition } from '../../types/mission.types';

interface ValueComparisonProps {
  level: LevelDefinition;
  onSubmit: (selectedOptionIds: string[]) => void;
  disabled?: boolean;
}

export const ValueComparison: React.FC<ValueComparisonProps> = ({
  level,
  onSubmit,
  disabled = false,
}) => {
  const options = level.options || [];
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedId(null);
  }, [level.id]);

  const selectedOpt = options.find((o) => o.id === selectedId);
  const startingBudget = level.startingBudgetLKR;
  const cost = selectedOpt ? selectedOpt.costLKR : 0;
  const remaining = startingBudget - cost;
  const isOverBudget = remaining < 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || isOverBudget) return;
    onSubmit([selectedId]);
  };

  return (
    <form onSubmit={handleSubmit} className="challenge-form">
      {/* Live Financial Ledger Bar */}
      <div className={`financial-ledger-banner ${isOverBudget ? 'ledger-over' : 'ledger-ok'}`} aria-label="Package Comparison Ledger">
        <div className="ledger-stat">
          <span className="stat-label">Available Fund</span>
          <span className="stat-amount">Rs. {startingBudget.toLocaleString()}</span>
        </div>
        <div className="ledger-stat">
          <span className="stat-label">Package Cost</span>
          <span className="stat-amount">Rs. {cost.toLocaleString()}</span>
        </div>
        <div className="ledger-stat">
          <span className="stat-label">Remaining Savings</span>
          <span className={`stat-amount ${isOverBudget ? 'amount-negative' : 'amount-positive'}`}>
            Rs. {remaining.toLocaleString()}
          </span>
        </div>
      </div>

      {isOverBudget && (
        <div className="ledger-warning-box" role="alert">
          ⚠️ <strong>Over Budget:</strong> This package costs Rs.{' '}
          {Math.abs(remaining).toLocaleString()} more than your available funds! Choose a more cost-effective option.
        </div>
      )}

      {/* Comparison Cards Grid */}
      <div className="value-comparison-grid" role="radiogroup" aria-label="Available Packages">
        {options.map((opt) => {
          const isSelected = selectedId === opt.id;
          let badgeClass = 'badge-certified';
          let qualityTag = '✅ Certified & Safe';

          if (opt.qualityLevel === 'substandard') {
            badgeClass = 'badge-substandard';
            qualityTag = '⚠️ Cheap Trap (Unsafe)';
          } else if (opt.qualityLevel === 'luxury_excess') {
            badgeClass = 'badge-luxury';
            qualityTag = '💎 Overpriced Luxury';
          }

          return (
            <div
              key={opt.id}
              className={`comparison-card ${isSelected ? 'comparison-selected' : ''}`}
              onClick={() => !disabled && setSelectedId(opt.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!disabled) setSelectedId(opt.id);
                }
              }}
              role="radio"
              aria-checked={isSelected}
              tabIndex={disabled ? -1 : 0}
              aria-label={`${opt.title}, ${qualityTag}, cost Rs. ${opt.costLKR.toLocaleString()}`}
            >
              <div className="comparison-card-top">
                <span className={`quality-badge ${badgeClass}`}>{qualityTag}</span>
                <span className="comparison-price">Rs. {opt.costLKR.toLocaleString()}</span>
              </div>

              <h4 className="comparison-title">{opt.title}</h4>
              <p className="comparison-desc">{opt.description}</p>

              {opt.financialTradeoffNote && (
                <div className="comparison-tradeoff-note">
                  💡 <em>{opt.financialTradeoffNote}</em>
                </div>
              )}

              <div className="comparison-select-indicator">
                <div className={`option-check-pill ${isSelected ? 'pill-checked' : ''}`}>
                  <span className="check-icon">{isSelected ? '✓' : '○'}</span>
                  <span className="check-label">{isSelected ? 'Selected Package' : 'Select Package'}</span>
                </div>
                <input
                  type="radio"
                  name="value_option"
                  checked={isSelected}
                  onChange={() => setSelectedId(opt.id)}
                  disabled={disabled}
                  className="sr-only-checkbox"
                  tabIndex={-1}
                  aria-hidden="true"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="challenge-submit-row">
        <button
          type="submit"
          className="btn-confirm-decision"
          disabled={disabled || !selectedId || isOverBudget}
        >
          {!selectedId
            ? 'Select a package to continue'
            : isOverBudget
            ? `⚠️ Over Budget by Rs. ${Math.abs(remaining).toLocaleString()}`
            : `Confirm Selection (Rs. ${cost.toLocaleString()}) ➔`}
        </button>
      </div>
    </form>
  );
};
