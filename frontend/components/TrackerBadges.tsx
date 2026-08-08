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
      <div style={{ fontFamily: "var(--font-fraunces)", fontStyle: "italic", fontSize: "0.875rem", color: "var(--text-muted)" }}>
        No keyword matches found.
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {uniqueTrackerIds.map((trackerId) => (
          <span
            key={trackerId}
            style={{
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: "0.6875rem",
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              padding: "2px 6px",
              border: "1px solid var(--border)",
              color: "var(--accent)",
            }}
          >
            [{(nameById.get(trackerId) ?? trackerId).toUpperCase()}]
          </span>
        ))}
      </div>
      <ul className="mt-3 space-y-1">
        {matches.map((m, i) => (
          <li
            key={m.id ?? i}
            style={{ fontFamily: "var(--font-fraunces)", fontSize: "0.8125rem", color: "var(--text-secondary)" }}
          >
            <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{nameById.get(m.tracker_id) ?? m.tracker_id}</span>
            {" — "}
            <span style={{ fontStyle: "italic" }}>&ldquo;{m.snippet}&rdquo;</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
