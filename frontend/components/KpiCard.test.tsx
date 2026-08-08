import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import KpiCard from "./KpiCard";

describe("KpiCard", () => {
  it("renders label and value", () => {
    render(<KpiCard label="Total calls" value="42" />);
    expect(screen.getByText("Total calls")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders hint when provided", () => {
    render(<KpiCard label="Avg score" value="0.85" hint="last 30 days" />);
    expect(screen.getByText("last 30 days")).toBeInTheDocument();
  });

  it("omits hint element when not provided", () => {
    render(<KpiCard label="Violations" value="3" />);
    expect(screen.queryByText("last 30 days")).not.toBeInTheDocument();
  });
});
