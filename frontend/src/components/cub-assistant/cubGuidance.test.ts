import { describe, expect, it } from "vitest";
import { detectSpokenLang, greetingFor, matchCubIntent } from "./cubGuidance";
import { replyFromPrediction } from "./cubPredictedReply";
import { canOpenRoute, isAllowedCubRoute, isAuthPath, shouldWarnBeforeLeave } from "./cubRoutes";
import { canRetryListenError, errorNote, listenLangCandidates } from "./cubListen";
import { cubUi } from "./cubUi";
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

  it("opens the market for go-to-trading phrases", () => {
    const reply = matchCubIntent("I want to go to trading", "en", { path: "/student/dashboard", role: "student" });
    expect(reply.path).toBe("/market");
  });

  it("asks for a known phrase when it does not match", () => {
    const reply = matchCubIntent("asdfgh", "en", { path: "/market", role: "student" });
    expect(reply.path).toBeUndefined();
    expect(reply.text.toLowerCase()).toMatch(/open the market|buy a stock|portfolio/);
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

  it("answers a buy-how-to intent instead of the generic unknown line", () => {
    const reply = replyFromPrediction(
      {
        model_ready: true,
        used_model: true,
        model_note: "test",
        intent: "HOW_TO_BUY",
        confidence: 0.8,
        reliable: true,
        suggested_route: "/market/terminal",
        navigation_blocked: false,
        blocked_reason: null,
        needs_confirm: false,
      },
      "en",
      { path: "/market", role: "student" },
    );
    expect(reply?.path).toBe("/market/terminal");
    expect(reply?.text.toLowerCase()).toMatch(/buy/);
    expect(reply?.text.toLowerCase()).not.toMatch(/didn’t catch/);
  });

  it("repeats the last trade answer on a follow-up intent", () => {
    const reply = replyFromPrediction(
      {
        model_ready: true,
        used_model: true,
        model_note: "test",
        intent: "FOLLOW_UP_EXPLAIN",
        confidence: 0.7,
        reliable: true,
        suggested_route: null,
        navigation_blocked: false,
        blocked_reason: null,
        needs_confirm: false,
      },
      "en",
      { path: "/market", role: "student", lastIntent: "HOW_TO_TRADE" },
    );
    expect(reply?.text.toLowerCase()).toMatch(/slower/);
    expect(reply?.text.toLowerCase()).toMatch(/terminal/);
  });

  it("asks for a rephrase when confidence is low", () => {
    const reply = replyFromPrediction(
      {
        model_ready: true,
        used_model: true,
        model_note: "test",
        intent: "HOW_TO_BUY",
        confidence: 0.1,
        reliable: false,
        suggested_route: "/market/terminal",
        navigation_blocked: false,
        blocked_reason: null,
        needs_confirm: false,
        example_questions: ["how do I buy a stock"],
      },
      "en",
      { path: "/market", role: "student" },
    );
    expect(reply?.intent).toBe("LOW_CONFIDENCE");
    expect(reply?.text.toLowerCase()).toMatch(/not sure|another way/);
  });
});

describe("cub listen helpers", () => {
  it("retries Sinhala STT with English when Chrome reports network", () => {
    expect(listenLangCandidates("si")).toEqual(["si-LK", "si", "en-US"]);
    expect(canRetryListenError("network", 0, 3)).toBe(true);
    expect(canRetryListenError("network", 2, 3)).toBe(false);
  });

  it("tells the child to type when the hearing API is down", () => {
    expect(cubUi("en", "apiDown").toLowerCase()).toMatch(/type|8000/);
  });

  it("does not blame the internet when the device is online", () => {
    expect(errorNote("network", "en", { online: true }).toLowerCase()).not.toMatch(/internet/);
    expect(errorNote("network", "si", { online: true })).toMatch(/English|ලිය/);
    expect(errorNote("network", "en", { online: false }).toLowerCase()).toMatch(/internet/);
  });
});

describe("cub speech helpers", () => {
  it("reports missing Sinhala voices", () => {
    const voices = [{ lang: "en-GB", name: "Daniel" }] as SpeechSynthesisVoice[];
    expect(canSpeakSinhala(voices)).toBe(false);
    expect(pickVoice("si", voices)).toBeNull();
  });
});
