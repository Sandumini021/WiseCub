import React from 'react';
import {
  CharacterTransition,
  CharacterPhysicalCondition,
  CharacterEmotionalState,
} from '../../types/emotion.types';
import { PuppyCharacterSvg } from '../character/PuppyCharacterSvg';
import { SquirrelCharacterSvg } from '../character/SquirrelCharacterSvg';
import { PandaCharacterSvg } from '../character/PandaCharacterSvg';

interface CharacterTransitionPanelProps {
  transition: CharacterTransition;
  onContinue: () => void;
  characterName?: string;
}

export const CharacterTransitionPanel: React.FC<CharacterTransitionPanelProps> = ({
  transition,
  onContinue,
  characterName,
}) => {
  const isImprovement = transition.direction === 'IMPROVEMENT';
  const isSetback = transition.direction === 'SETBACK';

  const isPanda =
    characterName?.toLowerCase().includes('bao') ||
    characterName?.toLowerCase().includes('panda') ||
    transition.characterDialogue.toLowerCase().includes('fair') ||
    transition.characterDialogue.toLowerCase().includes('stall') ||
    transition.characterDialogue.toLowerCase().includes('library') ||
    transition.characterDialogue.toLowerCase().includes('treasurer');

  const isSquirrel =
    !isPanda &&
    (characterName?.toLowerCase().includes('nutty') ||
      transition.characterDialogue.toLowerCase().includes('nutty') ||
      transition.characterDialogue.toLowerCase().includes('winter') ||
      transition.characterDialogue.toLowerCase().includes('acorn') ||
      transition.newCondition.includes('SHELTER') ||
      transition.newCondition.includes('WINTER') ||
      transition.newCondition.includes('STOCKS'));

  const displayName = isPanda
    ? 'Bao Bao the Panda'
    : isSquirrel
    ? 'Nutty the Squirrel'
    : 'Barnaby the Puppy';
  const avatarEmoji = isPanda ? '🐼' : isSquirrel ? '🐿️' : '🐶';

  // Condition labels
  const conditionLabelMap: Record<string, string> = {
    NEEDS_CARE: isPanda ? 'Safety Unfunded' : 'Needs Care (Injured)',
    WEAK_STABILIZED: isPanda ? 'Stalls Staged & Ready' : 'Stabilized & Resting',
    RECEIVING_TREATMENT: isPanda ? 'Wholesale Secured' : 'Receiving Treatment',
    RECOVERING: isPanda ? 'Booths Active & Lively' : 'Rehabilitating & Healing',
    HEALTHY_ACTIVE: isPanda ? 'Charity Triumphant!' : 'Fully Healed & Playful!',
    SETBACK_WAITING: isPanda ? 'Balancing Fair Ledger' : 'Waiting for Supplies',
    SHELTER_UNPREPARED: 'Shelter Unprepared',
    BASIC_STOCKS_FORMED: 'Basic Stocks Ready',
    STORAGE_ORGANIZED: 'Pantry Organized',
    WINTER_RESERVES_ACTIVE: 'Winter Reserves Active',
    WEATHER_IMPACTED: 'Weather Impacted',
    SHELTER_FORTIFIED: 'Shelter Fortified',
    WINTER_READY: 'Winter Prepared & Secure!',
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

  const formatCondition = (cond: CharacterPhysicalCondition) =>
    conditionLabelMap[cond] || cond.replace(/_/g, ' ');

  const formatEmotion = (emo: CharacterEmotionalState) =>
    emotionLabelMap[emo] || { emoji: avatarEmoji, text: emo.replace(/_/g, ' ') };

  const prevEmotionInfo = formatEmotion(transition.previousEmotion);
  const newEmotionInfo = formatEmotion(transition.newEmotion);

  return (
    <div className="character-transition-view" role="region" aria-label="Emotional reaction feedback">
      <div className="transition-header">
        <div className="transition-badge-row">
          <span
            className={`transition-banner-pill ${
              isImprovement ? 'pill-success' : isSetback ? 'pill-setback' : 'pill-stable'
            }`}
          >
            {isImprovement
              ? '✨ Emotional & Condition Improvement!'
              : isSetback
              ? '⚠️ Financial Setback Observed'
              : '⚖️ Condition Maintained & Stable'}
          </span>
        </div>
        <h2 className="transition-title">{displayName} Responds to Your Decision</h2>
        <p className="transition-subtitle">
          In WiseCub, every financial choice immediately influences your companion’s emotional well-being and recovery.
        </p>
      </div>

      {/* Before and After Visual Comparison Stage */}
      <div className="transition-comparison-stage">
        {/* Before Decision */}
        <div className="stage-side stage-before">
          <div className="side-header">
            <span className="side-step-chip">Step 1</span>
            <span className="side-label">Before Decision</span>
          </div>
          <div className="side-avatar-box">
            {isPanda ? (
              <PandaCharacterSvg
                condition={transition.previousCondition}
                emotion={transition.previousEmotion}
                size={130}
              />
            ) : isSquirrel ? (
              <SquirrelCharacterSvg
                condition={transition.previousCondition}
                emotion={transition.previousEmotion}
                size={130}
              />
            ) : (
              <PuppyCharacterSvg
                condition={transition.previousCondition}
                emotion={transition.previousEmotion}
                size={130}
              />
            )}
          </div>
          <div className="side-status-card">
            <div className="side-condition-text">{formatCondition(transition.previousCondition)}</div>
            <div className="side-emotion-text">
              {prevEmotionInfo.emoji} {prevEmotionInfo.text}
            </div>
          </div>
        </div>

        {/* Dynamic Transition Connector */}
        <div className="stage-arrow-col">
          <div
            className={`transition-arrow-circle ${
              isImprovement ? 'arrow-improve' : isSetback ? 'arrow-setback' : 'arrow-stable'
            }`}
            aria-hidden="true"
          >
            ➔
          </div>
          <span className="arrow-caption">
            {isImprovement ? 'Growth' : isSetback ? 'Impact' : 'Steady'}
          </span>
        </div>

        {/* After Decision */}
        <div
          className={`stage-side stage-after ${
            isImprovement
              ? 'side-glow-success'
              : isSetback
              ? 'side-glow-setback'
              : 'side-glow-stable'
          }`}
        >
          <div className="side-header">
            <span className="side-step-chip chip-highlight">Step 2</span>
            <span className="side-label">Resulting State</span>
          </div>
          <div className="side-avatar-box">
            {isPanda ? (
              <PandaCharacterSvg
                condition={transition.newCondition}
                emotion={transition.newEmotion}
                size={140}
              />
            ) : isSquirrel ? (
              <SquirrelCharacterSvg
                condition={transition.newCondition}
                emotion={transition.newEmotion}
                size={140}
              />
            ) : (
              <PuppyCharacterSvg
                condition={transition.newCondition}
                emotion={transition.newEmotion}
                size={140}
              />
            )}
          </div>
          <div className="side-status-card side-status-active">
            <div className="side-condition-text">
              <strong>{formatCondition(transition.newCondition)}</strong>
            </div>
            <div className="side-emotion-text">
              {newEmotionInfo.emoji} <strong>{newEmotionInfo.text}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Character Speech Bubble */}
      <div className="transition-dialogue-card">
        <div className="dialogue-avatar-mini" aria-hidden="true">{avatarEmoji}</div>
        <div className="dialogue-text-body">
          <div className="dialogue-speaker-row">
            <h4 className="dialogue-speaker">{displayName} says:</h4>
            <span className="dialogue-tag">{newEmotionInfo.emoji} Emotional Reaction</span>
          </div>
          <p className="dialogue-quote">“{transition.characterDialogue}”</p>
        </div>
      </div>

      {/* Cause & Effect Explanation Card */}
      <div className="transition-explanation-card">
        <div className="explanation-section-heading">
          <span className="heading-icon">🔍</span>
          <h4>Financial Cause & Effect</h4>
        </div>
        <p className="explanation-text">{transition.learningExplanation}</p>

        <div className="transition-reason-detail">
          <span className="detail-icon">💡</span>
          <div className="detail-content">
            <strong>Decision Impact:</strong> {transition.reason}
          </div>
        </div>
      </div>

      <div className="transition-action-row">
        <button
          type="button"
          className="btn-confirm-decision btn-view-competency"
          onClick={onContinue}
        >
          View Detailed Competency Evaluation ➔
        </button>
      </div>
    </div>
  );
};
