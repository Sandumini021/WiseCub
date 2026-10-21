import React from 'react';
import { LevelDefinition } from '../../types/mission.types';

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
  return (
    <div className="level-progress-map-container">
      <div className="map-header">
        <h3 className="map-title">Mission Path · Barnaby’s Recovery Journey</h3>
        <p className="map-subtitle">
          Pass each financial competency test to unlock the next story chapter.
        </p>
      </div>

      <div className="level-nodes-path">
        {levels.map((lvl, index) => {
          const isCompleted = completedLevelNumbers.includes(lvl.levelNumber);
          const isUnlocked = lvl.levelNumber <= unlockedLevelNumber;
          const isCurrent = lvl.levelNumber === activeLevelNumber;

          let statusClass = 'node-locked';
          let statusLabel = 'Locked';

          if (isCompleted) {
            statusClass = 'node-completed';
            statusLabel = 'Completed';
          } else if (!isUnlocked) {
            statusClass = 'node-locked';
            statusLabel = 'Locked';
          } else if (isCurrent) {
            statusClass = 'node-active';
            statusLabel = 'In Progress';
          } else {
            statusClass = 'node-unlocked';
            statusLabel = 'Available';
          }

          const handleClick = () => {
            if (isUnlocked) {
              onSelectLevel(lvl.levelNumber);
            } else if (onLockedClick) {
              onLockedClick(lvl);
            }
          };

          return (
            <div
              key={lvl.id}
              className={`level-node-card ${statusClass} ${isCurrent && isUnlocked ? 'current-pulse' : ''}`}
              onClick={handleClick}
              role="button"
              tabIndex={isUnlocked ? 0 : -1}
              aria-label={`Level ${lvl.levelNumber}: ${lvl.title} - ${statusLabel}`}
            >
              <div className="node-number-badge">
                {isCompleted ? '✓' : isUnlocked ? lvl.levelNumber : '🔒'}
              </div>

              <div className="node-content">
                <div className="node-top-meta">
                  <span className="node-num-tag">Level {lvl.levelNumber}</span>
                  <span className={`node-status-pill status-${statusClass}`}>{statusLabel}</span>
                </div>
                <h4 className="node-title">{lvl.title}</h4>
                <p className="node-subtitle">{lvl.subtitle}</p>
                <div className="node-competency-tag">
                  🎯 Focus: <strong>{formatCompetencyName(lvl.targetCompetency)}</strong>
                </div>
              </div>

              {index < levels.length - 1 && (
                <div className={`node-connector ${isCompleted ? 'connector-done' : ''}`} />
              )}
            </div>
          );
        })}
      </div>
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
    default:
      return comp;
  }
}
