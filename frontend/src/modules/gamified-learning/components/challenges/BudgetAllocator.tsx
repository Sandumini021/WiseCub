import React, { useEffect, useState } from 'react';
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

  // Initialize state with 0 so the student actively allocates the budget
  const [allocations, setAllocations] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const cat of categories) {
      init[cat.id] = 0;
    }
    return init;
  });

  // Reset allocations whenever the level changes
  useEffect(() => {
    const init: Record<string, number> = {};
    for (const cat of categories) {
      init[cat.id] = 0;
    }
    setAllocations(init);
  }, [level.id]);

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
    if (isOverBudget || totalAllocated === 0) return;
    onSubmit(allocations);
  };

  return (
    <form onSubmit={handleSubmit} className="challenge-form">
      {/* Live Financial Ledger Bar */}
      <div className={`financial-ledger-banner ${isOverBudget ? 'ledger-over' : 'ledger-ok'}`} aria-label="Budget Allocation Ledger">
        <div className="ledger-stat">
          <span className="stat-label">Total Budget</span>
          <span className="stat-amount">Rs. {startingBudget.toLocaleString()}</span>
        </div>
        <div className="ledger-stat">
          <span className="stat-label">Total Allocated</span>
          <span className="stat-amount">Rs. {totalAllocated.toLocaleString()}</span>
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
          ⚠️ <strong>Over Budget:</strong> You have planned Rs.{' '}
          {Math.abs(remainingCash).toLocaleString()} more than your budget allows! Reduce some
          discretionary categories to balance your funds.
        </div>
      )}

      {/* Category Allocation Sliders & Steppers */}
      <div className="allocation-categories-list" role="group" aria-label="Budget Categories">
        {categories.map((cat) => {
          const currentVal = allocations[cat.id] || 0;
          const isBelowMin = cat.isEssential && currentVal < cat.minRecommendedLKR;
          const maxLimit = Math.max(cat.maxRecommendedLKR, startingBudget);
          const percentOfBudget = startingBudget > 0 ? Math.min(100, Math.round((currentVal / startingBudget) * 100)) : 0;

          return (
            <div key={cat.id} className="allocation-card">
              <div className="allocation-card-header">
                <div className="allocation-title-group">
                  <span className={`option-category-badge ${cat.isEssential ? 'badge-essential' : 'badge-discretionary'}`}>
                    {cat.isEssential ? '⭐ Essential Care' : '🎈 Optional Want'}
                  </span>
                  <h4 className="allocation-title">{cat.name}</h4>
                </div>
                <div className="allocation-amount-display">
                  Rs. {currentVal.toLocaleString()}
                  <span className="allocation-percent-badge">{percentOfBudget}%</span>
                </div>
              </div>

              <p className="allocation-desc">{cat.description}</p>

              {cat.isEssential && (
                <div className={`allocation-recommended-note ${isBelowMin ? 'recommended-insufficient' : 'recommended-ok'}`}>
                  📌 Minimum recommended for safe care: <strong>Rs. {cat.minRecommendedLKR.toLocaleString()}</strong>
                  {isBelowMin ? (
                    <span className="alert-text"> (Current allocation is insufficient!)</span>
                  ) : (
                    <span className="ok-text"> ✓ Target met</span>
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
                  aria-label={`Decrease ${cat.name} by Rs. ${cat.stepLKR}`}
                >
                  − Rs. {cat.stepLKR}
                </button>

                <div className="slider-wrapper">
                  <input
                    type="range"
                    min={0}
                    max={maxLimit}
                    step={cat.stepLKR}
                    value={currentVal}
                    onChange={(e) => handleSliderChange(cat.id, Number(e.target.value))}
                    disabled={disabled}
                    className="allocation-slider"
                    aria-label={`${cat.name} allocation amount`}
                  />
                </div>

                <button
                  type="button"
                  className="btn-stepper"
                  onClick={() => updateCategory(cat.id, 1)}
                  disabled={disabled}
                  aria-label={`Increase ${cat.name} by Rs. ${cat.stepLKR}`}
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
          disabled={disabled || isOverBudget || totalAllocated === 0}
        >
          {isOverBudget
            ? `⚠️ Over Budget by Rs. ${Math.abs(remainingCash).toLocaleString()}`
            : totalAllocated === 0
            ? 'Allocate your budget across categories to continue'
            : `Confirm Allocation (Rs. ${totalAllocated.toLocaleString()}) ➔`}
        </button>
      </div>
    </form>
  );
};
