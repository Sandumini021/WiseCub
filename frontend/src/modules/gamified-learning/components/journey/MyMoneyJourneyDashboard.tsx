import React, { useEffect, useState } from 'react';
import { getJourneyOverview, getAdaptiveRecommendation } from '../../services/gamifiedApi';
import {
  JourneyOverview,
  JourneyMissionSummary,
  SkillMetric,
  AdaptiveRecommendation,
} from '../../types/journey.types';
import { CharacterEmotionalState, CharacterPhysicalCondition } from '../../types/emotion.types';
import { PuppyCharacterSvg } from '../character/PuppyCharacterSvg';
import { SquirrelCharacterSvg } from '../character/SquirrelCharacterSvg';
import { PandaCharacterSvg } from '../character/PandaCharacterSvg';
import { MissionDetailModal } from './MissionDetailModal';

interface MyMoneyJourneyDashboardProps {
  onNavigateToMission: (missionId: string, levelNumber?: number) => void;
  onBackToMissionsHub?: () => void;
}

export const MyMoneyJourneyDashboard: React.FC<MyMoneyJourneyDashboardProps> = ({
  onNavigateToMission,
  onBackToMissionsHub,
}) => {
  const [data, setData] = useState<JourneyOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillMetric | null>(null);
  const [inspectMissionId, setInspectMissionId] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<AdaptiveRecommendation | null>(null);
  const [recLoading, setRecLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    getAdaptiveRecommendation()
      .then((rec) => {
        if (mounted) {
          setRecommendation(rec);
          setRecLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.warn('Adaptive recommendation unavailable:', err);
          setRecLoading(false);
        }
      });

    getJourneyOverview()
      .then((overview) => {
        if (mounted) {
          setData(overview);
          if (overview.financialSkillsProfile.length > 0) {
            setSelectedSkill(overview.financialSkillsProfile[0]);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error('Failed to load journey overview:', err);
          setError('Unable to load journey progress. Please check your connection or log in.');
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const renderMissionCharacter = (m: JourneyMissionSummary, size: number = 100) => {
    const cond = (m.characterState.physical_condition || 'NEEDS_CARE') as CharacterPhysicalCondition;
    const emo = (m.characterState.emotional_state || 'WORRIED') as CharacterEmotionalState;

    if (m.missionId === 'mission_squirrel_savings') {
      return <SquirrelCharacterSvg condition={cond} emotion={emo} size={size} />;
    }
    if (m.missionId === 'mission_panda_fair') {
      return <PandaCharacterSvg condition={cond} emotion={emo} size={size} />;
    }
    return <PuppyCharacterSvg condition={cond} emotion={emo} size={size} />;
  };

  if (loading) {
    return (
      <div className="journey-dashboard-loading">
        <div className="journey-loading-card">
          <div className="journey-spinner" />
          <h3>Loading Your Money Journey...</h3>
          <p>Gathering evidence-based competency evaluations and companion recovery states.</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="journey-dashboard-error">
        <div className="journey-error-card">
          <span className="error-icon">⚠️</span>
          <h3>Could Not Load Journey Data</h3>
          <p>{error || 'An unexpected error occurred while fetching your learning journey.'}</p>
          <div className="error-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
            {onBackToMissionsHub && (
              <button
                type="button"
                className="btn-secondary"
                onClick={onBackToMissionsHub}
              >
                Back to Missions Hub
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { overview, missions, financialSkillsProfile, achievements, emotionalImpactShowcase, learningTips } = data;
  const totalLevelsPercent = Math.round((overview.totalLevelsCompleted / overview.totalLevelsCount) * 100);

  return (
    <div className="journey-dashboard-container">
      {/* TOP NAVIGATION / BREADCRUMB BAR */}
      <nav className="journey-top-bar">
        {onBackToMissionsHub && (
          <button
            type="button"
            className="btn-back-hub"
            onClick={onBackToMissionsHub}
          >
            ← Back to Missions Hub
          </button>
        )}
        <div className="journey-top-tags">
          <span className="tag-brand">WiseCub · CDEMF Research Engine</span>
          <span className="tag-tier">
            🏆 Tier: <strong>{overview.masteryTier}</strong>
          </span>
          <span className="tag-coins">
            🪙 <strong>{overview.earnedCoins}</strong> Virtual Coins
          </span>
        </div>
      </nav>

      {/* SECTION A: LEARNING OVERVIEW HERO */}
      <header className="journey-hero-card">
        <div className="hero-text-area">
          <span className="hero-greeting-pill">🌟 Student Learning Journey</span>
          <h1 className="hero-title">
            Welcome back, <span className="highlight-name">{data.studentName}</span>!
          </h1>
          <p className="hero-subtitle">
            Every budgeting, saving, and spending choice you make directly alters the survival, comfort,
            and happiness of your animal companions across 20 evidence-driven story challenges.
          </p>

          <div className="hero-stats-row">
            <div className="hero-stat-block">
              <span className="stat-value">{overview.totalLevelsCompleted} / {overview.totalLevelsCount}</span>
              <span className="stat-label">Levels Cleared</span>
            </div>
            <div className="hero-stat-block">
              <span className="stat-value">{overview.totalMissionsCompleted} / {overview.totalMissionsCount}</span>
              <span className="stat-label">Missions Mastered</span>
            </div>
            <div className="hero-stat-block">
              <span className="stat-value">
                {overview.overallCompetencyScore !== null ? `${overview.overallCompetencyScore}%` : 'In Progress'}
              </span>
              <span className="stat-label">Average Mastery</span>
            </div>
            <div className="hero-stat-block">
              <span className="stat-value">
                {achievements.filter((a) => a.unlocked).length} / {achievements.length}
              </span>
              <span className="stat-label">Badges Unlocked</span>
            </div>
          </div>

          <div className="hero-progress-section">
            <div className="progress-labels">
              <span>Overall Curriculum Progress (20 Playable Levels)</span>
              <strong>{totalLevelsPercent}% Completed</strong>
            </div>
            <div className="progress-track-large">
              <div
                className="progress-fill-large"
                style={{ width: `${totalLevelsPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="hero-cta-area">
          <div className="cta-companion-preview">
            <span className="cta-eyebrow">Next Story Step</span>
            <h4>
              Level {overview.nextRecommendedLevel}
            </h4>
            <p className="cta-desc">
              Continue your mission to strengthen your decision-making and build emergency resilience.
            </p>
            <button
              type="button"
              className="btn-continue-journey"
              onClick={() => onNavigateToMission(overview.activeMissionId, overview.nextRecommendedLevel)}
            >
              ▶ Continue Learning
            </button>
          </div>
        </div>
      </header>

      {/* SECTION B: MY MISSIONS (THE 3 COMPANIONS) */}
      <section className="dashboard-section">
        <div className="section-header-row">
          <div>
            <h2 className="section-heading">My Financial Story Missions</h2>
            <p className="section-subheading">
              Three interconnected story chapters exploring budgeting, multi-period saving, and smart spending.
            </p>
          </div>
        </div>

        <div className="missions-cards-grid">
          {missions.map((m) => {
            const isCompleted = m.isCompleted;
            const statusClass = m.competencyStatus.toLowerCase().replace(' ', '-');

            return (
              <div
                key={m.missionId}
                className="mission-journey-card"
                style={{ borderTop: `5px solid ${m.themeColor}` }}
              >
                <div className="card-header-flex">
                  <div className="card-avatar-box">
                    {renderMissionCharacter(m, 85)}
                  </div>
                  <div className="card-identity-box">
                    <span className="card-focus-tag" style={{ color: m.themeColor }}>
                      {m.focusSkill}
                    </span>
                    <h3 className="card-mission-title">{m.title}</h3>
                    <span className="card-partner-label">
                      Partner: <strong>{m.characterName}</strong>
                    </span>
                  </div>
                </div>

                <div className="card-status-bar">
                  <span className={`competency-badge badge-${statusClass}`}>
                    {isCompleted ? '⭐ Mastered' : m.competencyStatus}
                  </span>
                  <span className="coins-earned-chip">
                    🪙 {m.earnedCoins} Coins
                  </span>
                </div>

                <div className="card-progress-col">
                  <div className="card-progress-labels">
                    <span>Levels: <strong>{m.completedLevelsCount} / {m.totalLevels}</strong></span>
                    <span>{m.progressPercent}%</span>
                  </div>
                  <div className="card-progress-track">
                    <div
                      className="card-progress-fill"
                      style={{ width: `${m.progressPercent}%`, backgroundColor: m.themeColor }}
                    />
                  </div>
                </div>

                <div className="card-actions-row">
                  <button
                    type="button"
                    className="btn-card-action btn-card-play"
                    onClick={() => onNavigateToMission(m.missionId, m.unlockedLevelNumber)}
                  >
                    {m.completedLevelsCount > 0 ? '▶ Continue Mission' : '🐾 Start Mission'}
                  </button>
                  <button
                    type="button"
                    className="btn-card-action btn-card-details"
                    onClick={() => setInspectMissionId(m.missionId)}
                  >
                    🔍 View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION B.5: RECOMMENDED FOR YOU (CDEMF ADAPTIVE AI) */}
      <section className="dashboard-section adaptive-recommendation-section">
        <div className="section-header-row">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 className="section-heading">Recommended for You</h2>
              <span className="adaptive-ai-pill">✨ Adaptive AI</span>
            </div>
            <p className="section-subheading">
              Personalized practice suggestions synthesized from your recent competency evidence and story progress.
            </p>
          </div>
        </div>

        {recLoading ? (
          <div className="adaptive-rec-loading-card">
            <div className="journey-spinner" style={{ width: 24, height: 24 }} />
            <span>Analyzing your financial gameplay patterns...</span>
          </div>
        ) : recommendation ? (
          <div className={`adaptive-rec-card category-${recommendation.recommendedCategory.toLowerCase()}`}>
            <div className="rec-card-main">
              <div className="rec-badge-row">
                <span className="rec-mission-badge">
                  🎮 {recommendation.recommendedMissionTitle}
                </span>
                <span className={`rec-tier-badge tier-${recommendation.recommendedCategory.toLowerCase()}`}>
                  {recommendation.recommendedCategory === 'FOUNDATION'
                    ? '🌱 Foundation Practice'
                    : recommendation.recommendedCategory === 'ADVANCED'
                    ? '⚡ Advanced Challenge'
                    : '🎯 Standard Practice'}
                </span>
                {recommendation.isOptional && (
                  <span className="rec-optional-badge">⭐ Optional Bonus Challenge</span>
                )}
              </div>

              <h3 className="rec-title">{recommendation.recommendationTitle}</h3>
              <p className="rec-competency-tag">
                Focus Skill: <strong>{recommendation.recommendedCompetency}</strong> (Level {recommendation.recommendedLevelNumber})
              </p>
              <p className="rec-explanation">"{recommendation.explanation}"</p>
            </div>

            <div className="rec-action-col">
              <button
                type="button"
                className="btn-practice-now"
                onClick={() =>
                  onNavigateToMission(
                    recommendation.recommendedMissionId,
                    recommendation.recommendedLevelNumber
                  )
                }
              >
                {recommendation.recommendedCategory === 'FOUNDATION'
                  ? 'Review Practice'
                  : recommendation.recommendedCategory === 'ADVANCED'
                  ? 'Try Challenge'
                  : 'Practice Now'} →
              </button>
              <span className="rec-action-hint">{recommendation.pedagogicalAction}</span>
            </div>
          </div>
        ) : (
          <div className="adaptive-rec-fallback-card">
            <p>Ready to continue your financial adventure? Pick any mission card above to keep learning!</p>
          </div>
        )}
      </section>

      {/* SECTION C: FINANCIAL SKILLS PROFILE */}
      <section className="dashboard-section skills-profile-section">
        <div className="section-header-row">
          <div>
            <h2 className="section-heading">Financial Skills Profile</h2>
            <p className="section-subheading">
              Evidence-based competency scoring across 7 real financial disciplines. Insufficient evidence is explicitly flagged.
            </p>
          </div>
        </div>

        <div className="skills-interactive-layout">
          <div className="skills-list-col">
            {financialSkillsProfile.map((skill) => {
              const isSelected = selectedSkill?.skillKey === skill.skillKey;
              const hasEvidence = skill.hasSufficientEvidence;
              const score = skill.score ?? 0;

              return (
                <div
                  key={skill.skillKey}
                  className={`skill-item-card ${isSelected ? 'skill-item-selected' : ''}`}
                  onClick={() => setSelectedSkill(skill)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="skill-item-main">
                    <div className="skill-item-title-row">
                      <span className="skill-name">{skill.name}</span>
                      {hasEvidence ? (
                        <span className="skill-score-num">
                          <strong>{score}</strong> / 100
                        </span>
                      ) : (
                        <span className="skill-no-evidence-tag">Needs Evidence</span>
                      )}
                    </div>

                    <div className="skill-bar-track">
                      {hasEvidence ? (
                        <div
                          className={`skill-bar-fill ${
                            score >= 85 ? 'fill-mastered' : score >= 65 ? 'fill-proficient' : 'fill-developing'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      ) : (
                        <div className="skill-bar-fill fill-empty" style={{ width: '0%' }} />
                      )}
                    </div>

                    <div className="skill-item-footer">
                      <span className="skill-category-pill">{skill.category}</span>
                      {skill.isStrength && <span className="pill-strength">⭐ Strength</span>}
                      {skill.needsPractice && <span className="pill-practice">⚠️ Focus Area</span>}
                      <span className="skill-evidence-count">
                        {skill.evidenceCount} {skill.evidenceCount === 1 ? 'assessment' : 'assessments'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="skills-detail-col">
            {selectedSkill ? (
              <div className="skill-detail-card">
                <span className="detail-eyebrow">{selectedSkill.category}</span>
                <h3 className="detail-skill-title">{selectedSkill.name}</h3>
                <p className="detail-desc">{selectedSkill.description}</p>

                <div className="detail-evidence-box">
                  <div className="evidence-metric">
                    <span className="metric-title">Evidence Collected</span>
                    <strong className="metric-val">{selectedSkill.evidenceCount} Assessments</strong>
                  </div>
                  <div className="evidence-metric">
                    <span className="metric-title">Demonstrated Status</span>
                    <strong className={`metric-val status-${selectedSkill.status}`}>
                      {selectedSkill.hasSufficientEvidence ? selectedSkill.status.toUpperCase() : 'INSUFFICIENT EVIDENCE'}
                    </strong>
                  </div>
                </div>

                {!selectedSkill.hasSufficientEvidence ? (
                  <div className="evidence-guidance-alert">
                    <span className="alert-icon">💡</span>
                    <p>
                      We need evidence from gameplay to calculate this competency score.
                      Play levels in <strong>Puppy Rescue</strong>, <strong>Squirrel&apos;s Savings</strong>, or <strong>Panda&apos;s Fair</strong> to demonstrate your skill!
                    </p>
                  </div>
                ) : selectedSkill.needsPractice ? (
                  <div className="evidence-guidance-alert alert-practice">
                    <span className="alert-icon">🎯</span>
                    <p>
                      This skill has room for growth. Review the personalized recommendations below to target your next practice challenge.
                    </p>
                  </div>
                ) : (
                  <div className="evidence-guidance-alert alert-mastered">
                    <span className="alert-icon">🌟</span>
                    <p>
                      Excellent mastery demonstrated! Your decisions consistently adhered to sound financial principles and protected your companions.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="skill-detail-placeholder">
                <p>Select a skill from the list to view its competency breakdown.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION D: REWARDS & ACHIEVEMENTS */}
      <section className="dashboard-section">
        <div className="section-header-row">
          <div>
            <h2 className="section-heading">Verified Rewards & Achievements</h2>
            <p className="section-subheading">
              Badges are unlocked through verified server-side competency mastery, never through decorative button clicks.
            </p>
          </div>
        </div>

        <div className="badges-grid">
          {achievements.map((badge) => {
            const isUnlocked = badge.unlocked;

            return (
              <div
                key={badge.id}
                className={`badge-card ${isUnlocked ? 'badge-unlocked' : 'badge-locked'}`}
              >
                <div className="badge-icon-bubble">
                  <span className="badge-emoji">{badge.icon}</span>
                  {!isUnlocked && <span className="badge-lock-overlay">🔒</span>}
                </div>

                <div className="badge-text-col">
                  <div className="badge-header-row">
                    <h4 className="badge-title">{badge.title}</h4>
                    <span className={`badge-pill ${isUnlocked ? 'badge-pill-earned' : 'badge-pill-locked'}`}>
                      {isUnlocked ? '✓ Earned' : 'Locked'}
                    </span>
                  </div>

                  <p className="badge-description">{badge.description}</p>

                  <div className="badge-condition-box">
                    <span className="condition-label">Condition:</span>
                    <span className="condition-text">{badge.unlockCondition}</span>
                  </div>

                  {!isUnlocked && badge.progressTarget > 0 && (
                    <div className="badge-progress-col">
                      <div className="badge-progress-labels">
                        <span>Progress</span>
                        <span>{badge.progressCurrent} / {badge.progressTarget}</span>
                      </div>
                      <div className="badge-progress-track">
                        <div
                          className="badge-progress-fill"
                          style={{ width: `${Math.round((badge.progressCurrent / badge.progressTarget) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION E: EMOTIONAL STORY IMPACT (CDEMF SHOWCASE) */}
      <section className="dashboard-section emotional-impact-section">
        <div className="section-header-row">
          <div>
            <h2 className="section-heading">Emotional Story Impact (CDEMF Showcase)</h2>
            <p className="section-subheading">
              Evidence of how your real financial allocations directly transformed animal companion physical and emotional well-being.
            </p>
          </div>
        </div>

        {emotionalImpactShowcase.length === 0 ? (
          <div className="empty-impact-card">
            <span className="empty-icon">📖</span>
            <h4>Your Story Impact Awaits</h4>
            <p>
              As you solve budget challenges, emergency veterinary calls, and winter storage choices,
              your companions&apos; emotional journeys will be recorded here in real-time.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => onNavigateToMission('mission_rescue_puppy', 1)}
            >
              Start Level 1 to Begin
            </button>
          </div>
        ) : (
          <div className="impact-cards-grid">
            {emotionalImpactShowcase.map((record, i) => (
              <div key={i} className="impact-story-card">
                <div className="impact-card-top">
                  <span className="impact-mission-badge">{record.missionTitle} · L{record.levelNumber}</span>
                  <span className={`impact-direction-pill dir-${record.direction.toLowerCase()}`}>
                    {record.direction === 'POSITIVE' ? '📈 Recovery' : record.direction === 'NEGATIVE' ? '📉 Setback' : '⚖️ Stable'}
                  </span>
                </div>

                <div className="impact-states-row">
                  <div className="state-badge">
                    <span className="state-label">Before</span>
                    <span className="state-value">{record.previousEmotion.replace('_', ' ')}</span>
                  </div>
                  <span className="state-arrow">➔</span>
                  <div className="state-badge state-badge-new">
                    <span className="state-label">After</span>
                    <span className="state-value">{record.newEmotion.replace('_', ' ')}</span>
                  </div>
                </div>

                {record.characterDialogue && (
                  <div className="impact-dialogue-bubble">
                    <span className="bubble-speaker">{record.characterName}:</span>
                    <p className="bubble-quote">&ldquo;{record.characterDialogue}&rdquo;</p>
                  </div>
                )}

                {record.reason && (
                  <div className="impact-reason-box">
                    <strong>Consequence:</strong> {record.reason}
                  </div>
                )}

                {record.improvedAfterRetry && (
                  <div className="impact-retry-tag">
                    🌱 Overcame Challenge on Retry with Remediation Guidance
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION F: PERSONALIZED LEARNING TIPS */}
      <section className="dashboard-section">
        <div className="section-header-row">
          <div>
            <h2 className="section-heading">Personalized Learning Recommendations</h2>
            <p className="section-subheading">
              Rule-based pedagogical tips derived from your lower competency dimensions, incomplete challenges, and retry patterns.
            </p>
          </div>
        </div>

        <div className="tips-grid">
          {learningTips.map((tip, idx) => (
            <div key={idx} className="tip-card">
              <div className="tip-category-tag">{tip.category}</div>
              <h4 className="tip-title">{tip.title}</h4>
              <p className="tip-desc">{tip.description}</p>
              {tip.actionMissionId && tip.actionLevelNumber && (
                <button
                  type="button"
                  className="btn-tip-action"
                  onClick={() => onNavigateToMission(tip.actionMissionId!, tip.actionLevelNumber!)}
                >
                  {tip.actionLabel} →
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION G: MISSION DETAIL MODAL */}
      {inspectMissionId && (
        <MissionDetailModal
          missionId={inspectMissionId}
          onClose={() => setInspectMissionId(null)}
          onPlayLevel={(mid, lvl) => {
            setInspectMissionId(null);
            onNavigateToMission(mid, lvl);
          }}
        />
      )}
    </div>
  );
};
