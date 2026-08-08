"use client";

import { useState } from "react";
import type { SegmentSentiment } from "@/lib/types";

interface SentimentTimelineProps {
  segments: SegmentSentiment[];
}

const WIDTH = 640;
const HEIGHT = 180;
const PAD_LEFT = 40;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;

const LABEL_COLOR: Record<string, string> = {
  positive: "var(--status-good)",
  neutral: "var(--status-warning)",
  negative: "var(--status-critical)",
};

export default function SentimentTimeline({ segments }: SentimentTimelineProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (segments.length === 0) {
    return (
      <div
        className="rounded-lg border p-4 text-sm"
        style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-muted)" }}
      >
        Sentiment: no data yet
      </div>
    );
  }

  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const xFor = (i: number) =>
    PAD_LEFT + (segments.length === 1 ? plotW / 2 : (i / (segments.length - 1)) * plotW);
  // score ranges -1..1, map to plot with 0 at vertical center
  const yFor = (score: number) => PAD_TOP + plotH / 2 - (score * plotH) / 2;

  const linePath = segments.map((s, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(s.score)}`).join(" ");

  const hovered = hoverIdx !== null ? segments[hoverIdx] : null;

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
      <div className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        Sentiment over time
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        style={{ maxWidth: WIDTH }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {/* zero baseline */}
        <line
          x1={PAD_LEFT}
          x2={WIDTH - PAD_RIGHT}
          y1={PAD_TOP + plotH / 2}
          y2={PAD_TOP + plotH / 2}
          stroke="var(--baseline)"
          strokeWidth={1}
        />

        <path d={linePath} fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeLinejoin="round" />

        {segments.map((s, i) => (
          <g key={i}>
            <circle cx={xFor(i)} cy={yFor(s.score)} r={5} fill={LABEL_COLOR[s.label] ?? "var(--text-muted)"} stroke="var(--surface-1)" strokeWidth={2} />
            <rect
              x={xFor(i) - plotW / segments.length / 2}
              y={PAD_TOP}
              width={plotW / segments.length}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
            />
          </g>
        ))}

        {hoverIdx !== null && (
          <line
            x1={xFor(hoverIdx)}
            x2={xFor(hoverIdx)}
            y1={PAD_TOP}
            y2={PAD_TOP + plotH}
            stroke="var(--baseline)"
            strokeWidth={1}
          />
        )}
      </svg>

      {hovered && (
        <div className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
          <span className="capitalize" style={{ color: LABEL_COLOR[hovered.label], fontWeight: 600 }}>
            {hovered.label}
          </span>
          {" — "}
          <span className="capitalize">{hovered.speaker}</span>
          {` (score ${hovered.score.toFixed(2)})`}
        </div>
      )}
    </div>
  );
}
