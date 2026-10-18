/**
 * researchSession.ts
 *
 * Pseudonymous research session helper for the WiseCub Scam Safety mock drill.
 *
 * Privacy constraints:
 * - Uses sessionStorage only. The ID is cleared automatically when the tab closes.
 *   It is NEVER written to localStorage.
 * - Uses crypto.randomUUID() exclusively. Math.random() is never used.
 * - No name, email, age, school, IP address, or device fingerprint is collected.
 * - If sessionStorage or crypto.randomUUID() is unavailable, returns null so the
 *   educational drill can still run without recording a research event.
 *
 * Tier 2 / mock prototype only. No backend call is made here.
 */

const SESSION_KEY = "wisecub.research.sessionId";

/** UUID v4 validation pattern. */
const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value: string): boolean {
  return UUID_V4_RE.test(value);
}

/**
 * Generates a cryptographically random UUID v4.
 * Returns null if crypto.randomUUID is unavailable.
 */
export function generateSessionId(): string | null {
  try {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }
    console.warn(
      "[WiseCub Research] crypto.randomUUID() is not available. " +
        "Research event logging will be disabled for this session."
    );
    return null;
  } catch {
    console.warn(
      "[WiseCub Research] Failed to generate a session ID. " +
        "Research event logging will be disabled for this session."
    );
    return null;
  }
}

/**
 * Returns the pseudonymous session ID for the current browser tab.
 * Reuses an existing valid UUID from sessionStorage, or generates and stores a new one.
 * Returns null if UUID generation is unavailable — the drill must still function.
 */
export function getOrCreateSessionId(): string | null {
  // 1. Try to reuse an existing valid session ID
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored && isValidUuid(stored)) {
      return stored;
    }
  } catch {
    // sessionStorage.getItem failed — continue to generate a new ID.
  }

  // 2. Generate a new session ID
  const newId = generateSessionId();
  if (newId === null) {
    return null;
  }

  // 3. Persist the new session ID
  try {
    sessionStorage.setItem(SESSION_KEY, newId);
  } catch {
    console.warn(
      "[WiseCub Research] Could not persist session ID to sessionStorage. " +
        "The session ID is available for this render only."
    );
  }

  return newId;
}
