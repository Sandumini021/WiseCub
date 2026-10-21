import { LEVELS, TOTAL_LEVELS } from "../data/levels";
import type {
  ChoiceTownProgress,
  DecisionOptionId,
  LevelSession,
  LevelStatus,
  AnalysisResult,
} from "../types/decisionMaking";

const STORAGE_KEY = "wisecub.choiceTown.v1";

/** Starting dashboard state for this frontend prototype (not loaded from a database). */
const DEMO_COMPLETED = [1, 2, 3, 4];
const DEMO_CURRENT = 5;

function emptyProgress(): ChoiceTownProgress {
  return {
    completedLevelIds: [...DEMO_COMPLETED],
    currentLevelId: DEMO_CURRENT,
    sessions: {},
    updatedAt: new Date().toISOString(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseProgress(raw: unknown): ChoiceTownProgress | null {
  if (!isRecord(raw)) return null;
  if (!Array.isArray(raw.completedLevelIds)) return null;
  if (typeof raw.currentLevelId !== "number") return null;
  if (!isRecord(raw.sessions)) return null;
  return {
    completedLevelIds: raw.completedLevelIds.filter(
      (id): id is number => typeof id === "number",
    ),
    currentLevelId: raw.currentLevelId,
    sessions: raw.sessions as Record<string, LevelSession>,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
  };
}

export function readProgress(): ChoiceTownProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return emptyProgress();
    const parsed = parseProgress(JSON.parse(stored) as unknown);
    return parsed ?? emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function writeProgress(progress: ChoiceTownProgress): ChoiceTownProgress {
  const next = {
    completedLevelIds: progress.completedLevelIds,
    currentLevelId: progress.currentLevelId,
    sessions: progress.sessions,
    updatedAt: progress.updatedAt || new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function getLevelStatus(
  levelId: number,
  progress: ChoiceTownProgress,
): LevelStatus {
  if (progress.completedLevelIds.includes(levelId)) return "completed";
  if (levelId === progress.currentLevelId) return "current";
  return "available";
}

export function getSession(levelId: number, progress = readProgress()): LevelSession {
  return progress.sessions[String(levelId)] ?? {};
}

function patchSession(
  levelId: number,
  patch: Partial<LevelSession>,
): ChoiceTownProgress {
  const progress = readProgress();
  const key = String(levelId);
  const current = progress.sessions[key] ?? {};
  return writeProgress({
    ...progress,
    sessions: {
      ...progress.sessions,
      [key]: { ...current, ...patch },
    },
  });
}

export function saveDecisionLocal(levelId: number, optionId: DecisionOptionId): ChoiceTownProgress {
  return patchSession(levelId, { optionId });
}

export function saveReasoning(levelId: number, reasoning: string): ChoiceTownProgress {
  return patchSession(levelId, { reasoning });
}

export function saveAnalysis(levelId: number, analysis: AnalysisResult): ChoiceTownProgress {
  return patchSession(levelId, { analysis });
}

export function completeLevelLocal(levelId: number): ChoiceTownProgress {
  const progress = readProgress();
  const completed = new Set(progress.completedLevelIds);
  completed.add(levelId);
  const completedIds = [...completed].sort((a, b) => a - b);
  const nextLocked = LEVELS.find(
    (level) => !completedIds.includes(level.id),
  );
  return writeProgress({
    ...progress,
    completedLevelIds: completedIds,
    currentLevelId: nextLocked?.id ?? TOTAL_LEVELS,
    sessions: {
      ...progress.sessions,
      [String(levelId)]: {
        ...(progress.sessions[String(levelId)] ?? {}),
        completed: true,
      },
    },
  });
}

export function progressPercent(progress: ChoiceTownProgress): number {
  return Math.round((progress.completedLevelIds.length / TOTAL_LEVELS) * 100);
}
