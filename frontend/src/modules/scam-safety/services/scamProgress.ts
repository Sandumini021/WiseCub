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

/** Primary storage key in localStorage (legacy/unscoped fallback). */
export const SCAM_PROGRESS_STORAGE_KEY = "wisecub.scamSafety.progress";

/** Legacy fallback storage keys for backward compatibility with unscoped callers. */
export const SCAM_COMPLETED_STORAGE_KEY = "wisecub.scamSafety.completedCategories";
export const SCAM_SCORES_STORAGE_KEY = "wisecub.scamSafety.scores";

/** Returns the account-scoped storage key for a child ID. */
export function getScamProgressKey(childId?: string): string {
  const clean = childId?.trim();
  if (clean) {
    return `wisecub.scamSafety.progress.${clean}`;
  }
  return SCAM_PROGRESS_STORAGE_KEY;
}

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
 * When childId is provided, ONLY reads that child's account-scoped key.
 * Never merges unowned legacy storage into an authenticated account.
 * When childId is omitted, reads the unscoped legacy key for backward compatibility.
 */
export function loadScamProgress(childId?: string): ScamProgress {
  const defaultProgress: ScamProgress = {
    completedCategories: [],
    categoryScores: {},
    lastUpdated: new Date().toISOString(),
  };

  if (typeof window === "undefined" || !window.localStorage) {
    return defaultProgress;
  }

  const cleanId = childId?.trim();
  const completedSet = new Set<CategoryId>();
  const scores: Partial<Record<CategoryId, number>> = {};

  if (cleanId) {
    // Account-specific progress: ONLY read the child-scoped key.
    // NEVER merge unowned legacy global storage into a specific account!
    try {
      const raw = window.localStorage.getItem(getScamProgressKey(cleanId));
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
      // Malformed JSON; return default empty progress
    }

    const completedCategories = CATEGORY_ORDER.filter((id) =>
      completedSet.has(id)
    );

    return {
      completedCategories,
      categoryScores: scores,
      lastUpdated: new Date().toISOString(),
    };
  }

  // Unscoped / legacy fallback (used only when no childId is provided)
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
 * When childId is provided, writes exclusively to the child-scoped key.
 */
export function persistScamProgress(progress: ScamProgress, childId?: string): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  const cleanId = childId?.trim();
  try {
    if (cleanId) {
      window.localStorage.setItem(
        getScamProgressKey(cleanId),
        JSON.stringify(progress)
      );
    } else {
      window.localStorage.setItem(
        SCAM_PROGRESS_STORAGE_KEY,
        JSON.stringify(progress)
      );
      // Also write to legacy key for compatibility with older unscoped callers
      window.localStorage.setItem(
        SCAM_COMPLETED_STORAGE_KEY,
        JSON.stringify(progress.completedCategories)
      );
    }
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
  scorePercent: number,
  childId?: string
): ScamProgress {
  const current = loadScamProgress(childId);
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

  persistScamProgress(updatedProgress, childId);
  return updatedProgress;
}

/**
 * Marks a category as completed directly (e.g. on manual pass confirmation).
 */
export function markCategoryCompleted(catId: CategoryId, childId?: string): ScamProgress {
  return saveCategoryProgress(catId, 100, childId);
}

/**
 * Resets all scam safety progress for the specified child (or default).
 */
export function resetScamProgress(childId?: string): ScamProgress {
  const empty: ScamProgress = {
    completedCategories: [],
    categoryScores: {},
    lastUpdated: new Date().toISOString(),
  };
  persistScamProgress(empty, childId);
  return empty;
}

// ─────────────────────────────────────────────────────────────────────────────
//  BACKEND SYNC HELPERS
//
//  These functions connect the local localStorage-based progress to the
//  WiseCub backend (PUT/GET /api/state/{child_id}/safety).
//
//  Design principles:
//  - localStorage is kept as a local per-child cache.
//  - Backend sync is fire-and-forget (non-blocking). A failed request never
//    clears or replaces valid local progress.
//  - Merge is additive: the best score for each category is always kept,
//    and completed categories are never removed once earned.
//  - Progress is strictly isolated per child: unowned legacy data or other
//    children's progress is never merged into a new child's account.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merges two ScamProgress objects so that:
 * - completedCategories is the union of both sets, in CATEGORY_ORDER.
 * - categoryScores keeps the higher score for each category.
 * - lastUpdated reflects the most recent of the two timestamps.
 *
 * This is a pure function with no side effects — safe to unit-test.
 */
export function mergeProgress(a: ScamProgress, b: ScamProgress): ScamProgress {
  const completedSet = new Set<CategoryId>([
    ...a.completedCategories,
    ...b.completedCategories,
  ]);

  const mergedScores: Partial<Record<CategoryId, number>> = {};
  for (const cat of CATEGORY_ORDER) {
    const scoreA = a.categoryScores[cat];
    const scoreB = b.categoryScores[cat];
    if (scoreA !== undefined && scoreB !== undefined) {
      mergedScores[cat] = Math.max(scoreA, scoreB);
    } else if (scoreA !== undefined) {
      mergedScores[cat] = scoreA;
    } else if (scoreB !== undefined) {
      mergedScores[cat] = scoreB;
    }
    // If a score meets the passing threshold, ensure the category is marked completed
    const best = mergedScores[cat];
    if (best !== undefined && isCategoryPassing(best)) {
      completedSet.add(cat);
    }
  }

  const completedCategories = CATEGORY_ORDER.filter((id) => completedSet.has(id));

  // Keep whichever lastUpdated is more recent
  const tsA = new Date(a.lastUpdated).getTime();
  const tsB = new Date(b.lastUpdated).getTime();
  const lastUpdated = new Date(Math.max(tsA, tsB)).toISOString();

  return { completedCategories, categoryScores: mergedScores, lastUpdated };
}

/**
 * Loads Scam Safety progress from the backend for the given child,
 * merges it with the child's local progress (keeping best scores),
 * persists the merged result locally for this child, and returns it.
 *
 * If the backend returns 404 (brand new child with no saved state yet):
 * - It returns only the child's own progress (which is empty for new signups).
 * - It NEVER inherits or merges unowned legacy progress into a new child!
 *
 * @param childId   - The authenticated child's UUID (from demoSession.childId()).
 * @param loadState - The loadModuleState helper from apiClient.
 * @returns         The merged ScamProgress for this child.
 */
export async function syncProgressFromBackend(
  childId: string,
  loadState: (
    childId: string,
    module: string,
  ) => Promise<{ child_id: string; module: string; data: unknown }>,
): Promise<ScamProgress> {
  const cleanId = childId?.trim();
  const local = loadScamProgress(cleanId);

  if (!cleanId) {
    return local;
  }

  try {
    const response = await loadState(cleanId, "safety");
    const remote = response.data;

    // Validate that the remote payload looks like a ScamProgress object
    if (
      remote &&
      typeof remote === "object" &&
      Array.isArray((remote as ScamProgress).completedCategories)
    ) {
      const remoteProgress: ScamProgress = {
        completedCategories: (
          (remote as ScamProgress).completedCategories ?? []
        ).filter(isValidCategoryId),
        categoryScores: {},
        lastUpdated:
          (remote as ScamProgress).lastUpdated ?? new Date().toISOString(),
      };

      // Validate and copy remote scores
      const remoteScores = (remote as ScamProgress).categoryScores ?? {};
      if (remoteScores && typeof remoteScores === "object") {
        for (const [key, val] of Object.entries(remoteScores)) {
          if (isValidCategoryId(key) && typeof val === "number") {
            remoteProgress.categoryScores[key] = val;
          }
        }
      }

      const merged = mergeProgress(local, remoteProgress);
      persistScamProgress(merged, cleanId);
      return merged;
    }
  } catch {
    // 404 (no saved state yet) or network error — return local progress for this child.
    // For a new signup, local is { completedCategories: [], categoryScores: {} },
    // so they start fresh at Level 1 with no prior levels completed.
  }

  return local;
}

/**
 * Saves the given ScamProgress to the backend for the given child.
 * Fire-and-forget: errors are silently swallowed so the UI is never blocked.
 *
 * @param childId   - The authenticated child's UUID.
 * @param progress  - The current ScamProgress to persist.
 * @param saveState - The saveModuleState helper from apiClient.
 */
export function syncProgressToBackend(
  childId: string,
  progress: ScamProgress,
  saveState: (childId: string, module: string, data: unknown) => Promise<unknown>,
): void {
  const cleanId = childId?.trim();
  if (!cleanId) {
    return;
  }
  void saveState(cleanId, "safety", {
    completedCategories: progress.completedCategories,
    categoryScores: progress.categoryScores,
    lastUpdated: progress.lastUpdated,
  }).catch(() => {
    // Non-blocking: backend errors do not affect local progress or the UI
  });
}

