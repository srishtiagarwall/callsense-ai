"use client";

import { useState } from "react";
import type { TrendPoint } from "@/lib/types";

interface TrendChartProps {
  data: TrendPoint[];
  metric: "call_count" | "avg_score";
  title: string;
}

const WIDTH = 640;
const HEIGHT = 220;
const PAD_LEFT = 40;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

export default function TrendChart({ data, metric, title }: TrendChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const points = data.filter((d) => d[metric] !== null) as (TrendPoint & { [k: string]: number })[];

  if (points.length === 0) {
    return (
      <div
        className="rounded-lg border p-4 text-sm"
        style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-muted)" }}
      >
        {title}: no data yet
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
  const areaPath = `${linePath} L ${xFor(points.length - 1)} ${PAD_TOP + plotH} L ${xFor(0)} ${PAD_TOP + plotH} Z`;

  const hovered = hoverIdx !== null ? points[hoverIdx] : null;

  return (
    <div
      className="rounded-lg border p-4"
      style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
    >
      <div className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {title}
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        style={{ maxWidth: WIDTH }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {/* gridlines */}
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

        <path d={areaPath} fill="var(--series-1)" opacity={0.1} stroke="none" />
        <path d={linePath} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {points.map((p, i) => (
          <g key={p.date}>
            <circle
              cx={xFor(i)}
              cy={yFor(Number(p[metric]))}
              r={4}
              fill="var(--series-1)"
              stroke="var(--surface-1)"
              strokeWidth={2}
            />
            {/* larger invisible hit target */}
            <rect
              x={xFor(i) - plotW / points.length / 2}
              y={PAD_TOP}
              width={plotW / points.length}
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
          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{hovered.date}</span>
          {" — "}
          {metric === "call_count" ? `${hovered.call_count} calls` : `avg score ${hovered.avg_score?.toFixed(2)}`}
        </div>
      )}
    </div>
  );
}
