import React, { useEffect, useState } from 'react';
import { LevelDefinition } from '../../types/mission.types';

interface EmergencyResponseProps {
  level: LevelDefinition;
  onSubmit: (selectedOptionIds: string[]) => void;
  disabled?: boolean;
}

export const EmergencyResponse: React.FC<EmergencyResponseProps> = ({
  level,
  onSubmit,
  disabled = false,
}) => {
  const options = level.options || [];
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedId(null);
  }, [level.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    onSubmit([selectedId]);
  };

  return (
    <form onSubmit={handleSubmit} className="challenge-form">
      {/* Emergency Alert Banner */}
      <div className="emergency-alert-card" role="alert" aria-label="Emergency Shock Alert">
        <div className="emergency-icon-col">🚨</div>
        <div className="emergency-text-col">
          <div className="emergency-badge-tag">CRITICAL FINANCIAL EMERGENCY</div>
          <h4 className="emergency-alert-title">Sudden Fever Spike: Immediate Clinic Care Needed!</h4>
          <p className="emergency-alert-desc">
            Barnaby’s condition has deteriorated suddenly. The emergency vet requires <strong>Rs. 4,500</strong> for
            immediate medical intervention.
          </p>
          <div className="emergency-financial-pill-row">
            <span className="pill-cash">💵 Cash on Hand: Rs. 2,000</span>
            <span className="pill-reserve">🛡️ Emergency Buffer: Rs. 3,500</span>
            <span className="pill-total">📊 Total Liquid Capital: Rs. 5,500</span>
          </div>
        </div>
      </div>

      {/* Decision Strategy Cards */}
      <div className="emergency-options-grid" role="radiogroup" aria-label="Emergency Financial Strategies">
        {options.map((opt) => {
          const isSelected = selectedId === opt.id;
          const isSafeStrategy = opt.id === 'opt_use_emergency_fund';

          return (
            <div
              key={opt.id}
              className={`emergency-card ${isSelected ? 'emergency-card-selected' : ''}`}
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
              aria-label={`${opt.title}, ${isSafeStrategy ? 'Smart Emergency Strategy' : 'Dangerous Risk'}, cost Rs. ${opt.costLKR.toLocaleString()}`}
            >
              <div className="emergency-card-header">
                <span className={`strategy-badge ${isSafeStrategy ? 'badge-safe' : 'badge-danger'}`}>
                  {isSafeStrategy ? '🛡️ Smart Emergency Strategy' : '⚠️ Dangerous Risk'}
                </span>
                <span className="emergency-price">Rs. {opt.costLKR.toLocaleString()}</span>
              </div>

              <h4 className="emergency-title">{opt.title}</h4>
              <p className="emergency-desc">{opt.description}</p>

              {opt.financialTradeoffNote && (
                <div className="emergency-tradeoff-tip">
                  💡 <em>{opt.financialTradeoffNote}</em>
                </div>
              )}

              <div className="emergency-radio-row">
                <div className={`option-check-pill ${isSelected ? 'pill-checked' : ''}`}>
                  <span className="check-icon">{isSelected ? '✓' : '○'}</span>
                  <span className="check-label">{isSelected ? 'Selected Strategy' : 'Choose Strategy'}</span>
                </div>
                <input
                  type="radio"
                  name="emergency_choice"
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
          disabled={disabled || !selectedId}
        >
          {!selectedId ? 'Select an emergency strategy to continue' : 'Execute Emergency Strategy ➔'}
        </button>
      </div>
    </form>
  );
};
