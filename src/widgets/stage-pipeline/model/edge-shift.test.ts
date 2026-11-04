import { describe, expect, it } from "vitest";
import { edgeShift } from "./edge-shift";

describe("edgeShift", () => {
  it("keeps a tooltip that already fits", () => {
    expect(edgeShift(40, 200, 390)).toBe(0);
  });

  it("pushes a tooltip off the left edge back inside", () => {
    expect(edgeShift(-99, 120, 390)).toBe(107);
  });

  it("pulls a tooltip off the right edge back inside", () => {
    expect(edgeShift(250, 396, 390)).toBe(-14);
  });
});
