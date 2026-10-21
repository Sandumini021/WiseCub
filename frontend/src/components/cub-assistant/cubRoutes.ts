import type { CubRole } from "./cubAssistantTypes";
import { homePathForRole } from "../../pages/auth/roles";

export const AUTH_PATHS = new Set(["/", "/welcome", "/login", "/signup"]);

export const CUB_ROUTE_ALLOWLIST = [
  "/student/dashboard",
  "/home",
  "/market",
  "/market/lessons/1",
  "/market/lessons/2",
  "/market/lessons/3",
  "/market/lessons/4",
  "/market/lessons/5",
  "/market/lessons/6",
  "/market/lessons/7",
  "/market/lessons/8",
  "/market/lessons/9",
  "/market/lessons/10",
  "/market/terminal",
  "/market/confirm",
  "/market/portfolio",
  "/choices",
  "/missions",
  "/safety",
  "/progress",
  "/profile",
  "/tax",
  "/tax/learn",
  "/tax/simulate",
  "/tax/challenge",
  "/tax/decisions",
  "/tax/quiz",
  "/tax/sri-lanka",
  "/teacher/dashboard",
  "/teacher/classes",
  "/teacher/students",
  "/teacher/quizzes",
  "/teacher/assignments",
  "/teacher/reports",
  "/guardian/dashboard",
  "/guardian/children",
  "/guardian/progress",
  "/guardian/quizzes",
  "/guardian/tips",
] as const;

const ALLOWED = new Set<string>(CUB_ROUTE_ALLOWLIST);

export function isAuthPath(path: string) {
  return AUTH_PATHS.has(path);
}

export function isAllowedCubRoute(path: string) {
  if (ALLOWED.has(path)) {
    return true;
  }
  return /^\/market\/lessons\/\d+$/.test(path) || /^\/tax(\/[\w-]+)*$/.test(path);
}

export function canOpenRoute(role: CubRole | undefined, path: string) {
  if (!isAllowedCubRoute(path)) {
    return false;
  }
  const current = role ?? "student";
  if (path.startsWith("/teacher") && current !== "teacher") {
    return false;
  }
  if (path.startsWith("/guardian") && current !== "guardian") {
    return false;
  }
  if ((path === "/student/dashboard" || path === "/home") && current !== "student") {
    return false;
  }
  return true;
}

export function safeHome(role: CubRole | undefined) {
  return homePathForRole(role);
}

export function shouldWarnBeforeLeave(fromPath: string, toPath: string) {
  return fromPath === "/market/confirm" && toPath !== "/market/confirm";
}
