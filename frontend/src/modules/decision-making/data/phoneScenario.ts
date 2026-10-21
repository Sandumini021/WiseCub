import type { ScenarioDefinition } from "../types/decisionMaking";

export const PHONE_SCENARIO: ScenarioDefinition = {
  levelId: 5,
  title: "The phone that broke",
  situation:
    "You have Rs. 6,000 saved. Your phone has broken, and you need to decide what to do.",
  facts: [
    { label: "Your savings", value: "Rs. 6,000" },
    { label: "Repair cost", value: "Rs. 4,000" },
    { label: "New phone cost", value: "Rs. 20,000" },
    {
      label: "Cousin offer",
      value: "Willing to lend the extra money to buy a new phone",
    },
  ],
  waitAssumption:
    "If you wait and save Rs. 1,000 a week, it would take about 14 weeks to cover the remaining Rs. 14,000. That waiting time is a scenario assumption, not a guaranteed result.",
  options: [
    {
      id: "A",
      title: "Borrow and buy a new phone",
      shortLabel: "Borrow and buy",
      summary: "Use your savings and borrow the rest from your cousin.",
      bullets: [
        "Use your Rs. 6,000 savings.",
        "Borrow Rs. 14,000 from your cousin.",
        "You will owe Rs. 14,000.",
      ],
      immediate: "You get a new phone, but you owe your cousin Rs. 14,000.",
      future:
        "You need to plan how and when to repay the loan, while still covering other needs.",
      snapshot: {
        label: "Borrow and buy",
        savings: 0,
        debt: 14000,
        stateLabel: "Phone",
        state: "New phone",
        note: "Savings are used. Rs. 14,000 is still owed unless a repayment plan is defined.",
      },
    },
    {
      id: "B",
      title: "Repair your current phone",
      shortLabel: "Repair",
      summary: "Pay for a repair and keep some savings.",
      bullets: [
        "Pay Rs. 4,000 for the repair.",
        "Keep Rs. 2,000 in savings.",
        "Continue using your repaired phone without taking on new debt.",
      ],
      immediate: "You spend Rs. 4,000 and retain Rs. 2,000 in savings.",
      future:
        "You avoid new borrowing and can continue using your current phone, assuming the repair works.",
      snapshot: {
        label: "Repair",
        savings: 2000,
        debt: 0,
        stateLabel: "Phone",
        state: "Repaired phone (assumes the repair works)",
        note: "No new borrowing. You have Rs. 2,000 left.",
      },
    },
    {
      id: "C",
      title: "Wait and save",
      shortLabel: "Wait and save",
      summary: "Keep your savings and wait until you can buy a new phone.",
      bullets: [
        "Delay buying a new phone.",
        "Continue saving until you can afford the new phone.",
        "Avoid borrowing money for the purchase.",
      ],
      immediate:
        "You delay getting a new phone and retain your savings while planning for the purchase.",
      future:
        "Waiting can help you avoid debt, but you must consider whether you can manage without a working phone in the meantime.",
      snapshot: {
        label: "Wait and save",
        savings: 6000,
        debt: 0,
        stateLabel: "Phone",
        state: "No working phone yet",
        note: "Savings stay at Rs. 6,000. A new phone is still unaffordable today.",
      },
    },
  ],
  moneyScale: 20000,
  sixMonthAssumptions: [
    "This comparison is a teaching sketch, not a prediction of your real life.",
    "No repayment schedule is defined, so borrowed money is shown as still owing unless you said how you would repay it.",
    "The repair path assumes the repair continues to work for six months.",
    "The wait-and-save path uses the 14-week saving example only as an assumption (about Rs. 1,000 a week).",
    "None of these paths is labelled as the only correct choice.",
  ],
};

export const REASONING_MAX_CHARS = 400;
export const REASONING_MIN_CHARS = 20;
