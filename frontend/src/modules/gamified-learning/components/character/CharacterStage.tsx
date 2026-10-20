import React from 'react';
import { CharacterState } from '../../types/emotion.types';
import { PuppyCharacterSvg } from './PuppyCharacterSvg';
import { SquirrelCharacterSvg } from './SquirrelCharacterSvg';
import { PandaCharacterSvg } from './PandaCharacterSvg';

interface CharacterStageProps {
  characterState: CharacterState;
  showDialogue?: boolean;
  size?: number;
  compact?: boolean;
}

export const CharacterStage: React.FC<CharacterStageProps> = ({
  characterState,
  showDialogue = true,
  size = 200,
  compact = false,
}) => {
  const { physicalCondition, emotionalState, vitalityScore, happinessScore, activeDialogue } =
    characterState;

  const isPanda =
    characterState.characterId === 'char_panda_baobao' ||
    characterState.name?.toLowerCase().includes('bao') ||
    characterState.name?.toLowerCase().includes('panda');

  const isSquirrel =
    !isPanda &&
    (characterState.characterId === 'char_squirrel_nutty' ||
      characterState.name?.toLowerCase().includes('nutty'));

  // Format labels for child-friendly reading
  const conditionLabelMap: Record<string, { label: string; tone: string }> = {
    // Puppy conditions
    NEEDS_CARE: {
      label: isPanda ? 'Safety Unfunded' : 'Needs Care (Injured)',
      tone: 'badge-urgent',
    },
    WEAK_STABILIZED: {
      label: isPanda ? 'Stalls Staged & Ready' : 'Stabilized & Resting',
      tone: 'badge-warning',
    },
    RECEIVING_TREATMENT: {
      label: isPanda ? 'Wholesale Secured' : 'Receiving Treatment',
      tone: 'badge-info',
    },
    RECOVERING: {
      label: isPanda ? 'Booths Active & Lively' : 'Rehabilitating & Healing',
      tone: 'badge-progress',
    },
    HEALTHY_ACTIVE: {
      label: isPanda ? 'Charity Triumphant!' : 'Fully Healed & Playful!',
      tone: 'badge-success',
    },
    SETBACK_WAITING: {
      label: isPanda ? 'Balancing Fair Ledger' : 'Waiting for Supplies',
      tone: 'badge-setback',
    },
    // Nutty squirrel conditions
    SHELTER_UNPREPARED: { label: 'Shelter Unprepared', tone: 'badge-urgent' },
    BASIC_STOCKS_FORMED: { label: 'Basic Stocks Ready', tone: 'badge-warning' },
    STORAGE_ORGANIZED: { label: 'Pantry Organized', tone: 'badge-progress' },
    WINTER_RESERVES_ACTIVE: { label: 'Winter Reserves Active', tone: 'badge-info' },
    WEATHER_IMPACTED: { label: 'Weather Impacted', tone: 'badge-setback' },
    SHELTER_FORTIFIED: { label: 'Shelter Fortified', tone: 'badge-progress' },
    WINTER_READY: { label: 'Winter Prepared & Secure!', tone: 'badge-success' },
  };

  const emotionLabelMap: Record<string, { emoji: string; text: string }> = {
    ANXIOUS: { emoji: '😟', text: 'Anxious' },
    WORRIED: { emoji: '🥺', text: 'Worried' },
    VULNERABLE: { emoji: '🩹', text: 'Vulnerable' },
    HOPEFUL: { emoji: '✨', text: 'Hopeful' },
    RELIEVED: { emoji: '😌', text: 'Relieved' },
    CHEERFUL: { emoji: '🐶', text: 'Cheerful' },
    JOYFUL_HEALTHY: { emoji: '🎉', text: 'Joyful & Healthy!' },
    TEMPTED: { emoji: '🍭', text: 'Tempted' },
    CONFIDENT: { emoji: '🛡️', text: 'Confident' },
    HAPPY_AND_SECURE: { emoji: '🏡', text: 'Happy & Secure' },
    EXCITED: { emoji: '🎈', text: 'Excited' },
    CONFUSED: { emoji: '❓', text: 'Confused' },
    STRESSED: { emoji: '😰', text: 'Stressed' },
    PROUD_AND_HAPPY: { emoji: '🏆', text: 'Proud & Happy!' },
  };

  const conditionInfo = conditionLabelMap[physicalCondition] || {
    label: physicalCondition.replace(/_/g, ' '),
    tone: 'badge-info',
  };
  const emotionInfo = emotionLabelMap[emotionalState] || {
    emoji: isPanda ? '🐼' : isSquirrel ? '🐿️' : '🐾',
    text: emotionalState.replace(/_/g, ' '),
  };

  if (compact) {
    return (
      <div className="character-stage-compact">
        {isPanda ? (
          <PandaCharacterSvg condition={physicalCondition} emotion={emotionalState} size={70} />
        ) : isSquirrel ? (
          <SquirrelCharacterSvg condition={physicalCondition} emotion={emotionalState} size={70} />
        ) : (
          <PuppyCharacterSvg condition={physicalCondition} emotion={emotionalState} size={70} />
        )}
        <div className="stage-compact-meta">
          <div className="stage-pills-row">
            <span className={`condition-pill ${conditionInfo.tone}`}>{conditionInfo.label}</span>
            <span className="emotion-pill">
              {emotionInfo.emoji} {emotionInfo.text}
            </span>
          </div>
          <div className="mini-meters">
            <div className="meter-label">
              {isPanda ? 'Fair Readiness' : isSquirrel ? 'Preparedness' : 'Vitality'}: {vitalityScore}%
            </div>
            <div className="meter-bar">
              <div className="meter-fill fill-vitality" style={{ width: `${vitalityScore}%` }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="character-stage-card">
      <div className="character-stage-header">
        <div className="character-name-group">
          <h3 className="character-display-name">{characterState.name}</h3>
          <p className="character-condition-blurb">{characterState.conditionDescription}</p>
        </div>
        <div className="character-badges-row">
          <span className={`condition-pill ${conditionInfo.tone}`}>{conditionInfo.label}</span>
          <span className="emotion-pill">
            {emotionInfo.emoji} {emotionInfo.text}
          </span>
        </div>
      </div>

      <div className="character-stage-main">
        {/* Animated Visual Character */}
        <div className="character-visual-container">
          {isPanda ? (
            <PandaCharacterSvg
              condition={physicalCondition}
              emotion={emotionalState}
              size={size}
            />
          ) : isSquirrel ? (
            <SquirrelCharacterSvg
              condition={physicalCondition}
              emotion={emotionalState}
              size={size}
            />
          ) : (
            <PuppyCharacterSvg
              condition={physicalCondition}
              emotion={emotionalState}
              size={size}
            />
          )}
        </div>

        {/* Speech/Thought Bubble */}
        {showDialogue && activeDialogue && (
          <div className="character-speech-bubble" role="region" aria-label="Character thought">
            <div className="speech-tail" />
            <p className="speech-quote">"{activeDialogue}"</p>
          </div>
        )}
      </div>

      {/* Vitality & Happiness Meters */}
      <div className="character-meters-grid">
        <div className="stage-meter-card">
          <div className="meter-header">
            <span className="meter-title">
              {isPanda
                ? '🎪 Fair Readiness'
                : isSquirrel
                ? '❄️ Winter Preparedness'
                : '❤️ Vitality & Health'}
            </span>
            <span className="meter-value">{vitalityScore} / 100</span>
          </div>
          <div className="meter-track">
            <div
              className="meter-fill fill-vitality"
              style={{ width: `${Math.max(5, vitalityScore)}%` }}
            />
          </div>
        </div>

        <div className="stage-meter-card">
          <div className="meter-header">
            <span className="meter-title">
              {isPanda
                ? '✨ Treasurer Confidence'
                : isSquirrel
                ? '✨ Security & Mood'
                : '✨ Mood & Happiness'}
            </span>
            <span className="meter-value">{happinessScore} / 100</span>
          </div>
          <div className="meter-track">
            <div
              className="meter-fill fill-happiness"
              style={{ width: `${Math.max(5, happinessScore)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Squirrel Condition Dimensions Sub-grid if present */}
      {isSquirrel && (
        <div
          style={{
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px dashed #e2e8f0',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.5rem',
            fontSize: '0.8rem',
            color: '#4b5563',
          }}
        >
          <div style={{ background: '#f8fafc', padding: '0.35rem 0.5rem', borderRadius: '6px' }}>
            <span>🌰 Food: </span>
            <strong>{characterState.foodSupply ?? 50}%</strong>
          </div>
          <div style={{ background: '#f8fafc', padding: '0.35rem 0.5rem', borderRadius: '6px' }}>
            <span>💰 Savings: </span>
            <strong>{characterState.savingsReserve ?? 40}%</strong>
          </div>
          <div style={{ background: '#f8fafc', padding: '0.35rem 0.5rem', borderRadius: '6px' }}>
            <span>🏡 Shelter: </span>
            <strong>{characterState.shelterReadiness ?? 35}%</strong>
          </div>
          <div style={{ background: '#f8fafc', padding: '0.35rem 0.5rem', borderRadius: '6px' }}>
            <span>🛡️ Resilience: </span>
            <strong>{characterState.winterPreparedness ?? 45}%</strong>
          </div>
        </div>
      )}

      {/* Panda Condition Dimensions Sub-grid if present */}
      {isPanda && (
        <div
          style={{
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px dashed #e2e8f0',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.5rem',
            fontSize: '0.8rem',
            color: '#4b5563',
          }}
        >
          <div style={{ background: '#f8fafc', padding: '0.35rem 0.5rem', borderRadius: '6px' }}>
            <span>📊 Budget: </span>
            <strong>{characterState.budgetHealth ?? 60}%</strong>
          </div>
          <div style={{ background: '#f8fafc', padding: '0.35rem 0.5rem', borderRadius: '6px' }}>
            <span>🎪 Staging: </span>
            <strong>{characterState.fairReadiness ?? 30}%</strong>
          </div>
          <div style={{ background: '#f8fafc', padding: '0.35rem 0.5rem', borderRadius: '6px' }}>
            <span>📚 Charity: </span>
            <strong>{characterState.charityGoalProgress ?? 0}%</strong>
          </div>
          <div style={{ background: '#f8fafc', padding: '0.35rem 0.5rem', borderRadius: '6px' }}>
            <span>🤝 Vendors: </span>
            <strong>{characterState.vendorRelationships ?? 50}%</strong>
          </div>
        </div>
      )}
    </div>
  );
};
