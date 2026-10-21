import React from 'react';
import { LevelDefinition } from '../../types/mission.types';
import { PuppyCharacterSvg } from '../character/PuppyCharacterSvg';
import { SquirrelCharacterSvg } from '../character/SquirrelCharacterSvg';
import { PandaCharacterSvg } from '../character/PandaCharacterSvg';

interface LevelProgressMapProps {
  levels: LevelDefinition[];
  unlockedLevelNumber: number;
  completedLevelNumbers: number[];
  activeLevelNumber: number;
  onSelectLevel: (levelNumber: number) => void;
  onLockedClick?: (level: LevelDefinition) => void;
}

export const LevelProgressMap: React.FC<LevelProgressMapProps> = ({
  levels,
  unlockedLevelNumber,
  completedLevelNumbers,
  activeLevelNumber,
  onSelectLevel,
  onLockedClick,
}) => {
  const firstLevelId = levels[0]?.id || '';
  const safeCompleted = completedLevelNumbers || [];
  const totalLevels = levels.length;
  const completedCount = safeCompleted.filter((n) => levels.some((l) => l.levelNumber === n)).length;
  const isMissionCompleted = totalLevels > 0 && completedCount >= totalLevels;
  const progressPercent = totalLevels > 0 ? Math.min(100, Math.round((completedCount / totalLevels) * 100)) : 0;

  // Resolve mission metadata and character theme dynamically
  let missionMeta = {
    id: 'mission_rescue_puppy',
    title: 'Rescue the Injured Puppy',
    companionName: 'Barnaby',
    characterType: 'puppy' as 'puppy' | 'squirrel' | 'panda' | 'generic',
    themeClass: 'theme-puppy',
    tagline: 'Pass each financial competency test to heal and rehabilitate Barnaby.',
    skills: 'Budgeting • Prioritization • Emergency Reserve',
    accentColor: '#0284c7',
  };

  if (firstLevelId.includes('squirrel')) {
    missionMeta = {
      id: 'mission_squirrel_savings',
      title: "Squirrel's Winter Savings",
      companionName: 'Nutty',
      characterType: 'squirrel',
      themeClass: 'theme-squirrel',
      tagline: 'Balance daily snacks and store acorns to keep Nutty safe through severe winter blizzards.',
      skills: 'Needs vs. Wants • Multi-Period Savings • Shock Resilience',
      accentColor: '#d97706',
    };
  } else if (firstLevelId.includes('panda')) {
    missionMeta = {
      id: 'mission_panda_fair',
      title: "Panda's School Fair",
      companionName: 'Bao Bao',
      characterType: 'panda',
      themeClass: 'theme-panda',
      tagline: 'Compare wholesale suppliers and manage stall margins to support the school library.',
      skills: 'Smart Spending • Vendor Tradeoffs • Ethical Pricing',
      accentColor: '#0f766e',
    };
  }

  // Safe student-facing labels (prevents "Level 9 of 8" artifacts)
  const currentPlayableLevelNumber = Math.min(unlockedLevelNumber, totalLevels || 1);
  const progressLabel = isMissionCompleted
    ? `Mission Completed (${totalLevels} of ${totalLevels} levels mastered)`
    : `${completedCount} of ${totalLevels} levels completed`;

  const currentLevelLabel = isMissionCompleted
    ? 'All Chapters Mastered!'
    : `Current Frontier: Level ${currentPlayableLevelNumber}`;

  return (
    <div className={`level-progress-map-container ${missionMeta.themeClass}`}>
      {/* ── 1. MISSION-SPECIFIC ADVENTURE HEADER ── */}
      <section className="adventure-map-header" aria-label={`${missionMeta.title} Adventure Map Header`}>
        <div className="header-character-col">
          <div className={`character-avatar-bubble bubble-${missionMeta.characterType}`}>
            {missionMeta.characterType === 'puppy' && (
              <PuppyCharacterSvg
                condition={isMissionCompleted ? 'HEALTHY_ACTIVE' : completedCount > 0 ? 'RECOVERING' : 'NEEDS_CARE'}
                emotion={isMissionCompleted ? 'JOYFUL_HEALTHY' : completedCount > 0 ? 'HOPEFUL' : 'ANXIOUS'}
                size={82}
              />
            )}
            {missionMeta.characterType === 'squirrel' && (
              <SquirrelCharacterSvg
                condition="HEALTHY_ACTIVE"
                emotion="JOYFUL_HEALTHY"
                size={82}
              />
            )}
            {missionMeta.characterType === 'panda' && (
              <PandaCharacterSvg
                condition="HEALTHY_ACTIVE"
                emotion="JOYFUL_HEALTHY"
                size={82}
              />
            )}
          </div>
        </div>

        <div className="header-details-col">
          <div className="header-badge-row">
            <span className="mission-chapter-pill">{totalLevels} Chapters</span>
            <span className="mission-companion-pill">Companion: {missionMeta.companionName}</span>
            <span className="mission-skills-pill">{missionMeta.skills}</span>
          </div>
          <h2 className="adventure-map-title">{missionMeta.title}</h2>
          <p className="adventure-map-tagline">{missionMeta.tagline}</p>
        </div>
      </section>

      {/* ── 2. PROGRESS OVERVIEW & CDEMF PURPOSE ── */}
      <section className="map-summary-section" aria-label="Progress Overview and Learning Framework">
        <div className="map-learning-purpose">
          <span className="purpose-icon">🌱</span>
          <p className="purpose-text">
            <strong>Story-Driven Financial Growth:</strong> Make smart money choices, see how your companion reacts,
            and build the skills needed to unlock your next adventure.
          </p>
        </div>

        <div className="map-progress-overview">
          <div className="progress-overview-text">
            <div className="overview-primary">
              <span className="overview-label">MISSION PROGRESS</span>
              <strong className="overview-status">{progressLabel}</strong>
            </div>
            <div className="overview-stat-pills">
              <span className="stat-pill stat-frontier">🎯 {currentLevelLabel}</span>
              <span className="stat-pill stat-percent">{progressPercent}% Mastered</span>
            </div>
          </div>
          <div className="map-progress-bar-track">
            <div
              className={`map-progress-bar-fill fill-${missionMeta.characterType}`}
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </section>

      {/* ── 3. VISUAL ADVENTURE PROGRESSION PATH ── */}
      <section className="adventure-path-track" aria-label="Interactive Level Progression Path">
        {levels.map((lvl, index) => {
          const isCompleted = safeCompleted.includes(lvl.levelNumber);
          const isUnlocked = lvl.levelNumber <= unlockedLevelNumber;
          const isCurrent = lvl.levelNumber === activeLevelNumber;
          const isFrontier = !isCompleted && isUnlocked && lvl.levelNumber === unlockedLevelNumber;
          const isEven = index % 2 === 1;

          let statusClass = 'node-locked';
          let statusLabel = 'Locked';
          let actionHint = `Prerequisite: Complete Level ${lvl.levelNumber - 1}`;
          let waypointIcon: React.ReactNode = '🔒';

          if (isCompleted) {
            statusClass = 'node-completed';
            statusLabel = 'Completed';
            actionHint = 'Replay Chapter ➔';
            waypointIcon = '✓';
          } else if (!isUnlocked) {
            statusClass = 'node-locked';
            statusLabel = 'Locked';
            actionHint = `Locked · Finish Level ${lvl.levelNumber - 1} First`;
            waypointIcon = '🔒';
          } else if (isCurrent || isFrontier) {
            statusClass = 'node-current';
            statusLabel = isCurrent ? 'In Progress' : 'Ready to Play';
            actionHint = 'Play Challenge ➔';
            waypointIcon = lvl.levelNumber;
          } else {
            statusClass = 'node-unlocked';
            statusLabel = 'Available';
            actionHint = 'Enter Level ➔';
            waypointIcon = lvl.levelNumber;
          }

          const handleClick = () => {
            if (isUnlocked) {
              onSelectLevel(lvl.levelNumber);
            } else if (onLockedClick) {
              onLockedClick(lvl);
            }
          };

          const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          };

          return (
            <div
              key={lvl.id}
              className={`adventure-path-step ${isEven ? 'step-right' : 'step-left'} ${statusClass}`}
            >
              {/* Level Card */}
              <div
                className={`level-node-card ${statusClass} ${isCurrent && isUnlocked ? 'current-pulse' : ''}`}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                role="button"
                tabIndex={0}
                aria-label={`Level ${lvl.levelNumber}: ${lvl.title} - ${statusLabel}`}
              >
                <div className="card-top-row">
                  <span className="node-num-tag">Level {lvl.levelNumber}</span>
                  <span className={`node-status-pill status-${statusClass}`}>
                    {isCompleted ? '✓ ' : ''}{statusLabel}
                  </span>
                </div>

                <h4 className="node-title">{lvl.title}</h4>
                <p className="node-subtitle">{lvl.subtitle}</p>

                <div className="card-bottom-row">
                  <div className="node-competency-tag">
                    🎯 <span>{formatCompetencyName(lvl.targetCompetency)}</span>
                  </div>
                  <div className="node-action-prompt">
                    <span>{actionHint}</span>
                  </div>
                </div>
              </div>

              {/* Central Milestone Waypoint */}
              <div className="waypoint-column">
                <div
                  className={`waypoint-node ${statusClass}`}
                  onClick={handleClick}
                  onKeyDown={handleKeyDown}
                  role="button"
                  tabIndex={0}
                  aria-label={`Waypoint Level ${lvl.levelNumber}: ${statusLabel}`}
                  title={`Level ${lvl.levelNumber} (${statusLabel})`}
                >
                  {waypointIcon}
                </div>

                {index < levels.length - 1 && (
                  <div
                    className={`waypoint-connector-line ${isCompleted ? 'connector-active' : ''}`}
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Layout spacer for balanced zigzag path on desktop */}
              <div className="step-spacer" aria-hidden="true" />
            </div>
          );
        })}
      </section>
    </div>
  );
};

function formatCompetencyName(comp: string): string {
  switch (comp) {
    case 'budgetingSkill':
      return 'Budgeting Skill';
    case 'spendingDiscipline':
      return 'Spending Discipline';
    case 'savingBehavior':
      return 'Saving Behavior';
    case 'investmentAwareness':
      return 'Value & Investment';
    case 'goalAchievement':
      return 'Goal Achievement';
    case 'emergencyPreparedness':
      return 'Emergency Planning';
    case 'consistency':
      return 'Consistency & Discipline';
    case 'riskAwareness':
      return 'Risk Awareness';
    default:
      return comp;
  }
}
