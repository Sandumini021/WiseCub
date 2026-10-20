import React, { useState } from 'react';
import { MissionDefinition } from '../../types/mission.types';
import { MissionProgress } from '../../types/progress.types';
import { PuppyCharacterSvg } from '../character/PuppyCharacterSvg';

interface MissionHubViewProps {
  catalog: MissionDefinition[];
  activeMissionId: string;
  puppyProgress: MissionProgress;
  onSelectMission: (missionId: string) => void;
  onOpenAnalytics: () => void;
}

export const MissionHubView: React.FC<MissionHubViewProps> = ({
  catalog,
  activeMissionId: _activeMissionId,
  puppyProgress,
  onSelectMission,
  onOpenAnalytics,
}) => {
  const [previewMission, setPreviewMission] = useState<MissionDefinition | null>(null);

  return (
    <div className="mission-hub-container">
      {/* Hero Banner */}
      <div className="mission-hub-hero">
        <div className="hero-text-content">
          <span className="hero-eyebrow">WiseCub · Competency-Driven Emotional Mission Framework</span>
          <h1 className="hero-title">Financial Story Missions</h1>
          <p className="hero-subtitle">
            Step into emotional financial adventures where your budgeting, saving, and prioritization
            decisions shape your animal companion’s condition and recovery in real-time.
          </p>
        </div>
        <div className="hero-actions">
          <button type="button" className="btn-analytics-pill" onClick={onOpenAnalytics}>
            📊 Research & Analytics
          </button>
        </div>
      </div>

      {/* Flagship Active Mission Card (Featured) */}
      <div className="featured-mission-section">
        <div className="featured-badge-pill">⭐ Flagship Research Mission · Active Prototype</div>
        <div className="featured-mission-card">
          <div className="featured-visual-col">
            <PuppyCharacterSvg
              condition={puppyProgress.characterState.physicalCondition}
              emotion={puppyProgress.characterState.emotionalState}
              size={150}
            />
            <div className="featured-character-status">
              <strong>{puppyProgress.characterState.name}</strong>
              <span className="status-tag">
                {puppyProgress.characterState.physicalCondition.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="featured-info-col">
            <div className="featured-meta-row">
              <span className="meta-competency">🎯 Primary Focus: Budgeting & Saving</span>
              <span className="meta-levels">8 Progressive Levels</span>
            </div>
            <h2 className="featured-title">Rescue the Injured Puppy</h2>
            <p className="featured-desc">
              Manage virtual funds to rescue Barnaby from a park bench, plan his weekly veterinary budget,
              save for an orthopedic splint, handle midnight fever emergencies, and navigate difficult
              trade-offs until he is fully healed.
            </p>

            <div className="featured-progress-bar-row">
              <div className="prog-label">
                <span>Progress: Level {puppyProgress.unlockedLevelNumber} of 8</span>
                <span>{Math.round((puppyProgress.completedLevelNumbers.length / 8) * 100)}% Complete</span>
              </div>
              <div className="prog-track">
                <div
                  className="prog-fill"
                  style={{
                    width: `${(puppyProgress.completedLevelNumbers.length / 8) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="featured-actions-row">
              <button
                type="button"
                className="btn-confirm-decision btn-play-flagship"
                onClick={() => onSelectMission('mission_rescue_puppy')}
              >
                {puppyProgress.completedLevelNumbers.length > 0 ? '▶ Continue Puppy Mission' : '🐾 Start Puppy Mission'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Remaining Missions Catalog Grid */}
      <div className="catalog-section">
        <h3 className="catalog-heading">Upcoming Storybook Financial Missions</h3>
        <p className="catalog-subheading">
          Explore the modular financial curriculum across saving, spending discipline, business finance, and risk:
        </p>

        <div className="missions-storybook-grid">
          {catalog
            .filter((m) => m.id !== 'mission_rescue_puppy')
            .map((mission) => {
              const isSquirrel = mission.id === 'mission_squirrel_savings';
              return (
                <div
                  key={mission.id}
                  className={`storybook-mission-card ${isSquirrel ? 'playable-mission-card' : ''}`}
                  onClick={() => setPreviewMission(mission)}
                  role="button"
                  tabIndex={0}
                  style={isSquirrel ? { border: '2px solid #f59e0b', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.15)' } : undefined}
                >
                  <div className="card-top-accent" style={{ backgroundColor: mission.themeColor }} />
                  <div className="card-inner-padding">
                    <div className="card-character-row">
                      <span className="character-avatar-icon">
                        {mission.id.includes('squirrel') ? '🐿️' :
                         mission.id.includes('panda') ? '🐼' :
                         mission.id.includes('turtle') ? '🐢' :
                         mission.id.includes('fox') ? '🦊' : '🐻'}
                      </span>
                      <div className="character-labels">
                        <span className="char-name">{mission.characterName}</span>
                        <span className="char-role">{mission.characterRole}</span>
                      </div>
                      {isSquirrel && (
                        <span
                          style={{
                            marginLeft: 'auto',
                            background: '#fef3c7',
                            color: '#92400e',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '999px',
                            border: '1px solid #fde68a',
                          }}
                        >
                          ✨ Ready to Play
                        </span>
                      )}
                    </div>

                    <h4 className="mission-card-title">{mission.title}</h4>
                    <p className="mission-card-desc">{mission.description}</p>

                    <div className="mission-card-footer">
                      <span className="footer-levels">{mission.totalLevels} Story Levels</span>
                      {isSquirrel ? (
                        <button
                          type="button"
                          className="btn-confirm-decision"
                          style={{
                            padding: '0.35rem 0.8rem',
                            fontSize: '0.85rem',
                            background: 'linear-gradient(135deg, #d97706, #b45309)',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectMission(mission.id);
                          }}
                        >
                          🐿️ Play Now ➔
                        </button>
                      ) : (
                        <span className="btn-preview-link">Inspect Story ➔</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Mission Preview Modal */}
      {previewMission && (
        <div className="analytics-modal-backdrop" onClick={() => setPreviewMission(null)}>
          <div className="analytics-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="analytics-header">
              <div>
                <span className="modal-category-tag">Story Mission Preview</span>
                <h2 className="analytics-title">{previewMission.title}</h2>
              </div>
              <button type="button" className="btn-close-modal" onClick={() => setPreviewMission(null)}>
                ✕
              </button>
            </div>

            <div className="preview-body">
              <p><strong>Companion Character:</strong> {previewMission.characterName} ({previewMission.characterSpecies})</p>
              <p><strong>Role:</strong> {previewMission.characterRole}</p>
              <p><strong>Target Competency:</strong> {previewMission.primaryCompetency}</p>
              <p><strong>Secondary Competencies:</strong> {previewMission.secondaryCompetencies.join(', ')}</p>
              <p><strong>Story Synopsis:</strong> {previewMission.description}</p>
              <div className="prototype-slice-notice">
                {previewMission.id === 'mission_squirrel_savings' ? (
                  <span>
                    🐿️ <strong>Fully Playable Story Mission:</strong> Squirrel's Winter Savings features
                    6 fully playable competency-driven levels with Nutty's winter survival simulations,
                    emotional state transitions, and individualized remediation.
                  </span>
                ) : (
                  <span>
                    ℹ️ <strong>Research Increment Note:</strong> In this increment, the complete 8-level
                    vertical slice for <strong>Rescue the Injured Puppy</strong> is fully implemented with
                    decision tracking, dynamic character state machine, competency evaluation, and strict gates.
                  </span>
                )}
              </div>
            </div>

            <div className="analytics-footer">
              {previewMission.id === 'mission_squirrel_savings' ? (
                <button
                  type="button"
                  className="btn-confirm-decision"
                  style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}
                  onClick={() => {
                    const id = previewMission.id;
                    setPreviewMission(null);
                    onSelectMission(id);
                  }}
                >
                  ▶ Play Squirrel's Winter Savings (6 Levels)
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-confirm-decision"
                  onClick={() => {
                    setPreviewMission(null);
                    onSelectMission('mission_rescue_puppy');
                  }}
                >
                  Play Active Flagship (Puppy Rescue)
                </button>
              )}
              <button
                type="button"
                className="btn-secondary-action"
                onClick={() => setPreviewMission(null)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
