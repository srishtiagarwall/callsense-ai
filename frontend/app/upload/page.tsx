"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadCall } from "@/lib/api";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const call = await uploadCall(file, language || undefined);
      router.push(`/calls/${call.id}`);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
        Upload a call
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Audio file
          </label>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
            style={{ color: "var(--text-secondary)" }}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Language (optional)
          </label>
          <input
            type="text"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="en"
            className="w-full rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-primary)" }}
          />
        </div>

        {error && (
          <div className="rounded-lg border p-3 text-sm" style={{ borderColor: "var(--status-critical)", color: "var(--status-critical)" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!file || busy}
          className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ background: "var(--series-1)" }}
        >
          {busy ? "Uploading…" : "Upload"}
        </button>
      </form>
    </div>
  );
}
