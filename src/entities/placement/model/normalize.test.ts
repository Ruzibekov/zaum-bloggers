import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseCsv } from "@/shared/lib/csv";
import { normalizeRows, parseDate, parseNumber, SheetFormatError } from "./normalize";
import type { Dataset } from "./types";

const read = (relative: string) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");

describe("normalizeRows", () => {
  it("turns the live Google Sheet CSV into exactly the same rows as scripts/extract.py", () => {
    const fromSheet = normalizeRows(parseCsv(read("./demo-sheet.fixture.csv")));
    const fromFile = (JSON.parse(read("../../../../public/data.json")) as Dataset).placements;
    expect(fromSheet).toHaveLength(24);
    expect(fromSheet).toEqual(fromFile);
  });

  it("finds columns by name in any order and tolerates missing optional columns", () => {
    const rows = [
      ["Статус", "Комментарий", "Блогер", "Стоимость размещения, ₽", "Дата рекламы", "Ссылка на рекламу"],
      ["Запланировано", "  ", "Канал А", "12 500", "07.11.2026", "javascript:alert(1)"],
      ["Что-то своё", "Позвонить", "Канал Б", "", "", "https://t.me/x"],
      ["Согласование", "", "", "100", "", ""],
    ];
    const [a, b] = normalizeRows(rows);
    expect(normalizeRows(rows)).toHaveLength(2);
    expect(a).toMatchObject({
      id: "row-1",
      blogger: "Канал А",
      stage: "scheduled",
      cost: 12500,
      date: "2026-11-07",
      adUrl: null,
      comment: null,
      platform: null,
      budget: null,
      storiesReach: null,
    });
    expect(b).toMatchObject({ stage: "other", statusLabel: "Что-то своё", cost: null, adUrl: "https://t.me/x" });
  });

  it("reports which required columns are missing", () => {
    expect(() => normalizeRows([["Блогер", "Площадка"]])).toThrowError(new SheetFormatError("В таблице нет колонки «Статус»"));
    expect(() => normalizeRows([["A"]])).toThrowError("колонок «Блогер» и «Статус»");
    expect(() => normalizeRows([])).toThrowError("Таблица пустая");
  });

  it("makes duplicate articles unique", () => {
    const rows = [["Артикул", "Блогер", "Статус"], ["X-1", "А", "Пост"], ["X-1", "Б", "Пост"]];
    expect(normalizeRows(rows).map((p) => p.id)).toEqual(["X-1", "X-1-2"]);
  });
});

describe("cell parsing", () => {
  it.each([
    ["1968,75", 1968.75],
    ["23 200", 23200],
    ["6\u00a0300 ₽", 6300],
    ["=K2/I2", null],
    ["много", null],
    ["", null],
  ])("parses number %s", (input, expected) => {
    expect(parseNumber(input)).toBe(expected);
  });

  it.each([
    ["2026-11-02", "2026-11-02"],
    ["2.11.2026", "2026-11-02"],
    ["31.02.2026", null],
    ["ноябрь", null],
  ])("parses date %s", (input, expected) => {
    expect(parseDate(input)).toBe(expected);
  });
});
