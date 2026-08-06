"use client";

import { useEffect, useState } from "react";
import { getAnalyticsSummary, getAnalyticsTrends, getAnalyticsViolations } from "@/lib/api";
import type { AnalyticsSummary, TrendPoint, ViolationCount } from "@/lib/types";
import KpiCard from "@/components/KpiCard";
import TrendChart from "@/components/TrendChart";

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
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
        Dashboard
      </h1>

      {error && (
        <div className="rounded-lg border p-4 text-sm" style={{ borderColor: "var(--status-critical)", color: "var(--status-critical)" }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Total calls" value={summary ? String(summary.total_calls) : "—"} />
        <KpiCard label="Evaluated" value={summary ? String(summary.total_evaluated) : "—"} />
        <KpiCard label="Avg QA score" value={summary?.avg_score != null ? summary.avg_score.toFixed(2) : "—"} />
        <KpiCard label="Violations" value={summary ? String(summary.total_violations) : "—"} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TrendChart data={trends} metric="call_count" title="Call volume by day" />
        <TrendChart data={trends} metric="avg_score" title="Avg QA score by day" />
      </div>

      <div className="rounded-lg border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
        <div className="mb-3 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Top compliance violations
        </div>
        {violations.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No violations recorded.
          </p>
        ) : (
          <ul className="space-y-1 text-sm">
            {violations.map((v) => (
              <li key={v.violation} className="flex justify-between" style={{ color: "var(--text-primary)" }}>
                <span>{v.violation}</span>
                <span className="tabular-nums" style={{ color: "var(--text-secondary)" }}>
                  {v.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
