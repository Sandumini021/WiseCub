export type CubReply = {
  text: string;
  path?: string;
  speakPage?: boolean;
};

export const PAGE_GREETINGS: Record<string, string> = {
  "/": "Hi, I’m Cub. Tap Enter as demo child when you are ready. You can type to me, or tap the mic and speak.",
  "/home": "Pick a world. I come with you. The Market Floor is open first. Missions, Scam Alley, and Choice Town come next.",
  "/market": "Welcome to the Market Floor. This is pretend money only. Lesson 1 is open. Say “start lesson 1”, or ask what a share is.",
  "/market/lessons/1":
    "This is Lesson 1. A share is one slice of a company. Read the pie, then take the quick check. Hear it aloud if you want me to read it.",
  "/market/terminal":
    "This is the practice terminal. Prices are synthetic. Buy or sell pretend shares, then Cub will ask you to confirm. No real money.",
  "/market/confirm":
    "Read my warning before you confirm. You may buy fewer shares, or confirm anyway. The point is noticing the risk.",
  "/market/portfolio":
    "This is your practice portfolio. We look at patience and spreading money — never a profit ranking against other children.",
  "/choices": "This is Choice Town. Full scenarios come next. I can take you back to the market if you like.",
  "/missions": "Missions will use story budgets later. For now I can guide you to the other rooms.",
  "/safety": "Scam practice stays inside WiseCub. We never send real messages. I can explain that, or take you home.",
  "/progress": "Progress will show habits, not who made more pretend money. Want the market?",
  "/profile": "Avatar picking will live here soon. I can take you back to the market.",
  "/login": "No password. Type a name if you like, then Get started. I will meet you on the dashboard.",
  "/signup": "This is practice signup. Cub does not keep real passwords. Fill the form, pick an avatar, then go to the playground.",
};

export function greetingFor(path: string): string {
  if (PAGE_GREETINGS[path]) {
    return PAGE_GREETINGS[path];
  }
  if (path.startsWith("/market/lessons")) {
    return PAGE_GREETINGS["/market/lessons/1"];
  }
  return "I’m Cub. Type a message, or tap the mic. I can take you to Market, Choices, Missions, or Safety.";
}

export function suggestionsFor(path: string): string[] {
  if (path === "/market") {
    return ["What is a share?", "Start lesson 1", "Go to Safety", "Is this real money?"];
  }
  if (path.startsWith("/market/lessons")) {
    return ["What is a share?", "Is this real money?", "Back to the market"];
  }
  if (path.startsWith("/market/terminal") || path.startsWith("/market/confirm")) {
    return ["Is this real money?", "Show my portfolio", "Back to the market"];
  }
  if (path.startsWith("/market/portfolio")) {
    return ["Open the terminal", "Is this real money?", "Back to the market"];
  }
  if (path === "/safety") {
    return ["Open the market", "Go home", "Are scams real here?"];
  }
  if (path === "/login") {
    return ["Is this real money?", "What can you do?"];
  }
  if (path === "/home") {
    return ["Open the market", "Go to Safety", "Is this real money?"];
  }
  return ["Open the market", "What can you do?", "Is this real money?", "Go home"];
}

export function matchCubIntent(raw: string): CubReply {
  const text = raw.toLowerCase();

  if (/(real money|real bank|broker|pay real)/.test(text)) {
    return {
      text: "No real money is used. The rupees you see are virtual practice money. Nothing connects to a bank.",
    };
  }
  if (/(scam|phish|email|sms|call).*(send|real|outside)/.test(text) || /are scams real/.test(text)) {
    return {
      text: "Drills stay on this website. I will not send emails, SMS, or calls. Fake messages only appear inside WiseCub.",
    };
  }
  if (/(what can you do|help|how do i)/.test(text)) {
    return {
      text: "I can explain the page, remind you it is pretend money, and take you to Home, Market, Choices, Missions, Safety, Progress, or Profile. Type it, tap a yellow chip, or use the mic.",
    };
  }
  if (/(what is a share|what's a share|share is)/.test(text)) {
    return {
      text: "A share is one small slice of a company. If the company does well, your slice can be worth more. If it does badly, it can be worth less. We only practise with pretend rupees.",
      path: "/market",
    };
  }
  if (/(start lesson|lesson 1|lesson one)/.test(text)) {
    return {
      text: "Opening Lesson 1 — What is a share? Read the pie, then the quick check.",
      path: "/market/lessons/1",
    };
  }
  if (/(back to the market|market floor)/.test(text)) {
    return { text: "Back to the Market Floor.", path: "/market" };
  }
  if (/(hear|read aloud|speak|say it)/.test(text)) {
    return { text: "I’ll read this page’s tip out loud. You can also use Hear it aloud on the Market Floor.", speakPage: true };
  }
  if (/(portfolio|holdings|my positions|session review)/.test(text)) {
    return { text: "Opening your practice portfolio. Habits, not profit rank.", path: "/market/portfolio" };
  }
  if (/(terminal|buy|sell|trade|order ticket)/.test(text)) {
    return {
      text: "Opening the practice terminal. Finish Lesson 1 first if the floor is still closed.",
      path: "/market/terminal",
    };
  }
  if (/(market|invest|stock|shares)/.test(text)) {
    return { text: "Opening the Market Floor. Remember: fictional companies and virtual money only.", path: "/market" };
  }
  if (/(choice|decision|choice town)/.test(text)) {
    return { text: "Taking you to Choices. Branching stories come in a later increment.", path: "/choices" };
  }
  if (/(mission|budget|puppy)/.test(text)) {
    return { text: "Taking you to Missions. Story budgets come next.", path: "/missions" };
  }
  if (/(safety|scam|phish)/.test(text)) {
    return { text: "Taking you to Scam Safety. Practice stays inside WiseCub.", path: "/safety" };
  }
  if (/(progress|score|habit)/.test(text)) {
    return { text: "Opening My Progress.", path: "/progress" };
  }
  if (/(profile|avatar|settings)/.test(text)) {
    return { text: "Opening your profile. Avatar picking comes soon.", path: "/profile" };
  }
  if (/(home|dashboard)/.test(text)) {
    return { text: "Taking you home.", path: "/home" };
  }
  if (/(landing|start over|log out|leave)/.test(text)) {
    return { text: "Back to the WiseCub welcome page.", path: "/" };
  }

  return {
    text: "I didn’t catch that yet. I’m a simple guide, not a trained AI model. Try a yellow button, or say “open the market”.",
  };
}
