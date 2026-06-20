const env = import.meta.env ?? {};
const isLocalViteDev =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
  window.location.port === "5173";
export const API_BASE_URL = env.VITE_API_BASE_URL ?? (isLocalViteDev ? "http://localhost:3001" : "");

const API_TIMEOUT_MS = Number(env.VITE_API_TIMEOUT_MS ?? 8000);
const AGENT_TIMEOUT_MS = Number(env.VITE_AGENT_TIMEOUT_MS ?? 30000);

const previewText = (value: string) => value.replace(/\s+/g, " ").trim().slice(0, 160);

export const requestJson = async <T>(
  url: string,
  init: RequestInit = {},
  timeoutMs = API_TIMEOUT_MS,
): Promise<T> => {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`API request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    const text = await response.text();
    throw new Error(
      `API did not return JSON. status=${response.status}, content-type=${contentType || "unknown"}, preview=${previewText(text)}`,
    );
  }

  const payload = (await response.json()) as T & { ok?: boolean; error?: string };
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error ?? `API request failed with ${response.status}`);
  }
  return payload;
};

export const apiGetDashboard = () =>
  requestJson<BackendDashboardResponse>(`${API_BASE_URL}/api/dashboard`);

export const apiPostSnapshot = (snapshot: BackendSnapshotInput) =>
  requestJson<{ ok: true; snapshot: BackendSnapshot }>(
    `${API_BASE_URL}/api/snapshots`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
    },
  );

export const apiPostEvent = (event: BackendEventInput) =>
  requestJson<{
    ok: true;
    event: BackendEvent;
    risk_result: BackendRiskResult;
    task: BackendTask | null;
  }>(
    `${API_BASE_URL}/api/events`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    },
  );

export const apiPatchTask = (taskId: string, changes: BackendTaskPatch) =>
  requestJson<{ ok: true; task: BackendTask }>(
    `${API_BASE_URL}/api/tasks/${taskId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    },
  );

export const apiAnalyzeAgent = (input: BackendAgentAnalyzeInput) =>
  requestJson<BackendAgentOutput>(
    `${API_BASE_URL}/api/agent/analyze`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    AGENT_TIMEOUT_MS,
  );

export interface BackendDashboardResponse {
  ok: true;
  generated_at: string;
  elders: BackendDashboardRow[];
}

export interface BackendDashboardRow {
  elder: BackendElder;
  baseline: BackendBaseline;
  latest_snapshot: BackendSnapshot | null;
  events: BackendEvent[];
  risk_result: BackendRiskResult | null;
  tasks: BackendTask[];
  latest_agent_output: BackendAgentOutput | null;
}

export interface BackendElder {
  elder_id: string;
  name: string;
  age: number;
  room: string;
  risk_tags: string[];
  created_at: string;
}

export interface BackendBaseline {
  elder_id: string;
  avg_steps_7d: number;
  avg_sleep_7d: number;
  avg_active_minutes_7d: number;
  resting_hr_baseline: number;
  baseline_confidence: number;
  baseline_label?: string;
  usable_days?: number;
}

export interface BackendSnapshot {
  snapshot_id: string;
  elder_id: string;
  date: string;
  data_source: string;
  heart_rate_avg: number | null;
  resting_heart_rate: number | null;
  steps: number | null;
  active_minutes: number | null;
  sleep_duration: number | null;
  wear_time_hours: number | null;
  data_quality: number;
  created_at: string;
}

export type BackendSnapshotInput = Omit<BackendSnapshot, "snapshot_id" | "created_at"> & {
  snapshot_id?: string;
  created_at?: string;
};

export interface BackendEvent {
  event_id: string;
  elder_id: string;
  event_type: string;
  timestamp: string;
  source: string;
  raw_text: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface BackendEventInput {
  event_id?: string;
  elder_id: string;
  event_type: string;
  timestamp?: string;
  source?: string;
  raw_text?: string | null;
  payload?: Record<string, unknown>;
}

export interface BackendRiskResult {
  elder_id: string;
  status_level: "stable" | "observe" | "attention" | "high_risk" | "urgent" | "insufficient_data";
  risk_score: number;
  key_reasons: string[];
  triggered_rules: string[];
  recommended_action: string;
  data_quality: number;
  safety_disclaimer: string;
}

export interface BackendTask {
  task_id: string;
  elder_id: string;
  source_event_id: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  task_title: string;
  task_reason: string;
  recommended_action: string;
  status: "pending" | "in_progress" | "completed";
  handled_by: string | null;
  handled_note: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface BackendTaskPatch {
  status?: "pending" | "in_progress" | "completed";
  handled_by?: string | null;
  handled_note?: string | null;
  completed_at?: string | null;
}

export interface BackendAgentAnalyzeInput {
  elder_profile: Record<string, unknown>;
  daily_snapshot: Record<string, unknown>;
  baseline: Record<string, unknown>;
  events: Array<Record<string, unknown>>;
  risk_result: Record<string, unknown>;
  source_event_id?: string | null;
}

export interface BackendAgentOutput {
  output_id: string;
  elder_id: string;
  source_event_id?: string | null;
  status_level: BackendRiskResult["status_level"];
  risk_score: number;
  caregiver_summary: string;
  family_summary: string;
  institution_summary: string;
  recommended_action: string;
  safety_disclaimer: string;
  key_reasons: string[];
  agent_source: "mock" | "openai";
  warning?: string | null;
  created_at: string;
}
