import { describe, expect, it } from "vitest";
import {
  DASH,
  formatCompact,
  formatCompactRub,
  formatDate,
  formatInt,
  formatLongDay,
  formatMonthLong,
  formatRelativeDay,
  formatSignedPercent,
  formatRub,
  formatShortDate,
  pluralRu,
} from "./format";

const nb = (value: string) => value.replace(/[\u00a0\u202f]/g, " ");

describe("number formatting", () => {
  it("formats rubles and integers in Russian style", () => {
    expect(nb(formatRub(1253750))).toBe("1 253 750 ₽");
    expect(nb(formatInt(312.6))).toBe("313");
  });

  it("compacts large numbers", () => {
    expect(nb(formatCompact(950))).toBe("950");
    expect(nb(formatCompact(1540))).toBe("1,5 тыс.");
    expect(nb(formatCompact(19400))).toBe("19 тыс.");
    expect(nb(formatCompact(2831667))).toBe("2,8 млн");
    expect(nb(formatCompactRub(2831667))).toBe("2,8 млн ₽");
  });

  it.each([null, undefined, Number.NaN, Number.POSITIVE_INFINITY])("never prints NaN or Infinity for %s", (value) => {
    expect(formatRub(value)).toBe(DASH);
    expect(formatInt(value)).toBe(DASH);
    expect(formatCompact(value)).toBe(DASH);
    expect(formatCompactRub(value)).toBe(DASH);
  });
});

describe("dates and months", () => {
  it("formats months", () => {
    expect(formatMonthLong("2026-05")).toBe("Май 2026");
  });

  it("formats dates and hides the year when it is current", () => {
    expect(nb(formatDate("2026-10-03"))).toBe("3 октября");
    expect(nb(formatDate("2026-10-03", true))).toBe("3 октября 2026");
    expect(nb(formatShortDate("2026-10-03", 2026))).toBe("3 окт");
    expect(nb(formatShortDate("2025-11-18", 2026))).toBe("18 ноя 25");
    expect(formatDate(null)).toBe(DASH);
    expect(formatDate("garbage")).toBe(DASH);
  });

  it("picks Russian plural forms", () => {
    const word = (n: number) => pluralRu(n, "блогер", "блогера", "блогеров");
    expect([1, 2, 5, 11, 21, 22, 112].map(word)).toEqual([
      "блогер",
      "блогера",
      "блогеров",
      "блогеров",
      "блогер",
      "блогера",
      "блогеров",
    ]);
  });

  it("names days relative to today", () => {
    expect(formatRelativeDay("2026-11-04", "2026-11-04")).toBe("Сегодня");
    expect(formatRelativeDay("2026-11-05", "2026-11-04")).toBe("Завтра");
    expect(formatRelativeDay("2026-11-03", "2026-11-04")).toBe("Вчера");
    expect(nb(formatRelativeDay("2026-11-07", "2026-11-04"))).toBe("Сб, 7 ноября");
    expect(formatRelativeDay(null, "2026-11-04")).toBe("Дата не назначена");
    expect(nb(formatLongDay("2026-11-04"))).toBe("Среда, 4 ноября");
  });

  it("formats signed percentages with a real minus sign", () => {
    expect(formatSignedPercent(0.123)).toBe("+12%");
    expect(formatSignedPercent(-0.051)).toBe("−5%");
    expect(formatSignedPercent(0.001)).toBe("0%");
    expect(formatSignedPercent(null)).toBe(DASH);
  });
});
