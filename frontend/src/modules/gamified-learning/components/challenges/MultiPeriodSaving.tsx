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

  // Track user choices for each week — start with 0 so the student actively plans savings
  const [choices, setChoices] = useState<
    Record<number, { savedAmountLKR: number; resistedTemptation: boolean }>
  >(() => {
    const init: Record<number, { savedAmountLKR: number; resistedTemptation: boolean }> = {};
    for (const p of periods) {
      init[p.period] = {
        savedAmountLKR: 0,
        resistedTemptation: false,
      };
    }
    return init;
  });

  // Reset choices whenever the level changes
  useEffect(() => {
    const init: Record<number, { savedAmountLKR: number; resistedTemptation: boolean }> = {};
    for (const p of periods) {
      init[p.period] = {
        savedAmountLKR: 0,
        resistedTemptation: false,
      };
    }
    setChoices(init);
  }, [level.id]);

  const toggleTemptation = (periodNum: number) => {
    if (disabled) return;
    setChoices((prev) => {
      const curr = prev[periodNum];
      const pConfig = periods.find((p) => p.period === periodNum)!;
      const nextResisted = !curr.resistedTemptation;
      const maxPossible = nextResisted
        ? pConfig.allowanceLKR - pConfig.mandatoryCostLKR
        : pConfig.allowanceLKR - pConfig.mandatoryCostLKR - pConfig.temptationCostLKR;
      return {
        ...prev,
        [periodNum]: {
          resistedTemptation: nextResisted,
          savedAmountLKR: Math.max(0, Math.min(curr.savedAmountLKR, maxPossible)),
        },
      };
    });
  };

  const handleSavingsChange = (periodNum: number, value: number) => {
    if (disabled) return;
    setChoices((prev) => ({
      ...prev,
      [periodNum]: {
        ...prev[periodNum],
        savedAmountLKR: value,
      },
    }));
  };

  // Calculate cumulative savings
  const totalSaved = Object.values(choices).reduce(
    (sum, c) => sum + c.savedAmountLKR,
    0
  );
  const goalProgressPercent = Math.min(100, Math.round((totalSaved / targetGoalLKR) * 100));
  const isGoalReached = totalSaved >= targetGoalLKR;

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
    <form onSubmit={handleSubmit} className="challenge-form">
      {/* Goal Progress Banner */}
      <div className={`goal-progress-banner ${isGoalReached ? 'goal-reached' : 'goal-pending'}`}>
        <div className="goal-meta-row">
          <span className="goal-title">🎯 Goal: {config.goalDescription}</span>
          <span className="goal-figures">
            Rs. {totalSaved.toLocaleString()} / Rs. {targetGoalLKR.toLocaleString()} ({goalProgressPercent}%)
          </span>
        </div>
        <div className="goal-meter-track">
          <div
            className="goal-meter-fill"
            style={{ width: `${goalProgressPercent}%` }}
          />
        </div>
        {!isGoalReached && (
          <div className="goal-hint-text">
            ⚠️ You need Rs. {(targetGoalLKR - totalSaved).toLocaleString()} more across the 3 weeks to fund the splint.
          </div>
        )}
      </div>

      {/* Week by Week Cards */}
      <div className="multi-period-weeks-grid">
        {periods.map((p) => {
          const currentChoice = choices[p.period];
          const maxSave = currentChoice.resistedTemptation
            ? p.allowanceLKR - p.mandatoryCostLKR
            : p.allowanceLKR - p.mandatoryCostLKR - p.temptationCostLKR;

          return (
            <div key={p.period} className="week-planning-card">
              <div className="week-card-header">
                <span className="week-badge">{p.label}</span>
                <span className="week-income">Allowance: +Rs. {p.allowanceLKR.toLocaleString()}</span>
              </div>

              {/* Mandatory Living Cost */}
              <div className="mandatory-cost-item">
                <span className="cost-desc">📦 Mandatory: {p.mandatoryCostDescription}</span>
                <span className="cost-tag">-Rs. {p.mandatoryCostLKR.toLocaleString()}</span>
              </div>

              {/* Temptation Challenge */}
              <div
                className={`temptation-box ${currentChoice.resistedTemptation ? 'temptation-resisted' : 'temptation-bought'}`}
              >
                <div className="temptation-header">
                  <span className="temptation-title">🍭 Temptation: {p.temptationTitle}</span>
                  <span className="temptation-price">-Rs. {p.temptationCostLKR.toLocaleString()}</span>
                </div>
                <p className="temptation-desc">{p.temptationDescription}</p>

                <button
                  type="button"
                  className={`btn-temptation-toggle ${currentChoice.resistedTemptation ? 'btn-resisted' : 'btn-bought'}`}
                  onClick={() => toggleTemptation(p.period)}
                  disabled={disabled}
                >
                  {currentChoice.resistedTemptation
                    ? '🛡️ Resisting Temptation (Keeps cash for splint)'
                    : '💸 Buying Temptation (Spends cash)'}
                </button>
              </div>

              {/* Savings Slider */}
              <div className="week-savings-control">
                <div className="savings-control-label">
                  <span>Weekly Bank Deposit:</span>
                  <strong>Rs. {currentChoice.savedAmountLKR.toLocaleString()}</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxSave}
                  step={500}
                  value={currentChoice.savedAmountLKR}
                  onChange={(e) => handleSavingsChange(p.period, Number(e.target.value))}
                  disabled={disabled}
                  className="savings-slider"
                />
                <span className="max-save-note">Max available to save this week: Rs. {maxSave.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="challenge-submit-row">
        <button
          type="submit"
          className="btn-confirm-decision"
          disabled={disabled || totalSaved === 0}
        >
          {totalSaved === 0 ? 'Plan Savings to Continue' : 'Lock 3-Week Savings Plan & Check Target'}
        </button>
      </div>
    </form>
  );
};
