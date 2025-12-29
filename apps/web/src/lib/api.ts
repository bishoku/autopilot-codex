const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

export const apiFetch = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const hasBody = options?.body != null;
  const baseHeaders: Record<string, string> = hasBody ? { "Content-Type": "application/json" } : {};
  const response = await fetch(`${API_URL}${path}`, {
    headers: { ...baseHeaders, ...(options?.headers ?? {}) },
    ...options
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const apiFetchOptional = async <T>(path: string): Promise<T | null> => {
  const response = await fetch(`${API_URL}${path}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export type Session = {
  id: string;
  name: string | null;
  projectPath: string;
  createdAt: string;
  updatedAt: string;
  codexThreadId: string | null;
  currentStage: string | null;
};

export const listSessions = () => apiFetch<Session[]>("/sessions");

export const createSession = (input: { name?: string; projectPath: string }) =>
  apiFetch<Session>("/sessions", {
    method: "POST",
    body: JSON.stringify(input)
  });

export const getSession = (id: string) => apiFetch<Session>(`/sessions/${id}`);

export const setIntent = (id: string, intentText: string) =>
  apiFetch<{ ok: boolean }>(`/sessions/${id}/intent`, {
    method: "POST",
    body: JSON.stringify({ intentText })
  });

export const generateRequirements = (id: string) =>
  apiFetch<{ runId: string }>(`/sessions/${id}/stages/requirements/generate`, { method: "POST" });

export const generateAcceptance = (id: string) =>
  apiFetch<{ runId: string }>(`/sessions/${id}/stages/acceptance-criteria/generate`, { method: "POST" });

export const generateImpact = (id: string) =>
  apiFetch<{ runId: string }>(`/sessions/${id}/stages/impact-analysis/generate`, { method: "POST" });

export const generateTasks = (id: string) =>
  apiFetch<{ runId: string }>(`/sessions/${id}/stages/tasks/generate`, { method: "POST" });

export const getRequirements = (id: string) => apiFetch<any[]>(`/sessions/${id}/requirements`);
export const getAcceptance = (id: string) => apiFetch<any[]>(`/sessions/${id}/acceptance-criteria`);
export const getImpact = (id: string) => apiFetchOptional<any>(`/sessions/${id}/impact-analysis`);
export const getTasks = (id: string) => apiFetch<any[]>(`/sessions/${id}/tasks`);

export const startExecution = (id: string, selectedTaskIds?: string[]) =>
  apiFetch<{ executionId: string }>(`/sessions/${id}/execution/start`, {
    method: "POST",
    body: JSON.stringify({ selectedTaskIds })
  });

export const executeTask = (id: string, taskId: string) =>
  apiFetch<{ runId: string }>(`/sessions/${id}/tasks/${taskId}/execute`, {
    method: "POST"
  });
