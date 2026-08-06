import type { TranscriptResult } from "@/lib/types";

interface TranscriptViewProps {
  transcript: TranscriptResult;
}

const SPEAKER_COLOR: Record<string, string> = {
  agent: "var(--series-1)",
  customer: "var(--series-2)",
};

export default function TranscriptView({ transcript }: TranscriptViewProps) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Transcript
        </div>
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          provider: {transcript.provider}
        </div>
      </div>

      {transcript.segments.length > 0 ? (
        <div className="space-y-2">
          {transcript.segments.map((seg, i) => (
            <div key={i} className="flex gap-3 text-sm">
              <span
                className="w-20 shrink-0 font-medium capitalize"
                style={{ color: SPEAKER_COLOR[seg.speaker] ?? "var(--text-secondary)" }}
              >
                {seg.speaker}
              </span>
              <span style={{ color: "var(--text-primary)" }}>{seg.text}</span>
              <span className="ml-auto shrink-0 tabular-nums text-xs" style={{ color: "var(--text-muted)" }}>
                {seg.start.toFixed(1)}s
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm" style={{ color: "var(--text-primary)" }}>
          {transcript.text}
        </p>
      )}
    </div>
  );
}
