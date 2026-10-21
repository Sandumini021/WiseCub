import React, { useEffect, useState } from 'react';
import { LevelDefinition } from '../../types/mission.types';

interface NeedsWantsSelectorProps {
  level: LevelDefinition;
  onSubmit: (selectedOptionIds: string[]) => void;
  disabled?: boolean;
}

export const NeedsWantsSelector: React.FC<NeedsWantsSelectorProps> = ({
  level,
  onSubmit,
  disabled = false,
}) => {
  const options = level.options || [];
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedIds([]);
  }, [level.id]);

  const toggleOption = (id: string) => {
    if (disabled) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const startingBudget = level.startingBudgetLKR;
  const totalCost = options
    .filter((opt) => selectedIds.includes(opt.id))
    .reduce((sum, opt) => sum + opt.costLKR, 0);
  const remainingCash = startingBudget - totalCost;
  const isOverBudget = remainingCash < 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0 || isOverBudget) return;
    onSubmit(selectedIds);
  };

  return (
    <form onSubmit={handleSubmit} className="challenge-form">
      {/* Live Financial Ledger Bar */}
      <div className={`financial-ledger-banner ${isOverBudget ? 'ledger-over' : 'ledger-ok'}`} aria-label="Budget Ledger">
        <div className="ledger-stat">
          <span className="stat-label">Available Budget</span>
          <span className="stat-amount">Rs. {startingBudget.toLocaleString()}</span>
        </div>
        <div className="ledger-stat">
          <span className="stat-label">Total Selected</span>
          <span className="stat-amount">Rs. {totalCost.toLocaleString()}</span>
        </div>
        <div className="ledger-stat">
          <span className="stat-label">Remaining Balance</span>
          <span className={`stat-amount ${isOverBudget ? 'amount-negative' : 'amount-positive'}`}>
            Rs. {remainingCash.toLocaleString()}
          </span>
        </div>
      </div>

      {isOverBudget && (
        <div className="ledger-warning-box" role="alert">
          ⚠️ <strong>Over Budget:</strong> You have selected Rs.{' '}
          {Math.abs(remainingCash).toLocaleString()} more than your available cash! Deselect
          optional wants to balance your spending.
        </div>
      )}

      {/* Options Cards Grid */}
      <div className="options-selection-grid" role="group" aria-label="Needs and Wants Options">
        {options.map((opt) => {
          const isSelected = selectedIds.includes(opt.id);
          return (
            <div
              key={opt.id}
              className={`decision-option-card ${isSelected ? 'option-selected' : ''}`}
              onClick={() => toggleOption(opt.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleOption(opt.id);
                }
              }}
              role="checkbox"
              aria-checked={isSelected}
              tabIndex={disabled ? -1 : 0}
              aria-label={`${opt.title}, ${opt.isEssential ? 'Essential Need' : 'Optional Want'}, cost Rs. ${opt.costLKR.toLocaleString()}`}
            >
              <div className="option-card-header">
                <span className={`option-category-badge ${opt.isEssential ? 'badge-essential' : 'badge-discretionary'}`}>
                  {opt.isEssential ? '⭐ Essential Need' : '🎈 Optional Want'}
                </span>
                <span className="option-price-tag">Rs. {opt.costLKR.toLocaleString()}</span>
              </div>

              <h4 className="option-title">{opt.title}</h4>
              <p className="option-description">{opt.description}</p>

              {opt.financialTradeoffNote && (
                <div className="option-tradeoff-tip">
                  💡 <em>{opt.financialTradeoffNote}</em>
                </div>
              )}

              <div className="option-action-row">
                <div className={`option-check-pill ${isSelected ? 'pill-checked' : ''}`}>
                  <span className="check-icon">{isSelected ? '✓' : '+'}</span>
                  <span className="check-label">{isSelected ? 'Selected' : 'Select Item'}</span>
                </div>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleOption(opt.id)}
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
          disabled={disabled || selectedIds.length === 0 || isOverBudget}
        >
          {isOverBudget
            ? `⚠️ Over Budget by Rs. ${Math.abs(remainingCash).toLocaleString()}`
            : selectedIds.length === 0
            ? 'Select at least one item to continue'
            : `Confirm Choices & Evaluate (Rs. ${totalCost.toLocaleString()}) ➔`}
        </button>
      </div>
    </form>
  );
};
