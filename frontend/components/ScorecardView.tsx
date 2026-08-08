import type { EvaluationResult } from "@/lib/types";
import { scoreColor } from "@/lib/format";

interface ScorecardViewProps {
  evaluation: EvaluationResult;
}

export default function ScorecardView({ evaluation }: ScorecardViewProps) {
  const entries = Object.entries(evaluation.scores);
  const overall = entries.length > 0 ? entries.reduce((sum, [, s]) => sum + s, 0) / entries.length : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between" style={{ borderBottom: "1px solid var(--border-strong)", paddingBottom: "0.5rem" }}>
        <span
          style={{ fontFamily: "var(--font-fraunces)", fontSize: "0.875rem", color: "var(--text-secondary)" }}
        >
          Overall
        </span>
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontWeight: 500,
            fontSize: "1.25rem",
            color: scoreColor(overall),
          }}
        >
          {overall.toFixed(2)}
        </span>
      </div>

      <div className="mt-2">
        {entries.map(([id, score]) => (
          <div
            key={id}
            className="flex items-center justify-between py-1.5"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <span style={{ fontFamily: "var(--font-fraunces)", fontSize: "0.875rem", color: "var(--text-primary)" }}>
              {id.replace(/_/g, " ")}
            </span>
            <span
              style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "0.8125rem", color: scoreColor(score) }}
            >
              {score.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <p
        className="mt-3"
        style={{ fontFamily: "var(--font-fraunces)", fontStyle: "italic", fontSize: "0.875rem", lineHeight: 1.5, color: "var(--text-secondary)" }}
      >
        {evaluation.summary}
      </p>

      {evaluation.violations.length > 0 && (
        <div className="mt-3">
          <div
            style={{
              fontFamily: "var(--font-fraunces)",
              fontWeight: 500,
              fontSize: "0.75rem",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--status-critical)",
            }}
          >
            Violations
          </div>
          <ul className="mt-1">
            {evaluation.violations.map((v) => (
              <li
                key={v}
                style={{ fontFamily: "var(--font-fraunces)", fontSize: "0.8125rem", color: "var(--text-primary)" }}
              >
                — {v}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
