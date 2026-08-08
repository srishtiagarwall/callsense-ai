"use client";

import { use, useCallback, useEffect, useState } from "react";
import {
  analyzeSentiment,
  API_BASE_URL,
  embedCall,
  evaluateCall,
  getCall,
  getEvaluation,
  getSentiment,
  getTalkMetrics,
  getTrackerMatches,
  getTranscript,
  listRubrics,
  listTrackers,
  runTrackers,
  startTranscription,
} from "@/lib/api";
import { getApiKey } from "@/lib/auth";
import type {
  Call,
  EvaluationResult,
  Job,
  Rubric,
  SentimentResult,
  TalkMetrics,
  Tracker,
  TrackerMatch,
  TranscriptResult,
} from "@/lib/types";
import TranscriptView from "@/components/TranscriptView";
import ScorecardView from "@/components/ScorecardView";
import TalkTimeBar from "@/components/TalkTimeBar";
import SentimentTimeline from "@/components/SentimentTimeline";
import TrackerBadges from "@/components/TrackerBadges";

export default function CallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [call, setCall] = useState<Call | null>(null);
  const [transcript, setTranscript] = useState<TranscriptResult | null>(null);
  const [talkMetrics, setTalkMetrics] = useState<TalkMetrics | null>(null);
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [trackerMatches, setTrackerMatches] = useState<TrackerMatch[] | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [selectedRubricId, setSelectedRubricId] = useState<string>("");
  const [job, setJob] = useState<Job | null>(null);
  const [indexed, setIndexed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(() => {
    getCall(id).then(setCall).catch(() => setCall(null));
    getTranscript(id)
      .then(setTranscript)
      .catch(() => setTranscript(null));
    getTalkMetrics(id)
      .then(setTalkMetrics)
      .catch(() => setTalkMetrics(null));
    getSentiment(id)
      .then(setSentiment)
      .catch(() => setSentiment(null));
    getTrackerMatches(id)
      .then(setTrackerMatches)
      .catch(() => setTrackerMatches(null));
    getEvaluation(id)
      .then(setEvaluation)
      .catch(() => setEvaluation(null));
  }, [id]);

  useEffect(() => {
    listTrackers().then(setTrackers).catch(() => setTrackers([]));
    listRubrics()
      .then((r) => {
        setRubrics(r);
        if (r.length > 0) setSelectedRubricId((current) => current || r[0].id);
      })
      .catch(() => setRubrics([]));
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!job || job.status === "done" || job.status === "failed") return;

    const apiKey = getApiKey();
    const streamUrl = `${API_BASE_URL}/calls/${id}/transcription/jobs/${job.id}/stream${
      apiKey ? `?key=${encodeURIComponent(apiKey)}` : ""
    }`;
    const source = new EventSource(streamUrl);

    source.onmessage = (event) => {
      const updated: Job = JSON.parse(event.data);
      setJob(updated);
      if (updated.status === "done") {
        getTranscript(id).then(setTranscript).catch(() => {});
        getTalkMetrics(id).then(setTalkMetrics).catch(() => {});
      }
      if (updated.status === "done" || updated.status === "failed") {
        source.close();
      }
    };

    source.onerror = () => {
      source.close();
    };

    return () => source.close();
    // Intentionally keyed on job?.id, not the whole job object: re-running on
    // every setJob() from an incoming SSE message would tear down and reopen
    // the connection per event instead of once per job.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.id, id]);

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
      const result = await evaluateCall(id, selectedRubricId || undefined);
      setEvaluation(result);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleAnalyzeSentiment() {
    setBusy(true);
    setError(null);
    try {
      const result = await analyzeSentiment(id);
      setSentiment(result);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRunTrackers() {
    setBusy(true);
    setError(null);
    try {
      const matches = await runTrackers(id);
      setTrackerMatches(matches);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleIndexForSearch() {
    setBusy(true);
    setError(null);
    try {
      await embedCall(id);
      setIndexed(true);
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
        {rubrics.length > 0 && (
          <select
            value={selectedRubricId}
            onChange={(e) => setSelectedRubricId(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-primary)" }}
          >
            {rubrics.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={handleEvaluate}
          disabled={busy || !transcript}
          className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ background: "var(--series-3)" }}
        >
          {evaluation ? "Re-evaluate" : "Evaluate"}
        </button>
        <button
          onClick={handleAnalyzeSentiment}
          disabled={busy || !transcript}
          className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ background: "var(--series-4)" }}
        >
          {sentiment ? "Re-analyze sentiment" : "Analyze sentiment"}
        </button>
        <button
          onClick={handleRunTrackers}
          disabled={busy || !transcript}
          className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
        >
          {trackerMatches ? "Re-run trackers" : "Run trackers"}
        </button>
        <button
          onClick={handleIndexForSearch}
          disabled={busy || !transcript}
          className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
        >
          {indexed ? "Re-index for search" : "Index for search"}
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
      {talkMetrics && <TalkTimeBar metrics={talkMetrics} />}
      {sentiment && <SentimentTimeline segments={sentiment.segments} />}
      {trackerMatches && <TrackerBadges matches={trackerMatches} trackers={trackers} />}
      {evaluation && <ScorecardView evaluation={evaluation} />}
    </div>
  );
}
