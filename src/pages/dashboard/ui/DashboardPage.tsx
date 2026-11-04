import { useCallback, useDeferredValue, useMemo, useRef, useState } from "react";
import {
  cpmScaleOf,
  focusMonth,
  summarize,
  taskGroupsOf,
  weekEnd,
  workloadOf,
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
import { useFirstVisit } from "@/shared/lib/useFirstVisit";
import { useHashRoute } from "@/shared/lib/useHashRoute";
import { useToday } from "@/shared/lib/useToday";
import { formatDate, formatLongDay, pluralRu } from "@/shared/lib/format";
import { Button, Toast, type ToastMessage } from "@/shared/ui";
import { AppBar } from "./AppBar";
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

function publications(count: number): string {
  return `${count}\u00a0${pluralRu(count, "публикация", "публикации", "публикаций")}`;
}

function headline(todayCount: number, restOfWeek: number): [string, string] {
  const first = todayCount ? `Сегодня ${publications(todayCount)},` : "Сегодня публикаций нет,";
  if (restOfWeek) return [first, `до конца недели ещё\u00a0${restOfWeek}`];
  return [first, todayCount ? "до конца недели больше нет" : "до конца недели тоже нет"];
}

export function DashboardPage({ state, source, onSourceChange, onRefresh }: DashboardPageProps) {
  const { data, fallback, refreshing, refreshError, loadedAt } = state;
  const placements = data.placements;
  const today = useToday();
  const { route, navigate } = useHashRoute();
  const [filters, setFilters] = useState<PlacementFilters>(INITIAL_FILTERS);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [wasRefreshing, setWasRefreshing] = useState(refreshing);
  const deferredFilters = useDeferredValue(filters);
  const boardRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const animate = useFirstVisit("zaum:thread-drawn");

  const groups = useMemo(() => taskGroupsOf(placements, today), [placements, today]);
  const workload = useMemo(() => workloadOf(groups), [groups]);
  const summary = useMemo(() => summarize(placements), [placements]);
  const scale = useMemo(() => cpmScaleOf(placements), [placements]);
  const month = useMemo(() => focusMonth(placements, today), [placements, today]);
  const visible = useMemo(() => applyFilters(placements, deferredFilters, groups), [placements, deferredFilters, groups]);

  const live = data.source.kind === "sheet" && !fallback;
  const loadedTime = timeFormat.format(loadedAt);
  if (wasRefreshing !== refreshing) {
    setWasRefreshing(refreshing);
    if (!refreshing) {
      setToast(
        refreshError
          ? { id: loadedAt, tone: "error", title: "Обновить не получилось", text: `${refreshError}. На экране данные с прошлой загрузки.` }
          : { id: loadedAt, tone: "done", title: `Данные обновлены · ${loadedTime}` },
      );
    }
  }
  const dismissToast = useCallback(() => setToast(null), []);

  const todayCount = placements.filter((p) => p.date === today).length;
  const end = weekEnd(today);
  const restOfWeek = placements.filter((p) => p.date !== null && p.date > today && p.date <= end).length;
  const [titleFirst, titleRest] = headline(todayCount, restOfWeek);
  const waiting = workload.waiting.size;
  const mismatched = workload.mismatched.size;
  const sourceName = live ? "Google Таблица ·" : "Снимок от";
  const sourceWhen = live ? loadedTime : data.generatedAt.slice(5, 10).split("-").reverse().join(".");

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

  function showMismatches() {
    setFilters((current) => ({ ...INITIAL_FILTERS, sort: current.sort, mismatch: true }));
    if (route.view !== "list") setView("list");
    scrollIntoView(boardRef.current);
  }

  function openCalendar() {
    setView("calendar");
    scrollIntoView(boardRef.current);
  }

  function findBlogger() {
    const input = searchRef.current;
    if (!input) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    input.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    input.focus({ preventScroll: true });
  }

  return (
    <>
      <AppBar
        homeHref={buildHash({ blogger: null, view: route.view })}
        sourceName={sourceName}
        sourceWhen={sourceWhen}
        sourceHint={`источник: ${live ? `Google Таблица, загружено в ${sourceWhen}` : `снимок data.json от ${formatDate(data.generatedAt)}`}, настроить`}
        refreshing={refreshing}
        onSource={() => setSourceOpen(true)}
        onRefresh={onRefresh}
        onSearch={findBlogger}
      />
      <main className={styles.main}>
        {fallback ? (
          <div className={styles.banner} role="status">
            <span className={styles.bannerDot} aria-hidden="true" />
            <p className={styles.bannerText}>
              <strong>Не удалось прочитать Google Таблицу.</strong> {fallback.reason}. Показан снимок от{" "}
              {formatDate(data.generatedAt)} — он может отставать от таблицы.
            </p>
            <div className={styles.bannerActions}>
              <Button variant="outline" onClick={onRefresh} disabled={refreshing}>
                {refreshing ? "Пробуем…" : "Повторить"}
              </Button>
              <Button variant="outline" onClick={() => setSourceOpen(true)}>
                Источник
              </Button>
            </div>
          </div>
        ) : null}
        <section className={styles.intro} aria-labelledby="today-title" data-animate={animate ? "" : undefined}>
          <p className={styles.eyebrow}>{formatLongDay(today)}</p>
          <h1 id="today-title" className={styles.title}>
            {titleFirst} <span className={styles.titleRest}>{titleRest}</span>
          </h1>
          <p className={styles.lede}>
            {waiting ? (
              <strong>
                {waiting} {pluralRu(waiting, "размещение ждёт", "размещения ждут", "размещений ждут")} действия
              </strong>
            ) : (
              <strong>Срочных действий нет</strong>
            )}
            {mismatched
              ? ` · ${mismatched} ${pluralRu(mismatched, "расхождение", "расхождения", "расхождений")} в таблице`
              : ""}
          </p>
          <StagePipeline
            placements={placements}
            waiting={workload.waiting}
            today={today}
            active={filters.stage}
            onSelect={selectStage}
          />
        </section>
        <div className={styles.split}>
          <WeekAgenda placements={placements} today={today} hrefFor={hrefFor} onOpenCalendar={openCalendar} />
          <div className={styles.aside}>
            <TaskBoard
              groups={groups}
              workload={workload}
              hrefFor={hrefFor}
              onShowAll={showTask}
              onShowMismatches={showMismatches}
              today={today}
            />
            <BudgetOverview summary={summary} />
          </div>
        </div>
        <PlacementsBoard
          ref={boardRef}
          searchRef={searchRef}
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
      <Toast message={toast} onDismiss={dismissToast} />
    </>
  );
}
