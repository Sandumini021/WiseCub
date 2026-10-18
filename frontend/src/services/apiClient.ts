const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new ApiError(`Request failed: ${response.status}`, response.status);
  }
  return (await response.json()) as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  return parse<T>(response);
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parse<T>(response);
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
  age: string;
  gender: string;
  avatar_id: string;
  entered_at?: string;
};

export function loadAccountByEmail(email: string) {
  return apiGet<RemoteAccount>(`/api/accounts/search?email=${encodeURIComponent(email)}`);
}

export function saveAccountRemote(
  childId: string,
  account: {
    name: string;
    email: string;
    age: string;
    gender: string;
    avatarId: string;
    enteredAt: string;
  },
) {
  return apiPut(`/api/accounts/${childId}`, {
    name: account.name,
    email: account.email,
    age: account.age,
    gender: account.gender,
    avatar_id: account.avatarId,
    entered_at: account.enteredAt,
  });
}

export function saveModuleState(childId: string, module: string, data: unknown) {
  return apiPut(`/api/state/${childId}/${module}`, { data });
}

export function loadModuleState<T>(childId: string, module: string) {
  return apiGet<{ child_id: string; module: string; data: T }>(`/api/state/${childId}/${module}`);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parse<T>(response);
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
