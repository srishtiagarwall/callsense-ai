import type { TalkMetrics } from "@/lib/types";

interface TalkTimeBarProps {
  metrics: TalkMetrics;
}

const WIDTH = 300;
const BAR_HEIGHT = 8;

export default function TalkTimeBar({ metrics }: TalkTimeBarProps) {
  const total = metrics.agent_seconds + metrics.customer_seconds;

  if (total === 0) {
    return (
      <div style={{ fontFamily: "var(--font-fraunces)", fontStyle: "italic", fontSize: "0.875rem", color: "var(--text-muted)" }}>
        No segments yet.
      </div>
    );
  }

  const agentWidth = (metrics.agent_pct / 100) * WIDTH;
  const customerWidth = WIDTH - agentWidth;

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${BAR_HEIGHT}`} className="w-full" style={{ maxWidth: WIDTH }}>
        <rect x={0} y={0} width={WIDTH} height={BAR_HEIGHT} fill="var(--surface-2)" />
        <rect x={0} y={0} width={agentWidth} height={BAR_HEIGHT} fill="var(--series-1)" />
        <rect x={agentWidth} y={0} width={customerWidth} height={BAR_HEIGHT} fill="var(--accent)" />
        {agentWidth > 0 && agentWidth < WIDTH && (
          <rect x={agentWidth - 0.5} y={0} width={1} height={BAR_HEIGHT} fill="var(--background)" />
        )}
      </svg>

      <div className="mt-2 flex justify-between" style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "0.75rem" }}>
        <span style={{ color: "var(--series-1)" }}>AGENT {metrics.agent_pct}%</span>
        <span style={{ color: "var(--accent)" }}>CALLER {metrics.customer_pct}%</span>
      </div>

      <div
        className="mt-3 grid grid-cols-2 gap-2"
        style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "0.75rem", color: "var(--text-secondary)" }}
      >
        <div>
          <div style={{ color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.6875rem" }}>Longest turn</div>
          <div className="capitalize" style={{ color: "var(--text-primary)" }}>
            {metrics.longest_monologue_speaker ?? "—"} · {metrics.longest_monologue_seconds}s
          </div>
        </div>
        <div>
          <div style={{ color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.6875rem" }}>Interruptions</div>
          <div style={{ color: "var(--text-primary)" }}>{metrics.interruption_count}</div>
        </div>
      </div>
    </div>
  );
}
