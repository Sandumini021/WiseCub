const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new ApiError(`Request failed: ${response.status}`, response.status);
  }
  return (await response.json()) as T;
}

export type HealthResponse = {
  status: string;
  service: string;
  database: string;
};

export function getHealth() {
  return apiGet<HealthResponse>("/health");
}
