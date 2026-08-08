import type { EvaluationResult } from "@/lib/types";
import { scoreColor } from "@/lib/format";

interface ScorecardViewProps {
  evaluation: EvaluationResult;
}

export default function ScorecardView({ evaluation }: ScorecardViewProps) {
  const entries = Object.entries(evaluation.scores);

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
      <div className="mb-3 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        QA Scorecard
      </div>

      <p className="mb-4 text-sm" style={{ color: "var(--text-secondary)" }}>
        {evaluation.summary}
      </p>

      <div className="space-y-2">
        {entries.map(([id, score]) => (
          <div key={id} className="flex items-center gap-3">
            <span className="w-40 shrink-0 text-sm" style={{ color: "var(--text-primary)" }}>
              {id}
            </span>
            <div className="h-2 flex-1 rounded-full" style={{ background: "var(--gridline)" }}>
              <div
                className="h-2 rounded-full"
                style={{ width: `${Math.round(score * 100)}%`, background: scoreColor(score) }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
              {score.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {evaluation.violations.length > 0 && (
        <div className="mt-4">
          <div className="mb-1 text-xs font-medium" style={{ color: "var(--status-critical)" }}>
            Compliance violations
          </div>
          <ul className="list-inside list-disc text-sm" style={{ color: "var(--text-primary)" }}>
            {evaluation.violations.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
