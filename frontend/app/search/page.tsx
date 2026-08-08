"use client";

import { useState } from "react";
import Link from "next/link";
import { searchCalls } from "@/lib/api";
import type { SearchResult } from "@/lib/types";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const found = await searchCalls(query);
      setResults(found);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
        Semantic search
      </h1>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        Search calls by meaning, not just keywords — e.g. &ldquo;customer wants a refund&rdquo; or &ldquo;system
        outage&rdquo;. Calls must be indexed first (embed from the call detail page) before they appear in results.
      </p>

      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe what you're looking for…"
          className="flex-1 rounded-md border px-3 py-2 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-primary)" }}
        />
        <button
          type="submit"
          disabled={busy || !query.trim()}
          className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ background: "var(--series-1)" }}
        >
          {busy ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border p-3 text-sm" style={{ borderColor: "var(--status-critical)", color: "var(--status-critical)" }}>
          {error}
        </div>
      )}

      {results !== null && (
        <div className="flex flex-col gap-2">
          {results.length === 0 ? (
            <div
              className="rounded-lg border p-4 text-center text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-muted)" }}
            >
              No matches — try indexing more calls first.
            </div>
          ) : (
            results.map((r) => (
              <Link
                key={r.call_id}
                href={`/calls/${r.call_id}`}
                className="flex items-center justify-between rounded-lg border p-3 text-sm hover:opacity-80"
                style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
              >
                <span style={{ color: "var(--series-1)" }}>{r.filename}</span>
                <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>
                  {(r.score * 100).toFixed(1)}% match
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
