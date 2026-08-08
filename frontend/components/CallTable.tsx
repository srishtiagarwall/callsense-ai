import Link from "next/link";
import type { Call } from "@/lib/types";
import { formatDuration } from "@/lib/format";
import EmptyState from "@/components/EmptyState";

interface CallTableProps {
  calls: Call[];
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default function CallTable({ calls }: CallTableProps) {
  if (calls.length === 0) {
    return <EmptyState>No calls yet — upload one to get started.</EmptyState>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="dense-table">
        <thead>
          <tr>
            <th>Filename</th>
            <th>Language</th>
            <th className="numeric">Duration</th>
            <th className="numeric">Uploaded</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => (
            <tr key={call.id}>
              <td>
                <Link href={`/calls/${call.id}`} style={{ color: "var(--accent)" }} className="call-row-link">
                  {call.filename}
                </Link>
              </td>
              <td style={{ color: "var(--text-secondary)" }}>{call.language ?? "—"}</td>
              <td className="numeric" style={{ color: "var(--text-secondary)" }}>
                {call.duration_seconds != null ? formatDuration(call.duration_seconds) : "—"}
              </td>
              <td className="numeric" style={{ color: "var(--text-secondary)" }}>
                {DATE_FORMAT.format(new Date(call.uploaded_at))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
