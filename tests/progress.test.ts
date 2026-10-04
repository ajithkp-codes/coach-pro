import { describe, it, expect } from "vitest";
import { progressPct } from "@/lib/progress";

describe("progressPct", () => {
  it("returns null without a target or current value", () => {
    expect(progressPct(80, null, 75, true)).toBeNull();
    expect(progressPct(80, 70, null, true)).toBeNull();
  });

  it("tracks a weight-loss goal (lower is better) toward target", () => {
    // start 80 → target 70, now 75 → halfway
    expect(progressPct(80, 70, 75, true)).toBe(50);
    expect(progressPct(80, 70, 80, true)).toBe(0);
    expect(progressPct(80, 70, 70, true)).toBe(100);
  });

  it("tracks a gain goal (higher is better)", () => {
    // start 40 → target 50, now 45 → halfway
    expect(progressPct(40, 50, 45, false)).toBe(50);
  });

  it("clamps overshoot and undershoot to 0–100", () => {
    expect(progressPct(80, 70, 65, true)).toBe(100); // past target
    expect(progressPct(80, 70, 85, true)).toBe(0); // moved the wrong way
  });

  it("without a start value, is 100 only when target is met in the right direction", () => {
    expect(progressPct(null, 100, 100, true)).toBe(100); // <= target
    expect(progressPct(null, 100, 120, true)).toBeNull(); // above target, lower is better
    expect(progressPct(null, 100, 120, false)).toBe(100); // >= target, higher is better
  });
});
