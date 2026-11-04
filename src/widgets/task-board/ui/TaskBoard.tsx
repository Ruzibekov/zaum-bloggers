import type { TaskGroup } from "@/entities/placement";
import { formatShortDate, pluralRu } from "@/shared/lib/format";
import { ArrowIcon } from "@/shared/ui";
import styles from "./TaskBoard.module.css";

interface TaskBoardProps {
  groups: readonly TaskGroup[];
  hrefFor: (blogger: string) => string;
  onShowAll: (key: string) => void;
  year: number;
}

const PREVIEW = 3;

export function TaskBoard({ groups, hrefFor, onShowAll, year }: TaskBoardProps) {
  const total = new Set(groups.filter((g) => g.kind !== "check").flatMap((g) => g.items.map((p) => p.id))).size;
  return (
    <section className={styles.section} aria-labelledby="tasks-title">
      <header className={styles.head}>
        <h2 id="tasks-title" className={styles.title}>
          Нужно сделать
        </h2>
        <p className={styles.count}>
          {total ? `${total} ${pluralRu(total, "размещение ждёт", "размещения ждут", "размещений ждут")}` : "Срочного нет"}
        </p>
      </header>
      {groups.length ? (
        <ul className={styles.groups}>
          {groups.map((group, index) => (
            <li
              key={group.key}
              className={styles.group}
              data-kind={group.kind}
              data-divider={group.kind === "check" && groups[index - 1]?.kind !== "check" ? "" : undefined}
            >
              {group.kind === "check" && groups[index - 1]?.kind !== "check" ? (
                <p className={styles.dividerLabel}>Проверить данные в таблице</p>
              ) : null}
              <div className={styles.groupHead}>
                <span className={styles.marker} aria-hidden="true" />
                <h3 className={styles.groupTitle}>{group.title}</h3>
                <span className={styles.badge}>{group.items.length}</span>
              </div>
              {group.hint ? <p className={styles.hint}>{group.hint}</p> : null}
              <ul className={styles.people}>
                {group.items.slice(0, PREVIEW).map((p) => (
                  <li key={p.id}>
                    <a className={styles.person} href={hrefFor(p.blogger)}>
                      {p.blogger}
                      <span className={styles.personDate}>{p.date ? formatShortDate(p.date, year) : "без даты"}</span>
                    </a>
                  </li>
                ))}
                <li>
                  <button type="button" className={styles.more} onClick={() => onShowAll(group.key)}>
                    {group.items.length > PREVIEW ? `Все ${group.items.length}` : "В списке"}
                    <ArrowIcon width={15} height={15} />
                  </button>
                </li>
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Срочных задач нет</p>
          <p className={styles.emptyText}>Просроченных дат и комментариев со следующим шагом в таблице нет.</p>
        </div>
      )}
      <p className={styles.footnote}>
        Задачи берутся из колонки «Комментарий» и из сверки статуса с датой рекламы.
      </p>
    </section>
  );
}
