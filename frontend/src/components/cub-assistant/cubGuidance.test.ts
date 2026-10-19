import { describe, expect, it } from "vitest";
import { detectSpokenLang, greetingFor, matchCubIntent } from "./cubGuidance";
import { replyFromPrediction } from "./cubPredictedReply";
import { canOpenRoute, isAllowedCubRoute, isAuthPath, shouldWarnBeforeLeave } from "./cubRoutes";
import { canSpeakSinhala, pickVoice } from "./cubSpeech";

describe("cub routes", () => {
  it("hides Cub on auth pages", () => {
    expect(isAuthPath("/login")).toBe(true);
    expect(isAuthPath("/signup")).toBe(true);
    expect(isAuthPath("/market")).toBe(false);
  });

  it("allows listed routes only", () => {
    expect(isAllowedCubRoute("/market")).toBe(true);
    expect(isAllowedCubRoute("/market/lessons/3")).toBe(true);
    expect(isAllowedCubRoute("https://evil.example")).toBe(false);
    expect(isAllowedCubRoute("/admin")).toBe(false);
  });

  it("blocks other roles from teacher and guardian pages", () => {
    expect(canOpenRoute("student", "/teacher/dashboard")).toBe(false);
    expect(canOpenRoute("teacher", "/guardian/dashboard")).toBe(false);
    expect(canOpenRoute("guardian", "/student/dashboard")).toBe(false);
    expect(canOpenRoute("teacher", "/teacher/classes")).toBe(true);
  });

  it("warns before leaving an unconfirmed trade", () => {
    expect(shouldWarnBeforeLeave("/market/confirm", "/market")).toBe(true);
    expect(shouldWarnBeforeLeave("/market", "/missions")).toBe(false);
  });
});

describe("cub intents", () => {
  it("keeps pretend-money answers ahead of the classifier", () => {
    const reply = matchCubIntent("is this real money", "en", { path: "/market", role: "student" });
    expect(reply.path).toBeUndefined();
    expect(reply.text.toLowerCase()).toMatch(/no real money/);
  });

  it("maps English and Sinhala market requests", () => {
    const en = matchCubIntent("Take me to the stock market", "en", { path: "/student/dashboard", role: "student" });
    expect(en.path).toBe("/market");
    const si = matchCubIntent("වෙළෙඳපොළට යන්න", "si", { path: "/student/dashboard", role: "student" });
    expect(si.path).toBe("/market");
    const spoken = matchCubIntent("go to the market", "en", { path: "/missions", role: "student" });
    expect(spoken.path).toBe("/market");
  });

  it("detects spoken Sinhala vs English", () => {
    expect(detectSpokenLang("වෙළෙඳපොළට යන්න", "en")).toBe("si");
    expect(detectSpokenLang("open the market", "si")).toBe("en");
  });

  it("updates page context copy by route", () => {
    expect(greetingFor("/safety", "en")).toMatch(/WiseCub/);
    expect(greetingFor("/safety", "si")).toMatch(/WiseCub/);
  });

  it("does not treat Cub as a trained model", () => {
    const reply = matchCubIntent("asdfgh", "en", { path: "/market", role: "student" });
    expect(reply.text.toLowerCase()).toContain("not a trained ai model");
  });

  it("sends a teacher home instead of the student dashboard", () => {
    const reply = matchCubIntent("go home", "en", { path: "/teacher/classes", role: "teacher" });
    expect(reply.path).toBe("/teacher/dashboard");
  });

  it("keeps classifier navigation on the allowlist and role", () => {
    const blocked = replyFromPrediction(
      {
        model_ready: true,
        used_model: true,
        model_note: "test",
        intent: "OPEN_TEACHER_CLASSES",
        confidence: 0.9,
        reliable: true,
        suggested_route: "/student/dashboard",
        navigation_blocked: true,
        blocked_reason: "role_or_allowlist",
        needs_confirm: false,
      },
      "en",
      { path: "/market", role: "student" },
    );
    expect(blocked?.path).toBe("/student/dashboard");
    expect(blocked?.text.toLowerCase()).toMatch(/different role/);

    const quizzes = replyFromPrediction(
      {
        model_ready: true,
        used_model: true,
        model_note: "test",
        intent: "OPEN_QUIZZES",
        confidence: 0.9,
        reliable: true,
        suggested_route: null,
        navigation_blocked: false,
        blocked_reason: null,
        needs_confirm: false,
      },
      "en",
      { path: "/home", role: "student" },
    );
    expect(quizzes?.path).toBeUndefined();
  });
});

describe("cub speech helpers", () => {
  it("reports missing Sinhala voices", () => {
    const voices = [{ lang: "en-GB", name: "Daniel" }] as SpeechSynthesisVoice[];
    expect(canSpeakSinhala(voices)).toBe(false);
    expect(pickVoice("si", voices)).toBeNull();
  });
});
