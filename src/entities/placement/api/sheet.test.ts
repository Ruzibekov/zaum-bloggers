import { afterEach, describe, expect, it, vi } from "vitest";
import { csvExportUrl, loadSheetDataset, parseSheetUrl, SheetLoadError } from "./sheet";

const URL_DEMO = "https://docs.google.com/spreadsheets/d/1PSx9Wasorkh-VTqj50fOZmfHSavWLkZjfr-e01bV-Fk/edit?gid=42#gid=42";

describe("Google Sheet links", () => {
  it("extracts the id and tab from an edit link", () => {
    expect(parseSheetUrl(URL_DEMO)).toEqual({ id: "1PSx9Wasorkh-VTqj50fOZmfHSavWLkZjfr-e01bV-Fk", gid: "42" });
    expect(parseSheetUrl("https://example.com/sheet")).toBeNull();
    expect(parseSheetUrl("")).toBeNull();
  });

  it("builds a read-only CSV export URL", () => {
    expect(csvExportUrl({ id: "abc", gid: null })).toBe(
      "https://docs.google.com/spreadsheets/d/abc/gviz/tq?tqx=out%3Acsv&headers=1",
    );
    expect(csvExportUrl({ id: "abc", gid: "7" })).toContain("&gid=7");
  });
});

describe("loadSheetDataset", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("explains a private sheet that answers with a login page", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>", { headers: { "content-type": "text/html" } })));
    await expect(loadSheetDataset(URL_DEMO)).rejects.toThrowError(/доступ «Все, у кого есть ссылка»/);
  });

  it("explains network or CORS failures", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    await expect(loadSheetDataset(URL_DEMO)).rejects.toBeInstanceOf(SheetLoadError);
  });

  it("rejects links that are not Google Sheets without a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(loadSheetDataset("https://example.com")).rejects.toThrowError("Ссылка не похожа на Google Таблицу");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("parses a CSV answer into a live dataset", async () => {
    const csv = '"Блогер","Статус","Дата рекламы"\n"Канал","Опубликовано","2026-11-03"\n';
    vi.stubGlobal("fetch", vi.fn(async () => new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8" } })));
    const data = await loadSheetDataset(URL_DEMO);
    expect(data.source).toEqual({ kind: "sheet", title: "Google Таблица", url: URL_DEMO });
    expect(data.placements[0]).toMatchObject({ blogger: "Канал", stage: "published", date: "2026-11-03" });
  });
});
