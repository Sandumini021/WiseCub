export type LinkedPreview = {
  id: string;
  name: string;
  age: string;
  missions: number;
  market: number;
  safety: number;
  choices: number;
  note: string;
};

const KEY = "wisecub.guardianDesk";

const STARTER: { children: LinkedPreview[] } = {
  children: [
    {
      id: "g1",
      name: "Nimasha",
      age: "13",
      missions: 45,
      market: 30,
      safety: 60,
      choices: 20,
      note: "Paused after a practice drop. That is a habit we like to notice — not a score.",
    },
  ],
};

function storage() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage;
}

export function readGuardianDesk() {
  const raw = storage()?.getItem(KEY);
  if (!raw) {
    return STARTER;
  }
  try {
    const parsed = JSON.parse(raw) as typeof STARTER;
    if (!Array.isArray(parsed.children)) {
      return STARTER;
    }
    return parsed;
  } catch {
    return STARTER;
  }
}

export function saveGuardianDesk(desk: typeof STARTER) {
  storage()?.setItem(KEY, JSON.stringify(desk));
}

export function inviteNote(code: string) {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) {
    return "Need an invite code. WiseCub will not guess usernames.";
  }
  if (trimmed === "WC-J26") {
    return "ok";
  }
  return "That code is not on this preview desk. Try WC-J26 to see how a link looks.";
}
