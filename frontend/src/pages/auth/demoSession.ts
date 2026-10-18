import { useEffect, useState } from "react";
import {
  loadAccountByEmail,
  saveAccountRemote,
  saveChildRemote,
  saveModuleState,
} from "../../services/apiClient";

const KEY = "wisecub.demoChild";
const ID_KEY = "wisecub.childId";
const SESSION_EVENT = "wisecub-session";

function notifySession() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

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

export function setChildId(id: string) {
  window.localStorage.setItem(ID_KEY, id);
}

export function writeDemoChild(name: string, extras?: Partial<DemoChild>): DemoChild {
  const prev = readDemoChild();
  const next: DemoChild = {
    name: name.trim() || prev?.name || "Demo child",
    enteredAt: extras?.enteredAt ?? new Date().toISOString(),
    email: extras?.email ?? prev?.email,
    age: extras?.age ?? prev?.age,
    gender: extras?.gender ?? prev?.gender,
    avatarId: extras?.avatarId ?? prev?.avatarId,
  };
  window.localStorage.setItem(KEY, JSON.stringify(next));
  notifySession();
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
  notifySession();
  const id = childId();
  void saveChildRemote(id, next.name, next.enteredAt).catch(() => {});
  void saveAccountRemote(id, {
    name: next.name,
    email: next.email ?? "",
    age: next.age ?? "",
    gender: next.gender ?? "",
    avatarId: next.avatarId,
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

export function clearDemoChild() {
  window.localStorage.removeItem(KEY);
  window.localStorage.setItem(ID_KEY, window.crypto.randomUUID());
  notifySession();
}

export function useDemoChild() {
  const [child, setChild] = useState<DemoChild | null>(() => readDemoChild());
  useEffect(() => {
    const refresh = () => setChild(readDemoChild());
    window.addEventListener("storage", refresh);
    window.addEventListener(SESSION_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(SESSION_EVENT, refresh);
    };
  }, []);
  useEffect(() => {
    const current = readDemoChild();
    if (!current?.email) {
      return;
    }
    void loadAccountByEmail(current.email)
      .then((account) => {
        const latest = readDemoChild();
        if (!latest) {
          return;
        }
        if (account.child_id) {
          setChildId(account.child_id);
        }
        if (account.avatar_id && account.avatar_id !== latest.avatarId) {
          writeDemoChild(account.name || latest.name, {
            email: account.email,
            age: account.age,
            gender: account.gender,
            avatarId: account.avatar_id,
          });
        }
      })
      .catch(() => {
        // Avatar stays local if Mongo is down.
      });
  }, []);
  return child;
}
