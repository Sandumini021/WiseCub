import React, { useEffect, useState } from 'react';
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
      <div className={`financial-ledger-banner ${isOverBudget ? 'ledger-over' : 'ledger-ok'}`} aria-label="Tradeoff Ledger">
        <div className="ledger-stat">
          <span className="stat-label">Available Fund</span>
          <span className="stat-amount">Rs. {startingBudget.toLocaleString()}</span>
        </div>
        <div className="ledger-stat">
          <span className="stat-label">Total Allocated</span>
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
          ⚠️ <strong>Over Budget:</strong> You cannot fund all choices at once. Make a prioritized
          tradeoff to keep total spending under Rs. {startingBudget.toLocaleString()}.
        </div>
      )}

      {/* Part 1: Competing Choices */}
      <div className="tradeoff-section-heading">
        <div className="step-badge">STEP 1</div>
        <h4>Choose Your Spending Priorities</h4>
        <p>Select which items to fund within your Rs. {startingBudget.toLocaleString()} budget:</p>
      </div>

      <div className="options-selection-grid" role="group" aria-label="Step 1 Spending Priorities">
        {options.map((opt) => {
          const isSelected = selectedOptionIds.includes(opt.id);
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
              aria-label={`${opt.title}, ${opt.isEssential ? 'Preventive Care' : 'Luxury Extra'}, cost Rs. ${opt.costLKR.toLocaleString()}`}
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

      {/* Part 2: Reasoning Justification */}
      <div className="tradeoff-section-heading tradeoff-step-2">
        <div className="step-badge">STEP 2</div>
        <h4>Why Did You Choose This Strategy?</h4>
        <p>Select the financial rationale that best justifies your decision:</p>
      </div>

      <div className="rationales-list" role="radiogroup" aria-label="Step 2 Reasoning Rationale">
        {rationales.map((rat) => {
          const isSelected = selectedRationaleId === rat.id;
          return (
            <div
              key={rat.id}
              className={`rationale-card ${isSelected ? 'rationale-selected' : ''}`}
              onClick={() => !disabled && setSelectedRationaleId(rat.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!disabled) setSelectedRationaleId(rat.id);
                }
              }}
              role="radio"
              aria-checked={isSelected}
              tabIndex={disabled ? -1 : 0}
              aria-label={rat.text}
            >
              <div className="rationale-radio-indicator">
                <span className="radio-dot">{isSelected ? '●' : '○'}</span>
              </div>
              <span className="rationale-text">{rat.text}</span>
              <input
                type="radio"
                name="tradeoff_rationale"
                checked={isSelected}
                onChange={() => setSelectedRationaleId(rat.id)}
                disabled={disabled}
                className="sr-only-checkbox"
                tabIndex={-1}
                aria-hidden="true"
              />
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
          {selectedOptionIds.length === 0
            ? 'Step 1: Select your spending priorities'
            : isOverBudget
            ? `⚠️ Over budget by Rs. ${Math.abs(remainingCash).toLocaleString()}`
            : !selectedRationaleId
            ? 'Step 2: Choose your financial rationale'
            : 'Submit Decision & Evaluate Rationale ➔'}
        </button>
      </div>
    </form>
  );
};
