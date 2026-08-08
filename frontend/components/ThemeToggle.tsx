"use client";

import { useEffect, useState } from "react";
import { getEffectiveTheme, setStoredTheme, type Theme } from "@/lib/theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // Reads localStorage/matchMedia (browser-only APIs unavailable during SSR),
    // so this must run post-mount rather than during the initial render — the
    // resulting one-time setState is intentional, not a cascading-render bug.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(getEffectiveTheme());
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setStoredTheme(next);
    setTheme(next);
  }

  if (!theme) return <span style={{ width: 68 }} />;

  return (
    <button
      onClick={toggle}
      className="theme-toggle ml-auto"
      style={{
        background: "none",
        border: "1px solid var(--border-strong)",
        borderRadius: 0,
        padding: "0.25rem 0.625rem",
        fontFamily: "var(--font-jetbrains-mono)",
        fontSize: "0.6875rem",
        letterSpacing: "0.02em",
        textTransform: "uppercase",
        color: "var(--text-secondary)",
        cursor: "pointer",
      }}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
