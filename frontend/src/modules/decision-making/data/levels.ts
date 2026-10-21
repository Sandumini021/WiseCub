import type { LevelDefinition } from "../types/decisionMaking";

export const TOTAL_LEVELS = 10;

export const LEVELS: LevelDefinition[] = [
  {
    id: 1,
    title: "Birthday money",
    description: "Decide how to use a birthday gift wisely.",
    preview:
      "You receive birthday money and need to think about spending, saving, and what matters most to you.",
    cubHint: "Consider what you want now and what you might wish you still had later.",
    icon: "gift",
    playable: true,
  },
  {
    id: 2,
    title: "Friend wants a loan",
    description: "Think about lending money to a friend.",
    preview:
      "A friend asks to borrow money. Think about trust, repayment, and how it might affect your friendship.",
    cubHint: "Lending is a choice about money and about people. Both matter.",
    icon: "loan",
    playable: true,
  },
  {
    id: 3,
    title: "Buy now, pay later",
    description: "Explore spending now and paying later.",
    preview:
      "An offer lets you take something home today and pay over time. What is the trade-off?",
    cubHint: "Paying later can feel easy now. Ask what you will still owe.",
    icon: "bnpl",
    playable: true,
  },
  {
    id: 4,
    title: "Tuition and a festival",
    description: "Balance education expenses and enjoyment.",
    preview:
      "School costs and a festival are both coming up. How do you balance learning and enjoyment?",
    cubHint: "Needs and celebrations can both be important. Plan for both if you can.",
    icon: "festival",
    playable: true,
  },
  {
    id: 5,
    title: "The phone that broke",
    description: "Repair, borrow to buy new, or wait and save.",
    preview:
      "Your phone is broken and you need to decide what to do. Should you repair it, borrow money to buy a new one, or wait and save?",
    cubHint:
      "Consider what you need now, what you may need later, and the trade-offs of each option.",
    icon: "phone",
    playable: true,
  },
  {
    id: 6,
    title: "First salary",
    description: "Plan how to divide income between needs and goals.",
    preview:
      "Your first salary arrives. How might you divide it between needs, saving, and goals?",
    cubHint: "A plan for income often starts with needs, then goals, then wants.",
    icon: "salary",
    playable: true,
  },
  {
    id: 7,
    title: "Lending to family",
    description: "Evaluate a request for financial help.",
    preview:
      "A family member asks for financial help. Think about what you can offer and what you cannot.",
    cubHint: "Helping family can be kind. It still needs a clear limit you can afford.",
    icon: "family",
    playable: true,
  },
  {
    id: 8,
    title: "An unexpected expense",
    description: "Adapt your plans when something goes wrong.",
    preview:
      "Something unexpected costs money. How do you adapt a plan that no longer fits?",
    cubHint: "Plans change. The skill is adjusting without ignoring other needs.",
    icon: "surprise",
    playable: true,
  },
  {
    id: 9,
    title: "Saving for a big goal",
    description: "Compare trade-offs when working toward a goal.",
    preview:
      "A big goal needs time and money. Compare what you give up now to get there later.",
    cubHint: "Waiting can be hard. Compare what you gain and what you postpone.",
    icon: "goal",
    playable: true,
  },
  {
    id: 10,
    title: "A difficult choice",
    description: "Apply your decision-making skills to a complex situation.",
    preview:
      "Several needs compete at once. Use what you have practised to think the choice through.",
    cubHint: "Complex choices need the same steps: needs, money, options, and later effects.",
    icon: "complex",
    playable: true,
  },
];

export function getLevel(id: number): LevelDefinition | undefined {
  return LEVELS.find((level) => level.id === id);
}
