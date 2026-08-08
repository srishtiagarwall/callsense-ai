import type { TalkMetrics } from "@/lib/types";
import { formatDuration as formatSeconds } from "@/lib/format";

interface TalkTimeBarProps {
  metrics: TalkMetrics;
}

const WIDTH = 640;
const BAR_HEIGHT = 28;

export default function TalkTimeBar({ metrics }: TalkTimeBarProps) {
  const total = metrics.agent_seconds + metrics.customer_seconds;

  if (total === 0) {
    return (
      <div
        className="rounded-lg border p-4 text-sm"
        style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-muted)" }}
      >
        Talk-time metrics: no segments yet
      </div>
    );
  }

  const agentWidth = (metrics.agent_pct / 100) * WIDTH;
  const customerWidth = (metrics.customer_pct / 100) * WIDTH;

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
      <div className="mb-3 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        Talk-time & interruptions
      </div>

      <svg viewBox={`0 0 ${WIDTH} ${BAR_HEIGHT}`} className="w-full" style={{ maxWidth: WIDTH }}>
        <rect x={0} y={0} width={agentWidth} height={BAR_HEIGHT} fill="var(--series-1)" rx={4} />
        <rect
          x={agentWidth}
          y={0}
          width={customerWidth}
          height={BAR_HEIGHT}
          fill="var(--series-2)"
          rx={4}
        />
      </svg>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--series-1)" }} />
            <span style={{ color: "var(--text-secondary)" }}>Agent</span>
          </div>
          <div className="mt-0.5 font-medium tabular-nums" style={{ color: "var(--text-primary)" }}>
            {metrics.agent_pct}% ({formatSeconds(metrics.agent_seconds)})
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--series-2)" }} />
            <span style={{ color: "var(--text-secondary)" }}>Customer</span>
          </div>
          <div className="mt-0.5 font-medium tabular-nums" style={{ color: "var(--text-primary)" }}>
            {metrics.customer_pct}% ({formatSeconds(metrics.customer_seconds)})
          </div>
        </div>
        <div>
          <div style={{ color: "var(--text-secondary)" }}>Longest monologue</div>
          <div className="mt-0.5 font-medium tabular-nums capitalize" style={{ color: "var(--text-primary)" }}>
            {metrics.longest_monologue_speaker ?? "—"} · {formatSeconds(metrics.longest_monologue_seconds)}
          </div>
        </div>
        <div>
          <div style={{ color: "var(--text-secondary)" }}>Interruptions</div>
          <div className="mt-0.5 font-medium tabular-nums" style={{ color: "var(--text-primary)" }}>
            {metrics.interruption_count}
          </div>
        </div>
      </div>
    </div>
  );
}
