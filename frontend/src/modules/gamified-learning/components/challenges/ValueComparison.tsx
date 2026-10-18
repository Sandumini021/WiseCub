import { useState } from 'react';
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

  const selectedOpt = options.find((o) => o.id === selectedId);
  const startingBudget = level.startingBudgetLKR;
  const cost = selectedOpt ? selectedOpt.costLKR : 0;
  const remaining = startingBudget - cost;
  const isOverBudget = remaining < 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    onSubmit([selectedId]);
  };

  return (
    <form onSubmit={handleSubmit} className="challenge-form">
      {/* Live Financial Ledger Bar */}
      <div className={`financial-ledger-banner ${isOverBudget ? 'ledger-over' : 'ledger-ok'}`}>
        <div className="ledger-stat">
          <span className="stat-label">Available Care Fund</span>
          <span className="stat-amount">Rs. {startingBudget.toLocaleString()}</span>
        </div>
        <div className="ledger-stat">
          <span className="stat-label">Package Cost</span>
          <span className="stat-amount">Rs. {cost.toLocaleString()}</span>
        </div>
        <div className="ledger-stat">
          <span className="stat-label">Remaining Reserve</span>
          <span className={`stat-amount ${isOverBudget ? 'amount-negative' : 'amount-positive'}`}>
            Rs. {remaining.toLocaleString()}
          </span>
        </div>
      </div>

      {isOverBudget && (
        <div className="ledger-warning-box">
          ⚠️ <strong>Over budget warning:</strong> This package costs Rs.{' '}
          {Math.abs(remaining).toLocaleString()} more than your available money!
        </div>
      )}

      {/* Comparison Cards Grid */}
      <div className="value-comparison-grid">
        {options.map((opt) => {
          const isSelected = selectedId === opt.id;
          let badgeClass = 'badge-certified';
          let qualityTag = 'Certified & Standard';

          if (opt.qualityLevel === 'substandard') {
            badgeClass = 'badge-substandard';
            qualityTag = '⚠️ Substandard & Unverified';
          } else if (opt.qualityLevel === 'luxury_excess') {
            badgeClass = 'badge-luxury';
            qualityTag = '💎 Luxury Excess (Overpriced)';
          }

          return (
            <div
              key={opt.id}
              className={`comparison-card ${isSelected ? 'comparison-selected' : ''}`}
              onClick={() => !disabled && setSelectedId(opt.id)}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
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
                <input
                  type="radio"
                  name="value_option"
                  checked={isSelected}
                  onChange={() => setSelectedId(opt.id)}
                  disabled={disabled}
                />
                <span>{isSelected ? 'Selected Package' : 'Select Package'}</span>
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
          Confirm Medical Package Selection
        </button>
      </div>
    </form>
  );
};
