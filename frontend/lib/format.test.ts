import { describe, expect, it } from "vitest";
import { formatDuration, scoreColor } from "./format";

describe("scoreColor", () => {
  it("returns good color at or above 0.8", () => {
    expect(scoreColor(0.8)).toBe("var(--status-good)");
    expect(scoreColor(1.0)).toBe("var(--status-good)");
  });

  it("returns warning color between 0.5 and 0.8", () => {
    expect(scoreColor(0.5)).toBe("var(--status-warning)");
    expect(scoreColor(0.79)).toBe("var(--status-warning)");
  });

  it("returns critical color below 0.5", () => {
    expect(scoreColor(0.49)).toBe("var(--status-critical)");
    expect(scoreColor(0)).toBe("var(--status-critical)");
  });
});

describe("formatDuration", () => {
  it("formats whole minutes and seconds as mm:ss", () => {
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(600)).toBe("10:00");
  });

  it("pads single-digit seconds", () => {
    expect(formatDuration(9)).toBe("0:09");
  });

  it("rounds fractional seconds", () => {
    expect(formatDuration(23.7)).toBe("0:24");
  });
});
