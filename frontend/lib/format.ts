export function scoreColor(score: number): string {
  if (score >= 0.8) return "var(--status-good)";
  if (score >= 0.5) return "var(--status-warning)";
  return "var(--status-critical)";
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
