import {
  cpmOf,
  stageIndex,
  totalCostOf,
  type BudgetKind,
  type Placement,
  type Stage,
  type TaskGroup,
} from "@/entities/placement";

export type SortKey = "date" | "blogger" | "stage" | "followers" | "reach" | "total" | "cpm";
export type SortDir = "asc" | "desc";

export interface PlacementFilters {
  query: string;
  stage: Stage | "all";
  platform: string;
  budget: BudgetKind | "all";
  format: string;
  task: string | null;
  sort: { key: SortKey; dir: SortDir };
}

export const ALL = "all";

export const INITIAL_FILTERS: PlacementFilters = {
  query: "",
  stage: "all",
  platform: ALL,
  budget: "all",
  format: ALL,
  task: null,
  sort: { key: "date", dir: "asc" },
};

export const SORT_LABEL: Record<SortKey, string> = {
  date: "Дата",
  blogger: "Блогер",
  stage: "Статус",
  followers: "Подписчики",
  reach: "Охват сторис",
  total: "Затраты",
  cpm: "CPM",
};

export const DEFAULT_DIR: Record<SortKey, SortDir> = {
  date: "asc",
  blogger: "asc",
  stage: "asc",
  followers: "desc",
  reach: "desc",
  total: "desc",
  cpm: "asc",
};

export function isFiltered(filters: PlacementFilters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.stage !== "all" ||
    filters.platform !== ALL ||
    filters.budget !== "all" ||
    filters.format !== ALL ||
    filters.task !== null
  );
}

export function resetFilters(filters: PlacementFilters): PlacementFilters {
  return { ...INITIAL_FILTERS, sort: filters.sort };
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();
}

function haystack(p: Placement): string {
  return normalize(
    [p.blogger, p.article, p.platform, p.format, p.comment, p.statusLabel, p.budgetLabel, p.audienceGeo]
      .filter(Boolean)
      .join(" "),
  );
}

function sortValue(p: Placement, key: SortKey): number | string | null {
  switch (key) {
    case "date":
      return p.date;
    case "blogger":
      return p.blogger;
    case "stage":
      return stageIndex(p.stage) < 0 ? null : stageIndex(p.stage);
    case "followers":
      return p.followers;
    case "reach":
      return p.storiesReach;
    case "total":
      return totalCostOf(p);
    case "cpm":
      return cpmOf(p);
  }
}

const collator = new Intl.Collator("ru", { numeric: true, sensitivity: "base" });

export function compareBy(key: SortKey, dir: SortDir) {
  const sign = dir === "asc" ? 1 : -1;
  return (a: Placement, b: Placement): number => {
    const va = sortValue(a, key);
    const vb = sortValue(b, key);
    if (va === null && vb === null) return a.row - b.row;
    if (va === null) return 1;
    if (vb === null) return -1;
    const diff = typeof va === "string" && typeof vb === "string" ? collator.compare(va, vb) : Number(va) - Number(vb);
    return diff * sign || a.row - b.row;
  };
}

export function applyFilters(
  rows: readonly Placement[],
  filters: PlacementFilters,
  groups: readonly TaskGroup[],
): Placement[] {
  const terms = normalize(filters.query).split(" ").filter(Boolean);
  const taskIds = filters.task ? new Set(groups.find((g) => g.key === filters.task)?.items.map((p) => p.id) ?? []) : null;
  return rows
    .filter((p) => {
      if (filters.stage !== "all" && p.stage !== filters.stage) return false;
      if (filters.platform !== ALL && p.platform !== filters.platform) return false;
      if (filters.budget !== "all" && p.budget !== filters.budget) return false;
      if (filters.format !== ALL && p.format !== filters.format) return false;
      if (taskIds && !taskIds.has(p.id)) return false;
      if (terms.length) {
        const text = haystack(p);
        if (!terms.every((term) => text.includes(term))) return false;
      }
      return true;
    })
    .sort(compareBy(filters.sort.key, filters.sort.dir));
}

export function toggleSort(filters: PlacementFilters, key: SortKey): PlacementFilters {
  const dir: SortDir =
    filters.sort.key === key ? (filters.sort.dir === "asc" ? "desc" : "asc") : DEFAULT_DIR[key];
  return { ...filters, sort: { key, dir } };
}

export interface Option {
  value: string;
  count: number;
}

export function optionsOf(rows: readonly Placement[], pick: (p: Placement) => string | null): Option[] {
  const counts = new Map<string, number>();
  for (const p of rows) {
    const value = pick(p);
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => collator.compare(a.value, b.value));
}
