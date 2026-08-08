interface SectionHeadingProps {
  index: number;
  title: string;
}

export default function SectionHeading({ index, title }: SectionHeadingProps) {
  return (
    <div className="mb-3">
      <div
        style={{
          fontFamily: "var(--font-fraunces)",
          fontWeight: 600,
          fontSize: "1.0625rem",
          lineHeight: 1.3,
          letterSpacing: "0.01em",
          color: "var(--text-primary)",
        }}
      >
        <span style={{ fontFamily: "var(--font-jetbrains-mono)", color: "var(--text-muted)", fontSize: "0.8125rem" }}>
          {String(index).padStart(2, "0")}
        </span>
        {" — "}
        <span style={{ textTransform: "uppercase" }}>{title}</span>
      </div>
      <div style={{ borderBottom: "1px solid var(--border)", marginTop: "0.5rem" }} />
    </div>
  );
}
