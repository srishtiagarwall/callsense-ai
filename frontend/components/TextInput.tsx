import type { InputHTMLAttributes } from "react";

export default function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { style, className, ...rest } = props;
  return (
    <input
      className={className}
      style={{
        fontFamily: "var(--font-fraunces)",
        fontSize: "0.9375rem",
        background: "transparent",
        border: "none",
        borderBottom: "1px solid var(--border-strong)",
        borderRadius: 0,
        color: "var(--text-primary)",
        padding: "0.375rem 0",
        width: "100%",
        ...style,
      }}
      {...rest}
    />
  );
}
