import type {
  AnalyticsSummary,
  Call,
  EvaluationResult,
  Job,
  PaginatedCalls,
  Rubric,
  SearchResult,
  SentimentResult,
  TalkMetrics,
  Tracker,
  TrackerMatch,
  TranscriptResult,
  TrendPoint,
  ViolationCount,
} from "./types";
import { getApiKey } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = getApiKey();
  const headers = new Headers(init?.headers);
  if (apiKey) headers.set("X-API-Key", apiKey);

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export function getHealth() {
  return apiFetch<{ status: string }>("/health");
}

export interface ListCallsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: string;
}

export function listCalls(params: ListCallsParams = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("page_size", String(params.pageSize));
  if (params.search) qs.set("search", params.search);
  if (params.sort) qs.set("sort", params.sort);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<PaginatedCalls>(`/calls${suffix}`);
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

export function getTalkMetrics(callId: string) {
  return apiFetch<TalkMetrics>(`/calls/${callId}/talk-metrics`);
}

export function evaluateCall(callId: string, rubricId?: string) {
  const qs = rubricId ? `?rubric_id=${encodeURIComponent(rubricId)}` : "";
  return apiFetch<EvaluationResult>(`/calls/${callId}/evaluate${qs}`, { method: "POST" });
}

export function getEvaluation(callId: string) {
  return apiFetch<EvaluationResult>(`/calls/${callId}/evaluation`);
}

export function analyzeSentiment(callId: string) {
  return apiFetch<SentimentResult>(`/calls/${callId}/sentiment`, { method: "POST" });
}

export function getSentiment(callId: string) {
  return apiFetch<SentimentResult>(`/calls/${callId}/sentiment`);
}

export function embedCall(callId: string) {
  return apiFetch<{ call_id: string }>(`/calls/${callId}/embed`, { method: "POST" });
}

export function searchCalls(query: string, topK?: number) {
  const qs = new URLSearchParams({ q: query, ...(topK ? { top_k: String(topK) } : {}) });
  return apiFetch<SearchResult[]>(`/search?${qs.toString()}`);
}

export function listRubrics() {
  return apiFetch<Rubric[]>("/rubrics");
}

export function getRubric(rubricId: string) {
  return apiFetch<Rubric>(`/rubrics/${rubricId}`);
}

export function createRubric(rubric: Rubric) {
  return apiFetch<Rubric>("/rubrics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rubric),
  });
}

export function updateRubric(rubricId: string, rubric: Rubric) {
  return apiFetch<Rubric>(`/rubrics/${rubricId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rubric),
  });
}

export function deleteRubric(rubricId: string) {
  return apiFetch<void>(`/rubrics/${rubricId}`, { method: "DELETE" });
}

export function listTrackers() {
  return apiFetch<Tracker[]>("/trackers");
}

export function runTrackers(callId: string) {
  return apiFetch<TrackerMatch[]>(`/calls/${callId}/trackers/run`, { method: "POST" });
}

export function getTrackerMatches(callId: string) {
  return apiFetch<TrackerMatch[]>(`/calls/${callId}/trackers`);
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
