import { useEffect, useState } from 'react';
import { useDemoChild } from '../../../pages/auth/demoSession';
import { MISSION_CATALOG } from '../data/missions/catalog';
import { RESCUE_PUPPY_MISSION } from '../data/missions/rescuePuppy';
import { useMissionProgress } from '../hooks/useMissionProgress';
import { getCompetencyHistory } from '../services/gamifiedApi';
import { DecisionLogger } from '../services/decisionLogger';
import { INITIAL_COMPETENCY_PROFILE, INITIAL_PUPPY_STATE } from '../services/prototypeStorage';
import { CompetencyProfile } from '../types/competency.types';
import { LevelDefinition } from '../types/mission.types';
import { MissionProgress } from '../types/progress.types';

// Components
import { MissionHubView } from '../components/hub/MissionHubView';
import { CharacterStage } from '../components/character/CharacterStage';
import { LevelProgressMap } from '../components/progression/LevelProgressMap';
import { NeedsWantsSelector } from '../components/challenges/NeedsWantsSelector';
import { BudgetAllocator } from '../components/challenges/BudgetAllocator';
import { MultiPeriodSaving } from '../components/challenges/MultiPeriodSaving';
import { ValueComparison } from '../components/challenges/ValueComparison';
import { EmergencyResponse } from '../components/challenges/EmergencyResponse';
import { TradeoffJustification } from '../components/challenges/TradeoffJustification';
import { CharacterTransitionPanel } from '../components/feedback/CharacterTransitionPanel';
import { CompetencyEvidenceModal } from '../components/feedback/CompetencyEvidenceModal';
import { RetrySupportPanel } from '../components/feedback/RetrySupportPanel';
import { LearningAnalyticsModal } from '../components/analytics/LearningAnalyticsModal';
import { PuppyCharacterSvg } from '../components/character/PuppyCharacterSvg';
import { SquirrelCharacterSvg } from '../components/character/SquirrelCharacterSvg';

import '../styles/gamified-learning.css';

type PageViewMode =
  | 'HUB'
  | 'MAP'
  | 'PLAY_LEVEL'
  | 'TRANSITION'
  | 'EVALUATION'
  | 'RETRY'
  | 'MISSION_COMPLETE';

function getFriendlySkillName(comp: string): string {
  switch (comp) {
    case 'budgetingSkill':
      return 'Budgeting Boss';
    case 'spendingDiscipline':
      return 'Smart Spending';
    case 'savingBehavior':
      return 'Savings Hero';
    case 'investmentAwareness':
      return 'Value Hunter';
    case 'goalAchievement':
      return 'Goal Crusher';
    default:
      return 'Money Smart';
  }
}

export function MissionBoardPage() {
  const { child, authReady } = useDemoChild();
  const [viewMode, setViewMode] = useState<PageViewMode>('HUB');
  const [selectedMissionId, setSelectedMissionId] = useState<string>('mission_rescue_puppy');
  const [currentLevelNumber, setCurrentLevelNumber] = useState<number>(1);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState<boolean>(false);
  const [lockedAlertLevel, setLockedAlertLevel] = useState<LevelDefinition | null>(null);
  const [competencyProfile, setCompetencyProfile] = useState<CompetencyProfile>(INITIAL_COMPETENCY_PROFILE);

  const {
    progress,
    submitting,
    error: apiError,
    lastMasteryResult,
    beginLevel,
    submitOptionSelection,
    submitAllocation,
    submitMultiPeriod,
    clearError,
    resetProgress,
  } = useMissionProgress(selectedMissionId, child?.username || child?.name);

  // Synchronize current unlocked level when progress loads or updates
  useEffect(() => {
    if (progress?.unlockedLevelNumber) {
      setCurrentLevelNumber(progress.unlockedLevelNumber);
    }
  }, [progress?.unlockedLevelNumber]);

  // Synchronize competency profile when analytics opens or mastery result arrives
  useEffect(() => {
    if (lastMasteryResult) {
      setCompetencyProfile((prev) => ({
        ...prev,
        budgetingSkill: lastMasteryResult.dimensionScores.budgetingSkill ?? prev.budgetingSkill,
        spendingDiscipline: lastMasteryResult.dimensionScores.spendingDiscipline ?? prev.spendingDiscipline,
        savingBehavior: lastMasteryResult.dimensionScores.savingBehavior ?? prev.savingBehavior,
        investmentAwareness: lastMasteryResult.dimensionScores.investmentAwareness ?? prev.investmentAwareness,
        goalAchievement: lastMasteryResult.dimensionScores.goalAchievement ?? prev.goalAchievement,
        lastUpdatedIso: lastMasteryResult.timestamp,
      }));
    }
  }, [lastMasteryResult]);

  useEffect(() => {
    if (showAnalyticsModal) {
      getCompetencyHistory(selectedMissionId)
        .then((hist) => {
          if (hist.current_profile && Object.keys(hist.current_profile).length > 0) {
            setCompetencyProfile((prev) => ({
              ...prev,
              budgetingSkill: hist.current_profile.budgetingSkill ?? prev.budgetingSkill,
              spendingDiscipline: hist.current_profile.spendingDiscipline ?? prev.spendingDiscipline,
              savingBehavior: hist.current_profile.savingBehavior ?? prev.savingBehavior,
              investmentAwareness: hist.current_profile.investmentAwareness ?? prev.investmentAwareness,
              goalAchievement: hist.current_profile.goalAchievement ?? prev.goalAchievement,
            }));
          }
        })
        .catch(() => {});
    }
  }, [showAnalyticsModal, selectedMissionId]);

  const currentMission =
    MISSION_CATALOG.find((m) => m.id === selectedMissionId) || RESCUE_PUPPY_MISSION;

  const puppyProgress: MissionProgress = progress || {
    missionId: selectedMissionId,
    unlockedLevelNumber: 1,
    completedLevelNumbers: [],
    highestCompletedLevelNumber: 0,
    characterState: currentMission.initialCharacterState
      ? { ...currentMission.initialCharacterState }
      : { ...INITIAL_PUPPY_STATE },
    attemptsByLevel: {},
    lastAttemptAtIso: new Date().toISOString(),
    isMissionCompleted: false,
    earnedCoins: 0,
  };

  const activeLevel =
    currentMission.levels.find((l) => l.levelNumber === currentLevelNumber) ||
    currentMission.levels[0];

  // -------------------------------------------------------------
  // Navigation Handlers
  // -------------------------------------------------------------
  const handleSelectMissionFromHub = (missionId: string) => {
    setSelectedMissionId(missionId);
    DecisionLogger.logEvent(missionId, 'root', 0, 0, 'MISSION_STARTED', {
      missionTitle: currentMission.title,
    });
    setViewMode('MAP');
  };

  const handleSelectLevelFromMap = async (lvlNumber: number) => {
    const isUnlocked = lvlNumber <= puppyProgress.unlockedLevelNumber;
    if (isUnlocked) {
      try {
        await beginLevel(lvlNumber);
      } catch (e) {
        console.warn('Server lock warning:', e);
      }
      setCurrentLevelNumber(lvlNumber);
      DecisionLogger.logEvent(
        selectedMissionId,
        `level_${lvlNumber}`,
        lvlNumber,
        (puppyProgress.attemptsByLevel[lvlNumber]?.length || 0) + 1,
        'LEVEL_STARTED',
        { levelNumber: lvlNumber }
      );
      setViewMode('PLAY_LEVEL');
    }
  };

  const handleLockedLevelClick = (lvl: LevelDefinition) => {
    setLockedAlertLevel(lvl);
  };

  const handleResetDemoData = async () => {
    try {
      await resetProgress();
      DecisionLogger.clearEvents();
      setCurrentLevelNumber(1);
      setViewMode('HUB');
      setShowAnalyticsModal(false);
    } catch (e) {
      console.error('Failed to reset demo progress', e);
    }
  };

  // -------------------------------------------------------------
  // Authoritative Backend Decision Handlers (CDEMF + MongoDB)
  // -------------------------------------------------------------
  const handleOptionSelectionSubmit = async (selectedOptionIds: string[]) => {
    DecisionLogger.logEvent(
      selectedMissionId,
      activeLevel.id,
      activeLevel.levelNumber,
      (puppyProgress.attemptsByLevel[activeLevel.levelNumber]?.length || 0) + 1,
      'DECISION_SUBMITTED',
      { selectedOptionIds }
    );
    try {
      await submitOptionSelection({
        levelId: activeLevel.id,
        levelNumber: activeLevel.levelNumber,
        interactionType: activeLevel.interactionType,
        selectedOptionIds,
      });
      setViewMode('TRANSITION');
    } catch (err) {
      console.error('Option submission failed:', err);
    }
  };

  const handleCategoryAllocationsSubmit = async (allocations: Record<string, number>) => {
    DecisionLogger.logEvent(
      selectedMissionId,
      activeLevel.id,
      activeLevel.levelNumber,
      (puppyProgress.attemptsByLevel[activeLevel.levelNumber]?.length || 0) + 1,
      'DECISION_SUBMITTED',
      { allocations }
    );
    try {
      await submitAllocation({
        levelId: activeLevel.id,
        levelNumber: activeLevel.levelNumber,
        interactionType: activeLevel.interactionType,
        allocations,
      });
      setViewMode('TRANSITION');
    } catch (err) {
      console.error('Allocation submission failed:', err);
    }
  };

  const handleMultiPeriodSavingSubmit = async (
    weeklyDecisions: Array<{ period: number; savedAmountLKR: number; resistedTemptation: boolean }>
  ) => {
    DecisionLogger.logEvent(
      selectedMissionId,
      activeLevel.id,
      activeLevel.levelNumber,
      (puppyProgress.attemptsByLevel[activeLevel.levelNumber]?.length || 0) + 1,
      'DECISION_SUBMITTED',
      { weeklyDecisions }
    );
    try {
      await submitMultiPeriod({
        levelId: activeLevel.id,
        levelNumber: activeLevel.levelNumber,
        weeklyDecisions: weeklyDecisions.map((w) => ({
          period: w.period,
          saved_amount_lkr: w.savedAmountLKR,
          resisted_temptation: w.resistedTemptation,
        })),
      });
      setViewMode('TRANSITION');
    } catch (err) {
      console.error('Multi-period submission failed:', err);
    }
  };

  const handleTradeoffJustificationSubmit = async (
    selectedOptionIds: string[],
    selectedRationaleId: string
  ) => {
    DecisionLogger.logEvent(
      selectedMissionId,
      activeLevel.id,
      activeLevel.levelNumber,
      (puppyProgress.attemptsByLevel[activeLevel.levelNumber]?.length || 0) + 1,
      'DECISION_SUBMITTED',
      { selectedOptionIds, selectedRationaleId }
    );
    try {
      await submitOptionSelection({
        levelId: activeLevel.id,
        levelNumber: activeLevel.levelNumber,
        interactionType: activeLevel.interactionType,
        selectedOptionIds,
        selectedRationaleId,
      });
      setViewMode('TRANSITION');
    } catch (err) {
      console.error('Tradeoff submission failed:', err);
    }
  };

  // -------------------------------------------------------------
  // Flow Handlers after Evaluation
  // -------------------------------------------------------------
  const handleProceedAfterEvaluation = () => {
    if (activeLevel.levelNumber >= currentMission.totalLevels && lastMasteryResult?.passed) {
      setViewMode('MISSION_COMPLETE');
    } else {
      const targetLevel = lastMasteryResult?.passed
        ? Math.min(puppyProgress.unlockedLevelNumber, currentMission.totalLevels)
        : activeLevel.levelNumber;
      setCurrentLevelNumber(targetLevel);
      setViewMode('MAP');
    }
  };

  const handleRetryFromRemediation = () => {
    DecisionLogger.logEvent(
      selectedMissionId,
      activeLevel.id,
      activeLevel.levelNumber,
      (puppyProgress.attemptsByLevel[activeLevel.levelNumber]?.length || 0) + 1,
      'LEVEL_RETRIED',
      { levelNumber: activeLevel.levelNumber }
    );
    setViewMode('PLAY_LEVEL');
  };

  // =============================================================
  // RENDER MODES
  // =============================================================
  return (
    <div className="gamified-learning-module">
      {/* AUTHENTICATION / GUEST NOTIFICATION */}
      {!child && authReady && (
        <div style={{ background: '#fff3cd', color: '#856404', padding: '0.6rem 1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #ffeeba', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚠️ You are playing as a guest. Decisions will not be persisted to a verified student account. Please log in to save your progress to MongoDB.</span>
          <a href="/login" style={{ color: '#533f03', fontWeight: 'bold', textDecoration: 'underline', marginLeft: '1rem' }}>Log In</a>
        </div>
      )}

      {/* SERVER ERROR BANNER */}
      {apiError && (
        <div style={{ background: '#f8d7da', color: '#721c24', padding: '0.6rem 1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #f5c6cb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚠️ {apiError}</span>
          <button type="button" onClick={clearError} style={{ background: 'transparent', border: 'none', color: '#721c24', fontWeight: 'bold', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* SUBMISSION SPINNER OVERLAY */}
      {submitting && (
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', color: '#1d4ed8', padding: '0.6rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <span>⏳ Persisting financial decision to MongoDB & evaluating {currentMission.characterName}'s condition...</span>
        </div>
      )}

      {/* VIEW 1: STORY MISSION HUB */}
      {viewMode === 'HUB' && (
        <MissionHubView
          catalog={MISSION_CATALOG}
          activeMissionId={selectedMissionId}
          puppyProgress={puppyProgress}
          onSelectMission={handleSelectMissionFromHub}
          onOpenAnalytics={() => setShowAnalyticsModal(true)}
        />
      )}

      {/* VIEW 2: MISSION LEVEL PROGRESSION MAP */}
      {viewMode === 'MAP' && (
        <div className="mission-map-view">
          <div className="view-nav-bar">
            <button
              type="button"
              className="btn-back-nav"
              onClick={() => setViewMode('HUB')}
            >
              ← Back to Mission Hub
            </button>
            <div className="nav-bar-right">
              <span className="coins-display">
                <span className="coin-icon" role="img" aria-label="coins">🪙</span> Virtual Coins: {puppyProgress.earnedCoins}
              </span>
              <button
                type="button"
                className="btn-analytics-pill"
                onClick={() => setShowAnalyticsModal(true)}
              >
                📊 Analytics
              </button>
            </div>
          </div>

          {/* Character Stage displaying Barnaby's current state */}
          <CharacterStage
            characterState={puppyProgress.characterState}
            showDialogue={true}
            size={180}
          />

          {/* Visual Progression Map */}
          <LevelProgressMap
            levels={currentMission.levels}
            unlockedLevelNumber={puppyProgress.unlockedLevelNumber}
            completedLevelNumbers={puppyProgress.completedLevelNumbers}
            activeLevelNumber={currentLevelNumber}
            onSelectLevel={handleSelectLevelFromMap}
            onLockedClick={handleLockedLevelClick}
          />

          <div className="map-bottom-cta">
            <button
              type="button"
              className="btn-confirm-decision btn-enter-level"
              onClick={() => handleSelectLevelFromMap(puppyProgress.unlockedLevelNumber)}
            >
              Enter Unlocked Challenge (Level {puppyProgress.unlockedLevelNumber}:{' '}
              {currentMission.levels[puppyProgress.unlockedLevelNumber - 1]?.title}) ➔
            </button>
          </div>
        </div>
      )}

      {/* VIEW 3: PLAY FINANCIAL CHALLENGE */}
      {viewMode === 'PLAY_LEVEL' && activeLevel && (
        <div className="play-level-view">
          <div className="view-nav-bar">
            <button
              type="button"
              className="btn-back-nav"
              onClick={() => setViewMode('MAP')}
            >
              ← Back to Level Map
            </button>
            <span className="level-indicator-tag">
              Level {activeLevel.levelNumber} of {currentMission.totalLevels}
            </span>
          </div>

          {/* Compact Character Stage */}
          <CharacterStage
            characterState={puppyProgress.characterState}
            showDialogue={true}
            size={160}
          />

          {/* Sleek Compact Mission Header */}
          <div className="compact-mission-header">
            <div className="header-meta-pills">
              <span className="pill-chapter">Level {activeLevel.levelNumber} of {currentMission.totalLevels}</span>
              <span className="pill-skill">🎯 {getFriendlySkillName(activeLevel.targetCompetency)}</span>
              <span className="pill-budget">💰 Rs. {activeLevel.startingBudgetLKR.toLocaleString()}</span>
            </div>
            <h2 className="header-mission-title">{activeLevel.title}</h2>
            <p className="header-mission-goal">🎯 {activeLevel.learningObjective}</p>
          </div>

          {/* Specialized Interactive Challenge by Type */}
          <div className="active-challenge-container">
            {activeLevel.interactionType === 'needs_wants' && (
              <NeedsWantsSelector
                level={activeLevel}
                onSubmit={handleOptionSelectionSubmit}
              />
            )}

            {(activeLevel.interactionType === 'budget_allocator' ||
              activeLevel.interactionType === 'recurring_budget' ||
              activeLevel.interactionType === 'capstone_challenge') && (
              <BudgetAllocator
                level={activeLevel}
                onSubmit={handleCategoryAllocationsSubmit}
              />
            )}

            {activeLevel.interactionType === 'multi_period_saving' && (
              <MultiPeriodSaving
                level={activeLevel}
                onSubmit={handleMultiPeriodSavingSubmit}
              />
            )}

            {activeLevel.interactionType === 'value_comparison' && (
              <ValueComparison
                level={activeLevel}
                onSubmit={handleOptionSelectionSubmit}
              />
            )}

            {activeLevel.interactionType === 'emergency_response' && (
              <EmergencyResponse
                level={activeLevel}
                onSubmit={handleOptionSelectionSubmit}
              />
            )}

            {activeLevel.interactionType === 'tradeoff_justification' && (
              <TradeoffJustification
                level={activeLevel}
                onSubmit={handleTradeoffJustificationSubmit}
              />
            )}
          </div>
        </div>
      )}

      {/* VIEW 4: CHARACTER EMOTIONAL & PHYSICAL TRANSITION */}
      {viewMode === 'TRANSITION' && lastMasteryResult && (
        <CharacterTransitionPanel
          transition={lastMasteryResult.characterTransition}
          characterName={currentMission.characterName}
          onContinue={() => setViewMode('EVALUATION')}
        />
      )}

      {/* VIEW 5: COMPETENCY EVALUATION */}
      {viewMode === 'EVALUATION' && lastMasteryResult && (
        <CompetencyEvidenceModal
          masteryResult={lastMasteryResult}
          onProceed={handleProceedAfterEvaluation}
          onRetry={() => setViewMode('RETRY')}
        />
      )}

      {/* VIEW 6: RETRY & REMEDIATION SUPPORT */}
      {viewMode === 'RETRY' && lastMasteryResult && activeLevel && (
        <RetrySupportPanel
          level={activeLevel}
          masteryResult={lastMasteryResult}
          attemptNumber={
            lastMasteryResult.attemptNumber ||
            (puppyProgress.attemptsByLevel[activeLevel.levelNumber]?.length || 1)
          }
          onRetry={handleRetryFromRemediation}
          onBackToMap={() => setViewMode('MAP')}
        />
      )}

      {/* VIEW 7: MISSION COMPLETION */}
      {viewMode === 'MISSION_COMPLETE' && (
        <div className="mission-complete-card">
          <div className="completion-hero">
            {selectedMissionId === 'mission_squirrel_savings' ? (
              <SquirrelCharacterSvg
                condition="HEALTHY_ACTIVE"
                emotion="HAPPY_AND_SECURE"
                size={220}
              />
            ) : (
              <PuppyCharacterSvg
                condition="HEALTHY_ACTIVE"
                emotion="JOYFUL_HEALTHY"
                size={220}
              />
            )}
            <h1 className="completion-title">
              {selectedMissionId === 'mission_squirrel_savings'
                ? "🎉 Nutty's Winter Sanctuary is Fully Prepared!"
                : '🎉 Barnaby is Fully Rescued & Adopted!'}
            </h1>
            <p className="completion-subtitle">
              {selectedMissionId === 'mission_squirrel_savings'
                ? "Through all 6 financial story chapters, your responsible budgeting, savings discipline, and emergency resilience secured Nutty's warm home, full pantry, and happy winter survival!"
                : 'Through all 8 financial story chapters, your responsible budgeting, savings discipline, and emergency preparedness nurtured Barnaby back to vibrant, joyful health!'}
            </p>
          </div>

          <div className="completion-stats-grid">
            <div className="comp-stat-card">
              <span className="comp-stat-num">{currentMission.totalLevels} / {currentMission.totalLevels}</span>
              <span className="comp-stat-label">Levels Cleared</span>
            </div>
            <div className="comp-stat-card">
              <span className="comp-stat-num">100%</span>
              <span className="comp-stat-label">Recovery Vitality</span>
            </div>
            <div className="comp-stat-card">
              <span className="comp-stat-num">{puppyProgress.earnedCoins}</span>
              <span className="comp-stat-label">Virtual Coins Earned</span>
            </div>
            <div className="comp-stat-card">
              <span className="comp-stat-num">{competencyProfile.overallMasteryLevel}</span>
              <span className="comp-stat-label">Mastery Tier</span>
            </div>
          </div>

          <div className="completion-actions-row">
            <button
              type="button"
              className="btn-confirm-decision"
              onClick={() => setShowAnalyticsModal(true)}
            >
              📊 View Research Analytics & Export Dataset
            </button>
            <button
              type="button"
              className="btn-secondary-action"
              onClick={() => setViewMode('HUB')}
            >
              Return to Mission Hub
            </button>
          </div>
        </div>
      )}

      {/* LOCKED LEVEL MODAL ALERT */}
      {lockedAlertLevel && (
        <div className="analytics-modal-backdrop" onClick={() => setLockedAlertLevel(null)}>
          <div className="analytics-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="analytics-header">
              <h3 className="analytics-title">🔒 Level {lockedAlertLevel.levelNumber} is Locked</h3>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setLockedAlertLevel(null)}
              >
                ✕
              </button>
            </div>
            <p>
              In WiseCub, level progression is strictly gated by proven financial competency.
              You must pass <strong>Level {lockedAlertLevel.levelNumber - 1}</strong> first before
              unlocking "{lockedAlertLevel.title}".
            </p>
            <div className="analytics-footer">
              <button
                type="button"
                className="btn-confirm-decision"
                onClick={() => {
                  setLockedAlertLevel(null);
                  handleSelectLevelFromMap(puppyProgress.unlockedLevelNumber);
                }}
              >
                Go to Active Level {puppyProgress.unlockedLevelNumber}
              </button>
              <button
                type="button"
                className="btn-secondary-action"
                onClick={() => setLockedAlertLevel(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESEARCH & LEARNING ANALYTICS MODAL */}
      {showAnalyticsModal && (
        <LearningAnalyticsModal
          missionProgress={puppyProgress}
          competencyProfile={competencyProfile}
          onClose={() => setShowAnalyticsModal(false)}
          onResetDemo={handleResetDemoData}
        />
      )}
    </div>
  );
}
