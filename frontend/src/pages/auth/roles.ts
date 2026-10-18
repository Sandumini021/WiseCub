export type AccountRole = "student" | "teacher" | "guardian";

export const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "si", label: "Sinhala" },
  { id: "ta", label: "Tamil" },
] as const;

export function homePathForRole(role?: string) {
  if (role === "teacher") {
    return "/teacher/dashboard";
  }
  if (role === "guardian") {
    return "/guardian/dashboard";
  }
  return "/student/dashboard";
}

export function isAccountRole(value: string | undefined): value is AccountRole {
  return value === "student" || value === "teacher" || value === "guardian";
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}
