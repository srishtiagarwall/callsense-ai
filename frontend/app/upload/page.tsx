"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadCall } from "@/lib/api";
import { PrimaryButton } from "@/components/Button";
import TextInput from "@/components/TextInput";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

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
    <div className="flex max-w-md flex-col gap-6">
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
        Upload
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) setFile(dropped);
          }}
          className="flex flex-col items-center justify-center py-12 text-center"
          style={{
            border: `1px dashed ${dragOver ? "var(--accent)" : "var(--border-strong)"}`,
            cursor: "pointer",
          }}
        >
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: "0.75rem",
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              color: dragOver ? "var(--accent)" : "var(--text-muted)",
            }}
          >
            {file ? file.name : "Drag file or click to browse"}
          </span>
        </label>

        <div>
          <label
            style={{
              fontFamily: "var(--font-fraunces)",
              fontWeight: 500,
              fontSize: "0.75rem",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}
          >
            Language (optional)
          </label>
          <TextInput value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="en" className="mt-1" />
        </div>

        {error && (
          <div style={{ fontFamily: "var(--font-fraunces)", color: "var(--status-critical)" }}>{error}</div>
        )}

        <PrimaryButton type="submit" disabled={!file || busy} className="self-start">
          {busy ? "Uploading…" : "Upload"}
        </PrimaryButton>
      </form>
    </div>
  );
}
