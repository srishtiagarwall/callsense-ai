export type JobStatus = "pending" | "processing" | "done" | "failed";

export interface Call {
  id: string;
  filename: string;
  audio_path: string;
  language: string | null;
  uploaded_at: string;
  duration_seconds: number | null;
}

export interface PaginatedCalls {
  items: Call[];
  total: number;
  page: number;
  page_size: number;
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

export interface SegmentSentiment {
  segment_index: number;
  speaker: string;
  label: "positive" | "neutral" | "negative";
  score: number;
}

export interface SentimentResult {
  id: string | null;
  call_id: string;
  segments: SegmentSentiment[];
  created_at: string;
}

export interface SearchResult {
  call_id: string;
  filename: string;
  score: number;
}

export interface RubricCriterion {
  id: string;
  description: string;
  weight: number;
}

export interface Rubric {
  id: string;
  name: string;
  script_steps: string[];
  compliance_rules: RubricCriterion[];
  qa_criteria: RubricCriterion[];
}

export interface Tracker {
  id: string;
  name: string;
  keywords: string[];
}

export interface TrackerMatch {
  id: string | null;
  call_id: string;
  tracker_id: string;
  keyword: string;
  segment_index: number;
  snippet: string;
  created_at: string;
}

export interface TalkMetrics {
  agent_seconds: number;
  customer_seconds: number;
  agent_pct: number;
  customer_pct: number;
  longest_monologue_speaker: string | null;
  longest_monologue_seconds: number;
  interruption_count: number;
}
