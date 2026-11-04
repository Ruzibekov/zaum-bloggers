import {
  cpmOf,
  flagsOf,
  FLAG_TITLE,
  isActionComment,
  isActionFlag,
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
        <svg className={styles.sortMark} data-dir={active ? sort.dir : undefined} width="10" height="12" viewBox="0 0 10 12" aria-hidden="true" focusable="false">
          <path d="M5 1.5 8.5 5h-7z" className={styles.up} />
          <path d="M5 10.5 1.5 7h7z" className={styles.down} />
        </svg>
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
            const flags = flagsOf(p, today);
            const cpm = cpmOf(p);
            const verdict = verdictFor(cpm, scale);
            const rel = p.date ? relative(p.date, today) : null;
            return (
              <tr key={p.id} className={styles.row}>
                <th scope="row" className={styles.who}>
                  <a className={styles.name} href={hrefFor(p.blogger)}>
                    {p.blogger}
                  </a>
                  <span className={styles.meta}>
                    <PlatformMark platform={p.platform} compact />
                    <span className={styles.metaText}>{[p.platform, p.format].filter(Boolean).join(" · ") || DASH}</span>
                    {p.budget === "barter" || !p.budget ? <BudgetTag budget={p.budget} label={p.budgetLabel} /> : null}
                  </span>
                </th>
                <td className={styles.stage} data-label="Статус">
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
                    {verdict ? <span className={styles.verdict} data-verdict={verdict} title={VERDICT_LABEL[verdict]} aria-hidden="true" /> : null}
                    {cpm === null ? <span className={styles.empty}>нет данных</span> : formatRub(cpm)}
                  </span>
                  {verdict ? <span className={styles.secondary}>{VERDICT_LABEL[verdict].toLowerCase()}</span> : null}
                </td>
                <td className={styles.next} data-label="Следующий шаг">
                  {flags.map((flag) => (
                    <span key={flag} className={styles.flag} data-kind={isActionFlag(flag) ? "action" : "check"}>
                      {FLAG_TITLE[flag]}
                    </span>
                  ))}
                  {isActionComment(p.comment) ? (
                    <span className={styles.comment}>{p.comment}</span>
                  ) : flags.length ? null : (
                    <span className={styles.empty}>{p.comment ?? "не указан"}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
