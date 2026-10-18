import { useEffect, useState } from 'react';
import { MISSION_CATALOG } from '../data/missions/catalog';
import { RESCUE_PUPPY_MISSION } from '../data/missions/rescuePuppy';
import { LevelDefinition, LevelMasteryResult } from '../types/mission.types';
import { UserLearningState } from '../types/progress.types';
import { PrototypeStorage } from '../services/prototypeStorage';
import { DecisionLogger } from '../services/decisionLogger';
import { FinancialSimulationEngine } from '../engine/financialSimulationEngine';
import { CompetencyEvaluationEngine } from '../engine/competencyEvaluationEngine';
import { EmotionalStateEngine } from '../engine/emotionalStateEngine';
import { LevelMasteryEngine } from '../engine/levelMasteryEngine';

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

import '../styles/gamified-learning.css';

type PageViewMode =
  | 'HUB'
  | 'MAP'
  | 'PLAY_LEVEL'
  | 'TRANSITION'
  | 'EVALUATION'
  | 'RETRY'
  | 'MISSION_COMPLETE';

export function MissionBoardPage() {
  const [userState, setUserState] = useState<UserLearningState>(() =>
    PrototypeStorage.getUserState()
  );
  const [viewMode, setViewMode] = useState<PageViewMode>('HUB');
  const [selectedMissionId, setSelectedMissionId] = useState<string>('mission_rescue_puppy');
  const [currentLevelNumber, setCurrentLevelNumber] = useState<number>(1);
  const [currentMasteryResult, setCurrentMasteryResult] = useState<LevelMasteryResult | null>(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState<boolean>(false);
  const [lockedAlertLevel, setLockedAlertLevel] = useState<LevelDefinition | null>(null);

  // Synchronize user state
  useEffect(() => {
    const loaded = PrototypeStorage.getUserState();
    setUserState(loaded);
    const puppyProgress = loaded.missionProgress['mission_rescue_puppy'];
    if (puppyProgress) {
      setCurrentLevelNumber(puppyProgress.unlockedLevelNumber);
    }
  }, []);

  const currentMission =
    MISSION_CATALOG.find((m) => m.id === selectedMissionId) || RESCUE_PUPPY_MISSION;
  const puppyProgress =
    userState.missionProgress['mission_rescue_puppy'] ||
    userState.missionProgress[selectedMissionId];
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

  const handleSelectLevelFromMap = (lvlNumber: number) => {
    const isUnlocked = lvlNumber <= puppyProgress.unlockedLevelNumber;
    if (isUnlocked) {
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

  const handleResetDemoData = () => {
    const fresh = PrototypeStorage.resetDemoData();
    DecisionLogger.clearEvents();
    setUserState(fresh);
    setCurrentLevelNumber(1);
    setCurrentMasteryResult(null);
    setViewMode('HUB');
    setShowAnalyticsModal(false);
  };

  // -------------------------------------------------------------
  // Core Decision Execution & State Machine
  // -------------------------------------------------------------
  const processDecisionOutcome = (
    financialState: any,
    outcome: any,
    selectedOptionIds?: string[],
    selectedRationaleId?: string
  ) => {
    DecisionLogger.logEvent(
      selectedMissionId,
      activeLevel.id,
      activeLevel.levelNumber,
      (puppyProgress.attemptsByLevel[activeLevel.levelNumber]?.length || 0) + 1,
      'DECISION_SUBMITTED',
      {
        selectedOptionIds,
        allocations: financialState.allocatedCategories,
        totalSpentLKR: financialState.totalSpentLKR,
        selectedRationaleId,
      }
    );

    // 1. Competency Evaluation
    const compEval = CompetencyEvaluationEngine.evaluateDecision(
      activeLevel,
      financialState,
      outcome,
      selectedRationaleId
    );

    // 2. Emotional State Transition
    const { newState: newPuppyState, transition } = EmotionalStateEngine.deriveCharacterState(
      puppyProgress.characterState,
      financialState,
      outcome,
      activeLevel
    );

    // 3. Strict Level Mastery & Gating
    const masteryResult = LevelMasteryEngine.evaluatePassFail(
      activeLevel,
      financialState,
      outcome,
      compEval.dimensionScores,
      transition,
      selectedOptionIds,
      selectedRationaleId
    );

    // 4. Update Profile
    const updatedProfile = CompetencyEvaluationEngine.updateCumulativeProfile(
      userState.competencyProfile,
      compEval.dimensionScores,
      compEval.secondaryScores
    );

    // 5. Persist Progress
    const updatedUserState = PrototypeStorage.recordLevelAttempt(
      selectedMissionId,
      activeLevel.levelNumber,
      activeLevel.id,
      masteryResult,
      newPuppyState,
      updatedProfile
    );

    setUserState(updatedUserState);
    setCurrentMasteryResult(masteryResult);

    // 6. Log Events
    DecisionLogger.logEvent(
      selectedMissionId,
      activeLevel.id,
      activeLevel.levelNumber,
      (puppyProgress.attemptsByLevel[activeLevel.levelNumber]?.length || 0) + 1,
      'CHARACTER_STATE_CHANGED',
      { transition }
    );

    DecisionLogger.logEvent(
      selectedMissionId,
      activeLevel.id,
      activeLevel.levelNumber,
      (puppyProgress.attemptsByLevel[activeLevel.levelNumber]?.length || 0) + 1,
      masteryResult.passed ? 'LEVEL_PASSED' : 'LEVEL_FAILED',
      { passed: masteryResult.passed, score: masteryResult.overallScore }
    );

    // 7. Transition view first!
    setViewMode('TRANSITION');
  };

  // Challenge specific handlers
  const handleOptionSelectionSubmit = (selectedOptionIds: string[]) => {
    const { financialState, outcome } = FinancialSimulationEngine.evaluateOptionSelections(
      activeLevel,
      selectedOptionIds,
      activeLevel.existingReserveLKR || 0
    );
    processDecisionOutcome(financialState, outcome, selectedOptionIds);
  };

  const handleCategoryAllocationsSubmit = (allocations: Record<string, number>) => {
    const { financialState, outcome } = FinancialSimulationEngine.evaluateCategoryAllocations(
      activeLevel,
      allocations,
      activeLevel.existingReserveLKR || 0
    );
    processDecisionOutcome(financialState, outcome);
  };

  const handleMultiPeriodSavingSubmit = (
    weeklyDecisions: Array<{ period: number; savedAmountLKR: number; resistedTemptation: boolean }>
  ) => {
    const { financialState, outcome } = FinancialSimulationEngine.evaluateMultiPeriodSavings(
      activeLevel,
      weeklyDecisions
    );
    processDecisionOutcome(financialState, outcome);
  };

  const handleTradeoffJustificationSubmit = (
    selectedOptionIds: string[],
    selectedRationaleId: string
  ) => {
    const { financialState, outcome } = FinancialSimulationEngine.evaluateOptionSelections(
      activeLevel,
      selectedOptionIds,
      activeLevel.existingReserveLKR || 0
    );
    processDecisionOutcome(financialState, outcome, selectedOptionIds, selectedRationaleId);
  };

  // -------------------------------------------------------------
  // Flow Handlers after Evaluation
  // -------------------------------------------------------------
  const handleProceedAfterEvaluation = () => {
    if (activeLevel.levelNumber >= 8) {
      setViewMode('MISSION_COMPLETE');
    } else {
      const nextLevelNum = activeLevel.levelNumber + 1;
      setCurrentLevelNumber(nextLevelNum);
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
              <span className="coins-display">🪙 Virtual Coins: {userState.totalVirtualCoins}</span>
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

          {/* Level Story Introduction Card */}
          <div className="level-intro-card">
            <div className="intro-meta-row">
              <span className="meta-topic-pill">
                🎯 Target Competency:{' '}
                <strong>
                  {activeLevel.targetCompetency === 'budgetingSkill'
                    ? 'Budgeting Skill'
                    : activeLevel.targetCompetency === 'spendingDiscipline'
                    ? 'Spending Discipline'
                    : activeLevel.targetCompetency === 'savingBehavior'
                    ? 'Saving Behavior'
                    : activeLevel.targetCompetency === 'investmentAwareness'
                    ? 'Value & Investment'
                    : 'Goal Achievement'}
                </strong>
              </span>
              <span className="meta-objective-pill">Story Chapter {activeLevel.levelNumber}</span>
            </div>
            <h2 className="intro-title">{activeLevel.title}</h2>
            <p className="intro-subtitle">{activeLevel.subtitle}</p>
            <p className="intro-story">{activeLevel.storyIntro}</p>

            <div className="learning-objective-box">
              <strong>Learning Objective:</strong> {activeLevel.learningObjective}
            </div>
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
      {viewMode === 'TRANSITION' && currentMasteryResult && (
        <CharacterTransitionPanel
          transition={currentMasteryResult.characterTransition}
          onContinue={() => setViewMode('EVALUATION')}
        />
      )}

      {/* VIEW 5: COMPETENCY EVALUATION */}
      {viewMode === 'EVALUATION' && currentMasteryResult && (
        <CompetencyEvidenceModal
          masteryResult={currentMasteryResult}
          onProceed={handleProceedAfterEvaluation}
          onRetry={() => setViewMode('RETRY')}
        />
      )}

      {/* VIEW 6: RETRY & REMEDIATION SUPPORT */}
      {viewMode === 'RETRY' && currentMasteryResult && activeLevel && (
        <RetrySupportPanel
          level={activeLevel}
          masteryResult={currentMasteryResult}
          attemptNumber={
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
            <PuppyCharacterSvg
              condition="HEALTHY_ACTIVE"
              emotion="JOYFUL_HEALTHY"
              size={220}
            />
            <h1 className="completion-title">🎉 Barnaby is Fully Rescued & Adopted!</h1>
            <p className="completion-subtitle">
              Through all 8 financial story chapters, your responsible budgeting, savings discipline,
              and emergency preparedness nurtured Barnaby back to vibrant, joyful health!
            </p>
          </div>

          <div className="completion-stats-grid">
            <div className="comp-stat-card">
              <span className="comp-stat-num">8 / 8</span>
              <span className="comp-stat-label">Levels Cleared</span>
            </div>
            <div className="comp-stat-card">
              <span className="comp-stat-num">100%</span>
              <span className="comp-stat-label">Recovery Vitality</span>
            </div>
            <div className="comp-stat-card">
              <span className="comp-stat-num">{userState.totalVirtualCoins}</span>
              <span className="comp-stat-label">Virtual Coins Earned</span>
            </div>
            <div className="comp-stat-card">
              <span className="comp-stat-num">{userState.competencyProfile.overallMasteryLevel}</span>
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
          competencyProfile={userState.competencyProfile}
          onClose={() => setShowAnalyticsModal(false)}
          onResetDemo={handleResetDemoData}
        />
      )}
    </div>
  );
}
