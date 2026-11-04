import { useDeferredValue, useMemo, useRef, useState } from "react";
import {
  cpmScaleOf,
  focusMonth,
  summarize,
  taskGroupsOf,
  weekEnd,
  type DatasetState,
  type SourcePreference,
  type Stage,
} from "@/entities/placement";
import { SourceDialog } from "@/features/data-source";
import { applyFilters, INITIAL_FILTERS, type PlacementFilters } from "@/features/placement-filters";
import { BloggerPanel } from "@/widgets/blogger-panel";
import { BudgetOverview } from "@/widgets/budget-overview";
import { PlacementsBoard } from "@/widgets/placements-board";
import { StagePipeline } from "@/widgets/stage-pipeline";
import { TaskBoard } from "@/widgets/task-board";
import { WeekAgenda } from "@/widgets/week-agenda";
import { buildHash, type ListView } from "@/shared/lib/hash-route";
import { useHashRoute } from "@/shared/lib/useHashRoute";
import { useToday } from "@/shared/lib/useToday";
import { formatDate, formatLongDay, pluralRu } from "@/shared/lib/format";
import { Button, RefreshIcon, SheetIcon } from "@/shared/ui";
import styles from "./DashboardPage.module.css";

type ReadyState = Extract<DatasetState, { kind: "ready" }>;

interface DashboardPageProps {
  state: ReadyState;
  source: SourcePreference;
  onSourceChange: (next: SourcePreference) => void;
  onRefresh: () => void;
}

const timeFormat = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" });

function scrollIntoView(element: HTMLElement | null) {
  if (!element) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  element.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  element.focus({ preventScroll: true });
}

export function DashboardPage({ state, source, onSourceChange, onRefresh }: DashboardPageProps) {
  const { data, fallback, refreshing, refreshError, loadedAt } = state;
  const placements = data.placements;
  const today = useToday();
  const { route, navigate } = useHashRoute();
  const [filters, setFilters] = useState<PlacementFilters>(INITIAL_FILTERS);
  const [sourceOpen, setSourceOpen] = useState(false);
  const deferredFilters = useDeferredValue(filters);
  const boardRef = useRef<HTMLElement>(null);

  const groups = useMemo(() => taskGroupsOf(placements, today), [placements, today]);
  const summary = useMemo(() => summarize(placements), [placements]);
  const scale = useMemo(() => cpmScaleOf(placements), [placements]);
  const month = useMemo(() => focusMonth(placements, today), [placements, today]);
  const visible = useMemo(() => applyFilters(placements, deferredFilters, groups), [placements, deferredFilters, groups]);

  const todayCount = placements.filter((p) => p.date === today).length;
  const restOfWeek = placements.filter((p) => p.date !== null && p.date > today && p.date <= weekEnd(today)).length;
  const attention = new Set(groups.filter((g) => g.kind !== "check").flatMap((g) => g.items.map((p) => p.id))).size;
  const checks = new Set(groups.filter((g) => g.kind === "check").flatMap((g) => g.items.map((p) => p.id))).size;
  const live = data.source.kind === "sheet";

  const hrefFor = (blogger: string) => buildHash({ blogger, view: route.view });
  const setView = (view: ListView) => navigate({ blogger: null, view }, "replace");
  const closePanel = () => navigate({ blogger: null, view: route.view }, "replace");

  function selectStage(stage: Stage) {
    setFilters((current) => ({ ...current, stage: current.stage === stage ? "all" : stage }));
    scrollIntoView(boardRef.current);
  }

  function showTask(key: string) {
    setFilters((current) => ({ ...INITIAL_FILTERS, sort: current.sort, task: key }));
    if (route.view !== "list") setView("list");
    scrollIntoView(boardRef.current);
  }

  return (
    <>
      <header className={styles.appbar}>
        <div className={styles.appbarInner}>
          <a className={styles.brand} href={buildHash({ blogger: null, view: route.view })}>
            <span className={styles.logo}>ZAUM</span>
            <span className={styles.brandText}>Блогеры</span>
          </a>
          <span className={styles.demo} title="Данные в таблице вымышлены">
            Демо-данные
          </span>
          <div className={styles.sourceBox}>
            <button type="button" className={styles.source} onClick={() => setSourceOpen(true)}>
              <span className={styles.sourceDot} data-state={fallback ? "fallback" : live ? "live" : "file"} aria-hidden="true" />
              <SheetIcon width={16} height={16} className={styles.sourceIcon} />
              <span className={styles.sourceText}>
                {fallback ? "Снимок data.json" : live ? "Google Таблица" : "Снимок data.json"}
                <span className={styles.sourceTime}>
                  {live ? `· ${timeFormat.format(loadedAt)}` : `· ${formatDate(data.generatedAt)}`}
                </span>
              </span>
              <span className="visually-hidden">— настроить источник</span>
            </button>
            <Button
              variant="icon"
              className={styles.refresh}
              data-busy={refreshing ? "" : undefined}
              aria-label={refreshing ? "Обновляем данные" : "Обновить данные"}
              aria-busy={refreshing}
              disabled={refreshing}
              onClick={onRefresh}
            >
              <RefreshIcon />
            </Button>
          </div>
        </div>
      </header>
      <main className={styles.main}>
        {fallback ? (
          <div className={styles.banner} role="status">
            <span className={styles.bannerDot} aria-hidden="true" />
            <p className={styles.bannerText}>
              <strong>Не удалось прочитать Google Таблицу.</strong> {fallback.reason}. Показан снимок data.json от{" "}
              {formatDate(data.generatedAt)} — он может отставать от таблицы.
            </p>
            <div className={styles.bannerActions}>
              <Button variant="quiet" onClick={onRefresh} disabled={refreshing}>
                {refreshing ? "Пробуем…" : "Повторить"}
              </Button>
              <Button variant="quiet" onClick={() => setSourceOpen(true)}>
                Источник
              </Button>
            </div>
          </div>
        ) : null}
        {refreshError ? (
          <div className={styles.banner} role="status">
            <span className={styles.bannerDot} aria-hidden="true" />
            <p className={styles.bannerText}>
              <strong>Обновить не получилось.</strong> {refreshError}. На экране данные с прошлой загрузки.
            </p>
          </div>
        ) : null}
        <section className={styles.intro} aria-labelledby="today-title">
          <p className={styles.eyebrow}>{formatLongDay(today)}</p>
          <h1 id="today-title" className={styles.title}>
            {todayCount
              ? `Сегодня ${todayCount} ${pluralRu(todayCount, "публикация", "публикации", "публикаций")}`
              : "Сегодня публикаций нет"}
            <span className={styles.titleRest}>
              {restOfWeek
                ? `, до конца недели ещё ${restOfWeek}`
                : todayCount
                  ? ", до конца недели больше нет"
                  : ""}
            </span>
          </h1>
          <p className={styles.lede}>
            {attention
              ? `${attention} ${pluralRu(attention, "размещение ждёт", "размещения ждут", "размещений ждут")} действия`
              : "Срочных действий нет"}
            {checks ? ` · ${checks} ${pluralRu(checks, "расхождение", "расхождения", "расхождений")} статуса и даты` : ""}
            {" · "}
            {placements.length} {pluralRu(placements.length, "размещение", "размещения", "размещений")} в таблице
          </p>
        </section>
        <StagePipeline placements={placements} today={today} active={filters.stage} onSelect={selectStage} />
        <div className={styles.split}>
          <WeekAgenda placements={placements} today={today} hrefFor={hrefFor} />
          <TaskBoard groups={groups} hrefFor={hrefFor} onShowAll={showTask} year={Number(today.slice(0, 4))} />
        </div>
        <BudgetOverview summary={summary} />
        <PlacementsBoard
          ref={boardRef}
          all={placements}
          rows={visible}
          filters={filters}
          onFiltersChange={setFilters}
          groups={groups}
          view={route.view}
          onViewChange={setView}
          hrefFor={hrefFor}
          scale={scale}
          today={today}
          month={month}
        />
        <footer className={styles.footer}>
          <p>
            Демо-данные ZAUM: блогеры и цифры вымышлены. Сервис только читает таблицу и ничего в неё не записывает.
          </p>
        </footer>
      </main>
      <BloggerPanel blogger={route.blogger} placements={placements} scale={scale} today={today} onClose={closePanel} />
      <SourceDialog open={sourceOpen} current={source} onClose={() => setSourceOpen(false)} onSave={onSourceChange} />
    </>
  );
}
