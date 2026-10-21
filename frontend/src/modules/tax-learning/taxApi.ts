import { apiGet, apiPost } from "../../services/apiClient";
import type { TaxRule } from "./data/applyTax";

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

export function gradeTaxQuiz(body: { question_id: string; choice?: string; amount?: string }) {
  return apiPost<{ ok: boolean; points: number; hint: string; correct?: string; correct_amount?: string }>(
    "/api/tax/quiz/grade",
    body,
  );
}
