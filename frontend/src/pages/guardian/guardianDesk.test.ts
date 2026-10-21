import { describe, expect, it } from "vitest";
import { inviteNote } from "./guardianPreview";

describe("guardian invite", () => {
  it("blocks empty username search", () => {
    expect(inviteNote("")).toMatch(/will not guess usernames/);
  });

  it("accepts the preview code only", () => {
    expect(inviteNote("wc-j26")).toBe("ok");
    expect(inviteNote("mystery")).toMatch(/not on this preview desk/);
  });
});
