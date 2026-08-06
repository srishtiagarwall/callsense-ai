import type {
  AnalyticsSummary,
  Call,
  EvaluationResult,
  Job,
  TranscriptResult,
  TrendPoint,
  ViolationCount,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, init);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export function getHealth() {
  return apiFetch<{ status: string }>("/health");
}

export function listCalls() {
  return apiFetch<Call[]>("/calls");
}

export function getCall(callId: string) {
  return apiFetch<Call>(`/calls/${callId}`);
}

export function uploadCall(file: File, language?: string) {
  const form = new FormData();
  form.append("file", file);
  const qs = language ? `?language=${encodeURIComponent(language)}` : "";
  return apiFetch<Call>(`/calls/upload${qs}`, { method: "POST", body: form });
}

export function startTranscription(callId: string) {
  return apiFetch<Job>(`/calls/${callId}/transcribe`, { method: "POST" });
}

export function getTranscriptionJob(callId: string, jobId: string) {
  return apiFetch<Job>(`/calls/${callId}/transcription/jobs/${jobId}`);
}

export function getTranscript(callId: string) {
  return apiFetch<TranscriptResult>(`/calls/${callId}/transcript`);
}

export function evaluateCall(callId: string, rubricId?: string) {
  const qs = rubricId ? `?rubric_id=${encodeURIComponent(rubricId)}` : "";
  return apiFetch<EvaluationResult>(`/calls/${callId}/evaluate${qs}`, { method: "POST" });
}

export function getEvaluation(callId: string) {
  return apiFetch<EvaluationResult>(`/calls/${callId}/evaluation`);
}

export function getAnalyticsSummary() {
  return apiFetch<AnalyticsSummary>("/analytics/summary");
}

export function getAnalyticsTrends() {
  return apiFetch<TrendPoint[]>("/analytics/trends");
}

export function getAnalyticsViolations() {
  return apiFetch<ViolationCount[]>("/analytics/violations");
}

export { apiFetch, API_BASE_URL };
