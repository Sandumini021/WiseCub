import React from 'react';
import { CharacterTransition } from '../../types/emotion.types';
import { PuppyCharacterSvg } from '../character/PuppyCharacterSvg';

interface CharacterTransitionPanelProps {
  transition: CharacterTransition;
  onContinue: () => void;
}

export const CharacterTransitionPanel: React.FC<CharacterTransitionPanelProps> = ({
  transition,
  onContinue,
}) => {
  const isImprovement = transition.direction === 'IMPROVEMENT';
  const isSetback = transition.direction === 'SETBACK';

  return (
    <div className="character-transition-view">
      <div className="transition-header">
        <span className={`transition-banner-pill ${isImprovement ? 'pill-success' : isSetback ? 'pill-setback' : 'pill-stable'}`}>
          {isImprovement
            ? '✨ Emotional & Physical Improvement!'
            : isSetback
            ? '⚠️ Financial Setback Observed'
            : '⚖️ Condition Stable'}
        </span>
        <h2 className="transition-title">Barnaby’s Condition Responds to Your Decision</h2>
      </div>

      {/* Before and After Visual Comparison */}
      <div className="transition-comparison-stage">
        {/* Before */}
        <div className="stage-side stage-before">
          <span className="side-label">Before Decision</span>
          <div className="side-avatar-box">
            <PuppyCharacterSvg
              condition={transition.previousCondition}
              emotion={transition.previousEmotion}
              size={130}
            />
          </div>
          <div className="side-state-tag">
            <span>{transition.previousCondition}</span> · <em>{transition.previousEmotion}</em>
          </div>
        </div>

        {/* Dynamic Arrow */}
        <div className="stage-arrow-col">
          <div className={`transition-arrow-circle ${isImprovement ? 'arrow-improve' : 'arrow-setback'}`}>
            {isImprovement ? '➔' : '➔'}
          </div>
        </div>

        {/* After */}
        <div className={`stage-side stage-after ${isImprovement ? 'side-glow-success' : 'side-glow-setback'}`}>
          <span className="side-label">New Resulting State</span>
          <div className="side-avatar-box">
            <PuppyCharacterSvg
              condition={transition.newCondition}
              emotion={transition.newEmotion}
              size={140}
            />
          </div>
          <div className="side-state-tag">
            <strong>{transition.newCondition}</strong> · <em>{transition.newEmotion}</em>
          </div>
        </div>
      </div>

      {/* Character Speech Bubble */}
      <div className="transition-dialogue-card">
        <div className="dialogue-avatar-mini">🐶</div>
        <div className="dialogue-text-body">
          <h4 className="dialogue-speaker">Barnaby the Puppy says:</h4>
          <p className="dialogue-quote">"{transition.characterDialogue}"</p>
        </div>
      </div>

      {/* Cause & Effect Explanation Card */}
      <div className="transition-explanation-card">
        <h4>🔍 The Financial Cause & Effect:</h4>
        <p className="explanation-text">{transition.learningExplanation}</p>
        <div className="transition-reason-detail">
          <strong>Decision Impact:</strong> {transition.reason}
        </div>
      </div>

      <div className="transition-action-row">
        <button type="button" className="btn-confirm-decision" onClick={onContinue}>
          View Detailed Competency Evaluation ➔
        </button>
      </div>
    </div>
  );
};
