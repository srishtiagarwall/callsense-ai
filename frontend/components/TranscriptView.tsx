import type { SegmentSentiment, TranscriptResult } from "@/lib/types";

interface TranscriptViewProps {
  transcript: TranscriptResult;
  sentimentBySegment?: Map<number, SegmentSentiment>;
}

const SPEAKER_LABEL: Record<string, string> = {
  agent: "Agent",
  customer: "Caller",
};

export default function TranscriptView({ transcript, sentimentBySegment }: TranscriptViewProps) {
  return (
    <div style={{ maxWidth: "68ch" }}>
      {transcript.segments.length > 0 ? (
        <div className="flex flex-col">
          {transcript.segments.map((seg, i) => {
            const sentiment = sentimentBySegment?.get(i);
            const speakerChanged = i === 0 || transcript.segments[i - 1].speaker !== seg.speaker;
            return (
              <div
                key={i}
                className="py-2.5"
                style={speakerChanged && i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
              >
                <div className="flex items-baseline justify-between">
                  <span
                    style={{
                      fontFamily: "var(--font-fraunces)",
                      fontWeight: 500,
                      fontSize: "0.75rem",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: seg.speaker === "agent" ? "var(--text-primary)" : "var(--text-secondary)",
                    }}
                  >
                    {SPEAKER_LABEL[seg.speaker] ?? seg.speaker}
                  </span>
                  <span className="flex items-center gap-3">
                    {sentiment && (
                      <span
                        style={{
                          fontFamily: "var(--font-jetbrains-mono)",
                          fontSize: "0.6875rem",
                          color: sentiment.score >= 0 ? "var(--status-good)" : "var(--status-critical)",
                        }}
                      >
                        {sentiment.score >= 0 ? "+" : ""}
                        {sentiment.score.toFixed(2)}
                      </span>
                    )}
                    <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                      {seg.start.toFixed(1)}s
                    </span>
                  </span>
                </div>
                <p
                  className="mt-1"
                  style={{
                    fontFamily: "var(--font-fraunces)",
                    fontSize: "1.0625rem",
                    lineHeight: 1.65,
                    color: "var(--text-primary)",
                  }}
                >
                  {seg.text}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ fontFamily: "var(--font-fraunces)", fontSize: "1.0625rem", lineHeight: 1.65, color: "var(--text-primary)" }}>
          {transcript.text}
        </p>
      )}
      <div
        className="mt-4"
        style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase" }}
      >
        Source: {transcript.provider}
      </div>
    </div>
  );
}
