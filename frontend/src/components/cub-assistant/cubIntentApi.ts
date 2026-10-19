import { apiPost } from "../../services/apiClient";
import type { CubRole } from "./cubAssistantTypes";
import type { CubIntentPrediction } from "./cubPredictedReply";

export async function fetchCubIntent(text: string, role: CubRole, path: string): Promise<CubIntentPrediction | null> {
  try {
    return await apiPost<CubIntentPrediction>("/api/cub/intent", { text, role, path });
  } catch {
    return null;
  }
}
