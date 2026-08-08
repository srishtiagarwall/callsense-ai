"use client";

import { useEffect, useState } from "react";
import { listCalls } from "@/lib/api";
import type { Call } from "@/lib/types";
import CallTable from "@/components/CallTable";
import TextInput from "@/components/TextInput";

const PAGE_SIZE = 20;

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCalls({ page, pageSize: PAGE_SIZE, search: search || undefined })
      .then((result) => {
        setCalls(result.items);
        setTotal(result.total);
      })
      .catch((err) => setError(String(err)));
  }, [page, search]);

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-6">
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
          Calls
        </h1>
        <div style={{ width: 260 }}>
          <TextInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by filename…"
          />
        </div>
      </div>

      {error && (
        <div style={{ fontFamily: "var(--font-fraunces)", color: "var(--status-critical)" }}>{error}</div>
      )}

      <CallTable calls={calls} />

      {totalPages > 1 && (
        <div
          className="flex items-center justify-between"
          style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "0.8125rem", color: "var(--text-secondary)" }}
        >
          <span>
            {total} calls
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="pager-link disabled:opacity-40"
              style={{ background: "none", border: "none", color: "var(--accent)", cursor: page <= 1 ? "default" : "pointer" }}
            >
              ‹ Prev
            </button>
            <span style={{ color: "var(--border-strong)" }}>│</span>
            <span>
              {page} / {totalPages}
            </span>
            <span style={{ color: "var(--border-strong)" }}>│</span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="pager-link disabled:opacity-40"
              style={{ background: "none", border: "none", color: "var(--accent)", cursor: page >= totalPages ? "default" : "pointer" }}
            >
              Next ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
