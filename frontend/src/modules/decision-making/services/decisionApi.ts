import type {
  AdaptiveRecommendation,
  AnalysisResult,
  ChoiceTownProgress,
  DecisionOption,
  DecisionOptionId,
} from "../types/decisionMaking";
import { recommendFromAnalysis } from "./adaptiveRecommendations";
import { analyzeReasoning } from "./reasoningAnalysis";
import {
  completeLevelLocal,
  readProgress,
  saveAnalysis,
  saveDecisionLocal,
  saveReasoning,
  writeProgress,
} from "./progressStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export type ReasoningSubmission = {
  progress: ChoiceTownProgress;
  analysis: AnalysisResult;
  recommendations: AdaptiveRecommendation[];
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Choice Town API returned ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function refreshProgress(): Promise<ChoiceTownProgress> {
  try {
    const remote = await request<ChoiceTownProgress>("/api/decision-making/progress");
    return writeProgress(remote);
  } catch {
    return readProgress();
  }
}

export async function persistDecision(
  levelId: number,
  optionId: DecisionOptionId,
): Promise<ChoiceTownProgress> {
  const local = saveDecisionLocal(levelId, optionId);
  try {
    const remote = await request<ChoiceTownProgress>(
      `/api/decision-making/sessions/${levelId}/decision`,
      { method: "PUT", body: JSON.stringify({ optionId }) },
    );
    return writeProgress(remote);
  } catch {
    return local;
  }
}

export async function persistReasoning(
  levelId: number,
  option: DecisionOption,
  reasoning: string,
): Promise<ReasoningSubmission> {
  try {
    const remote = await request<ReasoningSubmission>(
      `/api/decision-making/sessions/${levelId}/reasoning`,
      {
        method: "POST",
        body: JSON.stringify({
          optionId: option.id,
          reasoning,
          option: {
            title: option.title,
            summary: option.summary,
            immediate: option.immediate,
            bullets: option.bullets,
          },
        }),
      },
    );
    writeProgress(remote.progress);
    return remote;
  } catch {
    const analysis = analyzeReasoning(option, reasoning);
    saveReasoning(levelId, reasoning);
    const progress = saveAnalysis(levelId, analysis);
    const analyzed = Object.values(progress.sessions).filter((session) => session.analysis).length;
    const recommendations = recommendFromAnalysis(analysis, analyzed);
    const withNotes = writeProgress({
      ...progress,
      sessions: {
        ...progress.sessions,
        [String(levelId)]: {
          ...(progress.sessions[String(levelId)] ?? {}),
          recommendations,
        },
      },
    });
    return { progress: withNotes, analysis, recommendations };
  }
}

export async function persistCompletion(levelId: number): Promise<ChoiceTownProgress> {
  try {
    const remote = await request<ChoiceTownProgress>(
      `/api/decision-making/sessions/${levelId}/complete`,
      { method: "POST" },
    );
    return writeProgress(remote);
  } catch {
    return completeLevelLocal(levelId);
  }
}
