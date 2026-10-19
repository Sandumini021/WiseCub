import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  CATEGORY_ORDER,
  isCategoryPassing,
  calculateScorePercent,
  getCategoryStatus,
  getNextCategory,
  loadScamProgress,
  saveCategoryProgress,
  SCAM_SCORES_STORAGE_KEY,
  type CategoryId,
} from "../modules/scam-safety/services/scamProgress.ts";

// Mock localStorage for Node test runner
class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

// Attach mock window & localStorage
const mockStorage = new LocalStorageMock();
(globalThis as unknown as { window: { localStorage: LocalStorageMock } }).window = {
  localStorage: mockStorage,
};

describe("WiseCub Scam Safety - Level Unlocking & Progress System", () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it("Case 1: Score 79% -> does NOT pass and next category stays locked", () => {
    assert.equal(isCategoryPassing(79), false, "79% must not count as passing");
    
    // Save 79% for 'phishing'
    const progress = saveCategoryProgress("phishing", 79);
    assert.ok(
      !progress.completedCategories.includes("phishing"),
      "Phishing must NOT be marked completed with 79%"
    );

    // Next category ('sms') must remain locked
    const nextStatus = getCategoryStatus("sms", progress.completedCategories);
    assert.equal(nextStatus, "locked", "Scam text messages must remain locked when Phishing score is 79%");
  });

  it("Case 2: Score exactly 80% -> passes and unlocks next category", () => {
    assert.equal(isCategoryPassing(80), true, "Exactly 80% must count as passing");
    assert.equal(calculateScorePercent(4, 5), 80, "4 out of 5 correct must be 80%");

    // Save 80% for 'phishing'
    const progress = saveCategoryProgress("phishing", 80);
    assert.ok(
      progress.completedCategories.includes("phishing"),
      "Phishing must be marked completed with 80%"
    );

    // Current category is completed
    assert.equal(getCategoryStatus("phishing", progress.completedCategories), "completed");

    // Next category ('sms') must be unlocked ('available')
    const nextStatus = getCategoryStatus("sms", progress.completedCategories);
    assert.equal(nextStatus, "available", "Scam text messages must become available when Phishing is passed with 80%");

    // Third category ('qr') must still be locked
    assert.equal(getCategoryStatus("qr", progress.completedCategories), "locked");
  });

  it("Case 3: Score 81% -> passes and unlocks next category", () => {
    assert.equal(isCategoryPassing(81), true, "81% must count as passing");

    const progress = saveCategoryProgress("phishing", 81);
    assert.ok(
      progress.completedCategories.includes("phishing"),
      "Phishing must be marked completed with 81%"
    );

    const nextStatus = getCategoryStatus("sms", progress.completedCategories);
    assert.equal(nextStatus, "available", "Scam text messages must become available when Phishing score is 81%");
  });

  it("Case 4: Completing a category updates progress immediately without requiring manual refresh", () => {
    // Initial state: only 'phishing' is available, 'sms' is locked
    const initial = loadScamProgress();
    assert.equal(getCategoryStatus("phishing", initial.completedCategories), "available");
    assert.equal(getCategoryStatus("sms", initial.completedCategories), "locked");

    // Complete phishing with 100%
    const updated = saveCategoryProgress("phishing", 100);

    // Immediate return value reflects completed status and unlocked next level
    assert.equal(getCategoryStatus("phishing", updated.completedCategories), "completed");
    assert.equal(getCategoryStatus("sms", updated.completedCategories), "available");
  });

  it("Case 5: Refreshing the page (re-loading from storage) preserves unlocked state", () => {
    // Save passing score for 'phishing'
    saveCategoryProgress("phishing", 80);

    // Simulate page reload by creating fresh load
    const reloaded = loadScamProgress();
    assert.ok(reloaded.completedCategories.includes("phishing"), "Completed categories must persist across reload");
    assert.equal(getCategoryStatus("sms", reloaded.completedCategories), "available", "Next category must remain unlocked after reload");
  });

  it("Case 6: Previously earned passing scores in legacy storage are correctly reflected", () => {
    // Simulate legacy storage format (prior to this fix)
    mockStorage.setItem(
      SCAM_SCORES_STORAGE_KEY,
      JSON.stringify({ phishing: 85, sms: 60 })
    );

    const loaded = loadScamProgress();
    assert.ok(
      loaded.completedCategories.includes("phishing"),
      "Phishing should be recognized as completed because score was >= 80%"
    );
    assert.ok(
      !loaded.completedCategories.includes("sms"),
      "SMS should NOT be completed because score was < 80%"
    );
    assert.equal(getCategoryStatus("sms", loaded.completedCategories), "available", "SMS should be unlocked because Phishing passed");
    assert.equal(getCategoryStatus("qr", loaded.completedCategories), "locked", "QR should remain locked");
  });

  it("Case 7: Next category opens successfully in sequence", () => {
    // Phishing completed
    const progress = saveCategoryProgress("phishing", 80);
    const nextCat = getNextCategory("phishing");
    assert.equal(nextCat, "sms", "Next category after phishing must be sms");

    const status = getCategoryStatus(nextCat!, progress.completedCategories);
    assert.equal(status, "available", "Next category must be available to open");

    // Complete sms with 80%
    const progress2 = saveCategoryProgress("sms", 80);
    const nextCat2 = getNextCategory("sms");
    assert.equal(nextCat2, "qr", "Next category after sms must be qr");
    assert.equal(getCategoryStatus(nextCat2!, progress2.completedCategories), "available");
  });

  it("Case 8: Completing the final category does not cause an error or invalid unlock", () => {
    const finalCategory: CategoryId = "financial";
    assert.equal(
      CATEGORY_ORDER[CATEGORY_ORDER.length - 1],
      finalCategory,
      "Final category must be 'financial'"
    );

    // Complete all categories up to final
    for (const cat of CATEGORY_ORDER) {
      saveCategoryProgress(cat, 100);
    }

    const allProgress = loadScamProgress();
    assert.equal(allProgress.completedCategories.length, 6);

    // Next category after final must be null (no crash, no out-of-bounds)
    const nextAfterFinal = getNextCategory(finalCategory);
    assert.equal(nextAfterFinal, null, "Final category must return null for next category");

    // All categories completed
    const allPassed = CATEGORY_ORDER.every((id) =>
      allProgress.completedCategories.includes(id)
    );
    assert.ok(allPassed, "All 6 categories should be completed");
  });
});

describe("WiseCub Scam Safety - Scam Text Messages Level", () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it("SMS Level Content: Contains comprehensive lessons and realistic child-friendly scenarios", async () => {
    const { SMS_LESSON_SECTIONS, SMS_SCENARIOS, getLessonSectionsForCategory, getScenariosForCategory } =
      await import("../modules/scam-safety/data/smsScenarios.ts");

    // Verify lesson sections
    assert.equal(SMS_LESSON_SECTIONS.length, 7, "SMS lesson must contain 7 sections");
    const headings = SMS_LESSON_SECTIONS.map((s: { heading: string }) => s.heading);
    assert.ok(headings.some((h: string) => h.includes("Smishing")), "Should cover smishing definition");
    assert.ok(headings.some((h: string) => h.includes("urgency")), "Should cover false urgency");
    assert.ok(headings.some((h: string) => h.includes("links")), "Should cover shortened/suspicious links");
    assert.ok(headings.some((h: string) => h.includes("OTPs")), "Should cover OTP/PIN demands");
    assert.ok(headings.some((h: string) => h.includes("Mum")), "Should cover Hi Mum impersonation");

    // Verify getter functions
    assert.equal(getLessonSectionsForCategory("sms").length, 7);
    assert.equal(getScenariosForCategory("sms").length, 8);

    // Verify SMS scenarios
    assert.equal(SMS_SCENARIOS.length, 8, "Must contain 8 SMS scenarios");
    let suspiciousCount = 0;
    let safeCount = 0;

    for (const scenario of SMS_SCENARIOS) {
      assert.ok(scenario.id >= 201 && scenario.id <= 208, `Invalid scenario ID: ${scenario.id}`);
      assert.ok(scenario.sender && scenario.sender.length > 0, "Scenario must have a sender");
      assert.ok(scenario.body && scenario.body.length > 0, "Scenario must have a message body");
      assert.ok(
        scenario.correctAnswer === "Suspicious" || scenario.correctAnswer === "Looks Safe",
        "Answer must be Suspicious or Looks Safe"
      );
      assert.ok(scenario.warningSigns.length >= 2, "Must provide warning signs");
      assert.ok(scenario.explanation.length > 0, "Must provide explanation");
      assert.ok(scenario.tip.length > 0, "Must provide actionable tip");

      if (scenario.correctAnswer === "Suspicious") suspiciousCount++;
      if (scenario.correctAnswer === "Looks Safe") safeCount++;
    }

    assert.equal(suspiciousCount, 5, "Must have 5 suspicious SMS scenarios");
    assert.equal(safeCount, 3, "Must have 3 safe SMS scenarios");
  });

  it("SMS Level Unlocking: Score < 80% on SMS keeps Fake QR-code offers locked", () => {
    // Complete Phishing first so SMS is available
    saveCategoryProgress("phishing", 80);

    // Score 60% on SMS (3 out of 5)
    const p1 = saveCategoryProgress("sms", 60);
    assert.ok(!p1.completedCategories.includes("sms"), "SMS should not be marked completed with 60%");
    assert.equal(getCategoryStatus("qr", p1.completedCategories), "locked", "QR must remain locked with 60% SMS score");

    // Score 79% on SMS
    const p2 = saveCategoryProgress("sms", 79);
    assert.ok(!p2.completedCategories.includes("sms"), "SMS should not be marked completed with 79%");
    assert.equal(getCategoryStatus("qr", p2.completedCategories), "locked", "QR must remain locked with 79% SMS score");
  });

  it("SMS Level Unlocking: Score >= 80% on SMS unlocks Fake QR-code offers (qr)", () => {
    // Complete Phishing first
    saveCategoryProgress("phishing", 80);

    // Score exactly 80% on SMS (4 out of 5)
    const p80 = saveCategoryProgress("sms", 80);
    assert.ok(p80.completedCategories.includes("sms"), "SMS must be marked completed with 80%");
    assert.equal(getCategoryStatus("sms", p80.completedCategories), "completed");
    assert.equal(getCategoryStatus("qr", p80.completedCategories), "available", "Fake QR-code offers must unlock after passing SMS");

    // Reload from storage: verifies unlocked state persists
    const reloaded = loadScamProgress();
    assert.ok(reloaded.completedCategories.includes("sms"), "SMS completion persists in storage");
    assert.equal(getCategoryStatus("qr", reloaded.completedCategories), "available", "QR remains unlocked after storage reload");
  });
});

describe("WiseCub Scam Safety - Fake QR-code Offers Level (qr)", () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it("QR Level Content: Contains 7 lesson sections and 8 scenarios with correct answer distribution", async () => {
    const { getLessonSectionsForCategory, getScenariosForCategory } = await import(
      "../modules/scam-safety/data/smsScenarios.ts"
    );

    const sections = getLessonSectionsForCategory("qr");
    assert.equal(sections.length, 7, "QR lesson must contain 7 sections");
    const headings = sections.map((s) => s.heading);
    assert.ok(headings.some((h) => h.includes("Quishing")), "Should cover Quishing");
    assert.ok(headings.some((h) => h.includes("Sticker")), "Should cover sticker trick");
    assert.ok(headings.some((h) => h.includes("Preview")), "Should cover checking preview link");

    const scenarios = getScenariosForCategory("qr");
    assert.equal(scenarios.length, 8, "Must contain 8 QR scenarios");
    let suspiciousCount = 0;
    let safeCount = 0;

    for (const sc of scenarios) {
      assert.ok(sc.id >= 301 && sc.id <= 308, `Invalid scenario ID: ${sc.id}`);
      assert.ok(sc.body.length > 0, "Scenario must have body");
      assert.ok(sc.warningSigns.length >= 2, "Must provide warning signs");
      assert.ok(sc.explanation.length > 0, "Must provide explanation");
      assert.ok(sc.tip.length > 0, "Must provide tip");

      if (sc.correctAnswer === "Suspicious") suspiciousCount++;
      if (sc.correctAnswer === "Looks Safe") safeCount++;
    }

    assert.equal(suspiciousCount, 5, "Must have 5 suspicious QR scenarios");
    assert.equal(safeCount, 3, "Must have 3 safe QR scenarios");
  });

  it("QR Level Unlocking: Passing QR with >= 80% unlocks Prize scams (prize)", () => {
    saveCategoryProgress("phishing", 80);
    saveCategoryProgress("sms", 80);

    // Score 70% on QR
    const pFail = saveCategoryProgress("qr", 70);
    assert.equal(getCategoryStatus("prize", pFail.completedCategories), "locked");

    // Score 80% on QR
    const pPass = saveCategoryProgress("qr", 80);
    assert.equal(getCategoryStatus("qr", pPass.completedCategories), "completed");
    assert.equal(getCategoryStatus("prize", pPass.completedCategories), "available");
  });
});

describe("WiseCub Scam Safety - Prize and Giveaway Scams Level (prize)", () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it("Prize Level Content: Contains 7 lesson sections and 8 scenarios with correct answer distribution", async () => {
    const { getLessonSectionsForCategory, getScenariosForCategory } = await import(
      "../modules/scam-safety/data/smsScenarios.ts"
    );

    const sections = getLessonSectionsForCategory("prize");
    assert.equal(sections.length, 7, "Prize lesson must contain 7 sections");
    const headings = sections.map((s) => s.heading);
    assert.ok(headings.some((h) => h.includes("Wheel") || h.includes("Mystery")), "Should cover spin wheel/mystery box");
    assert.ok(headings.some((h) => h.includes("Shipping Fee") || h.includes("Advance")), "Should cover advance fees");

    const scenarios = getScenariosForCategory("prize");
    assert.equal(scenarios.length, 8, "Must contain 8 prize scenarios");
    let suspiciousCount = 0;
    let safeCount = 0;

    for (const sc of scenarios) {
      assert.ok(sc.id >= 401 && sc.id <= 408, `Invalid scenario ID: ${sc.id}`);
      assert.ok(sc.body.length > 0, "Scenario must have body");
      assert.ok(sc.warningSigns.length >= 2, "Must provide warning signs");
      assert.ok(sc.explanation.length > 0, "Must provide explanation");
      assert.ok(sc.tip.length > 0, "Must provide tip");

      if (sc.correctAnswer === "Suspicious") suspiciousCount++;
      if (sc.correctAnswer === "Looks Safe") safeCount++;
    }

    assert.equal(suspiciousCount, 5, "Must have 5 suspicious prize scenarios");
    assert.equal(safeCount, 3, "Must have 3 safe prize scenarios");
  });

  it("Prize Level Unlocking: Passing Prize with >= 80% unlocks Impersonation scams (impersonation)", () => {
    saveCategoryProgress("phishing", 80);
    saveCategoryProgress("sms", 80);
    saveCategoryProgress("qr", 80);

    const pFail = saveCategoryProgress("prize", 60);
    assert.equal(getCategoryStatus("impersonation", pFail.completedCategories), "locked");

    const pPass = saveCategoryProgress("prize", 80);
    assert.equal(getCategoryStatus("prize", pPass.completedCategories), "completed");
    assert.equal(getCategoryStatus("impersonation", pPass.completedCategories), "available");
  });
});

describe("WiseCub Scam Safety - Impersonation Scams Level (impersonation)", () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it("Impersonation Level Content: Contains 7 lesson sections and 8 scenarios with correct answer distribution", async () => {
    const { getLessonSectionsForCategory, getScenariosForCategory } = await import(
      "../modules/scam-safety/data/smsScenarios.ts"
    );

    const sections = getLessonSectionsForCategory("impersonation");
    assert.equal(sections.length, 7, "Impersonation lesson must contain 7 sections");
    const headings = sections.map((s) => s.heading);
    assert.ok(headings.some((h) => h.includes("Game Moderators") || h.includes("Admin")), "Should cover fake mods/admins");
    assert.ok(headings.some((h) => h.includes("Cloned")), "Should cover cloned profiles");

    const scenarios = getScenariosForCategory("impersonation");
    assert.equal(scenarios.length, 8, "Must contain 8 impersonation scenarios");
    let suspiciousCount = 0;
    let safeCount = 0;

    for (const sc of scenarios) {
      assert.ok(sc.id >= 501 && sc.id <= 508, `Invalid scenario ID: ${sc.id}`);
      assert.ok(sc.body.length > 0, "Scenario must have body");
      assert.ok(sc.warningSigns.length >= 2, "Must provide warning signs");
      assert.ok(sc.explanation.length > 0, "Must provide explanation");
      assert.ok(sc.tip.length > 0, "Must provide tip");

      if (sc.correctAnswer === "Suspicious") suspiciousCount++;
      if (sc.correctAnswer === "Looks Safe") safeCount++;
    }

    assert.equal(suspiciousCount, 5, "Must have 5 suspicious impersonation scenarios");
    assert.equal(safeCount, 3, "Must have 3 safe impersonation scenarios");
  });

  it("Impersonation Level Unlocking: Passing Impersonation with >= 80% unlocks Financial scams (financial)", () => {
    saveCategoryProgress("phishing", 80);
    saveCategoryProgress("sms", 80);
    saveCategoryProgress("qr", 80);
    saveCategoryProgress("prize", 80);

    const pFail = saveCategoryProgress("impersonation", 75);
    assert.equal(getCategoryStatus("financial", pFail.completedCategories), "locked");

    const pPass = saveCategoryProgress("impersonation", 85);
    assert.equal(getCategoryStatus("impersonation", pPass.completedCategories), "completed");
    assert.equal(getCategoryStatus("financial", pPass.completedCategories), "available");
  });
});

describe("WiseCub Scam Safety - Deceptive Financial Offers Level (financial)", () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it("Financial Level Content: Contains 7 lesson sections and 8 scenarios with correct answer distribution", async () => {
    const { getLessonSectionsForCategory, getScenariosForCategory } = await import(
      "../modules/scam-safety/data/smsScenarios.ts"
    );

    const sections = getLessonSectionsForCategory("financial");
    assert.equal(sections.length, 7, "Financial lesson must contain 7 sections");
    const headings = sections.map((s) => s.heading);
    assert.ok(headings.some((h) => h.includes("Doubler")), "Should cover money doublers");
    assert.ok(headings.some((h) => h.includes("Pyramid")), "Should cover pyramid schemes");

    const scenarios = getScenariosForCategory("financial");
    assert.equal(scenarios.length, 8, "Must contain 8 financial scenarios");
    let suspiciousCount = 0;
    let safeCount = 0;

    for (const sc of scenarios) {
      assert.ok(sc.id >= 601 && sc.id <= 608, `Invalid scenario ID: ${sc.id}`);
      assert.ok(sc.body.length > 0, "Scenario must have body");
      assert.ok(sc.warningSigns.length >= 2, "Must provide warning signs");
      assert.ok(sc.explanation.length > 0, "Must provide explanation");
      assert.ok(sc.tip.length > 0, "Must provide tip");

      if (sc.correctAnswer === "Suspicious") suspiciousCount++;
      if (sc.correctAnswer === "Looks Safe") safeCount++;
    }

    assert.equal(suspiciousCount, 5, "Must have 5 suspicious financial scenarios");
    assert.equal(safeCount, 3, "Must have 3 safe financial scenarios");
  });

  it("End-to-End Progression: Completing all 6 categories unlocks entire journey", () => {
    const cats: CategoryId[] = ["phishing", "sms", "qr", "prize", "impersonation", "financial"];
    for (const c of cats) {
      const p = saveCategoryProgress(c, 100);
      assert.ok(p.completedCategories.includes(c));
    }
    const finalState = loadScamProgress();
    assert.equal(finalState.completedCategories.length, 6);
    assert.ok(cats.every((c) => finalState.completedCategories.includes(c)));
  });
});


