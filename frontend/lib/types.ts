export type JobStatus = "pending" | "processing" | "done" | "failed";

export interface Call {
  id: string;
  filename: string;
  audio_path: string;
  language: string | null;
  uploaded_at: string;
  duration_seconds: number | null;
}

export interface TranscriptSegment {
  speaker: string;
  start: number;
  end: number;
  text: string;
}

export interface TranscriptResult {
  id: string | null;
  call_id: string;
  provider: string;
  language: string | null;
  text: string;
  segments: TranscriptSegment[];
  created_at: string;
}

export interface JobAttempt {
  provider: string;
  status: "success" | "failed" | "skipped";
  reason?: string;
}

export interface Job {
  id: string;
  call_id: string;
  kind: string;
  status: JobStatus;
  attempts: JobAttempt[];
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvaluationResult {
  id: string | null;
  call_id: string;
  rubric_id: string;
  scores: Record<string, number>;
  violations: string[];
  summary: string;
  raw: Record<string, unknown>;
  created_at: string;
}

export interface AnalyticsSummary {
  total_calls: number;
  total_evaluated: number;
  avg_score: number | null;
  total_violations: number;
}

export interface TrendPoint {
  date: string;
  call_count: number;
  avg_score: number | null;
}

export interface ViolationCount {
  violation: string;
  count: number;
}
