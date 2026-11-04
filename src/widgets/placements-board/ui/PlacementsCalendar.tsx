import { useMemo, useState } from "react";
import { PIPELINE, STAGE_LABEL, StageDot, type Placement } from "@/entities/placement";
import { monthGrid, monthOf, shiftMonth } from "@/shared/lib/dates";
import { formatMonthLong, formatRelativeDay, pluralRu } from "@/shared/lib/format";
import { Button, ChevronIcon } from "@/shared/ui";
import styles from "./PlacementsCalendar.module.css";

interface PlacementsCalendarProps {
  rows: readonly Placement[];
  initialMonth: string;
  today: string;
  hrefFor: (blogger: string) => string;
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const VISIBLE = 4;

export function PlacementsCalendar({ rows, initialMonth, today, hrefFor }: PlacementsCalendarProps) {
  const [month, setMonth] = useState(initialMonth);
  const byDate = useMemo(() => {
    const map = new Map<string, Placement[]>();
    for (const p of rows) {
      if (!p.date) continue;
      const list = map.get(p.date) ?? [];
      list.push(p);
      map.set(p.date, list);
    }
    return map;
  }, [rows]);
  const weeks = useMemo(() => monthGrid(month), [month]);
  const inMonth = rows.filter((p) => p.date && monthOf(p.date) === month).length;
  const undated = rows.filter((p) => !p.date).length;
  const daysWithItems = weeks.flat().filter((d) => monthOf(d) === month && byDate.has(d));

  return (
    <div className={styles.calendar}>
      <div className={styles.toolbar}>
        <Button variant="icon" aria-label="Предыдущий месяц" onClick={() => setMonth(shiftMonth(month, -1))}>
          <ChevronIcon className={styles.prev} />
        </Button>
        <h3 className={styles.month} aria-live="polite">
          {formatMonthLong(month)}
          <span className={styles.monthCount}>
            {inMonth} {pluralRu(inMonth, "публикация", "публикации", "публикаций")}
          </span>
        </h3>
        <Button variant="icon" aria-label="Следующий месяц" onClick={() => setMonth(shiftMonth(month, 1))}>
          <ChevronIcon />
        </Button>
        {month !== monthOf(today) ? (
          <Button variant="quiet" className={styles.todayButton} onClick={() => setMonth(monthOf(today))}>
            Сегодня
          </Button>
        ) : null}
      </div>
      <ul className={styles.legend} aria-label="Обозначения статусов">
        {PIPELINE.map((stage) => (
          <li key={stage}>
            <StageDot stage={stage} />
            {STAGE_LABEL[stage]}
          </li>
        ))}
      </ul>
      <div className={styles.grid} role="table" aria-label={`Календарь публикаций, ${formatMonthLong(month)}`}>
        <div className={styles.weekdays} role="row">
          {WEEKDAYS.map((day) => (
            <span key={day} role="columnheader" className={styles.weekday}>
              {day}
            </span>
          ))}
        </div>
        {weeks.map((week) => (
          <div key={week[0]} className={styles.week} role="row">
            {week.map((date) => {
              const items = byDate.get(date) ?? [];
              const outside = monthOf(date) !== month;
              return (
                <div
                  key={date}
                  role="cell"
                  className={styles.cell}
                  data-outside={outside ? "" : undefined}
                  data-today={date === today ? "" : undefined}
                  data-empty={items.length ? undefined : ""}
                >
                  <span className={styles.date}>
                    <span className="visually-hidden">{formatRelativeDay(date, today)}: </span>
                    <span aria-hidden="true">{Number(date.slice(8))}</span>
                  </span>
                  {items.length ? (
                    <ul className={styles.entries}>
                      {items.slice(0, items.length > VISIBLE ? VISIBLE - 1 : VISIBLE).map((p) => (
                        <li key={p.id}>
                          <a className={styles.entry} href={hrefFor(p.blogger)} title={`${p.blogger} · ${STAGE_LABEL[p.stage]}`}>
                            <StageDot stage={p.stage} />
                            <span className={styles.entryName}>{p.blogger}</span>
                            <span className="visually-hidden">, {STAGE_LABEL[p.stage]}</span>
                          </a>
                        </li>
                      ))}
                      {items.length > VISIBLE ? <li className={styles.more}>ещё {items.length - VISIBLE + 1}</li> : null}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <ol className={styles.agenda} aria-label={`Публикации, ${formatMonthLong(month)}`}>
        {daysWithItems.map((date) => (
          <li key={date} className={styles.agendaDay} data-today={date === today ? "" : undefined}>
            <span className={styles.agendaDate}>{formatRelativeDay(date, today)}</span>
            <ul className={styles.agendaItems}>
              {(byDate.get(date) ?? []).map((p) => (
                <li key={p.id}>
                  <a className={styles.agendaEntry} href={hrefFor(p.blogger)}>
                    <StageDot stage={p.stage} />
                    <span className={styles.entryName}>{p.blogger}</span>
                    <span className={styles.agendaStage}>{STAGE_LABEL[p.stage]}</span>
                  </a>
                </li>
              ))}
            </ul>
          </li>
        ))}
        {daysWithItems.length === 0 ? <li className={styles.agendaEmpty}>В этом месяце публикаций нет</li> : null}
      </ol>
      {undated ? (
        <p className={styles.undated}>
          Без даты: {undated} {pluralRu(undated, "размещение", "размещения", "размещений")} — их видно в списке.
        </p>
      ) : null}
    </div>
  );
}
