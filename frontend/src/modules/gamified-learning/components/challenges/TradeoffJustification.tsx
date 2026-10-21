import { useEffect, useState } from 'react';
import { LevelDefinition } from '../../types/mission.types';

interface TradeoffJustificationProps {
  level: LevelDefinition;
  onSubmit: (selectedOptionIds: string[], selectedRationaleId: string) => void;
  disabled?: boolean;
}

export const TradeoffJustification: React.FC<TradeoffJustificationProps> = ({
  level,
  onSubmit,
  disabled = false,
}) => {
  const options = level.options || [];
  const rationales = level.tradeoffRationales || [];
  const startingBudget = level.startingBudgetLKR;

  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [selectedRationaleId, setSelectedRationaleId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedOptionIds([]);
    setSelectedRationaleId(null);
  }, [level.id]);

  const toggleOption = (id: string) => {
    if (disabled) return;
    setSelectedOptionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const totalCost = options
    .filter((opt) => selectedOptionIds.includes(opt.id))
    .reduce((sum, opt) => sum + opt.costLKR, 0);
  const remainingCash = startingBudget - totalCost;
  const isOverBudget = remainingCash < 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOptionIds.length === 0 || !selectedRationaleId || isOverBudget) return;
    onSubmit(selectedOptionIds, selectedRationaleId);
  };

  return (
    <form onSubmit={handleSubmit} className="challenge-form">
      {/* Live Financial Ledger Bar */}
      <div className={`financial-ledger-banner ${isOverBudget ? 'ledger-over' : 'ledger-ok'}`}>
        <div className="ledger-stat">
          <span className="stat-label">Available Fund</span>
          <span className="stat-amount">Rs. {startingBudget.toLocaleString()}</span>
        </div>
        <div className="ledger-stat">
          <span className="stat-label">Total Allocated</span>
          <span className="stat-amount">Rs. {totalCost.toLocaleString()}</span>
        </div>
        <div className="ledger-stat">
          <span className="stat-label">Remaining Savings</span>
          <span className={`stat-amount ${isOverBudget ? 'amount-negative' : 'amount-positive'}`}>
            Rs. {remainingCash.toLocaleString()}
          </span>
        </div>
      </div>

      {isOverBudget && (
        <div className="ledger-warning-box">
          ⚠️ <strong>Over budget warning:</strong> You cannot fund all three options. You must
          make a prioritized trade-off to keep total spending under Rs. {startingBudget.toLocaleString()}.
        </div>
      )}

      {/* Part 1: Competing Choices */}
      <div className="tradeoff-section-heading">
        <h4>Step 1: Choose Your Spending Priorities</h4>
        <p>Select which items to fund within your Rs. {startingBudget.toLocaleString()} budget:</p>
      </div>

      <div className="options-selection-grid">
        {options.map((opt) => {
          const isSelected = selectedOptionIds.includes(opt.id);
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
                  {opt.isEssential ? '⭐ Preventive Care' : '🎈 Luxury Extra'}
                </span>
                <span className="option-price-tag">Rs. {opt.costLKR.toLocaleString()}</span>
              </div>

              <h4 className="option-title">{opt.title}</h4>
              <p className="option-description">{opt.description}</p>

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

      {/* Part 2: Reasoning Justification */}
      <div className="tradeoff-section-heading" style={{ marginTop: '24px' }}>
        <h4>Step 2: Why Did You Pick This?</h4>
        <p>Explain why your choice is the smartest move for Barnaby:</p>
      </div>

      <div className="rationales-list">
        {rationales.map((rat) => {
          const isSelected = selectedRationaleId === rat.id;
          return (
            <div
              key={rat.id}
              className={`rationale-card ${isSelected ? 'rationale-selected' : ''}`}
              onClick={() => !disabled && setSelectedRationaleId(rat.id)}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
            >
              <input
                type="radio"
                name="tradeoff_rationale"
                checked={isSelected}
                onChange={() => setSelectedRationaleId(rat.id)}
                disabled={disabled}
                className="rationale-radio"
              />
              <span className="rationale-text">{rat.text}</span>
            </div>
          );
        })}
      </div>

      <div className="challenge-submit-row">
        <button
          type="submit"
          className="btn-confirm-decision"
          disabled={disabled || selectedOptionIds.length === 0 || !selectedRationaleId || isOverBudget}
        >
          Submit Decision & Check Results
        </button>
      </div>
    </form>
  );
};
