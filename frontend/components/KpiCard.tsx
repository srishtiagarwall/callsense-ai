interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  divider?: boolean;
}

export default function KpiCard({ label, value, hint, divider }: KpiCardProps) {
  return (
    <div
      className="px-6 py-1 first:pl-0"
      style={divider ? { borderLeft: "1px solid var(--border)" } : undefined}
    >
      <div
        style={{
          fontFamily: "var(--font-fraunces)",
          fontWeight: 500,
          fontSize: "0.75rem",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
        }}
      >
        {label}
      </div>
      <div
        className="mt-1"
        style={{
          fontFamily: "var(--font-jetbrains-mono)",
          fontWeight: 700,
          fontSize: "2.25rem",
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color: "var(--text-primary)",
        }}
      >
        {value}
      </div>
      {hint && (
        <div
          className="mt-1"
          style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}
