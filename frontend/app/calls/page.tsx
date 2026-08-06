"use client";

import { useEffect, useState } from "react";
import { listCalls } from "@/lib/api";
import type { Call } from "@/lib/types";
import CallTable from "@/components/CallTable";

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCalls()
      .then(setCalls)
      .catch((err) => setError(String(err)));
  }, []);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
        Calls
      </h1>
      {error && (
        <div className="rounded-lg border p-4 text-sm" style={{ borderColor: "var(--status-critical)", color: "var(--status-critical)" }}>
          {error}
        </div>
      )}
      <CallTable calls={calls} />
    </div>
  );
}
