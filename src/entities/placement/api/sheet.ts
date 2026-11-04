import { parseCsv } from "@/shared/lib/csv";
import { localIsoDate } from "@/shared/lib/dates";
import { normalizeRows } from "../model/normalize";
import type { Dataset } from "../model/types";

export const DEMO_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1PSx9Wasorkh-VTqj50fOZmfHSavWLkZjfr-e01bV-Fk/edit";

export interface SheetRef {
  id: string;
  gid: string | null;
}

export function isDemoSheet(url: string): boolean {
  const id = parseSheetUrl(url)?.id;
  return id !== undefined && id === parseSheetUrl(DEMO_SHEET_URL)?.id;
}

export function parseSheetUrl(input: string): SheetRef | null {
  const value = input.trim();
  const match = /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/.exec(value);
  if (!match?.[1]) return null;
  const gid = /[#?&]gid=(\d+)/.exec(value)?.[1] ?? null;
  return { id: match[1], gid };
}

export function csvExportUrl(ref: SheetRef): string {
  const params = new URLSearchParams({ tqx: "out:csv", headers: "1" });
  if (ref.gid) params.set("gid", ref.gid);
  return `https://docs.google.com/spreadsheets/d/${ref.id}/gviz/tq?${params.toString()}`;
}

export class SheetLoadError extends Error {}

const TIMEOUT_MS = 10_000;

export async function loadSheetDataset(url: string, signal?: AbortSignal): Promise<Dataset> {
  const ref = parseSheetUrl(url);
  if (!ref) throw new SheetLoadError("Ссылка не похожа на Google Таблицу");
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  let response: Response;
  try {
    response = await fetch(csvExportUrl(ref), { signal: combined, cache: "no-store", credentials: "omit" });
  } catch (error) {
    if (signal?.aborted) throw error;
    if (timeout.aborted) throw new SheetLoadError("Google Таблица не ответила за 10 секунд", { cause: error });
    throw new SheetLoadError("Google Таблица недоступна: нет сети или доступ к таблице закрыт", { cause: error });
  }
  if (!response.ok) {
    throw new SheetLoadError(
      response.status === 404 ? "Таблица не найдена — проверьте ссылку" : `Google ответил ошибкой (HTTP ${response.status})`,
    );
  }
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("text/csv")) {
    throw new SheetLoadError("Таблица закрыта: включите доступ «Все, у кого есть ссылка» для чтения");
  }
  const placements = normalizeRows(parseCsv(await response.text()));
  return {
    generatedAt: localIsoDate(new Date()),
    source: { kind: "sheet", title: "Google Таблица", url },
    placements,
  };
}
