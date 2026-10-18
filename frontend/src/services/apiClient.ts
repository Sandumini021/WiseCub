const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

function messageFromDetail(detail: unknown, status: number): string {
  if (typeof detail === "string") {
    return detail;
  }
  if (detail && typeof detail === "object" && "message" in detail) {
    const message = (detail as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }
  return `Request failed: ${status}`;
}

async function parse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = (payload as { detail?: unknown }).detail ?? payload;
    throw new ApiError(messageFromDetail(detail, response.status), response.status, detail);
  }
  return payload as T;
}

function request(path: string, init?: RequestInit) {
  return fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...init,
  });
}

export async function apiGet<T>(path: string): Promise<T> {
  return parse<T>(await request(path));
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  return parse<T>(
    await request(path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return parse<T>(
    await request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    }),
  );
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return parse<T>(
    await request(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

export type HealthResponse = {
  status: string;
  service: string;
  database: string;
  db_name?: string;
};

export function getHealth() {
  return apiGet<HealthResponse>("/health");
}

export function saveChildRemote(childId: string, name: string, enteredAt: string) {
  return apiPut(`/api/children/${childId}`, { name, entered_at: enteredAt });
}

export type RemoteAccount = {
  child_id: string;
  name: string;
  email: string;
  username?: string;
  role?: string;
  age: string;
  gender: string;
  avatar_id: string;
  language?: string;
  class_code?: string;
  institution?: string;
  entered_at?: string;
};

export function checkUsername(username: string) {
  return apiGet<{ taken: boolean; valid: boolean; suggestions: string[] }>(
    `/api/accounts/username-check?username=${encodeURIComponent(username)}`,
  );
}

export function registerAccount(body: {
  name: string;
  username: string;
  password: string;
  role: string;
  email?: string;
  age?: string;
  avatarId?: string;
  language?: string;
  classCode?: string;
  institution?: string;
}) {
  return apiPost<RemoteAccount>("/api/register", {
    name: body.name,
    username: body.username,
    password: body.password,
    role: body.role,
    email: body.email ?? "",
    age: body.age ?? "",
    avatar_id: body.avatarId ?? "",
    language: body.language ?? "en",
    class_code: body.classCode ?? "",
    institution: body.institution ?? "",
  });
}

export function loginAccount(identifier: string, password: string, remember: boolean) {
  return apiPost<RemoteAccount>("/api/login", { identifier, password, remember });
}

export function logoutAccount() {
  return apiPost<{ ok: boolean }>("/api/logout");
}

export function getMe() {
  return apiGet<RemoteAccount>("/api/me");
}

export function patchMe(body: { avatar_id?: string; name?: string; language?: string }) {
  return apiPatch<RemoteAccount>("/api/me", body);
}

export function saveAccountRemote(
  childId: string,
  account: {
    name: string;
    email?: string;
    username?: string;
    role?: string;
    age?: string;
    gender?: string;
    avatarId?: string;
    language?: string;
    classCode?: string;
    institution?: string;
    enteredAt: string;
  },
) {
  return apiPut(`/api/accounts/${childId}`, {
    name: account.name,
    email: account.email ?? "",
    username: account.username ?? "",
    role: account.role ?? "student",
    age: account.age ?? "",
    gender: account.gender ?? "",
    avatar_id: account.avatarId ?? "",
    language: account.language ?? "en",
    class_code: account.classCode ?? "",
    institution: account.institution ?? "",
    entered_at: account.enteredAt,
  });
}

export function saveModuleState(childId: string, module: string, data: unknown) {
  return apiPut(`/api/state/${childId}/${module}`, { data });
}

export function loadModuleState<T>(childId: string, module: string) {
  return apiGet<{ child_id: string; module: string; data: T }>(`/api/state/${childId}/${module}`);
}

export function postMarketEvent(body: unknown) {
  return apiPost<{ ok: boolean; at: string; type: string }>("/api/market/events", body);
}

export type BehaviourIndicator = {
  behaviour: string;
  evidence: string[];
  occurrences: number;
  period: { from: string | null; to: string | null };
  level: "insufficient_evidence" | "not_observed" | "worth_reviewing";
  confidence: string;
  explanation: string;
  suggested_activity: string;
  validated_assessment: boolean;
};

export type BehaviourReport = {
  engine: string;
  trained_model: boolean;
  indicators: BehaviourIndicator[];
  coaching: Array<{ behaviour: string; language: string; text: string }>;
  allocation: Record<string, unknown> | null;
  disclaimer: string;
  event_count: number;
};

export function getMarketBehaviour(childId: string, sessionId?: string) {
  const query = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
  return apiGet<BehaviourReport>(`/api/market/behaviour/${childId}${query}`);
}
