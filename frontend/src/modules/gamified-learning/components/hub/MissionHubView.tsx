import React, { useState } from 'react';
import { MissionDefinition } from '../../types/mission.types';
import { MissionProgress } from '../../types/progress.types';
import { PuppyCharacterSvg } from '../character/PuppyCharacterSvg';
import { SquirrelCharacterSvg } from '../character/SquirrelCharacterSvg';
import { PandaCharacterSvg } from '../character/PandaCharacterSvg';

interface MissionHubViewProps {
  catalog: MissionDefinition[];
  activeMissionId: string;
  puppyProgress: MissionProgress;
  onSelectMission: (missionId: string) => void;
  onOpenAnalytics: () => void;
  onOpenJourney?: () => void;
}

export const MissionHubView: React.FC<MissionHubViewProps> = ({
  catalog,
  activeMissionId,
  puppyProgress,
  onSelectMission,
  onOpenAnalytics,
  onOpenJourney,
}) => {
  const [previewMission, setPreviewMission] = useState<MissionDefinition | null>(null);

  const playableMissionIds = ['mission_rescue_puppy', 'mission_squirrel_savings', 'mission_panda_fair'];
  const upcomingMissions = catalog.filter((m) => !playableMissionIds.includes(m.id));

  const isPuppyActive = activeMissionId === 'mission_rescue_puppy' || !activeMissionId;
  const currentCompletedCount = puppyProgress?.completedLevelNumbers?.length || 0;
  const currentUnlockedLvl = puppyProgress?.unlockedLevelNumber || 1;
  const isPuppyFullyCompleted = currentCompletedCount >= 8 || currentUnlockedLvl > 8;
  const puppyProgressLabel = isPuppyActive
    ? (isPuppyFullyCompleted
        ? '8 of 8 levels completed'
        : `Level ${Math.min(currentUnlockedLvl, 8)} of 8`)
    : '8 Levels Available';

  return (
    <div className="mission-hub-container">
      {/* ── 1. WELCOME HERO SECTION ── */}
      <section className="hub-hero-banner" aria-label="Welcome and Learning Framework Overview">
        <div className="hub-hero-badge-row">
          <span className="hub-framework-badge">
            <span className="badge-sparkle">✦</span> Story-Based Financial Learning
          </span>
          <span className="hub-audience-pill">Ages 12–16 Financial Adventures</span>
        </div>

        <div className="hub-hero-content-grid">
          <div className="hub-hero-text">
            <h1 className="hub-hero-title">
              Master Real-World Money Skills <br />
              <span className="hub-hero-highlight">Through Interactive Adventures</span>
            </h1>
            <p className="hub-hero-description">
              Every financial choice you make has real consequences. Allocate budgets, resist impulse temptations,
              and build emergency reserves to protect your animal companions and fund community projects.
            </p>

            {/* Visual CDEMF 4-Step Learning Loop */}
            <div className="cdemf-loop-container" aria-label="Learning cycle steps">
              <span className="cdemf-loop-label">HOW YOU LEARN:</span>
              <div className="cdemf-loop-steps">
                <div className="cdemf-step">
                  <div className="cdemf-step-icon">🎯</div>
                  <div className="cdemf-step-text">
                    <strong>1. Decision</strong>
                    <span>Budget & Spend</span>
                  </div>
                </div>
                <div className="cdemf-step-arrow">➔</div>
                <div className="cdemf-step">
                  <div className="cdemf-step-icon">🐾</div>
                  <div className="cdemf-step-text">
                    <strong>2. Reaction</strong>
                    <span>Companion Reacts</span>
                  </div>
                </div>
                <div className="cdemf-step-arrow">➔</div>
                <div className="cdemf-step">
                  <div className="cdemf-step-icon">📊</div>
                  <div className="cdemf-step-text">
                    <strong>3. Competency Growth</strong>
                    <span>Skills Tracked</span>
                  </div>
                </div>
                <div className="cdemf-step-arrow">➔</div>
                <div className="cdemf-step">
                  <div className="cdemf-step-icon">🚀</div>
                  <div className="cdemf-step-text">
                    <strong>4. Practice</strong>
                    <span>Personalized Next Step</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hub-hero-actions-card">
            <div className="hero-action-header">
              <span className="hero-action-label">YOUR FINANCIAL ADVENTURE</span>
              <h3 className="hero-action-heading">Ready to Dive In?</h3>
            </div>
            <p className="hero-action-subtext">
              Track your longitudinal competencies or continue directly from your current frontier level.
            </p>
            <div className="hero-action-buttons">
              {onOpenJourney && (
                <button
                  type="button"
                  className="btn-hub-primary"
                  onClick={onOpenJourney}
                  aria-label="Open My Money Journey Dashboard"
                >
                  <span className="btn-icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                      <polyline points="16 7 22 7 22 13" />
                    </svg>
                  </span>
                  <span className="btn-label-group">
                    <strong>My Money Journey</strong>
                    <small>Analytics & ML Recommendations</small>
                  </span>
                  <span className="btn-chevron">➔</span>
                </button>
              )}
              <button
                type="button"
                className="btn-hub-secondary"
                onClick={onOpenAnalytics}
                aria-label="Open Research Diagnostics"
              >
                <span className="btn-icon">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </span>
                <span>Research Analytics & Data Export</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. THREE FLAGSHIP STORY MISSIONS (EQUAL PROMINENCE) ── */}
      <section className="hub-missions-section" aria-label="Available Story Missions">
        <div className="section-header-row">
          <div>
            <span className="section-eyebrow">Interactive Financial Missions</span>
            <h2 className="section-title">Choose Your Story Adventure</h2>
          </div>
          <div className="section-tag-group">
            <span className="curriculum-tag">3 Playable Campaigns</span>
            <span className="curriculum-tag">20 Mastery Levels</span>
          </div>
        </div>

        <div className="tri-mission-grid">
          {/* MISSION 1: RESCUE THE INJURED PUPPY */}
          <article className="adventure-card mission-puppy" aria-label="Rescue the Injured Puppy mission card">
            <div className="card-banner-accent banner-puppy" />
            <div className="adventure-card-body">
              <div className="adventure-character-header">
                <div className="character-avatar-stage stage-puppy">
                  <PuppyCharacterSvg
                    condition={isPuppyActive ? puppyProgress?.characterState?.physicalCondition || 'NEEDS_CARE' : 'HEALTHY_ACTIVE'}
                    emotion={isPuppyActive ? puppyProgress?.characterState?.emotionalState || 'SAD_ANXIOUS' : 'JOYFUL_HEALTHY'}
                    size={110}
                  />
                </div>
                <div className="character-meta-info">
                  <span className="competency-badge badge-blue">🎯 Budgeting & Emergency Reserve</span>
                  <h3 className="mission-title">Rescue the Injured Puppy</h3>
                  <div className="companion-tag">
                    <span className="companion-name">Barnaby</span>
                    <span className="companion-status status-healthy">8 Chapter Arc</span>
                  </div>
                </div>
              </div>

              <p className="mission-synopsis">
                Barnaby is shivering on a cold park bench. Manage weekly virtual funds, allocate medical treatment,
                prioritize vet visits, and maintain emergency buffers until he is safely rehabilitated.
              </p>

              <div className="mission-learning-focus">
                <strong>Core Skills:</strong> Needs Prioritization • Reserve Allocation • Emergency Planning
              </div>

              <div className="mission-progress-display">
                <div className="progress-labels">
                  <span>{puppyProgressLabel}</span>
                  <span className="percent-indicator">
                    {isPuppyActive
                      ? (isPuppyFullyCompleted ? '100% Mastered' : `${Math.round((currentCompletedCount / 8) * 100)}% Mastered`)
                      : 'Ready to Play'}
                  </span>
                </div>
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill fill-puppy"
                    style={{ width: isPuppyActive ? `${Math.max(12, Math.min(100, (currentCompletedCount / 8) * 100))}%` : '100%' }}
                  />
                </div>
              </div>

              <div className="adventure-card-footer">
                <button
                  type="button"
                  className="btn-play-mission btn-puppy"
                  onClick={() => onSelectMission('mission_rescue_puppy')}
                >
                  <span>
                    {isPuppyActive && currentCompletedCount > 0
                      ? (isPuppyFullyCompleted ? '🐾 Review Puppy Mission' : '▶ Continue Puppy Rescue')
                      : '🐾 Start Puppy Mission'}
                  </span>
                  <span className="footer-arrow">➔</span>
                </button>
              </div>
            </div>
          </article>

          {/* MISSION 2: SQUIRREL'S WINTER SAVINGS */}
          <article className="adventure-card mission-squirrel" aria-label="Squirrel's Winter Savings mission card">
            <div className="card-banner-accent banner-squirrel" />
            <div className="adventure-card-body">
              <div className="adventure-character-header">
                <div className="character-avatar-stage stage-squirrel">
                  <SquirrelCharacterSvg
                    condition="HEALTHY_ACTIVE"
                    emotion="JOYFUL_HEALTHY"
                    size={110}
                  />
                </div>
                <div className="character-meta-info">
                  <span className="competency-badge badge-amber">🐿️ Savings Goals & Needs vs. Wants</span>
                  <h3 className="mission-title">Squirrel's Winter Savings</h3>
                  <div className="companion-tag">
                    <span className="companion-name">Nutty</span>
                    <span className="companion-status status-amber">6 Chapter Arc</span>
                  </div>
                </div>
              </div>

              <p className="mission-synopsis">
                Frost is coming to Oak Forest! Help Nutty separate essential survival acorns from luxury woodland snacks,
                set up a multi-period weather savings plan, and survive severe blizzard shocks.
              </p>

              <div className="mission-learning-focus">
                <strong>Core Skills:</strong> Needs vs. Wants • Multi-Period Savings • Winter Preparedness
              </div>

              <div className="mission-progress-display">
                <div className="progress-labels">
                  <span>6 Progressive Levels</span>
                  <span className="percent-indicator">Fully Playable</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill fill-squirrel" style={{ width: '100%' }} />
                </div>
              </div>

              <div className="adventure-card-footer">
                <button
                  type="button"
                  className="btn-play-mission btn-squirrel"
                  onClick={() => onSelectMission('mission_squirrel_savings')}
                >
                  <span>Play Squirrel Mission</span>
                  <span className="footer-arrow">➔</span>
                </button>
              </div>
            </div>
          </article>

          {/* MISSION 3: PANDA'S SCHOOL FAIR */}
          <article className="adventure-card mission-panda" aria-label="Panda's School Fair mission card">
            <div className="card-banner-accent banner-panda" />
            <div className="adventure-card-body">
              <div className="adventure-character-header">
                <div className="character-avatar-stage stage-panda">
                  <PandaCharacterSvg
                    condition="HEALTHY_ACTIVE"
                    emotion="JOYFUL_HEALTHY"
                    size={110}
                  />
                </div>
                <div className="character-meta-info">
                  <span className="competency-badge badge-teal">🐼 Smart Spending & Pricing Tradeoffs</span>
                  <h3 className="mission-title">Panda's School Fair</h3>
                  <div className="companion-tag">
                    <span className="companion-name">Bao Bao</span>
                    <span className="companion-status status-teal">6 Chapter Arc</span>
                  </div>
                </div>
              </div>

              <p className="mission-synopsis">
                Bao Bao is treasurer for the charity fair! Compare wholesale ingredient vendors, negotiate supply tradeoffs,
                respond to sudden fair-day supply surges, and price snacks to fund the Community Library.
              </p>

              <div className="mission-learning-focus">
                <strong>Core Skills:</strong> Vendor Comparison • Pricing Strategy • Ethical Tradeoffs
              </div>

              <div className="mission-progress-display">
                <div className="progress-labels">
                  <span>6 Progressive Levels</span>
                  <span className="percent-indicator">Fully Playable</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill fill-panda" style={{ width: '100%' }} />
                </div>
              </div>

              <div className="adventure-card-footer">
                <button
                  type="button"
                  className="btn-play-mission btn-panda"
                  onClick={() => onSelectMission('mission_panda_fair')}
                >
                  <span>Play Panda Mission</span>
                  <span className="footer-arrow">➔</span>
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* ── 3. CURRICULUM ROADMAP (FUTURE EXPANSION) ── */}
      {upcomingMissions.length > 0 && (
        <section className="hub-roadmap-section" aria-label="Future Research Missions">
          <div className="section-header-compact">
            <h3 className="roadmap-title">Curriculum Expansion Roadmap</h3>
            <p className="roadmap-sub">Additional CDEMF learning scenarios planned for the modular financial framework:</p>
          </div>

          <div className="roadmap-cards-grid">
            {upcomingMissions.map((m) => (
              <div
                key={m.id}
                className="roadmap-card"
                onClick={() => setPreviewMission(m)}
                role="button"
                tabIndex={0}
                aria-label={`Preview future mission: ${m.title}`}
              >
                <div className="roadmap-icon">
                  {m.id.includes('turtle') ? '🐢' : m.id.includes('fox') ? '🦊' : '🐻'}
                </div>
                <div className="roadmap-details">
                  <span className="roadmap-tag">Planned Module</span>
                  <h4 className="roadmap-name">{m.title}</h4>
                  <p className="roadmap-character">
                    {m.characterName} the {m.characterSpecies} • <em>{m.primaryCompetency}</em>
                  </p>
                </div>
                <span className="roadmap-preview-action">Preview ➔</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 4. MISSION PREVIEW MODAL ── */}
      {previewMission && (
        <div className="analytics-modal-backdrop" onClick={() => setPreviewMission(null)}>
          <div className="analytics-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="analytics-header">
              <div>
                <span className="modal-category-tag">Story Mission Preview</span>
                <h2 className="analytics-title">{previewMission.title}</h2>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setPreviewMission(null)}
                aria-label="Close Preview"
              >
                ✕
              </button>
            </div>

            <div className="preview-body">
              <p><strong>Companion Character:</strong> {previewMission.characterName} ({previewMission.characterSpecies})</p>
              <p><strong>Role:</strong> {previewMission.characterRole}</p>
              <p><strong>Primary Competency:</strong> {previewMission.primaryCompetency}</p>
              <p><strong>Secondary Competencies:</strong> {previewMission.secondaryCompetencies?.join(', ') || 'None'}</p>
              <p><strong>Story Synopsis:</strong> {previewMission.description}</p>
              <div className="prototype-slice-notice">
                <span>
                  ℹ️ <strong>Curriculum Roadmap Note:</strong> This scenario is defined in the WiseCub
                  CDEMF competency architecture. In this current build, <strong>Rescue the Injured Puppy (8 Levels)</strong>,{' '}
                  <strong>Squirrel's Winter Savings (6 Levels)</strong>, and <strong>Panda's School Fair (6 Levels)</strong>{' '}
                  are the fully playable active campaigns.
                </span>
              </div>
            </div>

            <div className="analytics-footer">
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
