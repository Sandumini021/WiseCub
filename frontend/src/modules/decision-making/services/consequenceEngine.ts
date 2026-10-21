import type {
  ConsequencePack,
  DecisionOptionId,
  ScenarioDefinition,
} from "../types/decisionMaking";

export function buildConsequences(
  scenario: ScenarioDefinition,
  optionId: DecisionOptionId,
): ConsequencePack {
  const selected = scenario.options.find((item) => item.id === optionId);
  const alternatives = scenario.options.filter((item) => item.id !== optionId);

  return {
    optionId,
    immediate: selected?.immediate ?? "",
    future: selected?.future ?? "",
    selectedSnapshot: selected?.snapshot ?? {
      label: "Your choice",
      savings: 0,
      debt: 0,
      stateLabel: "Situation",
      state: "Not available",
      note: "",
    },
    alternativeSnapshots: alternatives.map((item) => item.snapshot),
    sixMonthAssumptions: scenario.sixMonthAssumptions,
  };
}

export function formatRupees(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-LK")}`;
}
