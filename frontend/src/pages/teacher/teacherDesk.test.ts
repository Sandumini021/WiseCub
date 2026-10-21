import { describe, expect, it } from "vitest";
import { makeJoinCode, readTeacherDesk } from "./teacherPreview";

describe("teacher desk preview", () => {
  it("starts with two practice classes", () => {
    const desk = readTeacherDesk();
    expect(desk.classes).toHaveLength(2);
    expect(desk.students.every((row) => row.wait >= 0)).toBe(true);
  });

  it("makes a short join code", () => {
    expect(makeJoinCode()).toMatch(/^WC-[A-Z0-9]{4}$/);
  });
});
