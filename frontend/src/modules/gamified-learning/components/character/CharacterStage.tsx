import React from 'react';
import { CharacterState } from '../../types/emotion.types';
import { PuppyCharacterSvg } from './PuppyCharacterSvg';

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

  // Format labels for child-friendly reading
  const conditionLabelMap: Record<string, { label: string; tone: string }> = {
    NEEDS_CARE: { label: 'Needs Care (Injured)', tone: 'badge-urgent' },
    WEAK_STABILIZED: { label: 'Stabilized & Resting', tone: 'badge-warning' },
    RECEIVING_TREATMENT: { label: 'Receiving Treatment', tone: 'badge-info' },
    RECOVERING: { label: 'Rehabilitating & Healing', tone: 'badge-progress' },
    HEALTHY_ACTIVE: { label: 'Fully Healed & Playful!', tone: 'badge-success' },
    SETBACK_WAITING: { label: 'Waiting for Supplies', tone: 'badge-setback' },
  };

  const emotionLabelMap: Record<string, { emoji: string; text: string }> = {
    ANXIOUS: { emoji: '😟', text: 'Anxious' },
    WORRIED: { emoji: '🥺', text: 'Worried' },
    VULNERABLE: { emoji: '🩹', text: 'Vulnerable' },
    HOPEFUL: { emoji: '✨', text: 'Hopeful' },
    RELIEVED: { emoji: '😌', text: 'Relieved' },
    CHEERFUL: { emoji: '🐶', text: 'Cheerful' },
    JOYFUL_HEALTHY: { emoji: '🎉', text: 'Joyful & Healthy!' },
  };

  const conditionInfo = conditionLabelMap[physicalCondition] || {
    label: physicalCondition,
    tone: 'badge-info',
  };
  const emotionInfo = emotionLabelMap[emotionalState] || {
    emoji: '🐾',
    text: emotionalState,
  };

  if (compact) {
    return (
      <div className="character-stage-compact">
        <PuppyCharacterSvg condition={physicalCondition} emotion={emotionalState} size={70} />
        <div className="stage-compact-meta">
          <div className="stage-pills-row">
            <span className={`condition-pill ${conditionInfo.tone}`}>{conditionInfo.label}</span>
            <span className="emotion-pill">
              {emotionInfo.emoji} {emotionInfo.text}
            </span>
          </div>
          <div className="mini-meters">
            <div className="meter-label">Vitality: {vitalityScore}%</div>
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
          <PuppyCharacterSvg
            condition={physicalCondition}
            emotion={emotionalState}
            size={size}
          />
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
            <span className="meter-title">❤️ Vitality & Health</span>
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
            <span className="meter-title">✨ Mood & Happiness</span>
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
    </div>
  );
};
