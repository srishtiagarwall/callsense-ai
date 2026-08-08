import Link from "next/link";
import type { Call } from "@/lib/types";
import { formatDuration } from "@/lib/format";

interface CallTableProps {
  calls: Call[];
}

export default function CallTable({ calls }: CallTableProps) {
  if (calls.length === 0) {
    return (
      <div
        className="rounded-lg border p-6 text-center text-sm"
        style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-muted)" }}
      >
        No calls yet — upload one to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
      <table className="w-full text-sm" style={{ background: "var(--surface-1)" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--gridline)" }}>
            <th className="px-4 py-2 text-left font-medium" style={{ color: "var(--text-secondary)" }}>
              Filename
            </th>
            <th className="px-4 py-2 text-left font-medium" style={{ color: "var(--text-secondary)" }}>
              Language
            </th>
            <th className="px-4 py-2 text-left font-medium" style={{ color: "var(--text-secondary)" }}>
              Duration
            </th>
            <th className="px-4 py-2 text-left font-medium" style={{ color: "var(--text-secondary)" }}>
              Uploaded
            </th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => (
            <tr key={call.id} style={{ borderBottom: "1px solid var(--gridline)" }}>
              <td className="px-4 py-2">
                <Link href={`/calls/${call.id}`} className="font-medium hover:underline" style={{ color: "var(--series-1)" }}>
                  {call.filename}
                </Link>
              </td>
              <td className="px-4 py-2" style={{ color: "var(--text-secondary)" }}>
                {call.language ?? "—"}
              </td>
              <td className="px-4 py-2 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                {call.duration_seconds != null ? formatDuration(call.duration_seconds) : "—"}
              </td>
              <td className="px-4 py-2 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                {new Date(call.uploaded_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
