import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

const baseStyle = {
  fontFamily: "var(--font-fraunces)",
  fontWeight: 500,
  fontSize: "0.8125rem",
  letterSpacing: "0.03em",
  borderRadius: 0,
};

export function PrimaryButton({ children, style, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className="btn-primary px-4 py-2 disabled:opacity-40"
      style={{
        ...baseStyle,
        background: "var(--accent)",
        color: "var(--surface-1)",
        border: "none",
        ...style,
      }}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, style, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className="btn-secondary px-4 py-2 disabled:opacity-40"
      style={{
        ...baseStyle,
        background: "transparent",
        color: "var(--text-primary)",
        border: "1px solid var(--border-strong)",
        ...style,
      }}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

interface TextActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  destructive?: boolean;
}

export function TextAction({ children, destructive, style, disabled, ...rest }: TextActionProps) {
  return (
    <button
      className="btn-text disabled:opacity-40"
      style={{
        ...baseStyle,
        background: "none",
        border: "none",
        padding: 0,
        cursor: disabled ? "default" : "pointer",
        color: "var(--text-muted)",
        ...style,
      }}
      disabled={disabled}
      {...rest}
    >
      {"["}
      <span
        className="btn-text-inner"
        style={{ color: destructive ? "var(--status-critical)" : "var(--accent)" }}
      >
        {children}
      </span>
      {"]"}
    </button>
  );
}
