"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/calls", label: "Calls" },
  { href: "/upload", label: "Upload" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav
      className="flex items-center gap-1 border-b px-6 py-3"
      style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
    >
      <span className="mr-6 font-semibold" style={{ color: "var(--text-primary)" }}>
        CallSense AI
      </span>
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
            style={{
              color: active ? "var(--text-primary)" : "var(--text-secondary)",
              background: active ? "var(--gridline)" : "transparent",
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
