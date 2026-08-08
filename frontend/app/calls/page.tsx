"use client";

import { useEffect, useState } from "react";
import { listCalls } from "@/lib/api";
import type { Call } from "@/lib/types";
import CallTable from "@/components/CallTable";

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
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Calls
        </h1>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by filename…"
          className="w-64 rounded-md border px-3 py-1.5 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-primary)" }}
        />
      </div>

      {error && (
        <div className="rounded-lg border p-4 text-sm" style={{ borderColor: "var(--status-critical)", color: "var(--status-critical)" }}>
          {error}
        </div>
      )}

      <CallTable calls={calls} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm" style={{ color: "var(--text-secondary)" }}>
          <span>
            Page {page} of {totalPages} ({total} calls)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="rounded-md border px-3 py-1.5 disabled:opacity-50"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="rounded-md border px-3 py-1.5 disabled:opacity-50"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
