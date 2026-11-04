import { describe, expect, it } from "vitest";
import { addDays, daysBetween, localIsoDate, monthGrid, shiftMonth, weekdayIndex } from "./dates";

describe("dates", () => {
  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-11-04", -4)).toBe("2026-10-31");
  });

  it("counts whole days between dates", () => {
    expect(daysBetween("2026-11-04", "2026-11-10")).toBe(6);
    expect(daysBetween("2026-11-04", "2026-11-02")).toBe(-2);
    expect(daysBetween("bad", "2026-11-02")).toBeNull();
  });

  it("uses Monday as the first weekday", () => {
    expect(weekdayIndex("2026-11-02")).toBe(0);
    expect(weekdayIndex("2026-11-08")).toBe(6);
  });

  it("builds a Monday-first month grid covering the whole month", () => {
    const grid = monthGrid("2026-11");
    expect(grid[0]?.[0]).toBe("2026-10-26");
    expect(grid.at(-1)?.at(-1)).toBe("2026-12-06");
    expect(grid.flat()).toContain("2026-11-30");
    expect(grid.every((week) => week.length === 7)).toBe(true);
  });

  it("shifts months and formats local dates", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-11", 2)).toBe("2027-01");
    expect(localIsoDate(new Date(2026, 10, 4, 23, 30))).toBe("2026-11-04");
  });
});
