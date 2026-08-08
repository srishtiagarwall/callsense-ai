"use client";

import { useState } from "react";
import Link from "next/link";
import { searchCalls } from "@/lib/api";
import type { SearchResult } from "@/lib/types";
import { PrimaryButton } from "@/components/Button";
import TextInput from "@/components/TextInput";
import EmptyState from "@/components/EmptyState";
import { scoreColor } from "@/lib/format";

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
    <div className="flex flex-col gap-6">
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
        Search
      </h1>
      <p
        style={{ fontFamily: "var(--font-fraunces)", fontStyle: "italic", fontSize: "0.9375rem", lineHeight: 1.5, color: "var(--text-secondary)" }}
      >
        Search calls by meaning, not just keywords — &ldquo;customer wants a refund&rdquo; or &ldquo;system
        outage&rdquo;. Calls must be indexed first (from the call detail page) before they appear here.
      </p>

      <form onSubmit={handleSearch} className="flex items-end gap-4">
        <div className="flex-1">
          <TextInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe what you're looking for…"
          />
        </div>
        <PrimaryButton type="submit" disabled={busy || !query.trim()}>
          {busy ? "Searching…" : "Search"}
        </PrimaryButton>
      </form>

      {error && (
        <div style={{ fontFamily: "var(--font-fraunces)", color: "var(--status-critical)" }}>{error}</div>
      )}

      {results !== null && (
        <div>
          {results.length === 0 ? (
            <EmptyState>No matches — try indexing more calls first.</EmptyState>
          ) : (
            <div className="flex flex-col">
              {results.map((r, i) => (
                <Link
                  key={r.call_id}
                  href={`/calls/${r.call_id}`}
                  className="search-result-row flex items-center gap-4 py-3"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <span
                    style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "0.8125rem", color: "var(--text-muted)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="flex-1"
                    style={{ fontFamily: "var(--font-fraunces)", fontStyle: "italic", fontSize: "0.9375rem", color: "var(--text-primary)" }}
                  >
                    {r.filename}
                  </span>
                  <span
                    style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "0.8125rem", color: scoreColor(r.score) }}
                  >
                    {(r.score * 100).toFixed(1)}%
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
