import { apiGet, apiPost } from "../../services/apiClient";
import type { TaxRule } from "./data/applyTax";
import { gradeTaxLocal, localTaxPack } from "./data/taxPack";

export type TaxLesson = {
  id: string;
  title: string;
  blurb: string;
  beats: Array<{ t: string; d: string }>;
  check: { q: string; options: Array<{ id: string; label: string }>; correct: string };
};

export type TaxScenario = {
  id: string;
  income_kind: string;
  title: string;
  story: string;
  default_income: string;
  suggested_rule: string;
  saved_pile?: string | null;
};

export type TaxQuizItem = {
  id: string;
  kind: "mcq" | "calc";
  q: string;
  points: number;
  options?: Array<{ id: string; label: string }>;
  rule_id?: string;
  income?: string;
  income_kind?: string;
};

export function loadTaxRules() {
  return apiGet<{ rules: TaxRule[] }>("/api/tax/rules");
}

export function loadTaxContent(lang: string) {
  return apiGet<{
    lang: string;
    lessons: TaxLesson[];
    scenarios: TaxScenario[];
    quiz: TaxQuizItem[];
    disclaimer: string;
  }>(`/api/tax/content?lang=${encodeURIComponent(lang)}`);
}

function withTimeout<T>(task: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("tax-api-timeout")), ms);
    task.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function loadTaxLab(lang: string) {
  const fallback = localTaxPack(lang);
  try {
    const [content, rules] = await withTimeout(Promise.all([loadTaxContent(lang), loadTaxRules()]), 2500);
    return {
      lang: content.lang === "si" ? ("si" as const) : ("en" as const),
      lessons: content.lessons,
      scenarios: content.scenarios,
      quiz: content.quiz,
      disclaimer: content.disclaimer,
      rules: rules.rules,
      offline: false,
    };
  } catch {
    return { ...fallback, offline: true };
  }
}

export async function gradeTaxQuiz(body: { question_id: string; choice?: string; amount?: string }) {
  try {
    return await withTimeout(
      apiPost<{ ok: boolean; points: number; hint: string; correct?: string; correct_amount?: string }>(
        "/api/tax/quiz/grade",
        body,
      ),
      2000,
    );
  } catch {
    return gradeTaxLocal(body);
  }
}
