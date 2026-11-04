import type { BudgetKind, Placement, Stage } from "./types";

type Field =
  | "row"
  | "article"
  | "blogger"
  | "platform"
  | "budget"
  | "followers"
  | "audienceAge"
  | "audienceGeo"
  | "storiesReach"
  | "reelsViews"
  | "cost"
  | "productCost"
  | "format"
  | "status"
  | "date"
  | "adUrl"
  | "comment";

const COLUMNS: Record<Field, readonly string[]> = {
  row: ["№"],
  article: ["артикул"],
  blogger: ["блогер"],
  platform: ["площадка"],
  budget: ["категория бюджета"],
  followers: ["подписчики"],
  audienceAge: ["возраст аудитории"],
  audienceGeo: ["гео аудитории"],
  storiesReach: ["охват сторис"],
  reelsViews: ["просмотры рилс"],
  cost: ["стоимость размещения"],
  productCost: ["себестоимость товара"],
  format: ["формат рекламы"],
  status: ["статус"],
  date: ["дата рекламы"],
  adUrl: ["ссылка на рекламу"],
  comment: ["комментарий"],
};

const REQUIRED = { blogger: "Блогер", status: "Статус" } as const;

const STAGES: readonly [Exclude<Stage, "other">, string][] = [
  ["approval", "согласован"],
  ["scheduled", "запланир"],
  ["published", "опубликов"],
  ["results", "результат"],
];

const BUDGETS: readonly [BudgetKind, string][] = [
  ["paid", "плат"],
  ["barter", "бартер"],
];

export class SheetFormatError extends Error {}

function headerKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s*,\s*₽\s*$/, "")
    .trim();
}

export function mapColumns(header: readonly string[]): Partial<Record<Field, number>> {
  const keys = header.map(headerKey);
  const mapping: Partial<Record<Field, number>> = {};
  for (const field of Object.keys(COLUMNS) as Field[]) {
    const index = keys.findIndex((key) => COLUMNS[field].includes(key));
    if (index >= 0) mapping[field] = index;
  }
  const missing = (Object.keys(REQUIRED) as (keyof typeof REQUIRED)[]).filter((field) => mapping[field] === undefined);
  if (missing.length) {
    const names = missing.map((field) => `«${REQUIRED[field]}»`).join(" и ");
    throw new SheetFormatError(`В таблице нет ${missing.length > 1 ? "колонок" : "колонки"} ${names}`);
  }
  return mapping;
}

function text(value: string | undefined): string | null {
  if (value === undefined) return null;
  const result = value.replace(/\s+/g, " ").trim();
  return result || null;
}

export function parseNumber(value: string | undefined): number | null {
  const raw = text(value);
  if (raw === null || raw.startsWith("=")) return null;
  const cleaned = raw.replace(/[\s\u00a0\u202f₽%]/g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseDate(value: string | undefined): string | null {
  const raw = text(value);
  if (raw === null) return null;
  let parts: [number, number, number] | null = null;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(raw);
  const ru = /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(raw);
  if (iso) parts = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else if (ru) parts = [Number(ru[3]), Number(ru[2]), Number(ru[1])];
  if (!parts) return null;
  const [y, m, d] = parts;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date.toISOString().slice(0, 10);
}

function classify<T extends string>(value: string | null, table: readonly [T, string][]): T | null {
  if (value === null) return null;
  const lowered = value.toLowerCase().replace(/ё/g, "е");
  return table.find(([, needle]) => lowered.includes(needle))?.[0] ?? null;
}

function safeUrl(value: string | undefined): string | null {
  const raw = text(value);
  return raw && /^https?:\/\//i.test(raw) ? raw : null;
}

export function normalizeRows(rows: readonly (readonly string[])[]): Placement[] {
  const [header, ...body] = rows;
  if (!header) throw new SheetFormatError("Таблица пустая");
  const mapping = mapColumns(header);
  const cell = (cells: readonly string[], field: Field) => {
    const index = mapping[field];
    return index === undefined ? undefined : cells[index];
  };
  const placements: Placement[] = [];
  body.forEach((cells, offset) => {
    const index = offset + 1;
    const blogger = text(cell(cells, "blogger"));
    if (blogger === null) return;
    const status = text(cell(cells, "status"));
    const budgetLabel = text(cell(cells, "budget"));
    const article = text(cell(cells, "article"));
    const rowNumber = parseNumber(cell(cells, "row"));
    placements.push({
      id: article ?? `row-${index}`,
      row: rowNumber === null ? index : Math.trunc(rowNumber),
      article,
      blogger,
      platform: text(cell(cells, "platform")),
      budget: classify(budgetLabel, BUDGETS),
      budgetLabel,
      followers: parseNumber(cell(cells, "followers")),
      audienceAge: text(cell(cells, "audienceAge")),
      audienceGeo: text(cell(cells, "audienceGeo")),
      storiesReach: parseNumber(cell(cells, "storiesReach")),
      reelsViews: parseNumber(cell(cells, "reelsViews")),
      cost: parseNumber(cell(cells, "cost")),
      productCost: parseNumber(cell(cells, "productCost")),
      format: text(cell(cells, "format")),
      stage: classify(status, STAGES) ?? "other",
      statusLabel: status,
      date: parseDate(cell(cells, "date")),
      adUrl: safeUrl(cell(cells, "adUrl")),
      comment: text(cell(cells, "comment")),
    });
  });
  const seen = new Map<string, number>();
  for (const placement of placements) {
    const count = seen.get(placement.id) ?? 0;
    seen.set(placement.id, count + 1);
    if (count) placement.id = `${placement.id}-${count + 1}`;
  }
  return placements;
}
