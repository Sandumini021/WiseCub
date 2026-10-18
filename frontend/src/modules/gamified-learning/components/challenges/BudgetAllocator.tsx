import { useState } from 'react';
import { LevelDefinition } from '../../types/mission.types';

interface BudgetAllocatorProps {
  level: LevelDefinition;
  onSubmit: (allocations: Record<string, number>) => void;
  disabled?: boolean;
}

export const BudgetAllocator: React.FC<BudgetAllocatorProps> = ({
  level,
  onSubmit,
  disabled = false,
}) => {
  const categories = level.allocationCategories || [];
  const startingBudget = level.startingBudgetLKR;

  // Initialize state with default amounts or 0
  const [allocations, setAllocations] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const cat of categories) {
      init[cat.id] = cat.defaultAmountLKR || 0;
    }
    return init;
  });

  const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + val, 0);
  const remainingCash = startingBudget - totalAllocated;
  const isOverBudget = remainingCash < 0;

  const updateCategory = (id: string, delta: number) => {
    if (disabled) return;
    setAllocations((prev) => {
      const current = prev[id] || 0;
      const cat = categories.find((c) => c.id === id);
      const step = cat?.stepLKR || 500;
      const next = Math.max(0, current + delta * step);
      return { ...prev, [id]: next };
    });
  };

  const handleSliderChange = (id: string, value: number) => {
    if (disabled) return;
    setAllocations((prev) => ({ ...prev, [id]: Math.max(0, value) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(allocations);
  };

  return (
    <form onSubmit={handleSubmit} className="challenge-form">
      {/* Live Financial Ledger Bar */}
      <div className={`financial-ledger-banner ${isOverBudget ? 'ledger-over' : 'ledger-ok'}`}>
        <div className="ledger-stat">
          <span className="stat-label">Total Monthly / Care Budget</span>
          <span className="stat-amount">Rs. {startingBudget.toLocaleString()}</span>
        </div>
        <div className="ledger-stat">
          <span className="stat-label">Total Allocated</span>
          <span className="stat-amount">Rs. {totalAllocated.toLocaleString()}</span>
        </div>
        <div className="ledger-stat">
          <span className="stat-label">Unallocated Cash</span>
          <span className={`stat-amount ${isOverBudget ? 'amount-negative' : 'amount-positive'}`}>
            Rs. {remainingCash.toLocaleString()}
          </span>
        </div>
      </div>

      {isOverBudget && (
        <div className="ledger-warning-box">
          ⚠️ <strong>Budget Deficit:</strong> You have planned Rs.{' '}
          {Math.abs(remainingCash).toLocaleString()} more than your budget allows! Reduce some
          categories before confirming.
        </div>
      )}

      {/* Category Allocation Sliders & Steppers */}
      <div className="allocation-categories-list">
        {categories.map((cat) => {
          const currentVal = allocations[cat.id] || 0;
          const isBelowMin = cat.isEssential && currentVal < cat.minRecommendedLKR;

          return (
            <div key={cat.id} className="allocation-card">
              <div className="allocation-card-header">
                <div className="allocation-title-group">
                  <span className={`option-category-badge ${cat.isEssential ? 'badge-essential' : 'badge-discretionary'}`}>
                    {cat.isEssential ? 'Essential Care' : 'Discretionary'}
                  </span>
                  <h4 className="allocation-title">{cat.name}</h4>
                </div>
                <div className="allocation-amount-display">
                  Rs. {currentVal.toLocaleString()}
                </div>
              </div>

              <p className="allocation-desc">{cat.description}</p>

              {cat.isEssential && (
                <div className="allocation-recommended-note">
                  📌 Minimum recommended for safe care: <strong>Rs. {cat.minRecommendedLKR.toLocaleString()}</strong>
                  {isBelowMin && (
                    <span className="alert-text"> (Current allocation is insufficient!)</span>
                  )}
                </div>
              )}

              {/* Slider & Stepper Controls */}
              <div className="allocation-controls-row">
                <button
                  type="button"
                  className="btn-stepper"
                  onClick={() => updateCategory(cat.id, -1)}
                  disabled={disabled || currentVal <= 0}
                >
                  - Rs. {cat.stepLKR}
                </button>

                <input
                  type="range"
                  min={0}
                  max={Math.max(cat.maxRecommendedLKR, startingBudget)}
                  step={cat.stepLKR}
                  value={currentVal}
                  onChange={(e) => handleSliderChange(cat.id, Number(e.target.value))}
                  disabled={disabled}
                  className="allocation-slider"
                />

                <button
                  type="button"
                  className="btn-stepper"
                  onClick={() => updateCategory(cat.id, 1)}
                  disabled={disabled}
                >
                  + Rs. {cat.stepLKR}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="challenge-submit-row">
        <button
          type="submit"
          className="btn-confirm-decision"
          disabled={disabled || isOverBudget}
        >
          Submit Planned Budget & Evaluate Feasibility
        </button>
      </div>
    </form>
  );
};
