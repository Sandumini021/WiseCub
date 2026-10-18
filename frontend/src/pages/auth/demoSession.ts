import { saveAccountRemote, saveChildRemote, saveModuleState } from "../../services/apiClient";

const KEY = "wisecub.demoChild";
const ID_KEY = "wisecub.childId";

export type DemoChild = {
  name: string;
  enteredAt: string;
  email?: string;
  age?: string;
  gender?: string;
  avatarId?: string;
};

export type SignupProfile = {
  name: string;
  email: string;
  age: string;
  gender: string;
  avatarId: string;
};

export function childId(): string {
  let id = window.localStorage.getItem(ID_KEY);
  if (!id) {
    id = window.crypto.randomUUID();
    window.localStorage.setItem(ID_KEY, id);
  }
  return id;
}

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
  void saveChildRemote(childId(), next.name, next.enteredAt).catch(() => {
    // Keep the demo working if Mongo is not running yet.
  });
  return next;
}

export function writeSignupProfile(profile: SignupProfile): DemoChild {
  const next: DemoChild = {
    name: profile.name.trim() || "Demo child",
    enteredAt: new Date().toISOString(),
    email: profile.email.trim(),
    age: profile.age,
    gender: profile.gender,
    avatarId: profile.avatarId,
  };
  window.localStorage.setItem(KEY, JSON.stringify(next));
  const id = childId();
  void saveChildRemote(id, next.name, next.enteredAt).catch(() => {});
  void saveAccountRemote(id, {
    name: next.name,
    email: next.email ?? "",
    age: next.age ?? "",
    gender: next.gender ?? "",
    avatarId: next.avatarId ?? "cub-gold",
    enteredAt: next.enteredAt,
  }).catch(() => {});
  void saveModuleState(id, "child", {
    name: next.name,
    email: next.email,
    age: next.age,
    gender: next.gender,
    avatarId: next.avatarId,
  }).catch(() => {});
  return next;
}
