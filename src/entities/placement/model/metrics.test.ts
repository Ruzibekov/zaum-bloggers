import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { makePlacement } from "./fixtures";
import type { Dataset } from "./types";
import {
  agendaOf,
  commentCheckOf,
  mismatchesOf,
  nextStepOf,
  cpmOf,
  cpmScaleOf,
  flagsOf,
  focusMonth,
  pipelineOf,
  summarize,
  taskGroupsOf,
  totalCostOf,
  verdictFor,
  weekEnd,
  workloadOf,
} from "./metrics";

const TODAY = "2026-11-04";

describe("costs and CPM", () => {
  it("computes CPM like the sheet: placement cost per thousand story reach", () => {
    expect(cpmOf(makePlacement({ cost: 6300, storiesReach: 3200 }))).toBeCloseTo(1968.75);
    expect(cpmOf(makePlacement({ cost: 6300, storiesReach: 0 }))).toBeNull();
    expect(cpmOf(makePlacement({ cost: null }))).toBeNull();
  });

  it("adds product cost to the placement cost for the full spend", () => {
    expect(totalCostOf(makePlacement({ cost: 6300, productCost: 940 }))).toBe(7240);
    expect(totalCostOf(makePlacement({ cost: null, productCost: 940 }))).toBe(940);
    expect(totalCostOf(makePlacement({ cost: null, productCost: null }))).toBeNull();
  });

  it("summarizes spend, budget split and weighted CPM with its coverage", () => {
    const summary = summarize([
      makePlacement({ cost: 1000, productCost: 100, storiesReach: 1000, budget: "paid" }),
      makePlacement({ cost: 3000, productCost: 0, storiesReach: 1000, budget: "barter" }),
      makePlacement({ cost: 500, productCost: null, storiesReach: null, budget: null }),
    ]);
    expect(summary.total).toBe(4600);
    expect(summary.cost).toBe(4500);
    expect(summary.paid).toEqual({ count: 1, total: 1100 });
    expect(summary.barter).toEqual({ count: 1, total: 3000 });
    expect(summary.unknownBudget).toBe(1);
    expect(summary.cpm).toBe(2000);
    expect(summary.cpmCoverage).toBe(2);
  });
});

describe("CPM scale and verdict", () => {
  const scale = cpmScaleOf([
    makePlacement({ cost: 1000, storiesReach: 1000 }),
    makePlacement({ cost: 2000, storiesReach: 1000 }),
    makePlacement({ cost: 4000, storiesReach: 1000 }),
  ]);

  it("needs at least three values to compare", () => {
    expect(cpmScaleOf([makePlacement(), makePlacement()])).toBeNull();
    expect(scale).toEqual({ min: 1000, max: 4000, median: 2000, count: 3 });
  });

  it("calls ±10% around the median normal", () => {
    expect(verdictFor(1790, scale)).toBe("good");
    expect(verdictFor(2190, scale)).toBe("normal");
    expect(verdictFor(2200, scale)).toBe("bad");
    expect(verdictFor(null, scale)).toBeNull();
    expect(verdictFor(1000, null)).toBeNull();
  });
});

describe("daily workflow", () => {
  it("groups the next seven days by date and keeps stage order within a day", () => {
    const days = agendaOf(
      [
        makePlacement({ blogger: "late", date: "2026-11-11" }),
        makePlacement({ blogger: "b", date: "2026-11-05", stage: "scheduled" }),
        makePlacement({ blogger: "a", date: "2026-11-05", stage: "approval" }),
        makePlacement({ blogger: "today", date: TODAY }),
        makePlacement({ blogger: "past", date: "2026-11-03" }),
        makePlacement({ blogger: "none", date: null }),
      ],
      TODAY,
    );
    expect(days.map((d) => [d.date, d.items.map((p) => p.blogger)])).toEqual([
      [TODAY, ["today"]],
      ["2026-11-05", ["a", "b"]],
    ]);
  });

  it("flags overdue, undated and status-ahead-of-date rows", () => {
    expect(flagsOf(makePlacement({ stage: "approval", date: "2026-11-02" }), TODAY)).toEqual(["overdue"]);
    expect(flagsOf(makePlacement({ stage: "scheduled", date: null }), TODAY)).toEqual(["noDate"]);
    expect(flagsOf(makePlacement({ stage: "published", date: "2026-11-07" }), TODAY)).toEqual(["statusAhead"]);
    expect(flagsOf(makePlacement({ stage: "results", date: "2026-11-01" }), TODAY)).toEqual([]);
    expect(flagsOf(makePlacement({ stage: "scheduled", date: TODAY }), TODAY)).toEqual([]);
  });

  it("builds task groups from flags first, then confirmed comments, then mismatches", () => {
    const groups = taskGroupsOf(
      [
        makePlacement({ stage: "approval", date: "2026-11-02", comment: "Нужна дата публикации" }),
        makePlacement({ stage: "published", date: null, comment: "Нужна дата публикации" }),
        makePlacement({ stage: "published", date: "2026-11-03", comment: "Проверить результаты" }),
        makePlacement({ comment: "Демонстрационные данные" }),
        makePlacement({ stage: "published", date: "2026-11-20" }),
      ],
      TODAY,
    );
    expect(groups.map((g) => [g.kind, g.title, g.items.length])).toEqual([
      ["flag", "Дата прошла, а реклама не вышла", 1],
      ["comment", "Нужна дата публикации", 1],
      ["comment", "Проверить результаты", 1],
      ["check", "Расхождение: статус дальше даты", 1],
      ["check", "Расхождение: комментарий и данные", 1],
    ]);
  });
});

describe("comment reconciliation", () => {
  it("keeps «Нужна дата» as a task only while the date is empty", () => {
    expect(commentCheckOf(makePlacement({ stage: "published", date: null, comment: "Нужна дата публикации" }), TODAY)).toMatchObject({ kind: "task" });
    expect(commentCheckOf(makePlacement({ stage: "scheduled", date: "2026-11-05", comment: "Нужна дата публикации" }), TODAY)).toEqual({
      kind: "mismatch",
      title: "Нужна дата публикации",
      reason: "в комментарии «Нужна дата публикации», а дата уже стоит — 5\u00a0ноя",
    });
  });

  it("keeps «Проверить результаты» only for a published row whose date has come", () => {
    expect(commentCheckOf(makePlacement({ stage: "published", date: TODAY, comment: "Проверить результаты" }), TODAY)).toMatchObject({ kind: "task" });
    expect(commentCheckOf(makePlacement({ stage: "published", date: "2026-11-11", comment: "Проверить результаты" }), TODAY)).toMatchObject({
      kind: "mismatch",
      reason: "в комментарии «Проверить результаты», а публикация только 11\u00a0ноя",
    });
    expect(commentCheckOf(makePlacement({ stage: "results", date: "2026-11-01", comment: "Проверить результаты" }), TODAY)).toMatchObject({
      kind: "mismatch",
      reason: "в комментарии «Проверить результаты», а результаты уже получены",
    });
    expect(commentCheckOf(makePlacement({ stage: "approval", date: "2026-11-01", comment: "Проверить результаты" }), TODAY)).toMatchObject({
      kind: "mismatch",
      reason: "в комментарии «Проверить результаты», а реклама ещё на этапе «Согласование»",
    });
  });

  it("passes unknown comments through as tasks and ignores note-only or empty ones", () => {
    expect(commentCheckOf(makePlacement({ comment: "Прислать ТЗ" }), TODAY)).toEqual({ kind: "task", title: "Прислать ТЗ", hint: null });
    expect(commentCheckOf(makePlacement({ comment: "Демонстрационные данные" }), TODAY)).toBeNull();
    expect(commentCheckOf(makePlacement({ comment: "  " }), TODAY)).toBeNull();
    expect(commentCheckOf(makePlacement({ comment: null }), TODAY)).toBeNull();
  });

  it("lists every mismatch of a row and picks the confirmed next step", () => {
    const row = makePlacement({ stage: "results", date: "2026-11-12", comment: "Проверить результаты" });
    expect(mismatchesOf(row, TODAY)).toEqual([
      "статус «Результаты получены», а дата публикации ещё впереди — 12\u00a0ноя",
      "в комментарии «Проверить результаты», а результаты уже получены",
    ]);
    expect(nextStepOf(row, TODAY)).toBeNull();
    expect(nextStepOf(makePlacement({ stage: "approval", date: "2026-11-02", comment: "Нужна дата публикации" }), TODAY)).toBe(
      "Уточните у блогера новую дату или обновите статус",
    );
    expect(nextStepOf(makePlacement({ stage: "published", date: "2026-11-03", comment: "Проверить результаты" }), TODAY)).toBe("Проверить результаты");
  });

  it("counts the demo sheet as 2 rows waiting for action and 18 rows with mismatches", () => {
    const demo = JSON.parse(readFileSync(new URL("../../../../public/data.json", import.meta.url), "utf8")) as Dataset;
    const { waiting, mismatched } = workloadOf(taskGroupsOf(demo.placements, TODAY));
    const bloggers = (ids: Set<string>) => demo.placements.filter((p) => ids.has(p.id)).map((p) => p.blogger);
    expect(bloggers(waiting)).toEqual(["Блогер 001", "Блогер 002"]);
    expect(mismatched.size).toBe(18);
  });

  it("returns empty workload for an empty sheet", () => {
    const { waiting, mismatched } = workloadOf(taskGroupsOf([], TODAY));
    expect([waiting.size, mismatched.size]).toEqual([0, 0]);
  });
});

describe("pipeline and calendar", () => {
  it("counts every stage in pipeline order and adds unknown statuses only when present", () => {
    const rows = [makePlacement({ stage: "results", cost: 100, productCost: 0 }), makePlacement({ stage: "approval" })];
    expect(pipelineOf(rows).map((b) => [b.stage, b.count])).toEqual([
      ["approval", 1],
      ["scheduled", 0],
      ["published", 0],
      ["results", 1],
    ]);
    expect(pipelineOf([makePlacement({ stage: "other" })]).at(-1)?.stage).toBe("other");
  });

  it("finds the end of the week and the month to show", () => {
    expect(weekEnd("2026-11-04")).toBe("2026-11-08");
    expect(weekEnd("2026-11-08")).toBe("2026-11-08");
    expect(focusMonth([makePlacement({ date: "2026-11-10" })], TODAY)).toBe("2026-11");
    expect(focusMonth([makePlacement({ date: "2026-09-10" }), makePlacement({ date: "2026-09-12" })], TODAY)).toBe("2026-09");
  });
});
