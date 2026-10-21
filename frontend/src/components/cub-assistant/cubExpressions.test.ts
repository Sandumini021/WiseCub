import { describe, expect, it } from "vitest";
import {
  CUB_EXPRESSIONS,
  defaultDecisionCub,
  expressionForPattern,
  patternMessage,
} from "./cubExpressions";

describe("cub expressions", () => {
  it("lists all 15 faces", () => {
    expect(CUB_EXPRESSIONS).toHaveLength(15);
  });

  it("maps decision patterns without inventing evidence", () => {
    expect(expressionForPattern("herd_behaviour", "worth_reviewing")).toBe("thinking");
    expect(expressionForPattern("impulsive_investing", "worth_reviewing")).toBe("concerned");
    expect(expressionForPattern("panic_selling", "worth_reviewing")).toBe("concerned");
    expect(expressionForPattern("insufficient_research", "not_observed")).toBe("listening");
    expect(expressionForPattern("herd_behaviour", "insufficient_evidence")).toBe("listening");
  });

  it("keeps not-observed copy from claiming a trait", () => {
    expect(patternMessage("herd_behaviour", "not_observed", "en").toLowerCase()).toMatch(/not seen/);
    expect(defaultDecisionCub({ hasReview: false, hasVisiblePatterns: true, lang: "en" }).expression).toBe(
      "celebrating",
    );
  });
});
