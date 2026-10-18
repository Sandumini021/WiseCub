import { useState } from 'react';
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
    if (selectedIds.length === 0) return;
    onSubmit(selectedIds);
  };

  return (
    <form onSubmit={handleSubmit} className="challenge-form">
      {/* Live Financial Ledger Bar */}
      <div className={`financial-ledger-banner ${isOverBudget ? 'ledger-over' : 'ledger-ok'}`}>
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
        <div className="ledger-warning-box">
          ⚠️ <strong>Over budget warning:</strong> You have selected Rs.{' '}
          {Math.abs(remainingCash).toLocaleString()} more than your available cash! You must
          deselect non-essentials to balance your funds.
        </div>
      )}

      {/* Options Cards Grid */}
      <div className="options-selection-grid">
        {options.map((opt) => {
          const isSelected = selectedIds.includes(opt.id);
          return (
            <div
              key={opt.id}
              className={`decision-option-card ${isSelected ? 'option-selected' : ''}`}
              onClick={() => toggleOption(opt.id)}
              role="checkbox"
              aria-checked={isSelected}
              tabIndex={0}
            >
              <div className="option-card-header">
                <span className={`option-category-badge ${opt.isEssential ? 'badge-essential' : 'badge-discretionary'}`}>
                  {opt.isEssential ? '⭐ Indispensable Need' : '🎈 Optional Want'}
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
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleOption(opt.id)}
                  disabled={disabled}
                  className="option-checkbox"
                />
                <span className="option-select-text">
                  {isSelected ? 'Selected' : 'Select Item'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="challenge-submit-row">
        <button
          type="submit"
          className="btn-confirm-decision"
          disabled={disabled || selectedIds.length === 0}
        >
          Confirm Financial Choices & Evaluate Recovery
        </button>
      </div>
    </form>
  );
};
