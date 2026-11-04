import { useMemo } from "react";
import { agendaOf, STAGE_LABEL, StageDot, totalCostOf, type Placement } from "@/entities/placement";
import { addDays } from "@/shared/lib/dates";
import { formatDate, formatRelativeDay, formatRub, formatWeekdayShort } from "@/shared/lib/format";
import { Button } from "@/shared/ui";
import styles from "./WeekAgenda.module.css";

interface WeekAgendaProps {
  placements: readonly Placement[];
  today: string;
  hrefFor: (blogger: string) => string;
  onOpenCalendar: () => void;
}

const DAYS = 7;

function rangeOf(from: string, to: string): string {
  const [, fromMonth] = from.split("-");
  const [, toMonth] = to.split("-");
  if (fromMonth === toMonth) return `${Number(from.slice(8))}–${formatDate(to)}`;
  return `${formatDate(from)} – ${formatDate(to)}`;
}

export function WeekAgenda({ placements, today, hrefFor, onOpenCalendar }: WeekAgendaProps) {
  const days = useMemo(() => agendaOf(placements, today, DAYS), [placements, today]);
  const last = addDays(today, DAYS - 1);
  const next = useMemo(
    () =>
      placements
        .filter((p) => p.date !== null && p.date > last)
        .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))[0] ?? null,
    [placements, last],
  );

  return (
    <section className={styles.section} aria-labelledby="agenda-title">
      <header className={styles.head}>
        <h2 id="agenda-title" className={styles.title}>
          Ближайшие 7 дней
        </h2>
        <p className={styles.range}>{rangeOf(today, last)}</p>
      </header>
      {days.length ? (
        <ol className={styles.days}>
          {days.map((day) => {
            const isToday = day.date === today;
            return (
              <li key={day.date} className={styles.day} data-today={isToday ? "" : undefined}>
                <p className={styles.dateCol}>
                  <span className={styles.dayNumber}>{Number(day.date.slice(8))}</span>
                  <span className={styles.dayName}>{isToday ? "сегодня" : formatWeekdayShort(day.date)}</span>
                </p>
                <ul className={styles.items}>
                  {day.items.map((p) => (
                    <li key={p.id}>
                      <a className={styles.item} href={hrefFor(p.blogger)}>
                        <span className={styles.who}>
                          <span className={styles.name} title={p.blogger}>
                            {p.blogger}
                          </span>
                          <span className={styles.meta}>
                            {[p.platform, p.format].filter(Boolean).join(" · ") || "Площадка не указана"}
                          </span>
                        </span>
                        <span className={styles.side}>
                          <span className={styles.stage}>
                            <StageDot stage={p.stage} />
                            {p.stage === "other" ? (p.statusLabel ?? STAGE_LABEL.other) : STAGE_LABEL[p.stage]}
                          </span>
                          <span className={styles.cost}>{formatRub(totalCostOf(p))}</span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>На неделе публикаций нет</p>
          <p className={styles.emptyText}>
            {next
              ? `Следующая — ${formatRelativeDay(next.date, today).toLowerCase()}, ${next.blogger}.`
              : "В таблице нет будущих дат публикации."}
          </p>
          <Button variant="outline" onClick={onOpenCalendar}>
            Открыть календарь
          </Button>
        </div>
      )}
    </section>
  );
}
