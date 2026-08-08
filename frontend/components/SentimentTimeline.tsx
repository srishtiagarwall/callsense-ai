"use client";

import { useState } from "react";
import type { SegmentSentiment } from "@/lib/types";

interface SentimentTimelineProps {
  segments: SegmentSentiment[];
}

const WIDTH = 560;
const HEIGHT = 160;
const PAD_LEFT = 8;
const PAD_RIGHT = 88;
const PAD_TOP = 16;
const PAD_BOTTOM = 16;

export default function SentimentTimeline({ segments }: SentimentTimelineProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (segments.length === 0) {
    return (
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: "0.6875rem",
          textTransform: "uppercase",
          color: "var(--text-muted)",
        }}
      >
        Sentiment — no data
      </div>
    );
  }

  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const xFor = (i: number) =>
    PAD_LEFT + (segments.length === 1 ? plotW / 2 : (i / (segments.length - 1)) * plotW);
  const yFor = (score: number) => PAD_TOP + plotH / 2 - (score * plotH) / 2;

  const hovered = hoverIdx !== null ? segments[hoverIdx] : null;
  const last = segments[segments.length - 1];

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        style={{ maxWidth: WIDTH, overflow: "visible" }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <line
          x1={PAD_LEFT}
          x2={WIDTH - PAD_RIGHT}
          y1={PAD_TOP + plotH / 2}
          y2={PAD_TOP + plotH / 2}
          stroke="var(--baseline)"
          strokeWidth={1}
          strokeDasharray="2 3"
        />

        {segments.slice(0, -1).map((s, i) => {
          const next = segments[i + 1];
          const midScore = (s.score + next.score) / 2;
          const color = midScore >= 0 ? "var(--status-good)" : "var(--status-critical)";
          return (
            <line
              key={i}
              x1={xFor(i)}
              y1={yFor(s.score)}
              x2={xFor(i + 1)}
              y2={yFor(next.score)}
              stroke={color}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          );
        })}

        <circle
          cx={xFor(segments.length - 1)}
          cy={yFor(last.score)}
          r={3}
          fill={last.score >= 0 ? "var(--status-good)" : "var(--status-critical)"}
        />
        <text
          x={xFor(segments.length - 1) + 10}
          y={yFor(last.score) + 4}
          fontFamily="var(--font-jetbrains-mono)"
          fontSize="12"
          fontWeight={500}
          fill={last.score >= 0 ? "var(--status-good)" : "var(--status-critical)"}
        >
          {last.score >= 0 ? "+" : ""}
          {last.score.toFixed(2)}
        </text>

        {segments.map((s, i) => (
          <rect
            key={i}
            x={xFor(i) - plotW / segments.length / 2}
            y={PAD_TOP}
            width={plotW / segments.length}
            height={plotH}
            fill="transparent"
            onMouseEnter={() => setHoverIdx(i)}
          />
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
        <div
          className="mt-1 capitalize"
          style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "0.75rem", color: "var(--text-secondary)" }}
        >
          <span style={{ color: hovered.score >= 0 ? "var(--status-good)" : "var(--status-critical)" }}>
            {hovered.label}
          </span>
          {" · "}
          {hovered.speaker}
          {` · ${hovered.score.toFixed(2)}`}
        </div>
      )}
    </div>
  );
}
