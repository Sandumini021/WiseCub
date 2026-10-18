import { useEffect, useState } from "react";
import {
  loadAccountByEmail,
  loadAccountByUsername,
  saveAccountRemote,
  saveChildRemote,
  saveModuleState,
} from "../../services/apiClient";
import { type AccountRole, isAccountRole } from "./roles";

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
  username?: string;
  role?: AccountRole;
  age?: string;
  gender?: string;
  avatarId?: string;
  language?: string;
  classCode?: string;
  institution?: string;
};

export type SignupProfile = {
  name: string;
  email?: string;
  username: string;
  role: AccountRole;
  age?: string;
  gender?: string;
  avatarId?: string;
  language?: string;
  classCode?: string;
  institution?: string;
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

function mergeSession(name: string, extras?: Partial<DemoChild>): DemoChild {
  const prev = readDemoChild();
  return {
    name: name.trim() || prev?.name || "Demo child",
    enteredAt: extras?.enteredAt ?? new Date().toISOString(),
    email: extras?.email ?? prev?.email,
    username: extras?.username ?? prev?.username,
    role: extras?.role ?? prev?.role ?? "student",
    age: extras?.age ?? prev?.age,
    gender: extras?.gender ?? prev?.gender,
    avatarId: extras?.avatarId ?? prev?.avatarId,
    language: extras?.language ?? prev?.language ?? "en",
    classCode: extras?.classCode ?? prev?.classCode,
    institution: extras?.institution ?? prev?.institution,
  };
}

export function writeDemoChild(name: string, extras?: Partial<DemoChild>): DemoChild {
  const next = mergeSession(name, extras);
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
    email: profile.email?.trim(),
    username: profile.username.trim().toLowerCase(),
    role: profile.role,
    age: profile.age,
    gender: profile.gender,
    avatarId: profile.avatarId,
    language: profile.language ?? "en",
    classCode: profile.classCode,
    institution: profile.institution,
  };
  window.localStorage.setItem(KEY, JSON.stringify(next));
  notifySession();
  const id = childId();
  void saveChildRemote(id, next.name, next.enteredAt).catch(() => {});
  void saveAccountRemote(id, {
    name: next.name,
    email: next.email,
    username: next.username,
    role: next.role,
    age: next.age,
    gender: next.gender,
    avatarId: next.avatarId,
    language: next.language,
    classCode: next.classCode,
    institution: next.institution,
    enteredAt: next.enteredAt,
  }).catch(() => {});
  void saveModuleState(id, "child", {
    name: next.name,
    username: next.username,
    role: next.role,
    email: next.email,
    age: next.age,
    avatarId: next.avatarId,
    language: next.language,
  }).catch(() => {});
  return next;
}

export function clearDemoChild() {
  window.localStorage.removeItem(KEY);
  window.localStorage.setItem(ID_KEY, window.crypto.randomUUID());
  notifySession();
}

function applyRemoteAccount(account: {
  child_id?: string;
  name?: string;
  email?: string;
  username?: string;
  role?: string;
  age?: string;
  gender?: string;
  avatar_id?: string;
  language?: string;
  class_code?: string;
  institution?: string;
  entered_at?: string;
}) {
  if (account.child_id) {
    setChildId(account.child_id);
  }
  const latest = readDemoChild();
  if (!latest) {
    return;
  }
  writeDemoChild(account.name || latest.name, {
    email: account.email || latest.email,
    username: account.username || latest.username,
    role: isAccountRole(account.role) ? account.role : latest.role,
    age: account.age || latest.age,
    gender: account.gender || latest.gender,
    avatarId: account.avatar_id || latest.avatarId,
    language: account.language || latest.language,
    classCode: account.class_code || latest.classCode,
    institution: account.institution || latest.institution,
    enteredAt: account.entered_at,
  });
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
    if (current?.username) {
      void loadAccountByUsername(current.username).then(applyRemoteAccount).catch(() => {});
      return;
    }
    if (current?.email) {
      void loadAccountByEmail(current.email).then(applyRemoteAccount).catch(() => {});
    }
  }, []);
  return child;
}
