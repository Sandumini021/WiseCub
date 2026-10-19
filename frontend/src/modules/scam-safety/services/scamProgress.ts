/**
 * scamProgress.ts
 *
 * Progress persistence and category unlocking service for WiseCub Scam Safety.
 *
 * Core rules:
 * - A completed category with a score of 80% or higher unlocks the next category.
 * - Exactly 80% counts as passing.
 * - Scores below 80% do not unlock the next category.
 * - Progress is persisted to window.localStorage (following WiseCub key conventions).
 * - Existing stored progress and passing scores are migrated and preserved.
 * - Handles the final category safely without out-of-bounds errors.
 */

export type CategoryId =
  | "phishing"
  | "sms"
  | "qr"
  | "prize"
  | "impersonation"
  | "financial";

export type CategoryStatus = "locked" | "available" | "completed";

/** Ordered list of category IDs — drives the unlock sequence. */
export const CATEGORY_ORDER: readonly CategoryId[] = [
  "phishing",
  "sms",
  "qr",
  "prize",
  "impersonation",
  "financial",
] as const;

/** Passing threshold percentage (80 %). Exactly 80 % is passing. */
export const PASSING_PERCENTAGE = 80;

/** Primary storage key in localStorage. */
export const SCAM_PROGRESS_STORAGE_KEY = "wisecub.scamSafety.progress";

/** Legacy fallback storage keys for backward compatibility. */
export const SCAM_COMPLETED_STORAGE_KEY = "wisecub.scamSafety.completedCategories";
export const SCAM_SCORES_STORAGE_KEY = "wisecub.scamSafety.scores";

export type ScamProgress = {
  completedCategories: CategoryId[];
  categoryScores: Partial<Record<CategoryId, number>>;
  lastUpdated: string;
};

/** Checks if a score percentage meets or exceeds the 80% passing threshold. */
export function isCategoryPassing(scorePercent: number): boolean {
  return scorePercent >= PASSING_PERCENTAGE;
}

/** Calculates an integer percentage from correct answers and total questions. */
export function calculateScorePercent(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

/** Validates whether a string is a recognized CategoryId. */
export function isValidCategoryId(id: unknown): id is CategoryId {
  return (
    typeof id === "string" &&
    (CATEGORY_ORDER as readonly string[]).includes(id)
  );
}

/**
 * Derives each category's status from the set of completed category IDs.
 * - If catId is in completedIds -> "completed"
 * - If catId is the first category ("phishing") -> "available"
 * - If the immediate previous category in CATEGORY_ORDER is completed -> "available"
 * - Otherwise -> "locked"
 */
export function getCategoryStatus(
  catId: CategoryId,
  completedIds: readonly CategoryId[]
): CategoryStatus {
  if (completedIds.includes(catId)) {
    return "completed";
  }
  const idx = CATEGORY_ORDER.indexOf(catId);
  if (idx === 0) {
    return "available"; // First category is always available
  }
  const prevId = CATEGORY_ORDER[idx - 1];
  if (completedIds.includes(prevId)) {
    return "available";
  }
  return "locked";
}

/**
 * Returns the next category in sequence after the given category,
 * or null if it is the final category or unknown.
 */
export function getNextCategory(catId: CategoryId): CategoryId | null {
  const idx = CATEGORY_ORDER.indexOf(catId);
  if (idx >= 0 && idx < CATEGORY_ORDER.length - 1) {
    return CATEGORY_ORDER[idx + 1];
  }
  return null;
}

/**
 * Safely loads scam safety progress from localStorage.
 * Combines primary progress with legacy keys if present, ensuring backward compatibility.
 */
export function loadScamProgress(): ScamProgress {
  const defaultProgress: ScamProgress = {
    completedCategories: [],
    categoryScores: {},
    lastUpdated: new Date().toISOString(),
  };

  if (typeof window === "undefined" || !window.localStorage) {
    return defaultProgress;
  }

  const completedSet = new Set<CategoryId>();
  const scores: Partial<Record<CategoryId, number>> = {};

  // 1. Try reading primary storage
  try {
    const raw = window.localStorage.getItem(SCAM_PROGRESS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.completedCategories)) {
        for (const id of parsed.completedCategories) {
          if (isValidCategoryId(id)) completedSet.add(id);
        }
      }
      if (parsed.categoryScores && typeof parsed.categoryScores === "object") {
        for (const [key, val] of Object.entries(parsed.categoryScores)) {
          if (isValidCategoryId(key) && typeof val === "number") {
            scores[key] = val;
            if (isCategoryPassing(val)) {
              completedSet.add(key);
            }
          }
        }
      }
    }
  } catch {
    // Malformed JSON; proceed to legacy check
  }

  // 2. Fallback / legacy: check completedCategories key
  try {
    const legacyRaw = window.localStorage.getItem(SCAM_COMPLETED_STORAGE_KEY);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw);
      if (Array.isArray(parsed)) {
        for (const id of parsed) {
          if (isValidCategoryId(id)) completedSet.add(id);
        }
      }
    }
  } catch {
    // Ignore legacy read errors
  }

  // 3. Fallback / legacy: check scores key
  try {
    const scoresRaw = window.localStorage.getItem(SCAM_SCORES_STORAGE_KEY);
    if (scoresRaw) {
      const parsed = JSON.parse(scoresRaw);
      if (parsed && typeof parsed === "object") {
        for (const [key, val] of Object.entries(parsed)) {
          if (isValidCategoryId(key) && typeof val === "number") {
            if (scores[key] === undefined || val > (scores[key] ?? 0)) {
              scores[key] = val;
            }
            if (isCategoryPassing(val)) {
              completedSet.add(key);
            }
          }
        }
      }
    }
  } catch {
    // Ignore legacy read errors
  }

  // Preserve canonical category order
  const completedCategories = CATEGORY_ORDER.filter((id) =>
    completedSet.has(id)
  );

  return {
    completedCategories,
    categoryScores: scores,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Persists updated progress to localStorage.
 */
function persistScamProgress(progress: ScamProgress): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(
      SCAM_PROGRESS_STORAGE_KEY,
      JSON.stringify(progress)
    );
    // Also write to legacy key for compatibility with any older readers
    window.localStorage.setItem(
      SCAM_COMPLETED_STORAGE_KEY,
      JSON.stringify(progress.completedCategories)
    );
  } catch {
    // Storage quota or security restriction; state is kept in memory
  }
}

/**
 * Records a category completion attempt with its score percentage.
 * If scorePercent >= 80, the category is marked as completed and unlocks the next level.
 * If scorePercent < 80, the category remains uncompleted.
 * Returns the updated ScamProgress.
 */
export function saveCategoryProgress(
  catId: CategoryId,
  scorePercent: number
): ScamProgress {
  const current = loadScamProgress();
  const passed = isCategoryPassing(scorePercent);

  // Keep highest score
  const previousScore = current.categoryScores[catId] ?? 0;
  const bestScore = Math.max(previousScore, scorePercent);
  const updatedScores: Partial<Record<CategoryId, number>> = {
    ...current.categoryScores,
    [catId]: bestScore,
  };

  const completedSet = new Set<CategoryId>(current.completedCategories);
  if (passed) {
    completedSet.add(catId);
  }

  const updatedCompleted = CATEGORY_ORDER.filter((id) => completedSet.has(id));

  const updatedProgress: ScamProgress = {
    completedCategories: updatedCompleted,
    categoryScores: updatedScores,
    lastUpdated: new Date().toISOString(),
  };

  persistScamProgress(updatedProgress);
  return updatedProgress;
}

/**
 * Marks a category as completed directly (e.g. on manual pass confirmation).
 */
export function markCategoryCompleted(catId: CategoryId): ScamProgress {
  return saveCategoryProgress(catId, 100);
}

/**
 * Resets all scam safety progress (useful for testing or profile resets).
 */
export function resetScamProgress(): ScamProgress {
  const empty: ScamProgress = {
    completedCategories: [],
    categoryScores: {},
    lastUpdated: new Date().toISOString(),
  };
  persistScamProgress(empty);
  return empty;
}
