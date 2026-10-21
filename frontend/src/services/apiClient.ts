const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) || "http://localhost:8000";

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

export async function apiPostForm<T>(path: string, body: FormData): Promise<T> {
  return parse<T>(
    await request(path, {
      method: "POST",
      body,
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

// ─────────────────────────────────────────────────────────────────────────────
//  SCAM SAFETY GUARDIAN & SIMULATION API
// ─────────────────────────────────────────────────────────────────────────────

export type SmtpSummary = {
  configured: boolean;
  host?: string | null;
  port: number;
  from_email: string;
  use_tls: boolean;
  auth_configured: boolean;
};

export type GuardianDetails = {
  child_id: string;
  configured: boolean;
  parent_name: string;
  email: string;
  relationship: string;
  consent_confirmed: boolean;
  simulation_enabled: boolean;
  verification_status: "unconfigured" | "pending" | "verified";
  verification_method?: "unconfigured" | "simulated_dev_assist" | "email_link" | string;
  verified_at: string | null;
  updated_at?: string;
  smtp_configured?: boolean;
  smtp_summary?: SmtpSummary;
  verification_token_dev?: string;
};

export type LevelSimulationStatus = {
  simulation_id?: string;
  category_id: string;
  level_number?: string;
  score?: number;
  status:
    | "sent"
    | "not_configured"
    | "failed"
    | "not_passed"
    | "no_guardian"
    | "consent_required"
    | "unverified"
    | "disabled"
    | "pending";
  detail?: string;
  parent_email?: string;
  created_at?: string;
};

export type AllSimulationsResponse = {
  child_id: string;
  by_category: Record<string, LevelSimulationStatus | null>;
  total_simulations: number;
  history: LevelSimulationStatus[];
  smtp_configured?: boolean;
  smtp_summary?: SmtpSummary;
};

export type SimulationFollowUp = {
  question: string;
  options: string[];
  correct_index?: number;
  explanation?: string;
};

export type SimulationFeedback = {
  simulation_id: string;
  category_id: string;
  level_title: string;
  scenario_name: string;
  sender_name?: string;
  sender_email?: string;
  call_to_action?: string;
  display_link_text?: string;
  simulated_body: string;
  red_flags: string[];
  learning_goal: string;
  score?: number;
  created_at?: string;
  link_clicked?: boolean;
  educational_link_clicked?: boolean;
  reported_as_suspicious?: boolean;
  initial_classification?: string;
  outcome?: string;
  follow_up?: SimulationFollowUp;
  follow_up_completed?: boolean;
  follow_up_correct?: boolean;
  follow_up_selected_index?: number;
};

export type SimulatedInboxItem = {
  simulation_id: string;
  category_id: string;
  level_number: string;
  level_title: string;
  scenario_id: string;
  scenario_name: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  preview: string;
  body: string;
  call_to_action: string;
  display_link_text: string;
  created_at: string;
  inbox_opened: boolean;
  link_clicked: boolean;
  reported_as_suspicious: boolean;
  initial_classification: "unanswered" | "suspicious" | "safe" | "clicked_unsafe_link";
  outcome: "pending_decision" | "safely_reported" | "unsafe_link_clicked" | "marked_safe";
  debrief_viewed: boolean;
  follow_up_completed: boolean;
  follow_up_correct?: boolean;
};

export type SimulatedInboxResponse = {
  child_id: string;
  items: SimulatedInboxItem[];
  total: number;
  unread_count: number;
};

export type SimulationEventResponse = {
  ok: boolean;
  simulation_id: string;
  event_type: "inbox_opened" | "link_clicked" | "reported_suspicious" | "marked_safe";
  outcome: string;
  initial_classification: string;
  link_clicked: boolean;
  reported_as_suspicious: boolean;
  redirect_url?: string;
  message?: string;
};

export type FollowUpSubmitResponse = {
  ok: boolean;
  simulation_id: string;
  selected_index: number;
  correct_index: number;
  is_correct: boolean;
  explanation: string;
  learning_goal: string;
};

export type LevelLearningMetric = {
  category_id: string;
  title: string;
  level_number: string;
  attempts: number;
  correctly_reported: number;
  unsafe_clicks: number;
  debrief_completed: number;
  latest_outcome?: string | null;
};

export type SafetyLearningMetrics = {
  child_id: string;
  total_simulations: number;
  completed_decisions: number;
  pending_decisions: number;
  correctly_reported_count: number;
  unsafe_clicks_count: number;
  marked_safe_count: number;
  suspicious_recognition_rate: number;
  safe_avoidance_rate: number;
  debrief_completion_count: number;
  debrief_completion_rate: number;
  follow_up_completed_count: number;
  follow_up_correct_count: number;
  follow_up_accuracy: number;
  by_level: Record<string, LevelLearningMetric>;
  recent_attempts: Array<Record<string, unknown>>;
};

export function getGuardianDetails(childId: string) {
  return apiGet<GuardianDetails>(`/api/safety/guardian/${childId}`);
}

export function saveGuardianDetails(
  childId: string,
  body: {
    parent_name: string;
    email: string;
    relationship?: string;
    consent_confirmed: boolean;
    simulation_enabled: boolean;
  },
) {
  return apiPut<GuardianDetails>(`/api/safety/guardian/${childId}`, body);
}

export function verifyGuardianEmail(
  childId: string,
  token: string = "",
  isSimulatedDevVerification: boolean = false,
) {
  return apiPost<{ ok: boolean; verification_status: string; verification_method?: string }>(
    `/api/safety/guardian/${childId}/verify`,
    { token, is_simulated_dev_verification: isSimulatedDevVerification },
  );
}

export function updateGuardianConsent(
  childId: string,
  body: { consent_confirmed: boolean; simulation_enabled: boolean },
) {
  return apiPost<{ ok: boolean; consent_confirmed: boolean; simulation_enabled: boolean }>(
    `/api/safety/guardian/${childId}/consent`,
    body,
  );
}

export function triggerLevelSimulation(
  childId: string,
  body: {
    category_id: string;
    score: number;
    attempt_id: string;
    red_flags_identified?: string[];
    force_retry?: boolean;
  },
) {
  return apiPost<{
    eligible: boolean;
    duplicate?: boolean;
    retried?: boolean;
    simulation_id?: string;
    category_id: string;
    level_number?: string;
    status: string;
    parent_email?: string;
    detail?: string;
    feedback_url?: string;
  }>(`/api/safety/simulation/trigger/${childId}`, body);
}

export function triggerPassedLevelSimulation(childId: string, categoryId: string) {
  return apiPost<{
    eligible: boolean;
    duplicate?: boolean;
    retried?: boolean;
    simulation_id?: string;
    category_id: string;
    level_number?: string;
    status: string;
    parent_email?: string;
    detail?: string;
    feedback_url?: string;
  }>(`/api/safety/simulation/trigger-passed/${childId}/${categoryId}`, {});
}

export function getSimulationStatuses(childId: string) {
  return apiGet<AllSimulationsResponse>(`/api/safety/simulation/status/${childId}`);
}

export function getSimulationFeedback(simulationId: string) {
  return apiGet<SimulationFeedback>(`/api/safety/simulation/feedback/${simulationId}`);
}

export function getSimulatedInbox(childId: string) {
  return apiGet<SimulatedInboxResponse>(`/api/safety/simulation/inbox/${childId}`);
}

export function recordSimulationEvent(
  simulationId: string,
  eventType: "inbox_opened" | "link_clicked" | "reported_suspicious" | "marked_safe",
  selectedClassification?: "suspicious" | "safe",
) {
  return apiPost<SimulationEventResponse>(`/api/safety/simulation/event/${simulationId}`, {
    event_type: eventType,
    selected_classification: selectedClassification,
  });
}

export function submitSimulationFollowUp(simulationId: string, selectedIndex: number) {
  return apiPost<FollowUpSubmitResponse>(`/api/safety/simulation/follow-up/${simulationId}`, {
    selected_index: selectedIndex,
  });
}

export function getSafetyLearningMetrics(childId: string) {
  return apiGet<SafetyLearningMetrics>(`/api/safety/simulation/metrics/${childId}`);
}


