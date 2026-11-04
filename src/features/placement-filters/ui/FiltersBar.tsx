import { useEffect, useId, useMemo, useRef, type RefObject } from "react";
import { PIPELINE, STAGE_LABEL, type Placement, type TaskGroup } from "@/entities/placement";
import { Button, CloseIcon, SearchIcon, SelectPill } from "@/shared/ui";
import {
  ALL,
  DEFAULT_DIR,
  isFiltered,
  mismatchIdsOf,
  optionsOf,
  resetFilters,
  SORT_LABEL,
  type PlacementFilters,
  type SortKey,
} from "../model/filters";
import styles from "./FiltersBar.module.css";

interface FiltersBarProps {
  rows: readonly Placement[];
  filters: PlacementFilters;
  groups: readonly TaskGroup[];
  onChange: (next: PlacementFilters) => void;
  searchRef?: RefObject<HTMLInputElement | null>;
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

export function FiltersBar({ rows, filters, groups, onChange, searchRef }: FiltersBarProps) {
  const ownRef = useRef<HTMLInputElement>(null);
  const inputRef = searchRef ?? ownRef;
  const searchId = useId();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
      if (document.querySelector("dialog[open]")) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inputRef]);

  const options = useMemo(() => {
    const withCount = (value: string, label: string, n: number) => ({ value, label: `${label} · ${n}`, short: label });
    const stageCounts = new Map(PIPELINE.map((stage) => [stage, rows.filter((p) => p.stage === stage).length]));
    return {
      stage: [
        { value: ALL, label: "Все" },
        ...PIPELINE.map((stage) => withCount(stage, STAGE_LABEL[stage], stageCounts.get(stage) ?? 0)),
      ],
      platform: [
        { value: ALL, label: "Все" },
        ...optionsOf(rows, (p) => p.platform).map((o) => withCount(o.value, o.value, o.count)),
      ],
      budget: [
        { value: ALL, label: "Любой" },
        withCount("paid", "Платно", rows.filter((p) => p.budget === "paid").length),
        withCount("barter", "Бартер", rows.filter((p) => p.budget === "barter").length),
      ],
      format: [
        { value: ALL, label: "Все" },
        ...optionsOf(rows, (p) => p.format).map((o) => withCount(o.value, o.value, o.count)),
      ],
      sort: (Object.keys(SORT_LABEL) as SortKey[]).flatMap((key) => [
        { value: `${key}:${DEFAULT_DIR[key]}`, label: `${SORT_LABEL[key]} ${DEFAULT_DIR[key] === "asc" ? "↑" : "↓"}` },
        {
          value: `${key}:${DEFAULT_DIR[key] === "asc" ? "desc" : "asc"}`,
          label: `${SORT_LABEL[key]} ${DEFAULT_DIR[key] === "asc" ? "↓" : "↑"}`,
        },
      ]),
    };
  }, [rows]);

  const mismatchCount = useMemo(() => mismatchIdsOf(groups).size, [groups]);
  const task = filters.task ? (groups.find((g) => g.key === filters.task) ?? null) : null;

  return (
    <div className={styles.bar}>
      <div className={styles.searchRow}>
        <div className={styles.search}>
          <SearchIcon className={styles.searchIcon} />
          <label htmlFor={searchId} className="visually-hidden">
            Поиск по блогеру, артикулу, комментарию
          </label>
          <input
            id={searchId}
            ref={inputRef}
            className={styles.input}
            type="search"
            inputMode="search"
            autoComplete="off"
            spellCheck={false}
            placeholder="Блогер, артикул, комментарий"
            value={filters.query}
            onChange={(event) => onChange({ ...filters, query: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === "Escape" && filters.query) {
                event.preventDefault();
                onChange({ ...filters, query: "" });
              }
            }}
          />
          {filters.query ? (
            <button
              type="button"
              className={styles.clear}
              aria-label="Очистить поиск"
              onClick={() => {
                onChange({ ...filters, query: "" });
                inputRef.current?.focus();
              }}
            >
              <CloseIcon width={16} height={16} />
            </button>
          ) : (
            <kbd className={styles.kbd} aria-hidden="true">
              /
            </kbd>
          )}
        </div>
      </div>
      <div className={styles.pills} role="group" aria-label="Фильтры и сортировка">
        <SelectPill
          className={styles.sort}
          label="Сортировка"
          value={`${filters.sort.key}:${filters.sort.dir}`}
          options={options.sort}
          onChange={(value) => {
            const [key, dir] = value.split(":") as [SortKey, "asc" | "desc"];
            onChange({ ...filters, sort: { key, dir } });
          }}
        />
        <SelectPill
          label="Этап"
          value={filters.stage}
          active={filters.stage !== ALL}
          options={options.stage}
          onChange={(value) => onChange({ ...filters, stage: value as PlacementFilters["stage"] })}
        />
        <SelectPill
          label="Площадка"
          value={filters.platform}
          active={filters.platform !== ALL}
          options={options.platform}
          onChange={(value) => onChange({ ...filters, platform: value })}
        />
        <SelectPill
          label="Бюджет"
          value={filters.budget}
          active={filters.budget !== ALL}
          options={options.budget}
          onChange={(value) => onChange({ ...filters, budget: value as PlacementFilters["budget"] })}
        />
        <SelectPill
          label="Формат"
          value={filters.format}
          active={filters.format !== ALL}
          options={options.format}
          onChange={(value) => onChange({ ...filters, format: value })}
        />
        {mismatchCount ? (
          <button
            type="button"
            className={styles.toggle}
            aria-pressed={filters.mismatch}
            onClick={() => onChange({ ...filters, mismatch: !filters.mismatch })}
          >
            Расхождения
            <span className={styles.toggleCount}>{mismatchCount}</span>
          </button>
        ) : null}
        {task ? (
          <button type="button" className={styles.taskChip} onClick={() => onChange({ ...filters, task: null })}>
            <span className={styles.taskLabel}>Задача</span>
            <span className={styles.taskValue}>{task.title}</span>
            <CloseIcon width={14} height={14} />
            <span className="visually-hidden">— убрать фильтр</span>
          </button>
        ) : null}
        {isFiltered(filters) ? (
          <Button variant="quiet" className={styles.reset} onClick={() => onChange(resetFilters(filters))}>
            Сбросить
          </Button>
        ) : null}
      </div>
    </div>
  );
}
