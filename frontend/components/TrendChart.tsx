"use client";

import { useState } from "react";
import type { TrendPoint } from "@/lib/types";

interface TrendChartProps {
  data: TrendPoint[];
  metric: "call_count" | "avg_score";
  title: string;
}

const WIDTH = 560;
const HEIGHT = 200;
const PAD_LEFT = 8;
const PAD_RIGHT = 88;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;

const METRIC_LABEL: Record<string, string> = {
  call_count: "Calls",
  avg_score: "Score",
};

export default function TrendChart({ data, metric, title }: TrendChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const points = data.filter((d) => d[metric] !== null) as (TrendPoint & { [k: string]: number })[];

  if (points.length === 0) {
    return (
      <div>
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: "0.6875rem",
            letterSpacing: "0.01em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          {title} — no data
        </div>
      </div>
    );
  }

  const values = points.map((p) => Number(p[metric]));
  const maxVal = Math.max(...values, metric === "avg_score" ? 1 : 0);
  const minVal = 0;

  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const xFor = (i: number) => PAD_LEFT + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const yFor = (v: number) => PAD_TOP + plotH - ((v - minVal) / (maxVal - minVal || 1)) * plotH;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(Number(p[metric]))}`).join(" ");

  const hovered = hoverIdx !== null ? points[hoverIdx] : null;
  const lastPoint = points[points.length - 1];
  const lastValue = Number(lastPoint[metric]);

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        style={{ maxWidth: WIDTH, overflow: "visible" }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {[0, 0.5, 1].map((frac) => (
          <line
            key={frac}
            x1={PAD_LEFT}
            x2={WIDTH - PAD_RIGHT}
            y1={PAD_TOP + plotH * frac}
            y2={PAD_TOP + plotH * frac}
            stroke="var(--gridline)"
            strokeWidth={1}
          />
        ))}

        <path d={linePath} fill="none" stroke="var(--series-1)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />

        <circle cx={xFor(points.length - 1)} cy={yFor(lastValue)} r={3} fill="var(--series-1)" />

        <text
          x={xFor(points.length - 1) + 10}
          y={yFor(lastValue) + 4}
          fontFamily="var(--font-jetbrains-mono)"
          fontSize="12"
          fontWeight={500}
          fill="var(--series-1)"
        >
          {METRIC_LABEL[metric]} {metric === "avg_score" ? lastValue.toFixed(2) : lastValue}
        </text>

        {points.map((p, i) => (
          <rect
            key={p.date}
            x={xFor(i) - plotW / points.length / 2}
            y={PAD_TOP}
            width={plotW / points.length}
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
            strokeDasharray="2 3"
          />
        )}

        <text x={xFor(0)} y={HEIGHT - 6} fontFamily="var(--font-jetbrains-mono)" fontSize="10.5" fill="var(--text-muted)" textAnchor="start">
          {points[0].date}
        </text>
        <text x={xFor(points.length - 1)} y={HEIGHT - 6} fontFamily="var(--font-jetbrains-mono)" fontSize="10.5" fill="var(--text-muted)" textAnchor="end">
          {points[points.length - 1].date}
        </text>
      </svg>

      {hovered && (
        <div
          className="mt-1"
          style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "0.75rem", color: "var(--text-secondary)" }}
        >
          <span style={{ color: "var(--text-primary)" }}>{hovered.date}</span>
          {" · "}
          {metric === "call_count" ? `${hovered.call_count} calls` : `avg score ${hovered.avg_score?.toFixed(2)}`}
        </div>
      )}
    </div>
  );
}
