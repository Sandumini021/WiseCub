const KEY = "wisecub.demoChild";

export type DemoChild = {
  name: string;
  enteredAt: string;
};

export function readDemoChild(): DemoChild | null {
  const raw = window.localStorage.getItem(KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as DemoChild;
    if (!parsed.enteredAt) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeDemoChild(name: string): DemoChild {
  const next: DemoChild = {
    name: name.trim() || "Demo child",
    enteredAt: new Date().toISOString(),
  };
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
