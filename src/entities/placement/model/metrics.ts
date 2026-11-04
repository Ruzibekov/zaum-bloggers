import { addDays, daysBetween, monthOf, weekdayIndex } from "@/shared/lib/dates";
import { formatShortDate } from "@/shared/lib/format";
import { isBeforePublication, PIPELINE, STAGE_LABEL, stageIndex } from "./stages";
import type { Placement, Stage } from "./types";

function finite(value: number | null): value is number {
  return value !== null && Number.isFinite(value);
}

export function cpmOf(placement: Placement): number | null {
  const { cost, storiesReach } = placement;
  if (!finite(cost) || !finite(storiesReach) || storiesReach <= 0) return null;
  return (cost / storiesReach) * 1000;
}

export function totalCostOf(placement: Placement): number | null {
  const { cost, productCost } = placement;
  if (!finite(cost) && !finite(productCost)) return null;
  return (cost ?? 0) + (productCost ?? 0);
}

export interface BudgetSlice {
  count: number;
  total: number;
}

export interface Summary {
  count: number;
  cost: number;
  productCost: number;
  total: number;
  reach: number;
  reels: number;
  cpm: number | null;
  cpmCoverage: number;
  paid: BudgetSlice;
  barter: BudgetSlice;
  unknownBudget: number;
}

export function summarize(placements: readonly Placement[]): Summary {
  const summary: Summary = {
    count: placements.length,
    cost: 0,
    productCost: 0,
    total: 0,
    reach: 0,
    reels: 0,
    cpm: null,
    cpmCoverage: 0,
    paid: { count: 0, total: 0 },
    barter: { count: 0, total: 0 },
    unknownBudget: 0,
  };
  let cpmCost = 0;
  let cpmReach = 0;
  for (const p of placements) {
    summary.cost += p.cost ?? 0;
    summary.productCost += p.productCost ?? 0;
    summary.reach += p.storiesReach ?? 0;
    summary.reels += p.reelsViews ?? 0;
    const total = totalCostOf(p) ?? 0;
    summary.total += total;
    if (p.budget) {
      summary[p.budget].count += 1;
      summary[p.budget].total += total;
    } else {
      summary.unknownBudget += 1;
    }
    if (cpmOf(p) !== null) {
      cpmCost += p.cost ?? 0;
      cpmReach += p.storiesReach ?? 0;
      summary.cpmCoverage += 1;
    }
  }
  summary.cpm = cpmReach > 0 ? (cpmCost / cpmReach) * 1000 : null;
  return summary;
}

export interface StageBucket {
  stage: Stage;
  count: number;
  total: number;
}

export function pipelineOf(placements: readonly Placement[]): StageBucket[] {
  const stages: Stage[] = [...PIPELINE];
  if (placements.some((p) => p.stage === "other")) stages.push("other");
  return stages.map((stage) => {
    const rows = placements.filter((p) => p.stage === stage);
    return { stage, count: rows.length, total: rows.reduce((sum, p) => sum + (totalCostOf(p) ?? 0), 0) };
  });
}

export const MIN_CPM_SAMPLE = 3;
export const VERDICT_BAND = 0.1;

export interface CpmScale {
  min: number;
  max: number;
  median: number;
  count: number;
}

export type Verdict = "good" | "normal" | "bad";

export function cpmScaleOf(placements: readonly Placement[]): CpmScale | null {
  const values = placements
    .map(cpmOf)
    .filter(finite)
    .sort((a, b) => a - b);
  if (values.length < MIN_CPM_SAMPLE) return null;
  const mid = Math.floor(values.length / 2);
  const median = values.length % 2 ? (values[mid] ?? 0) : ((values[mid - 1] ?? 0) + (values[mid] ?? 0)) / 2;
  return { min: values[0] ?? 0, max: values.at(-1) ?? 0, median, count: values.length };
}

export function cpmDeviation(value: number | null, scale: CpmScale | null): number | null {
  if (value === null || !scale || scale.median <= 0) return null;
  return value / scale.median - 1;
}

export function verdictFor(value: number | null, scale: CpmScale | null): Verdict | null {
  const deviation = cpmDeviation(value, scale);
  if (deviation === null) return null;
  if (deviation <= -VERDICT_BAND) return "good";
  if (deviation >= VERDICT_BAND) return "bad";
  return "normal";
}

export function scalePosition(value: number, scale: CpmScale): number {
  const span = scale.max - scale.min;
  if (span <= 0) return 0.5;
  return Math.min(1, Math.max(0, (value - scale.min) / span));
}

export interface AgendaDay {
  date: string;
  items: Placement[];
}

function byDateThenStage(a: Placement, b: Placement): number {
  const date = (a.date ?? "").localeCompare(b.date ?? "");
  if (date) return date;
  return stageIndex(a.stage) - stageIndex(b.stage) || a.row - b.row;
}

export function agendaOf(placements: readonly Placement[], today: string, days = 7): AgendaDay[] {
  const last = addDays(today, days - 1);
  const rows = placements
    .filter((p) => p.date !== null && p.date >= today && p.date <= last)
    .sort(byDateThenStage);
  const result: AgendaDay[] = [];
  for (const row of rows) {
    const date = row.date ?? "";
    const day = result.at(-1);
    if (day && day.date === date) day.items.push(row);
    else result.push({ date, items: [row] });
  }
  return result;
}

export function weekEnd(today: string): string {
  return addDays(today, 6 - (weekdayIndex(today) ?? 0));
}

export type Flag = "overdue" | "noDate" | "statusAhead";

export const FLAG_TITLE: Record<Flag, string> = {
  overdue: "Дата прошла, а реклама не вышла",
  noDate: "Нет даты публикации",
  statusAhead: "Расхождение: статус дальше даты",
};

export const FLAG_HINT: Record<Flag, string> = {
  overdue: "Уточните у блогера новую дату или обновите статус",
  noDate: "Без даты размещение не попадёт в календарь",
  statusAhead: "Дата ещё впереди, а в статусе уже «Опубликовано» или «Результаты получены»: проверьте дату",
};

export function flagsOf(placement: Placement, today: string): Flag[] {
  const flags: Flag[] = [];
  const before = isBeforePublication(placement.stage);
  if (before && placement.date === null) flags.push("noDate");
  if (before && placement.date !== null && placement.date < today) flags.push("overdue");
  if (!before && placement.stage !== "other" && placement.date !== null && placement.date > today) {
    flags.push("statusAhead");
  }
  return flags;
}

const NOTE_ONLY = /^демонстрационн/i;
const NEEDS_DATE = /нужн[аоы]?\s+дат/i;
const CHECK_RESULTS = /провер\S*\s+результат/i;

export function isActionFlag(flag: Flag): boolean {
  return flag !== "statusAhead";
}

export function isActionComment(comment: string | null): comment is string {
  return comment !== null && comment.trim() !== "" && !NOTE_ONLY.test(comment);
}

export type CommentCheck =
  | { kind: "task"; title: string; hint: string | null }
  | { kind: "mismatch"; title: string; reason: string };

export function commentCheckOf(placement: Placement, today: string): CommentCheck | null {
  const { comment, date, stage } = placement;
  if (!isActionComment(comment) || stage === "other") return null;
  const title = comment.trim();
  if (NEEDS_DATE.test(title)) {
    if (date === null) return { kind: "task", title, hint: "Согласуйте с блогером дату выхода" };
    return { kind: "mismatch", title, reason: `в комментарии «${title}», а дата уже стоит — ${formatShortDate(date, Number(today.slice(0, 4)))}` };
  }
  if (CHECK_RESULTS.test(title)) {
    if (stage === "published" && date !== null && date <= today) {
      return { kind: "task", title, hint: "Реклама вышла, статистики ещё нет" };
    }
    if (stage === "results") {
      return { kind: "mismatch", title, reason: `в комментарии «${title}», а результаты уже получены` };
    }
    if (date !== null && date > today) {
      return { kind: "mismatch", title, reason: `в комментарии «${title}», а публикация только ${formatShortDate(date, Number(today.slice(0, 4)))}` };
    }
    return {
      kind: "mismatch",
      title,
      reason: `в комментарии «${title}», а реклама ещё на этапе «${STAGE_LABEL[stage]}»`,
    };
  }
  return { kind: "task", title, hint: null };
}

export function mismatchesOf(placement: Placement, today: string): string[] {
  const reasons: string[] = [];
  if (flagsOf(placement, today).includes("statusAhead") && placement.date) {
    reasons.push(`статус «${STAGE_LABEL[placement.stage]}», а дата публикации ещё впереди — ${formatShortDate(placement.date, Number(today.slice(0, 4)))}`);
  }
  const check = commentCheckOf(placement, today);
  if (check?.kind === "mismatch") reasons.push(check.reason);
  return reasons;
}

export interface TaskGroup {
  key: string;
  kind: "flag" | "comment" | "check";
  title: string;
  hint: string | null;
  items: Placement[];
}

export const MISMATCH_TITLE = "Расхождение: комментарий и данные";
export const MISMATCH_HINT = "Комментарий в таблице не совпадает с датой или этапом: проверьте, что верно";

export function taskGroupsOf(placements: readonly Placement[], today: string): TaskGroup[] {
  const flagGroups = (["overdue", "noDate", "statusAhead"] as const).map<TaskGroup>((flag) => ({
    key: `flag:${flag}`,
    kind: isActionFlag(flag) ? "flag" : "check",
    title: FLAG_TITLE[flag],
    hint: FLAG_HINT[flag],
    items: placements.filter((p) => flagsOf(p, today).includes(flag)).sort(byDateThenStage),
  }));
  const comments = new Map<string, { hint: string | null; items: Placement[] }>();
  const mismatched: Placement[] = [];
  for (const p of placements) {
    const check = commentCheckOf(p, today);
    if (!check) continue;
    if (check.kind === "mismatch") {
      mismatched.push(p);
      continue;
    }
    if (NEEDS_DATE.test(check.title) && flagsOf(p, today).includes("noDate")) continue;
    const entry = comments.get(check.title) ?? { hint: check.hint, items: [] };
    entry.items.push(p);
    comments.set(check.title, entry);
  }
  const commentGroups = [...comments.entries()]
    .map<TaskGroup>(([title, entry]) => ({
      key: `comment:${title}`,
      kind: "comment",
      title,
      hint: entry.hint,
      items: entry.items.sort(byDateThenStage),
    }))
    .sort((a, b) => b.items.length - a.items.length || a.title.localeCompare(b.title, "ru"));
  const mismatchGroup: TaskGroup = {
    key: "check:comment",
    kind: "check",
    title: MISMATCH_TITLE,
    hint: MISMATCH_HINT,
    items: mismatched.sort(byDateThenStage),
  };
  const actions = flagGroups.filter((group) => group.kind === "flag");
  const checks = [...flagGroups.filter((group) => group.kind === "check"), mismatchGroup];
  return [...actions, ...commentGroups, ...checks].filter((group) => group.items.length > 0);
}

export interface Workload {
  waiting: Set<string>;
  mismatched: Set<string>;
}

export function workloadOf(groups: readonly TaskGroup[]): Workload {
  const collect = (check: boolean) =>
    new Set(groups.filter((g) => (g.kind === "check") === check).flatMap((g) => g.items.map((p) => p.id)));
  return { waiting: collect(false), mismatched: collect(true) };
}

export function nextStepOf(placement: Placement, today: string): string | null {
  const flag = flagsOf(placement, today).find(isActionFlag);
  if (flag) return FLAG_HINT[flag];
  const check = commentCheckOf(placement, today);
  return check?.kind === "task" ? check.title : null;
}

export function focusMonth(placements: readonly Placement[], today: string): string {
  const months = new Map<string, number>();
  for (const p of placements) {
    if (p.date) months.set(monthOf(p.date), (months.get(monthOf(p.date)) ?? 0) + 1);
  }
  const current = monthOf(today);
  if (months.has(current) || months.size === 0) return current;
  return [...months.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? current;
}

export function daysUntil(date: string | null, today: string): number | null {
  return date ? daysBetween(today, date) : null;
}
