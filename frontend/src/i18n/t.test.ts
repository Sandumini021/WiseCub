import { describe, expect, it } from "vitest";
import { t } from "./t";
import en from "./locales/en.json";
import si from "./locales/si.json";
import sg from "./locales/singlish.json";

function leafPaths(tree: unknown, prefix = ""): string[] {
  if (typeof tree === "string") {
    return prefix ? [prefix] : [];
  }
  if (!tree || typeof tree !== "object") {
    return [];
  }
  return Object.entries(tree as Record<string, unknown>).flatMap(([key, value]) =>
    leafPaths(value, prefix ? `${prefix}.${key}` : key),
  );
}

describe("i18n", () => {
  it("returns English, Sinhala, and Singlish for the same key", () => {
    expect(t("en", "common.buy")).toBe("Buy");
    expect(t("si", "common.buy")).toBe("මිලදී ගන්න");
    expect(t("sg", "common.buy")).toBe("Miladee ganna");
  });

  it("fills template values", () => {
    expect(t("en", "dash.hi", { name: "Amal" })).toBe("Hi, Amal!");
  });

  it("falls back to English if a key is missing", () => {
    expect(t("sg", "common.welcome")).toMatch(/WiseCub/);
  });

  it("keeps Sinhala and Singlish packs in sync with English keys", () => {
    const paths = leafPaths(en);
    const missingSi = paths.filter((path) => t("si", path) === path);
    const missingSg = paths.filter((path) => t("sg", path) === path);
    expect(missingSi).toEqual([]);
    expect(missingSg).toEqual([]);
    expect(leafPaths(si).length).toBe(paths.length);
    expect(leafPaths(sg).length).toBe(paths.length);
  });

  it("does not fake Singlish by stripping Sinhala letters", () => {
    expect(t("sg", "common.welcome")).toMatch(/saadarayen/i);
    expect(t("sg", "common.welcome")).not.toMatch(/[\u0D80-\u0DFF]/);
  });
});
