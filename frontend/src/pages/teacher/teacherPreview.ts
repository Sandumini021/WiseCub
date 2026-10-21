export type DeskStudent = {
  id: string;
  name: string;
  classId: string;
  lessons: number;
  wait: number;
  spread: number;
  read: number;
  last: string;
};

export type DeskClass = {
  id: string;
  name: string;
  code: string;
  students: number;
};

const KEY = "wisecub.teacherDesk";

const STARTER: { classes: DeskClass[]; students: DeskStudent[] } = {
  classes: [
    { id: "c1", name: "J26 Money Lab", code: "WC-J26", students: 3 },
    { id: "c2", name: "Year 9 Practice", code: "WC-Y9A", students: 2 },
  ],
  students: [
    { id: "s1", name: "Amal", classId: "c1", lessons: 4, wait: 80, spread: 60, read: 90, last: "Market · today" },
    { id: "s2", name: "Nisha", classId: "c1", lessons: 2, wait: 40, spread: 30, read: 70, last: "Safety · yesterday" },
    { id: "s3", name: "Ravi", classId: "c1", lessons: 6, wait: 70, spread: 85, read: 50, last: "Missions · 2d" },
    { id: "s4", name: "Maya", classId: "c2", lessons: 1, wait: 55, spread: 20, read: 40, last: "Lesson 1" },
    { id: "s5", name: "Chen", classId: "c2", lessons: 3, wait: 65, spread: 70, read: 75, last: "Choices" },
  ],
};

function storage() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage;
}

export function readTeacherDesk() {
  const raw = storage()?.getItem(KEY);
  if (!raw) {
    return STARTER;
  }
  try {
    const parsed = JSON.parse(raw) as typeof STARTER;
    if (!Array.isArray(parsed.classes) || !Array.isArray(parsed.students)) {
      return STARTER;
    }
    return parsed;
  } catch {
    return STARTER;
  }
}

export function saveTeacherDesk(desk: typeof STARTER) {
  storage()?.setItem(KEY, JSON.stringify(desk));
}

export function makeJoinCode() {
  return `WC-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
