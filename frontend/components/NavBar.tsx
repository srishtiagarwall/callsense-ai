"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/calls", label: "Calls" },
  { href: "/upload", label: "Upload" },
  { href: "/rubrics", label: "Rubrics" },
  { href: "/search", label: "Search" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav
      className="flex h-14 items-center px-8"
      style={{ borderBottom: "1px solid var(--border)", background: "var(--background)" }}
    >
      <Link
        href="/"
        className="mr-8 shrink-0"
        style={{ fontFamily: "var(--font-fraunces)", fontWeight: 600, fontSize: "1.25rem", letterSpacing: "-0.01em" }}
      >
        <span style={{ color: "var(--text-primary)" }}>CallSense</span>
        <span style={{ color: "var(--accent)" }}>AI</span>
      </Link>

      <div className="flex items-center">
        {LINKS.map((link, i) => {
          const active = isActive(pathname, link.href);
          return (
            <span key={link.href} className="flex items-center">
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className="inline-block"
                  style={{
                    width: 1,
                    height: 12,
                    background: "var(--border)",
                    opacity: 0.7,
                    margin: "0 1rem",
                  }}
                />
              )}
              <Link
                href={link.href}
                className="nav-link"
                style={{
                  fontFamily: "var(--font-fraunces)",
                  fontWeight: 500,
                  fontSize: "0.8125rem",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: active ? "var(--foreground)" : "var(--text-secondary)",
                  textDecoration: "underline",
                  textDecorationColor: active ? "var(--accent)" : "transparent",
                  textUnderlineOffset: "4px",
                  transition: "color 120ms, text-decoration-color 120ms",
                }}
              >
                {link.label}
              </Link>
            </span>
          );
        })}
      </div>

      <ThemeToggle />
    </nav>
  );
}
