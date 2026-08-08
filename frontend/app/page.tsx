"use client";

import { useEffect, useState } from "react";
import { getAnalyticsSummary, getAnalyticsTrends, getAnalyticsViolations } from "@/lib/api";
import type { AnalyticsSummary, TrendPoint, ViolationCount } from "@/lib/types";
import KpiCard from "@/components/KpiCard";
import TrendChart from "@/components/TrendChart";
import SectionHeading from "@/components/SectionHeading";
import EmptyState from "@/components/EmptyState";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default function DashboardPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [violations, setViolations] = useState<ViolationCount[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getAnalyticsSummary(), getAnalyticsTrends(), getAnalyticsViolations()])
      .then(([s, t, v]) => {
        setSummary(s);
        setTrends(t);
        setViolations(v);
      })
      .catch((err) => setError(String(err)));
  }, []);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1
          style={{
            fontFamily: "var(--font-fraunces)",
            fontWeight: 600,
            fontSize: "2.75rem",
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
            color: "var(--text-primary)",
          }}
        >
          Dashboard
        </h1>
        <div
          className="mt-2"
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: "0.75rem",
            letterSpacing: "0.01em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          {DATE_FORMAT.format(new Date()).toUpperCase()}
          {summary && ` · ${summary.total_calls} CALLS PROCESSED`}
        </div>
      </div>

      {error && (
        <div style={{ fontFamily: "var(--font-fraunces)", color: "var(--status-critical)" }}>{error}</div>
      )}

      <div className="flex flex-wrap">
        <KpiCard label="Total calls" value={summary ? String(summary.total_calls) : "—"} />
        <KpiCard label="Evaluated" value={summary ? String(summary.total_evaluated) : "—"} divider />
        <KpiCard label="Avg QA score" value={summary?.avg_score != null ? summary.avg_score.toFixed(2) : "—"} divider />
        <KpiCard label="Violations" value={summary ? String(summary.total_violations) : "—"} divider />
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <SectionHeading index={1} title="Call volume" />
          <TrendChart data={trends} metric="call_count" title="Call volume by day" />
        </div>
        <div>
          <SectionHeading index={2} title="Avg QA score" />
          <TrendChart data={trends} metric="avg_score" title="Avg QA score by day" />
        </div>
      </div>

      <div>
        <SectionHeading index={3} title="Compliance violations" />
        {violations.length === 0 ? (
          <EmptyState>No violations recorded for this period.</EmptyState>
        ) : (
          <table className="dense-table">
            <thead>
              <tr>
                <th></th>
                <th>Violation</th>
                <th className="numeric">Count</th>
              </tr>
            </thead>
            <tbody>
              {violations.map((v) => (
                <tr key={v.violation}>
                  <td style={{ width: 24 }}>
                    <span
                      className="inline-block"
                      style={{ width: 6, height: 6, background: "var(--status-critical)" }}
                    />
                  </td>
                  <td>{v.violation}</td>
                  <td className="numeric">{v.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
