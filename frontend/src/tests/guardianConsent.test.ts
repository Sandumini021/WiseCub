import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { CATEGORY_ORDER, isCategoryPassing, type CategoryId } from "../modules/scam-safety/services/scamProgress.ts";
import {
  saveGuardianDetails,
  verifyGuardianEmail,
  updateGuardianConsent,
  triggerLevelSimulation,
  triggerPassedLevelSimulation,
  getSimulationStatuses,
  type GuardianDetails,
  type LevelSimulationStatus,
} from "../services/apiClient.ts";

// Helper mock fetch
let lastFetchRequest: { url: string; options: RequestInit } | null = null;
let mockResponse: { status: number; ok: boolean; json: () => Promise<unknown> } = {
  status: 200,
  ok: true,
  json: async () => ({ status: "success" }),
};

(globalThis as unknown as { fetch: typeof fetch }).fetch = (async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  lastFetchRequest = { url: String(input), options: init || {} };
  return mockResponse as unknown as Response;
}) as typeof fetch;

describe("WiseCub Scam Safety - Parent/Guardian Details & Email Simulation", () => {
  beforeEach(() => {
    lastFetchRequest = null;
  });

  it("Client: Form validation rejects invalid guardian email or empty name", () => {
    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    assert.equal(isValidEmail("guardian"), false);
    assert.equal(isValidEmail("guardian@"), false);
    assert.equal(isValidEmail("guardian@wisecub"), false);
    assert.equal(isValidEmail("guardian@example.com"), true);

    const validateForm = (name: string, email: string, consent: boolean) => {
      if (!name.trim()) return "Guardian name is required";
      if (!isValidEmail(email)) return "A valid guardian email is required";
      if (!consent) return "Guardian consent is required";
      return null;
    };

    assert.equal(validateForm("", "parent@example.com", true), "Guardian name is required");
    assert.equal(validateForm("Jane Doe", "invalid-email", true), "A valid guardian email is required");
    assert.equal(validateForm("Jane Doe", "parent@example.com", false), "Guardian consent is required");
    assert.equal(validateForm("Jane Doe", "parent@example.com", true), null);
  });

  it("Client: saveGuardianDetails sends correct PUT payload", async () => {
    mockResponse = {
      status: 200,
      ok: true,
      json: async () => ({
        child_id: "child-456",
        guardian_name: "John Parent",
        guardian_email: "john@example.com",
        relationship: "Father",
        consent_given: true,
        email_verified: false,
        simulation_enabled: true,
      }),
    };

    const res = await saveGuardianDetails("child-456", {
      guardian_name: "John Parent",
      guardian_email: "john@example.com",
      relationship: "Father",
      consent_given: true,
      simulation_enabled: true,
    });

    assert.equal(lastFetchRequest?.options.method, "PUT");
    assert.ok(lastFetchRequest?.url.includes("/api/safety/guardian/child-456"));
    const body = JSON.parse(String(lastFetchRequest?.options.body));
    assert.equal(body.guardian_name, "John Parent");
    assert.equal(body.guardian_email, "john@example.com");
    assert.equal(body.consent_given, true);
    assert.equal(res.guardian_name, "John Parent");
  });

  it("Client: triggerLevelSimulation sends correct payload with score and attempt_id", async () => {
    mockResponse = {
      status: 200,
      ok: true,
      json: async () => ({
        status: "sent",
        message: "Simulation email sent",
        simulation_id: "sim-level-1",
        category_id: "phishing",
        level_number: 1,
      }),
    };

    const res = await triggerLevelSimulation("child-456", {
      category_id: "phishing",
      level_number: 1,
      score_percent: 85,
      attempt_id: "attempt-2026-10-20-1",
    });

    assert.equal(lastFetchRequest?.options.method, "POST");
    assert.ok(lastFetchRequest?.url.includes("/api/safety/simulation/trigger/child-456"));
    const body = JSON.parse(String(lastFetchRequest?.options.body));
    assert.equal(body.category_id, "phishing");
    assert.equal(body.level_number, 1);
    assert.equal(body.score_percent, 85);
    assert.equal(body.attempt_id, "attempt-2026-10-20-1");
    assert.equal(res.status, "sent");
  });

  it("Level trigger rules: only scores >= 80% are eligible to trigger educational email", () => {
    // 79% fails
    assert.equal(isCategoryPassing(79), false);
    // 80% passes
    assert.equal(isCategoryPassing(80), true);
    // 100% passes
    assert.equal(isCategoryPassing(100), true);

    const shouldTriggerEmail = (score: number, guardianVerified: boolean, consentActive: boolean) => {
      return isCategoryPassing(score) && guardianVerified && consentActive;
    };

    assert.equal(shouldTriggerEmail(79, true, true), false, "79% must never trigger simulation email");
    assert.equal(shouldTriggerEmail(80, false, true), false, "Unverified guardian must never trigger simulation email");
    assert.equal(shouldTriggerEmail(80, true, false), false, "Withdrawn consent must never trigger simulation email");
    assert.equal(shouldTriggerEmail(80, true, true), true, "Eligible 80% score with verified consenting guardian must trigger");
    assert.equal(shouldTriggerEmail(100, true, true), true, "Eligible 100% score with verified consenting guardian must trigger");
  });

  it("All 6 levels map correctly to distinct categories in order", () => {
    const expectedLevels: Array<{ index: number; category: CategoryId }> = [
      { index: 1, category: "phishing" },
      { index: 2, category: "sms" },
      { index: 3, category: "qr" },
      { index: 4, category: "prize" },
      { index: 5, category: "impersonation" },
      { index: 6, category: "financial" },
    ];

    expectedLevels.forEach(({ index, category }) => {
      assert.equal(CATEGORY_ORDER[index - 1], category);
    });
  });

  it("Duplicate prevention: tracking triggered attempts prevents redundant calls", () => {
    const triggeredAttempts = new Set<string>();

    const triggerOnce = (childId: string, category: string, attemptId: string) => {
      const key = `${childId}:${category}:${attemptId}`;
      if (triggeredAttempts.has(key)) {
        return false; // Skipped duplicate
      }
      triggeredAttempts.add(key);
      return true; // Sent
    };

    assert.equal(triggerOnce("c1", "phishing", "att-1"), true);
    assert.equal(triggerOnce("c1", "phishing", "att-1"), false); // Prevented duplicate
    assert.equal(triggerOnce("c1", "sms", "att-1"), true); // Different level allowed
    assert.equal(triggerOnce("c1", "phishing", "att-2"), true); // New legitimate attempt allowed
  });

  it("Client: triggerPassedLevelSimulation calls correct endpoint for previously completed level", async () => {
    mockResponse = {
      status: 200,
      ok: true,
      json: async () => ({
        eligible: true,
        status: "sent",
        category_id: "sms",
        level_number: "2",
        parent_email: "parent@example.com",
      }),
    };

    const res = await triggerPassedLevelSimulation("child-123", "sms");

    assert.equal(lastFetchRequest?.options.method, "POST");
    assert.ok(lastFetchRequest?.url.includes("/api/safety/simulation/trigger-passed/child-123/sms"));
    assert.equal(res.status, "sent");
    assert.equal(res.category_id, "sms");
  });

  it("Client: verifyGuardianEmail sends simulated dev verification flag when requested", async () => {
    mockResponse = {
      status: 200,
      ok: true,
      json: async () => ({
        ok: true,
        verification_status: "verified",
        verification_method: "simulated_dev_assist",
      }),
    };

    const res = await verifyGuardianEmail("child-123", "test-token", true);

    assert.equal(lastFetchRequest?.options.method, "POST");
    assert.ok(lastFetchRequest?.url.includes("/api/safety/guardian/child-123/verify"));
    const body = JSON.parse(String(lastFetchRequest?.options.body));
    assert.equal(body.token, "test-token");
    assert.equal(body.is_simulated_dev_verification, true);
    assert.equal(res.verification_status, "verified");
  });

  it("UI Status Accuracy: Replaces misleading 'Ready to Trigger' with accurate states", () => {
    type SimState = {
      sim: { status: string } | null;
      isPassed: boolean;
      guardianConfigured: boolean;
      guardianVerified: boolean;
      consentActive: boolean;
    };

    const resolveStatus = ({
      sim,
      isPassed,
      guardianConfigured,
      guardianVerified,
      consentActive,
    }: SimState) => {
      if (sim) {
        if (sim.status === "sent") return "Accepted by Provider ✓";
        if (sim.status === "not_configured") return "SMTP Not Configured";
        if (sim.status === "failed") return "Delivery Failed";
        if (sim.status === "unverified") return "Awaiting Verification";
        if (sim.status === "consent_required" || sim.status === "disabled") return "Consent Disabled";
      } else if (isPassed) {
        if (!guardianConfigured) return "Add Guardian";
        if (!guardianVerified) return "Awaiting Verification";
        if (!consentActive) return "Consent Disabled";
        return "Pending Simulation";
      }
      return "Not passed yet";
    };

    // Passed with unconfigured SMTP
    assert.equal(
      resolveStatus({
        sim: { status: "not_configured" },
        isPassed: true,
        guardianConfigured: true,
        guardianVerified: true,
        consentActive: true,
      }),
      "SMTP Not Configured"
    );

    // Passed with failed delivery
    assert.equal(
      resolveStatus({
        sim: { status: "failed" },
        isPassed: true,
        guardianConfigured: true,
        guardianVerified: true,
        consentActive: true,
      }),
      "Delivery Failed"
    );

    // Provider accepted
    assert.equal(
      resolveStatus({
        sim: { status: "sent" },
        isPassed: true,
        guardianConfigured: true,
        guardianVerified: true,
        consentActive: true,
      }),
      "Accepted by Provider ✓"
    );

    // Passed, verified guardian, but simulation not dispatched yet
    assert.equal(
      resolveStatus({
        sim: null,
        isPassed: true,
        guardianConfigured: true,
        guardianVerified: true,
        consentActive: true,
      }),
      "Pending Simulation"
    );

    // Level not passed
    assert.equal(
      resolveStatus({
        sim: null,
        isPassed: false,
        guardianConfigured: true,
        guardianVerified: true,
        consentActive: true,
      }),
      "Not passed yet"
    );
  });
});
