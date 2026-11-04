import { useMemo } from "react";
import {
  agendaOf,
  isBeforePublication,
  STAGE_SHORT,
  StageDot,
  totalCostOf,
  type Placement,
} from "@/entities/placement";
import { addDays } from "@/shared/lib/dates";
import { formatDate, formatRelativeDay, formatRub, formatWeekdayShort } from "@/shared/lib/format";
import styles from "./WeekAgenda.module.css";

interface WeekAgendaProps {
  placements: readonly Placement[];
  today: string;
  hrefFor: (blogger: string) => string;
}

const DAYS = 7;

export function WeekAgenda({ placements, today, hrefFor }: WeekAgendaProps) {
  const days = useMemo(() => agendaOf(placements, today, DAYS), [placements, today]);
  const next = useMemo(
    () =>
      placements
        .filter((p) => p.date !== null && p.date > addDays(today, DAYS - 1))
        .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))[0] ?? null,
    [placements, today],
  );

  return (
    <section className={styles.section} aria-labelledby="agenda-title">
      <header className={styles.head}>
        <h2 id="agenda-title" className={styles.title}>
          Ближайшие 7 дней
        </h2>
        <p className={styles.range}>
          {formatDate(today)} — {formatDate(addDays(today, DAYS - 1))}
        </p>
      </header>
      {days.length ? (
        <ol className={styles.days}>
          {days.map((day) => (
            <li key={day.date} className={styles.day} data-today={day.date === today ? "" : undefined}>
              <div className={styles.dateCol}>
                <span className={styles.dayNumber}>{Number(day.date.slice(8))}</span>
                <span className={styles.dayName}>
                  {day.date === today ? "сегодня" : formatWeekdayShort(day.date)}
                </span>
              </div>
              <ul className={styles.items}>
                {day.items.map((p) => (
                  <li key={p.id}>
                    <a className={styles.item} href={hrefFor(p.blogger)}>
                      <StageDot stage={p.stage} />
                      <span className={styles.who}>
                        <span className={styles.name}>{p.blogger}</span>
                        <span className={styles.meta}>
                          {[p.platform, p.format].filter(Boolean).join(" · ") || "Площадка не указана"}
                        </span>
                      </span>
                      <span className={styles.side}>
                        <span className={styles.stage} data-warn={p.stage === "approval" ? "" : undefined}>
                          {p.stage === "approval" ? "Ещё не согласовано" : STAGE_SHORT[p.stage]}
                        </span>
                        <span className={styles.cost}>{formatRub(totalCostOf(p))}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      ) : (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>На этой неделе публикаций нет</p>
          <p className={styles.emptyText}>
            {next
              ? `Следующая — ${formatRelativeDay(next.date, today).toLowerCase()}, ${next.blogger}${
                  isBeforePublication(next.stage) ? "" : " (статус уже «Опубликовано»)"
                }.`
              : "В таблице нет будущих дат публикации."}
          </p>
        </div>
      )}
    </section>
  );
}
