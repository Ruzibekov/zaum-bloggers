import type { Ref } from "react";
import { VERDICT_BAND, VERDICT_LABEL, type CpmScale, type Placement, type TaskGroup } from "@/entities/placement";
import { FiltersBar, isFiltered, resetFilters, toggleSort, type PlacementFilters } from "@/features/placement-filters";
import type { ListView } from "@/shared/lib/hash-route";
import { formatInt, formatRub } from "@/shared/lib/format";
import { Button, Segmented, StateBlock } from "@/shared/ui";
import { PlacementsCalendar } from "./PlacementsCalendar";
import { PlacementsTable } from "./PlacementsTable";
import styles from "./PlacementsBoard.module.css";

interface PlacementsBoardProps {
  all: readonly Placement[];
  rows: readonly Placement[];
  filters: PlacementFilters;
  onFiltersChange: (next: PlacementFilters) => void;
  groups: readonly TaskGroup[];
  view: ListView;
  onViewChange: (view: ListView) => void;
  hrefFor: (blogger: string) => string;
  scale: CpmScale | null;
  today: string;
  month: string;
  ref?: Ref<HTMLElement>;
}

const VIEWS = [
  { value: "list" as const, label: "Список" },
  { value: "calendar" as const, label: "Календарь" },
];

export function PlacementsBoard({
  all,
  rows,
  filters,
  onFiltersChange,
  groups,
  view,
  onViewChange,
  hrefFor,
  scale,
  today,
  month,
  ref,
}: PlacementsBoardProps) {
  const filtered = isFiltered(filters);
  const band = Math.round(VERDICT_BAND * 100);
  return (
    <section ref={ref} className={styles.section} aria-labelledby="placements-title" tabIndex={-1}>
      <header className={styles.head}>
        <div className={styles.heading}>
          <h2 id="placements-title" className={styles.title}>
            Все размещения
          </h2>
          <p className={styles.count} aria-live="polite">
            {filtered ? `Найдено ${formatInt(rows.length)} из ${formatInt(all.length)}` : `${formatInt(all.length)} в таблице`}
          </p>
        </div>
        <Segmented label="Вид" options={VIEWS} value={view} onChange={onViewChange} />
      </header>
      <FiltersBar rows={all} filters={filters} groups={groups} onChange={onFiltersChange} />
      {rows.length === 0 ? (
        <div className={styles.emptyCard}>
          <StateBlock
            title={all.length ? "Ничего не нашли" : "В таблице пока нет размещений"}
            action={
              all.length ? (
                <Button variant="quiet" onClick={() => onFiltersChange(resetFilters(filters))}>
                  Сбросить фильтры
                </Button>
              ) : undefined
            }
          >
            {all.length
              ? "Попробуйте другое имя или уберите часть фильтров."
              : "Добавьте строки в Google Таблицу и обновите страницу."}
          </StateBlock>
        </div>
      ) : view === "calendar" ? (
        <PlacementsCalendar rows={rows} initialMonth={month} today={today} hrefFor={hrefFor} />
      ) : (
        <div className={styles.tableCard}>
          <PlacementsTable
            rows={rows}
            sort={filters.sort}
            onSort={(key) => onFiltersChange(toggleSort(filters, key))}
            hrefFor={hrefFor}
            scale={scale}
            today={today}
          />
        </div>
      )}
      {view === "list" && rows.length ? (
        <p className={styles.legend}>
          {scale ? (
            <>
              <span className={styles.legendItem}>
                <span className={styles.mark} data-verdict="good" aria-hidden="true" />
                {VERDICT_LABEL.good} — CPM ниже медианы на {band}% и больше
              </span>
              <span className={styles.legendItem}>
                <span className={styles.mark} data-verdict="normal" aria-hidden="true" />
                {VERDICT_LABEL.normal} — в пределах ±{band}%
              </span>
              <span className={styles.legendItem}>
                <span className={styles.mark} data-verdict="bad" aria-hidden="true" />
                {VERDICT_LABEL.bad} — выше на {band}% и больше
              </span>
              <span className={styles.legendNote}>
                Медиана CPM {formatRub(scale.median)} по {scale.count} размещениям
              </span>
            </>
          ) : (
            <span className={styles.legendNote}>Чтобы сравнивать CPM, нужны стоимость и охват хотя бы у трёх размещений.</span>
          )}
        </p>
      ) : null}
    </section>
  );
}
