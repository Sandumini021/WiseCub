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

  const themeClass = isPanda
    ? 'companion-theme-panda'
    : isSquirrel
    ? 'companion-theme-squirrel'
    : 'companion-theme-puppy';

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

  const companionRoleSubtitle = isPanda
    ? 'Treasurer of the School Fair'
    : isSquirrel
    ? 'Forest Saver preparing for Winter'
    : 'Injured Puppy in Recovery';

  if (compact) {
    return (
      <div className={`character-stage-compact ${themeClass}`}>
        <div className="compact-avatar-wrapper">
          {isPanda ? (
            <PandaCharacterSvg condition={physicalCondition} emotion={emotionalState} size={72} />
          ) : isSquirrel ? (
            <SquirrelCharacterSvg condition={physicalCondition} emotion={emotionalState} size={72} />
          ) : (
            <PuppyCharacterSvg condition={physicalCondition} emotion={emotionalState} size={72} />
          )}
        </div>
        <div className="stage-compact-meta">
          <div className="compact-header-row">
            <span className="compact-name">{characterState.name}</span>
            <span className={`condition-pill ${conditionInfo.tone}`}>{conditionInfo.label}</span>
            <span className="emotion-pill">
              {emotionInfo.emoji} {emotionInfo.text}
            </span>
          </div>
          <div className="mini-meters">
            <div className="mini-meter-row">
              <span className="meter-label">
                {isPanda ? '🎪 Fair Readiness' : isSquirrel ? '❄️ Preparedness' : '❤️ Vitality'}:
              </span>
              <strong className="meter-val-text">{vitalityScore}%</strong>
            </div>
            <div className="meter-bar">
              <div className="meter-fill fill-vitality" style={{ width: `${Math.max(6, vitalityScore)}%` }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`character-stage-card ${themeClass}`}>
      <div className="character-stage-header">
        <div className="character-name-group">
          <div className="character-title-row">
            <span className="character-avatar-badge">{isPanda ? '🐼' : isSquirrel ? '🐿️' : '🐶'}</span>
            <div>
              <h3 className="character-display-name">{characterState.name}</h3>
              <p className="character-subtitle">{companionRoleSubtitle}</p>
            </div>
          </div>
          <p className="character-condition-blurb">{characterState.conditionDescription}</p>
        </div>
        <div className="character-badges-row">
          <span className={`condition-pill ${conditionInfo.tone}`} title="Physical / Mission Status">
            {conditionInfo.label}
          </span>
          <span className="emotion-pill" title="Emotional State">
            {emotionInfo.emoji} {emotionInfo.text}
          </span>
        </div>
      </div>

      <div className="character-stage-main">
        {/* Animated Visual Character with Pedestal */}
        <div className="character-visual-container">
          <div className="character-pedestal-glow" aria-hidden="true" />
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

        {/* Modern Emotional Speech / Thought Bubble */}
        {showDialogue && activeDialogue && (
          <div className="character-speech-bubble" role="region" aria-label={`${characterState.name}'s thoughts`}>
            <div className="speech-tail" aria-hidden="true" />
            <div className="speech-bubble-inner">
              <div className="speech-meta-header">
                <span className="speech-speaker-tag">
                  {emotionInfo.emoji} {characterState.name}’s Thoughts
                </span>
                <span className="speech-status-tag">Current Feeling</span>
              </div>
              <p className="speech-quote">“{activeDialogue}”</p>
            </div>
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
            <span className="meter-value-badge">{vitalityScore}%</span>
          </div>
          <div className="meter-track" role="progressbar" aria-valuenow={vitalityScore} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="meter-fill fill-vitality"
              style={{ width: `${Math.max(6, Math.min(100, vitalityScore))}%` }}
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
            <span className="meter-value-badge">{happinessScore}%</span>
          </div>
          <div className="meter-track" role="progressbar" aria-valuenow={happinessScore} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="meter-fill fill-happiness"
              style={{ width: `${Math.max(6, Math.min(100, happinessScore))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Squirrel Condition Dimensions Sub-grid if present */}
      {isSquirrel && (
        <div className="companion-subdimension-section">
          <div className="subdimension-title">🌰 Winter Preparedness Breakdown</div>
          <div className="subdimension-grid">
            <div className="subdimension-card">
              <div className="subdimension-label"><span>🌰 Food Stock</span><strong>{characterState.foodSupply ?? 50}%</strong></div>
              <div className="subdimension-bar"><div className="subdimension-fill fill-squirrel-food" style={{ width: `${Math.max(6, characterState.foodSupply ?? 50)}%` }} /></div>
            </div>
            <div className="subdimension-card">
              <div className="subdimension-label"><span>💰 Acorn Savings</span><strong>{characterState.savingsReserve ?? 40}%</strong></div>
              <div className="subdimension-bar"><div className="subdimension-fill fill-squirrel-savings" style={{ width: `${Math.max(6, characterState.savingsReserve ?? 40)}%` }} /></div>
            </div>
            <div className="subdimension-card">
              <div className="subdimension-label"><span>🏡 Shelter Readiness</span><strong>{characterState.shelterReadiness ?? 35}%</strong></div>
              <div className="subdimension-bar"><div className="subdimension-fill fill-squirrel-shelter" style={{ width: `${Math.max(6, characterState.shelterReadiness ?? 35)}%` }} /></div>
            </div>
            <div className="subdimension-card">
              <div className="subdimension-label"><span>🛡️ Winter Resilience</span><strong>{characterState.winterPreparedness ?? 45}%</strong></div>
              <div className="subdimension-bar"><div className="subdimension-fill fill-squirrel-resilience" style={{ width: `${Math.max(6, characterState.winterPreparedness ?? 45)}%` }} /></div>
            </div>
          </div>
        </div>
      )}

      {/* Panda Condition Dimensions Sub-grid if present */}
      {isPanda && (
        <div className="companion-subdimension-section">
          <div className="subdimension-title">🎪 School Fair Stewardship Breakdown</div>
          <div className="subdimension-grid">
            <div className="subdimension-card">
              <div className="subdimension-label"><span>📊 Budget Health</span><strong>{characterState.budgetHealth ?? 60}%</strong></div>
              <div className="subdimension-bar"><div className="subdimension-fill fill-panda-budget" style={{ width: `${Math.max(6, characterState.budgetHealth ?? 60)}%` }} /></div>
            </div>
            <div className="subdimension-card">
              <div className="subdimension-label"><span>🎪 Fair Staging</span><strong>{characterState.fairReadiness ?? 30}%</strong></div>
              <div className="subdimension-bar"><div className="subdimension-fill fill-panda-staging" style={{ width: `${Math.max(6, characterState.fairReadiness ?? 30)}%` }} /></div>
            </div>
            <div className="subdimension-card">
              <div className="subdimension-label"><span>📚 Charity Progress</span><strong>{characterState.charityGoalProgress ?? 0}%</strong></div>
              <div className="subdimension-bar"><div className="subdimension-fill fill-panda-charity" style={{ width: `${Math.max(6, characterState.charityGoalProgress ?? 0)}%` }} /></div>
            </div>
            <div className="subdimension-card">
              <div className="subdimension-label"><span>🤝 Vendor Trust</span><strong>{characterState.vendorRelationships ?? 50}%</strong></div>
              <div className="subdimension-bar"><div className="subdimension-fill fill-panda-vendor" style={{ width: `${Math.max(6, characterState.vendorRelationships ?? 50)}%` }} /></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
