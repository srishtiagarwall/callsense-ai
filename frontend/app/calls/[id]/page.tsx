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
  SegmentSentiment,
  SentimentResult,
  TalkMetrics,
  Tracker,
  TrackerMatch,
  TranscriptResult,
} from "@/lib/types";
import { formatDuration } from "@/lib/format";
import TranscriptView from "@/components/TranscriptView";
import ScorecardView from "@/components/ScorecardView";
import TalkTimeBar from "@/components/TalkTimeBar";
import SentimentTimeline from "@/components/SentimentTimeline";
import TrackerBadges from "@/components/TrackerBadges";
import SectionHeading from "@/components/SectionHeading";
import { TextAction } from "@/components/Button";
import EmptyState from "@/components/EmptyState";
import PipelineSteps from "@/components/PipelineSteps";

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
    return (
      <p style={{ fontFamily: "var(--font-fraunces)", fontStyle: "italic", color: "var(--text-muted)" }}>Loading…</p>
    );
  }

  const jobInFlight = job !== null && job.status !== "done" && job.status !== "failed";
  const sentimentBySegment = sentiment
    ? new Map<number, SegmentSentiment>(sentiment.segments.map((s) => [s.segment_index, s]))
    : undefined;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1
          style={{
            fontFamily: "var(--font-fraunces)",
            fontWeight: 600,
            fontSize: "2rem",
            lineHeight: 1.1,
            letterSpacing: "-0.01em",
            color: "var(--text-primary)",
          }}
        >
          {call.filename}
        </h1>
        <div
          className="mt-1"
          style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "0.8125rem", color: "var(--text-secondary)" }}
        >
          {new Date(call.uploaded_at).toLocaleString()}
          {call.language ? ` · ${call.language}` : ""}
          {call.duration_seconds != null ? ` · ${formatDuration(call.duration_seconds)}` : ""}
        </div>
        <div
          className="mt-2 flex items-center gap-2"
          style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "0.75rem" }}
        >
          <span
            aria-hidden="true"
            className="inline-block rounded-full"
            style={{
              width: 6,
              height: 6,
              background: jobInFlight ? "var(--accent)" : "var(--status-good)",
              animation: jobInFlight ? "status-pulse 1.2s ease-in-out infinite" : "none",
            }}
          />
          <span style={{ color: "var(--text-secondary)" }}>
            {jobInFlight ? `TRANSCRIBING (${job!.status.toUpperCase()})` : transcript ? "READY" : "NOT TRANSCRIBED"}
          </span>
        </div>
      </div>

      {error && (
        <div style={{ fontFamily: "var(--font-fraunces)", color: "var(--status-critical)" }}>{error}</div>
      )}

      <div className="grid gap-12" style={{ gridTemplateColumns: "1fr 340px" }}>
        <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: "2rem" }}>
          {transcript ? (
            <TranscriptView transcript={transcript} sentimentBySegment={sentimentBySegment} />
          ) : (
            <EmptyState
              action={
                <TextAction onClick={handleTranscribe} disabled={busy || jobInFlight}>
                  {jobInFlight ? "Transcribing…" : "Transcribe now"}
                </TextAction>
              }
            >
              This call hasn&rsquo;t been transcribed yet.
            </EmptyState>
          )}

          {job && job.status === "failed" && job.attempts.length > 0 && (
            <div className="mt-6" style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
              <div
                style={{
                  fontFamily: "var(--font-jetbrains-mono)",
                  fontSize: "0.6875rem",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                }}
              >
                Provider attempts
              </div>
              <ul className="mt-1">
                {job.attempts.map((a, i) => (
                  <li
                    key={i}
                    style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "0.75rem", color: "var(--text-secondary)" }}
                  >
                    {a.provider}: {a.status}
                    {a.reason ? ` (${a.reason})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-8">
          <div>
            <SectionHeading index={1} title="Actions" />
            <PipelineSteps
              busy={busy}
              steps={[
                {
                  label: "Transcribe",
                  doneLabel: "Re-transcribe",
                  done: !!transcript,
                  disabled: jobInFlight,
                  onRun: handleTranscribe,
                },
                {
                  label: "Evaluate",
                  doneLabel: "Re-evaluate",
                  done: !!evaluation,
                  disabled: !transcript,
                  onRun: handleEvaluate,
                },
                {
                  label: "Analyze sentiment",
                  doneLabel: "Re-analyze",
                  done: !!sentiment,
                  disabled: !transcript,
                  onRun: handleAnalyzeSentiment,
                },
                {
                  label: "Run trackers",
                  doneLabel: "Re-run",
                  done: !!trackerMatches,
                  disabled: !transcript,
                  onRun: handleRunTrackers,
                },
                {
                  label: "Index for search",
                  doneLabel: "Re-index",
                  done: indexed,
                  disabled: !transcript,
                  onRun: handleIndexForSearch,
                },
              ]}
            />
          </div>

          <div>
            <SectionHeading index={2} title="Scorecard" />
            {rubrics.length > 0 && (
              <select
                value={selectedRubricId}
                onChange={(e) => setSelectedRubricId(e.target.value)}
                className="mb-3 w-full"
                style={{
                  fontFamily: "var(--font-fraunces)",
                  fontSize: "0.8125rem",
                  background: "transparent",
                  border: "1px solid var(--border-strong)",
                  borderRadius: 0,
                  color: "var(--text-primary)",
                  padding: "0.25rem 0.5rem",
                }}
              >
                {rubrics.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            )}
            {evaluation ? (
              <ScorecardView evaluation={evaluation} />
            ) : (
              <EmptyState
                action={
                  <TextAction onClick={handleEvaluate} disabled={busy || !transcript}>
                    Evaluate now
                  </TextAction>
                }
              >
                {transcript ? "Not yet evaluated." : "Transcribe the call first."}
              </EmptyState>
            )}
          </div>

          <div>
            <SectionHeading index={3} title="Talk time" />
            {evaluation && !evaluation.agent_present ? (
              <EmptyState>
                The evaluation found no agent in this transcript, so speaker-based talk time can&rsquo;t
                be trusted and isn&rsquo;t shown.
              </EmptyState>
            ) : talkMetrics ? (
              <TalkTimeBar metrics={talkMetrics} />
            ) : (
              <EmptyState>No segments yet.</EmptyState>
            )}
          </div>

          <div>
            <SectionHeading index={4} title="Sentiment" />
            {sentiment ? (
              <SentimentTimeline segments={sentiment.segments} />
            ) : (
              <EmptyState
                action={
                  <TextAction onClick={handleAnalyzeSentiment} disabled={busy || !transcript}>
                    Analyze now
                  </TextAction>
                }
              >
                {transcript ? "Not yet analyzed." : "Transcribe the call first."}
              </EmptyState>
            )}
          </div>

          <div>
            <SectionHeading index={5} title="Trackers" />
            {trackerMatches ? (
              <TrackerBadges matches={trackerMatches} trackers={trackers} />
            ) : (
              <EmptyState
                action={
                  <TextAction onClick={handleRunTrackers} disabled={busy || !transcript}>
                    Run now
                  </TextAction>
                }
              >
                {transcript ? "Not yet run." : "Transcribe the call first."}
              </EmptyState>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
