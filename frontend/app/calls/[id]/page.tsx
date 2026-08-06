"use client";

import { use, useCallback, useEffect, useState } from "react";
import {
  evaluateCall,
  getCall,
  getEvaluation,
  getTranscript,
  getTranscriptionJob,
  startTranscription,
} from "@/lib/api";
import type { Call, EvaluationResult, Job, TranscriptResult } from "@/lib/types";
import TranscriptView from "@/components/TranscriptView";
import ScorecardView from "@/components/ScorecardView";

export default function CallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [call, setCall] = useState<Call | null>(null);
  const [transcript, setTranscript] = useState<TranscriptResult | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(() => {
    getCall(id).then(setCall).catch(() => setCall(null));
    getTranscript(id)
      .then(setTranscript)
      .catch(() => setTranscript(null));
    getEvaluation(id)
      .then(setEvaluation)
      .catch(() => setEvaluation(null));
  }, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!job || job.status === "done" || job.status === "failed") return;
    const interval = setInterval(async () => {
      const updated = await getTranscriptionJob(id, job.id);
      setJob(updated);
      if (updated.status === "done") {
        getTranscript(id).then(setTranscript).catch(() => {});
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [job, id]);

  async function handleTranscribe() {
    setBusy(true);
    setError(null);
    try {
      const newJob = await startTranscription(id);
      setJob(newJob);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleEvaluate() {
    setBusy(true);
    setError(null);
    try {
      const result = await evaluateCall(id);
      setEvaluation(result);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  if (!call) {
    return <p style={{ color: "var(--text-muted)" }}>Loading…</p>;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          {call.filename}
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Uploaded {new Date(call.uploaded_at).toLocaleString()}
          {call.language ? ` — ${call.language}` : ""}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border p-4 text-sm" style={{ borderColor: "var(--status-critical)", color: "var(--status-critical)" }}>
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleTranscribe}
          disabled={busy || (job !== null && job.status !== "done" && job.status !== "failed")}
          className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ background: "var(--series-1)" }}
        >
          {transcript ? "Re-transcribe" : "Transcribe"}
        </button>
        <button
          onClick={handleEvaluate}
          disabled={busy || !transcript}
          className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ background: "var(--series-3)" }}
        >
          {evaluation ? "Re-evaluate" : "Evaluate"}
        </button>
      </div>

      {job && job.status !== "done" && (
        <div
          className="rounded-lg border p-3 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-secondary)" }}
        >
          Transcription job: <span style={{ color: "var(--text-primary)" }}>{job.status}</span>
          {job.attempts.length > 0 && (
            <ul className="mt-1 list-inside list-disc">
              {job.attempts.map((a, i) => (
                <li key={i}>
                  {a.provider}: {a.status}
                  {a.reason ? ` (${a.reason})` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {transcript && <TranscriptView transcript={transcript} />}
      {evaluation && <ScorecardView evaluation={evaluation} />}
    </div>
  );
}
