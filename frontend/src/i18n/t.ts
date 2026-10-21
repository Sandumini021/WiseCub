import type { CubLang } from "../components/cub-assistant/cubAssistantTypes";
import en from "./locales/en.json";
import si from "./locales/si.json";
import sg from "./locales/singlish.json";

const PACKS: Record<CubLang, Record<string, unknown>> = { en, si, sg };

export function t(lang: CubLang, path: string, vars?: Record<string, string | number>) {
  const raw = lookup(PACKS[lang] ?? PACKS.en, path) ?? lookup(PACKS.en, path) ?? path;
  if (!vars) {
    return raw;
  }
  return Object.entries(vars).reduce((text, [key, value]) => text.replaceAll(`{{${key}}}`, String(value)), raw);
}

function lookup(tree: Record<string, unknown>, path: string): string | null {
  const parts = path.split(".");
  let node: unknown = tree;
  for (const part of parts) {
    if (!node || typeof node !== "object" || !(part in node)) {
      return null;
    }
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : null;
}
