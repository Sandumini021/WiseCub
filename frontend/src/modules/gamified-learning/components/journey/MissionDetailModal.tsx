import React, { useEffect, useState } from 'react';
import { getJourneyMissionDetail } from '../../services/gamifiedApi';
import { JourneyMissionDetail } from '../../types/journey.types';
import { CharacterEmotionalState, CharacterPhysicalCondition } from '../../types/emotion.types';
import { PuppyCharacterSvg } from '../character/PuppyCharacterSvg';
import { SquirrelCharacterSvg } from '../character/SquirrelCharacterSvg';
import { PandaCharacterSvg } from '../character/PandaCharacterSvg';

interface MissionDetailModalProps {
  missionId: string;
  onClose: () => void;
  onPlayLevel: (missionId: string, levelNumber: number) => void;
}

export const MissionDetailModal: React.FC<MissionDetailModalProps> = ({
  missionId,
  onClose,
  onPlayLevel,
}) => {
  const [detail, setDetail] = useState<JourneyMissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getJourneyMissionDetail(missionId)
      .then((data) => {
        if (active) {
          setDetail(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          console.error('Failed to load mission detail:', err);
          setError('Unable to load mission breakdown. Please try again.');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [missionId]);

  const renderCharacterSvg = (size: number = 90) => {
    if (!detail) return null;
    const cond = (detail.characterState.physical_condition || 'NEEDS_CARE') as CharacterPhysicalCondition;
    const emo = (detail.characterState.emotional_state || 'WORRIED') as CharacterEmotionalState;

    if (missionId === 'mission_squirrel_savings') {
      return <SquirrelCharacterSvg condition={cond} emotion={emo} size={size} />;
    }
    if (missionId === 'mission_panda_fair') {
      return <PandaCharacterSvg condition={cond} emotion={emo} size={size} />;
    }
    return <PuppyCharacterSvg condition={cond} emotion={emo} size={size} />;
  };

  return (
    <div className="journey-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="journey-modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="journey-modal-header" style={{ borderTop: `4px solid ${detail?.themeColor || '#0a4d42'}` }}>
          <div className="modal-title-row">
            <div className="character-avatar-bubble">
              {renderCharacterSvg(80)}
            </div>
            <div className="modal-title-text">
              <span className="modal-eyebrow">Mission Deep Dive · {detail?.focusSkill || 'Financial Story'}</span>
              <h2 className="modal-heading">{detail?.title || 'Mission Details'}</h2>
              <p className="modal-sub">
                Partner: <strong>{detail?.characterName}</strong> ({detail?.characterRole})
              </p>
            </div>
            <button type="button" className="btn-modal-close" onClick={onClose} aria-label="Close dialog">
              ✕
            </button>
          </div>

          {detail && (
            <div className="modal-progress-bar-row">
              <div className="progress-labels">
                <span>Progress: {detail.completedLevelsCount} of {detail.totalLevels} Levels Completed</span>
                <span>{detail.progressPercent}% Mastered</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${detail.progressPercent}%`, backgroundColor: detail.themeColor }}
                />
              </div>
            </div>
          )}
        </header>

        <div className="journey-modal-body">
          {loading && (
            <div className="modal-loading-state">
              <span className="spinner-dot" />
              <p>Retrieving server progression and attempt history...</p>
            </div>
          )}

          {error && (
            <div className="modal-error-box">
              <p>⚠️ {error}</p>
              <button type="button" className="btn-primary-sm" onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          )}

          {detail && !loading && (
            <>
              {/* SECTION 1: Level Progression Map */}
              <section className="modal-section">
                <h3 className="section-title">
                  <span className="section-icon">🗺️</span> Level-by-Level Story Progression
                </h3>
                <div className="levels-grid">
                  {detail.levels.map((lvl) => {
                    const isCompleted = lvl.status === 'COMPLETED';
                    const isCurrent = lvl.status === 'CURRENT';
                    const isLocked = lvl.status === 'LOCKED';

                    return (
                      <div
                        key={lvl.levelId}
                        className={`level-card status-${lvl.status.toLowerCase()}`}
                      >
                        <div className="level-badge-col">
                          <span className="level-num">L{lvl.levelNumber}</span>
                          <span className={`status-pill pill-${lvl.status.toLowerCase()}`}>
                            {isCompleted ? '✓ Passed' : isCurrent ? '▶ Active' : '🔒 Locked'}
                          </span>
                        </div>

                        <div className="level-info-col">
                          <h4 className="level-name">{lvl.title}</h4>
                          <span className="level-competency">Focus: {lvl.focusDimension.replace('_', ' ')}</span>
                          <div className="level-metrics">
                            {lvl.bestScore !== null && (
                              <span className="metric-score">Best Score: <strong>{lvl.bestScore}/100</strong></span>
                            )}
                            {lvl.attemptsCount > 0 && (
                              <span className="metric-attempts">Attempts: {lvl.attemptsCount}</span>
                            )}
                          </div>
                        </div>

                        <div className="level-action-col">
                          {!isLocked ? (
                            <button
                              type="button"
                              className={`btn-play-level ${isCurrent ? 'btn-active-highlight' : 'btn-replay'}`}
                              onClick={() => {
                                onClose();
                                onPlayLevel(detail.missionId, lvl.levelNumber);
                              }}
                            >
                              {isCurrent ? '▶ Play Now' : 'Replay'}
                            </button>
                          ) : (
                            <span className="locked-hint">Complete previous levels to unlock</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* SECTION 2: Character Emotional Journey History */}
              <section className="modal-section">
                <h3 className="section-title">
                  <span className="section-icon">❤️</span> Companion Emotional Trajectory (CDEMF)
                </h3>
                {detail.characterHistory.length === 0 ? (
                  <p className="empty-history-text">
                    No decisions recorded yet. Start playing this mission to see {detail.characterName}&apos;s condition respond to your choices!
                  </p>
                ) : (
                  <div className="emotional-timeline">
                    {detail.characterHistory.map((item, idx) => (
                      <div key={idx} className="timeline-node">
                        <div className="timeline-dot" />
                        <div className="timeline-content">
                          <div className="timeline-meta">
                            <span className="timeline-level">Level {item.level_number} · Attempt #{item.attempt_number}</span>
                            <span className={`direction-tag dir-${item.transition_direction.toLowerCase()}`}>
                              {item.transition_direction === 'POSITIVE' ? '📈 Recovery' : item.transition_direction === 'NEGATIVE' ? '📉 Setback' : '⚖️ Stable'}
                            </span>
                          </div>
                          <div className="timeline-condition">
                            Condition: <strong>{item.physical_condition.replace('_', ' ')}</strong> · Emotion: <strong>{item.emotional_state.replace('_', ' ')}</strong>
                          </div>
                          {item.transition_reason && (
                            <p className="timeline-reason">&ldquo;{item.transition_reason}&rdquo;</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        <footer className="journey-modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Back to Journey
          </button>
          {detail && detail.levels.some((l) => l.status === 'CURRENT') && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                const currentLvl = detail.levels.find((l) => l.status === 'CURRENT');
                if (currentLvl) {
                  onClose();
                  onPlayLevel(detail.missionId, currentLvl.levelNumber);
                }
              }}
            >
              Continue Playing L{detail.levels.find((l) => l.status === 'CURRENT')?.levelNumber}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};
