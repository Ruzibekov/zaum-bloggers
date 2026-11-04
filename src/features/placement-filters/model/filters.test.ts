import { describe, expect, it } from "vitest";
import { makePlacement } from "@/entities/placement/model/fixtures";
import type { TaskGroup } from "@/entities/placement";
import { applyFilters, INITIAL_FILTERS, isFiltered, optionsOf, resetFilters, toggleSort } from "./filters";

const rows = [
  makePlacement({ blogger: "Блогер 010", platform: "VK", budget: "barter", format: "Пост", date: "2026-11-09", cost: 900, storiesReach: 1000 }),
  makePlacement({ blogger: "Блогер 002", platform: "Telegram", stage: "approval", comment: "Нужна дата публикации", date: "2026-11-05", cost: 3000, storiesReach: 1000 }),
  makePlacement({ blogger: "Блогер 003", platform: "Telegram", format: "Обзор", date: null, cost: null }),
];

describe("applyFilters", () => {
  it("searches across name, comment and platform, ignoring case and ё", () => {
    expect(applyFilters(rows, { ...INITIAL_FILTERS, query: "НУЖНА ДАТА" }, []).map((p) => p.blogger)).toEqual(["Блогер 002"]);
    expect(applyFilters(rows, { ...INITIAL_FILTERS, query: "vk 010" }, []).map((p) => p.blogger)).toEqual(["Блогер 010"]);
    expect(applyFilters(rows, { ...INITIAL_FILTERS, query: "нет такого" }, [])).toEqual([]);
  });

  it("combines stage, platform, budget and format filters", () => {
    const filters = { ...INITIAL_FILTERS, platform: "Telegram", stage: "approval" as const };
    expect(applyFilters(rows, filters, []).map((p) => p.blogger)).toEqual(["Блогер 002"]);
    expect(applyFilters(rows, { ...INITIAL_FILTERS, budget: "barter" }, []).map((p) => p.blogger)).toEqual(["Блогер 010"]);
    expect(applyFilters(rows, { ...INITIAL_FILTERS, format: "Обзор" }, []).map((p) => p.blogger)).toEqual(["Блогер 003"]);
  });

  it("keeps only rows from mismatch groups when the mismatch filter is on", () => {
    const rows = [makePlacement({ id: "a" }), makePlacement({ id: "b" }), makePlacement({ id: "c" })];
    const check = { key: "check:comment", kind: "check" as const, title: "c", hint: null, items: [rows[1]!] };
    const ahead = { key: "flag:statusAhead", kind: "check" as const, title: "s", hint: null, items: [rows[2]!, rows[1]!] };
    const action = { key: "flag:overdue", kind: "flag" as const, title: "o", hint: null, items: [rows[0]!] };
    const result = applyFilters(rows, { ...INITIAL_FILTERS, mismatch: true }, [action, check, ahead]);
    expect(result.map((p) => p.id).sort()).toEqual(["b", "c"]);
    expect(applyFilters(rows, { ...INITIAL_FILTERS, mismatch: true }, [action])).toHaveLength(0);
    expect(isFiltered({ ...INITIAL_FILTERS, mismatch: true })).toBe(true);
  });

  it("filters by a task group", () => {
    const [first] = rows;
    const group: TaskGroup = { key: "comment:x", kind: "comment", title: "x", hint: null, items: first ? [first] : [] };
    expect(applyFilters(rows, { ...INITIAL_FILTERS, task: "comment:x" }, [group])).toHaveLength(1);
    expect(applyFilters(rows, { ...INITIAL_FILTERS, task: "comment:gone" }, [group])).toHaveLength(0);
  });

  it("sorts by date ascending by default and always keeps empty values last", () => {
    expect(applyFilters(rows, INITIAL_FILTERS, []).map((p) => p.date)).toEqual(["2026-11-05", "2026-11-09", null]);
    const byCpmDesc = applyFilters(rows, { ...INITIAL_FILTERS, sort: { key: "cpm", dir: "desc" } }, []);
    expect(byCpmDesc.map((p) => p.blogger)).toEqual(["Блогер 002", "Блогер 010", "Блогер 003"]);
    const byName = applyFilters(rows, { ...INITIAL_FILTERS, sort: { key: "blogger", dir: "asc" } }, []);
    expect(byName.map((p) => p.blogger)).toEqual(["Блогер 002", "Блогер 003", "Блогер 010"]);
  });
});

describe("filter state helpers", () => {
  it("toggles direction on the same column and uses a sensible default on a new one", () => {
    const once = toggleSort(INITIAL_FILTERS, "date");
    expect(once.sort).toEqual({ key: "date", dir: "desc" });
    expect(toggleSort(once, "total").sort).toEqual({ key: "total", dir: "desc" });
    expect(toggleSort(once, "cpm").sort).toEqual({ key: "cpm", dir: "asc" });
  });

  it("detects active filters and resets them while keeping the sort", () => {
    const filtered = { ...INITIAL_FILTERS, query: "x", sort: { key: "cpm" as const, dir: "desc" as const } };
    expect(isFiltered(filtered)).toBe(true);
    expect(isFiltered(INITIAL_FILTERS)).toBe(false);
    expect(resetFilters(filtered)).toEqual({ ...INITIAL_FILTERS, sort: filtered.sort });
  });

  it("lists options with counts", () => {
    expect(optionsOf(rows, (p) => p.platform)).toEqual([
      { value: "Telegram", count: 2 },
      { value: "VK", count: 1 },
    ]);
  });
});
