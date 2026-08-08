export default function EmptyState({ children }: { children: string }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div style={{ width: 24, borderBottom: "1px solid var(--border)", marginBottom: "1.25rem" }} />
      <p
        style={{
          fontFamily: "var(--font-fraunces)",
          fontStyle: "italic",
          fontSize: "1.0625rem",
          lineHeight: 1.5,
          color: "var(--text-secondary)",
          maxWidth: "32ch",
        }}
      >
        {children}
      </p>
    </div>
  );
}
