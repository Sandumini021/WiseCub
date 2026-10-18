import { useEffect, useState } from "react";
import {
  getMe,
  logoutAccount,
  patchMe,
  registerAccount,
  saveModuleState,
  type RemoteAccount,
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
  password: string;
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

function fromRemote(account: RemoteAccount): DemoChild {
  return {
    name: account.name,
    enteredAt: account.entered_at || new Date().toISOString(),
    email: account.email,
    username: account.username,
    role: isAccountRole(account.role) ? account.role : "student",
    age: account.age,
    gender: account.gender,
    avatarId: account.avatar_id,
    language: account.language,
    classCode: account.class_code,
    institution: account.institution,
  };
}

export function applyRemoteSession(account: RemoteAccount): DemoChild {
  if (account.child_id) {
    setChildId(account.child_id);
  }
  const next = fromRemote(account);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  notifySession();
  return next;
}

export function writeDemoChild(name: string, extras?: Partial<DemoChild>): DemoChild {
  const prev = readDemoChild();
  const next: DemoChild = {
    name: name.trim() || prev?.name || "Demo child",
    enteredAt: extras?.enteredAt ?? prev?.enteredAt ?? new Date().toISOString(),
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
  window.localStorage.setItem(KEY, JSON.stringify(next));
  notifySession();
  return next;
}

export async function writeSignupProfile(profile: SignupProfile): Promise<DemoChild> {
  const account = await registerAccount({
    name: profile.name.trim() || "Demo child",
    username: profile.username.trim().toLowerCase(),
    password: profile.password,
    role: profile.role,
    email: profile.email?.trim(),
    age: profile.age,
    avatarId: profile.avatarId,
    language: profile.language ?? "en",
    classCode: profile.classCode,
    institution: profile.institution,
  });
  const next = applyRemoteSession(account);
  void saveModuleState(childId(), "child", {
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

export function persistAvatar(avatarId: string) {
  const current = readDemoChild();
  if (!current) {
    return;
  }
  writeDemoChild(current.name, { avatarId });
  void patchMe({ avatar_id: avatarId }).catch(() => {});
}

export function clearDemoChild() {
  window.localStorage.removeItem(KEY);
  window.localStorage.setItem(ID_KEY, window.crypto.randomUUID());
  notifySession();
  void logoutAccount().catch(() => {});
}

export function useDemoChild() {
  const [child, setChild] = useState<DemoChild | null>(() => readDemoChild());
  const [authReady, setAuthReady] = useState(false);
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
    let cancelled = false;
    void getMe()
      .then((account) => {
        if (cancelled) {
          return;
        }
        applyRemoteSession(account);
        setAuthReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setAuthReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return { child, authReady };
}
