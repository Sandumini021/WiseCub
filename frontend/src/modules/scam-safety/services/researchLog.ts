/**
 * researchLog.ts
 *
 * Mock research event logger for the WiseCub Scam Safety in-app drill.
 *
 * Increment 1 — local prototype only:
 * - Logs to console.log only. No network requests, backend calls, or external
 *   analytics providers are used.
 * - The shape is typed for a future backend POST /safety/events endpoint, but
 *   that connection is explicitly NOT made in this increment.
 *
 * Privacy constraints:
 * - Only a pseudonymous session ID (UUID v4) and the selected hypothetical action
 *   are recorded. No name, email, phone number, age, school, IP address, or
 *   device fingerprint is ever passed to or logged by this module.
 * - If logging fails for any reason, the error is suppressed so the educational
 *   flow is never interrupted.
 */

/** The three hypothetical response choices available in the mock email drill. */
export type DrillAction = "clicked" | "ignored" | "reported";

/**
 * Typed event shape — mirrors the future backend ResearchEvent model.
 * Used only for local console logging in this increment.
 */
type ResearchEvent = {
  session_id: string;
  event_type: "mock_link_action";
  payload: { action: DrillAction };
  recorded_at: string; // ISO-8601
};

/**
 * Logs a mock drill action locally (console only in Increment 1).
 *
 * @param sessionId - Pseudonymous UUID v4 from researchSession.getOrCreateSessionId().
 *                    Pass null to skip logging when UUID generation was unavailable.
 * @param action    - The hypothetical response the learner selected.
 */
export function logDrillAction(
  sessionId: string | null,
  action: DrillAction
): void {
  if (sessionId === null) {
    // UUID generation was unavailable — skip silently; drill continues normally.
    return;
  }

  const event: ResearchEvent = {
    session_id: sessionId,
    event_type: "mock_link_action",
    payload: { action },
    recorded_at: new Date().toISOString(),
  };

  try {
    console.log("[WiseCub Research - Mock]", event);
  } catch {
    // Logging must never interrupt the educational flow.
  }
}
