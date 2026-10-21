import React, { useEffect, useState } from 'react';
import { LevelDefinition } from '../../types/mission.types';

interface MultiPeriodSavingProps {
  level: LevelDefinition;
  onSubmit: (weeklyDecisions: Array<{ period: number; savedAmountLKR: number; resistedTemptation: boolean }>) => void;
  disabled?: boolean;
}

export const MultiPeriodSaving: React.FC<MultiPeriodSavingProps> = ({
  level,
  onSubmit,
  disabled = false,
}) => {
  const config = level.multiPeriodConfig;
  if (!config) return null;

  const periods = config.periods;
  const targetGoalLKR = config.targetGoalLKR;

  // Default to resistedTemptation: true so the student starts with maximum saving capability
  const [choices, setChoices] = useState<
    Record<number, { savedAmountLKR: number; resistedTemptation: boolean }>
  >(() => {
    const init: Record<number, { savedAmountLKR: number; resistedTemptation: boolean }> = {};
    for (const p of periods) {
      init[p.period] = {
        savedAmountLKR: 0,
        resistedTemptation: true,
      };
    }
    return init;
  });

  useEffect(() => {
    const init: Record<number, { savedAmountLKR: number; resistedTemptation: boolean }> = {};
    for (const p of periods) {
      init[p.period] = {
        savedAmountLKR: 0,
        resistedTemptation: true,
      };
    }
    setChoices(init);
  }, [level.id]);

  const setTemptation = (periodNum: number, resist: boolean) => {
    if (disabled) return;
    setChoices((prev) => {
      const curr = prev[periodNum];
      const pConfig = periods.find((p) => p.period === periodNum)!;
      const maxPossible = resist
        ? pConfig.allowanceLKR - pConfig.mandatoryCostLKR
        : pConfig.allowanceLKR - pConfig.mandatoryCostLKR - pConfig.temptationCostLKR;
      return {
        ...prev,
        [periodNum]: {
          resistedTemptation: resist,
          savedAmountLKR: Math.min(curr.savedAmountLKR, maxPossible),
        },
      };
    });
  };

  const setSavings = (periodNum: number, value: number) => {
    if (disabled) return;
    setChoices((prev) => ({
      ...prev,
      [periodNum]: {
        ...prev[periodNum],
        savedAmountLKR: value,
      },
    }));
  };

  const totalSaved = Object.values(choices).reduce(
    (sum, c) => sum + c.savedAmountLKR,
    0
  );
  const goalProgressPercent = Math.min(100, Math.round((totalSaved / targetGoalLKR) * 100));
  const isGoalReached = totalSaved >= targetGoalLKR;
  const remainingNeeded = Math.max(0, targetGoalLKR - totalSaved);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = periods.map((p) => ({
      period: p.period,
      savedAmountLKR: choices[p.period].savedAmountLKR,
      resistedTemptation: choices[p.period].resistedTemptation,
    }));
    onSubmit(formatted);
  };

  return (
    <form onSubmit={handleSubmit} className="challenge-form clean-savings-challenge">
      {/* Sleek Goal Bar */}
      <div className={`clean-goal-bar ${isGoalReached ? 'goal-complete' : ''}`} aria-label="Savings Goal Status">
        <div className="goal-bar-info">
          <span className="goal-label">🎯 Savings Target: Rs. {targetGoalLKR.toLocaleString()}</span>
          <span className="goal-numbers">
            <strong>Rs. {totalSaved.toLocaleString()}</strong> / Rs. {targetGoalLKR.toLocaleString()} ({goalProgressPercent}%)
          </span>
        </div>
        <div className="goal-track">
          <div
            className="goal-fill"
            style={{ width: `${goalProgressPercent}%` }}
            role="progressbar"
            aria-valuenow={goalProgressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        {!isGoalReached && remainingNeeded > 0 ? (
          <span className="goal-subtext">Need Rs. {remainingNeeded.toLocaleString()} more across the planning periods.</span>
        ) : (
          <span className="goal-subtext goal-ok">🎉 Goal Reached! Full savings buffer achieved!</span>
        )}
      </div>

      {/* Clean Weekly Cards */}
      <div className="clean-weeks-grid" role="group" aria-label="Savings Planning Periods">
        {periods.map((p) => {
          const current = choices[p.period];
          const isResisted = current.resistedTemptation;
          const maxSave = isResisted
            ? p.allowanceLKR - p.mandatoryCostLKR
            : p.allowanceLKR - p.mandatoryCostLKR - p.temptationCostLKR;

          return (
            <div key={p.period} className="clean-week-card">
              {/* Header */}
              <div className="card-top-row">
                <span className="week-tag">{p.label}</span>
                <span className="income-tag">+Rs. {p.allowanceLKR.toLocaleString()}</span>
              </div>

              {/* Fixed Basics */}
              <div className="line-item basic-item">
                <span className="item-label">🐾 Mandatory Basics (Food & Bed)</span>
                <span className="item-cost">−Rs. {p.mandatoryCostLKR.toLocaleString()}</span>
              </div>

              {/* Temptation Toggle */}
              <div className={`temptation-pill-card ${isResisted ? 'pill-resisted' : 'pill-bought'}`}>
                <div className="temptation-title-row">
                  <span className="temptation-name">🍭 {p.temptationTitle}</span>
                  <span className="temptation-cost">−Rs. {p.temptationCostLKR.toLocaleString()}</span>
                </div>
                <div className="temptation-toggle-pills">
                  <button
                    type="button"
                    className={`pill-btn ${isResisted ? 'pill-active-green' : ''}`}
                    onClick={() => setTemptation(p.period, true)}
                    disabled={disabled}
                    aria-pressed={isResisted}
                  >
                    🛡️ Skip & Save
                  </button>
                  <button
                    type="button"
                    className={`pill-btn ${!isResisted ? 'pill-active-red' : ''}`}
                    onClick={() => setTemptation(p.period, false)}
                    disabled={disabled}
                    aria-pressed={!isResisted}
                  >
                    💸 Spend on Want
                  </button>
                </div>
              </div>

              {/* Deposit Slider */}
              <div className="deposit-box">
                <div className="deposit-label-row">
                  <span className="deposit-title">💰 Save This Period:</span>
                  <span className="deposit-val">Rs. {current.savedAmountLKR.toLocaleString()}</span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={maxSave}
                  step={500}
                  value={current.savedAmountLKR}
                  onChange={(e) => setSavings(p.period, Number(e.target.value))}
                  disabled={disabled}
                  className="clean-slider"
                  aria-label={`${p.label} savings amount`}
                />

                <div className="deposit-quick-actions">
                  <button
                    type="button"
                    className="btn-quick"
                    onClick={() => setSavings(p.period, 0)}
                    disabled={disabled}
                  >
                    Rs. 0
                  </button>
                  <button
                    type="button"
                    className="btn-quick btn-quick-max"
                    onClick={() => setSavings(p.period, maxSave)}
                    disabled={disabled}
                  >
                    Save All (Rs. {maxSave.toLocaleString()})
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      <div className="challenge-submit-row">
        <button
          type="submit"
          className={`btn-confirm-decision ${isGoalReached ? 'btn-green-ready' : ''}`}
          disabled={disabled || totalSaved === 0}
        >
          {isGoalReached
            ? `🎉 Lock Savings Plan (Rs. ${totalSaved.toLocaleString()}) ➔`
            : totalSaved === 0
            ? 'Set your weekly savings to continue'
            : `Save Rs. ${targetGoalLKR.toLocaleString()} to pass (Current: Rs. ${totalSaved.toLocaleString()}) ➔`}
        </button>
      </div>
    </form>
  );
};
