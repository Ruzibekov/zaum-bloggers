import {
  cpmOf,
  mismatchesOf,
  nextStepOf,
  PlatformMark,
  StageBadge,
  totalCostOf,
  verdictFor,
  VERDICT_LABEL,
  BudgetTag,
  type CpmScale,
  type Placement,
} from "@/entities/placement";
import { SORT_LABEL, type PlacementFilters, type SortKey } from "@/features/placement-filters";
import { daysBetween } from "@/shared/lib/dates";
import { DASH, formatCompact, formatInt, formatRub, formatShortDate, formatWeekdayShort, pluralRu } from "@/shared/lib/format";
import { ArrowDownIcon, ArrowUpIcon, SortIcon } from "@/shared/ui";
import styles from "./PlacementsTable.module.css";

interface PlacementsTableProps {
  rows: readonly Placement[];
  sort: PlacementFilters["sort"];
  onSort: (key: SortKey) => void;
  hrefFor: (blogger: string) => string;
  scale: CpmScale | null;
  today: string;
}

function relative(date: string, today: string): string | null {
  const diff = daysBetween(today, date);
  if (diff === null || Math.abs(diff) > 6) return null;
  if (diff === 0) return "сегодня";
  if (diff === 1) return "завтра";
  if (diff === -1) return "вчера";
  return diff > 0 ? `через ${diff} ${pluralRu(diff, "день", "дня", "дней")}` : `${-diff} ${pluralRu(-diff, "день", "дня", "дней")} назад`;
}

function SortHeader({ column, sort, onSort, align }: { column: SortKey; sort: PlacementFilters["sort"]; onSort: (key: SortKey) => void; align?: "end" }) {
  const active = sort.key === column;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
      data-align={align}
    >
      <button type="button" className={styles.sortButton} data-active={active ? "" : undefined} onClick={() => onSort(column)}>
        {SORT_LABEL[column]}
        {active && sort.dir === "asc" ? (
          <ArrowUpIcon className={styles.sortMark} data-active="" width={16} height={16} />
        ) : active ? (
          <ArrowDownIcon className={styles.sortMark} data-active="" width={16} height={16} />
        ) : (
          <SortIcon className={styles.sortMark} width={16} height={16} />
        )}
      </button>
    </th>
  );
}

export function PlacementsTable({ rows, sort, onSort, hrefFor, scale, today }: PlacementsTableProps) {
  const year = Number(today.slice(0, 4));
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <caption className="visually-hidden">Размещения у блогеров. Нажмите на заголовок колонки, чтобы отсортировать.</caption>
        <thead>
          <tr>
            <SortHeader column="blogger" sort={sort} onSort={onSort} />
            <SortHeader column="stage" sort={sort} onSort={onSort} />
            <SortHeader column="date" sort={sort} onSort={onSort} />
            <SortHeader column="followers" sort={sort} onSort={onSort} align="end" />
            <SortHeader column="reach" sort={sort} onSort={onSort} align="end" />
            <SortHeader column="total" sort={sort} onSort={onSort} align="end" />
            <SortHeader column="cpm" sort={sort} onSort={onSort} align="end" />
            <th scope="col">Следующий шаг</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const next = nextStepOf(p, today);
            const mismatches = mismatchesOf(p, today);
            const cpm = cpmOf(p);
            const verdict = verdictFor(cpm, scale);
            const rel = p.date ? relative(p.date, today) : null;
            return (
              <tr key={p.id} className={styles.row}>
                <th scope="row" className={styles.who}>
                  <a className={styles.name} href={hrefFor(p.blogger)} title={p.blogger}>
                    {p.blogger}
                  </a>
                  <span className={styles.meta}>
                    <PlatformMark platform={p.platform} compact />
                    <span className={styles.metaText}>{[p.platform, p.format].filter(Boolean).join(" · ") || DASH}</span>
                    {p.budget === "barter" || !p.budget ? <BudgetTag budget={p.budget} label={p.budgetLabel} /> : null}
                  </span>
                </th>
                <td className={styles.stage} data-label="Этап">
                  <StageBadge stage={p.stage} label={p.statusLabel} />
                </td>
                <td className={styles.date} data-label="Дата">
                  {p.date ? (
                    <>
                      <span className={styles.primary}>
                        {formatShortDate(p.date, year)}, {formatWeekdayShort(p.date)}
                      </span>
                      {rel ? <span className={styles.secondary}>{rel}</span> : null}
                    </>
                  ) : (
                    <span className={styles.empty}>не назначена</span>
                  )}
                </td>
                <td className={styles.num} data-label="Подписчики">
                  <span className={styles.primary}>{p.followers === null ? <span className={styles.empty}>нет данных</span> : formatCompact(p.followers)}</span>
                  {p.audienceAge || p.audienceGeo ? (
                    <span className={styles.secondary}>{[p.audienceAge, p.audienceGeo].filter(Boolean).join(" · ")}</span>
                  ) : null}
                </td>
                <td className={styles.num} data-label="Охват сторис">
                  <span className={styles.primary}>{p.storiesReach === null ? <span className={styles.empty}>нет данных</span> : formatCompact(p.storiesReach)}</span>
                  {p.reelsViews !== null ? <span className={styles.secondary}>рилс {formatCompact(p.reelsViews)}</span> : null}
                </td>
                <td className={styles.num} data-label="Затраты">
                  <span className={styles.primary}>{totalCostOf(p) === null ? <span className={styles.empty}>не указаны</span> : formatRub(totalCostOf(p))}</span>
                  {p.productCost ? (
                    <span className={styles.secondary}>
                      вкл. товар {formatInt(p.productCost)}
                    </span>
                  ) : null}
                </td>
                <td className={styles.num} data-label="CPM">
                  <span className={styles.primary}>
                    {cpm === null ? <span className={styles.empty}>нет данных</span> : formatRub(cpm)}
                  </span>
                  {verdict === "good" || verdict === "bad" ? (
                    <span className={styles.verdict} data-verdict={verdict}>
                      {verdict === "good" ? <ArrowDownIcon width={14} height={14} /> : <ArrowUpIcon width={14} height={14} />}
                      {VERDICT_LABEL[verdict].toLowerCase()}
                    </span>
                  ) : null}
                </td>
                <td className={styles.next} data-label="Следующий шаг">
                  {next ? <span className={styles.flag}>{next}</span> : null}
                  {mismatches.map((text) => (
                    <span key={text} className={styles.comment}>
                      Расхождение: {text}
                    </span>
                  ))}
                  {!next && !mismatches.length ? <span className={styles.empty}>не указан</span> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
