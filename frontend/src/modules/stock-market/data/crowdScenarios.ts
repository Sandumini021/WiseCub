/** Explicit practice cues. Never infer herd from a popular ticker alone. */

export const CROWD_SCENARIO = {
  scenarioId: "crowd-suntea-demo-1",
  ticker: "SUNTEA" as const,
  text: "Simulated crowd (practice only): 8 in 10 demo traders bought SUNTEA just now. This is a made-up cue — not real people.",
};

export const DROP_SCENARIO = {
  scenarioId: "drop-suntea-demo-1",
  ticker: "SUNTEA" as const,
  changePct: -9,
  text: "Simulated drill: SUNTEA’s pretend price just fell 9%. No real money is involved. You can still pause and read the company note.",
};

export const TRADE_REASONS = [
  { id: "company-note", label: "I read the company note" },
  { id: "crowd", label: "Because of the crowd cue" },
  { id: "price-moved", label: "Because the price moved" },
  { id: "practising", label: "I’m practising" },
  { id: "skip", label: "Prefer not to say" },
] as const;
