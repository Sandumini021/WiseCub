import { describe, expect, it } from "vitest";
import { applyTaxRule, type TaxRule } from "./applyTax";

const practice: TaxRule = {
  id: "practice_simple",
  mode: "hypothetical",
  title: "Practice",
  year_of_assessment: null,
  personal_relief: "50000",
  bands: [
    { width: "50000", rate: "0.06" },
    { width: "50000", rate: "0.18" },
    { width: null, rate: "0.24" },
  ],
  interest_ait_rate: null,
  expired: false,
  is_current: false,
  sources: [],
  notes: [],
  valid_from: "2000-01-01",
  valid_to: "2099-12-31",
  verification_date: null,
};

describe("applyTaxRule slider math", () => {
  it("keeps tax at zero below and at relief", () => {
    expect(applyTaxRule(practice, 0).tax).toBe(0);
    expect(applyTaxRule(practice, 50000).tax).toBe(0);
  });

  it("taxes only the slice above relief", () => {
    expect(applyTaxRule(practice, 50001).tax).toBe(0.06);
  });

  it("applies bands separately", () => {
    expect(applyTaxRule(practice, 120000).tax).toBe(6600);
  });

  it("rejects negatives", () => {
    expect(() => applyTaxRule(practice, -1)).toThrow(/negative/);
  });
});
