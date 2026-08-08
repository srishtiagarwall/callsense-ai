import type { Tracker, TrackerMatch } from "@/lib/types";

interface TrackerBadgesProps {
  matches: TrackerMatch[];
  trackers: Tracker[];
}

export default function TrackerBadges({ matches, trackers }: TrackerBadgesProps) {
  const nameById = new Map(trackers.map((t) => [t.id, t.name]));
  const uniqueTrackerIds = Array.from(new Set(matches.map((m) => m.tracker_id)));

  if (matches.length === 0) {
    return (
      <div
        className="rounded-lg border p-4 text-sm"
        style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-muted)" }}
      >
        Trackers: no keyword matches found
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
      <div className="mb-3 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        Trackers
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {uniqueTrackerIds.map((trackerId) => (
          <span
            key={trackerId}
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: "var(--status-warning)", color: "#1a1a1a" }}
          >
            {nameById.get(trackerId) ?? trackerId}
          </span>
        ))}
      </div>
      <ul className="space-y-1 text-xs" style={{ color: "var(--text-secondary)" }}>
        {matches.map((m, i) => (
          <li key={m.id ?? i}>
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>
              {nameById.get(m.tracker_id) ?? m.tracker_id}
            </span>
            {" — “"}
            {m.snippet}
            {"”"}
          </li>
        ))}
      </ul>
    </div>
  );
}
