import { describe, expect, it } from "vitest";
import { gradeTaxLocal, localTaxPack } from "./taxPack";

describe("on-device tax pack", () => {
  it("ships lessons, scenarios, and two rules", () => {
    const pack = localTaxPack("en");
    expect(pack.lessons.length).toBe(6);
    expect(pack.scenarios[0]?.id).toBe("tutoring");
    expect(pack.rules.map((row) => row.id)).toEqual(["practice_simple", "lk_pit_2025_2026"]);
  });

  it("grades the relief calc as zero", () => {
    const result = gradeTaxLocal({ question_id: "q3", amount: "0" });
    expect(result.ok).toBe(true);
    expect(result.points).toBe(15);
  });

  it("rejects a wrong mcq", () => {
    expect(gradeTaxLocal({ question_id: "q1", choice: "b" }).ok).toBe(false);
  });
});
