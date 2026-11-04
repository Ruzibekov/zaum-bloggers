import { mismatchesOf, STAGE_LABEL, type Placement, type TaskGroup, type Workload } from "@/entities/placement";
import { formatShortDate, pluralRu } from "@/shared/lib/format";
import { ArrowIcon, Button } from "@/shared/ui";
import styles from "./TaskBoard.module.css";

interface TaskBoardProps {
  groups: readonly TaskGroup[];
  workload: Workload;
  hrefFor: (blogger: string) => string;
  onShowAll: (key: string) => void;
  onShowMismatches: () => void;
  today: string;
}

const PREVIEW = 3;

function chipMeta(p: Placement, year: number): string {
  const stage = p.stage === "other" ? (p.statusLabel ?? STAGE_LABEL.other) : STAGE_LABEL[p.stage];
  return `${p.date ? formatShortDate(p.date, year) : "без даты"} · ${stage}`;
}

export function TaskBoard({ groups, workload, hrefFor, onShowAll, onShowMismatches, today }: TaskBoardProps) {
  const year = Number(today.slice(0, 4));
  const actions = groups.filter((g) => g.kind !== "check");
  const waiting = workload.waiting.size;
  const mismatched = workload.mismatched.size;
  const example = groups
    .filter((g) => g.kind === "check")
    .flatMap((g) => g.items)
    .map((p) => ({ blogger: p.blogger, reason: mismatchesOf(p, today)[0] }))
    .find((entry) => entry.reason);

  return (
    <section className={styles.section} aria-labelledby="tasks-title">
      <header className={styles.head}>
        <h2 id="tasks-title" className={styles.title}>
          Нужно сделать
        </h2>
        <p className={styles.count}>
          {waiting ? `${waiting} ${pluralRu(waiting, "размещение", "размещения", "размещений")}` : "срочного нет"}
        </p>
      </header>
      {actions.length ? (
        <ul className={styles.groups}>
          {actions.map((group) => (
            <li key={group.key} className={styles.group}>
              <h3 className={styles.groupTitle}>
                {group.key === "flag:overdue" ? <span className={styles.signal} aria-hidden="true" /> : null}
                {group.title}
              </h3>
              {group.hint ? <p className={styles.hint}>{group.hint}</p> : null}
              <ul className={styles.chips}>
                {group.items.slice(0, PREVIEW).map((p) => (
                  <li key={p.id} className={styles.chipItem}>
                    <a className={styles.chip} href={hrefFor(p.blogger)} title={`${p.blogger} · ${chipMeta(p, year)}`}>
                      <span className={styles.chipName}>{p.blogger}</span>
                      <span className={styles.chipMeta}>{chipMeta(p, year)}</span>
                    </a>
                  </li>
                ))}
                {group.items.length > PREVIEW ? (
                  <li className={styles.chipItem}>
                    <button type="button" className={styles.more} onClick={() => onShowAll(group.key)}>
                      Показать {group.items.length} в списке
                      <ArrowIcon width={16} height={16} />
                    </button>
                  </li>
                ) : null}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Срочных задач нет</p>
          <p className={styles.emptyText}>Просроченных дат и подтверждённых шагов из комментариев в таблице нет.</p>
        </div>
      )}
      {mismatched ? (
        <div className={styles.check}>
          <p className={styles.checkText}>
            {mismatched} {pluralRu(mismatched, "строка", "строки", "строк")}: комментарий или статус расходится с датой
            {example ? ` — например, ${example.blogger}: ${example.reason}` : ""}
          </p>
          <Button variant="outline" className={styles.checkButton} onClick={onShowMismatches}>
            Сверить в списке
            <ArrowIcon width={16} height={16} />
          </Button>
        </div>
      ) : null}
    </section>
  );
}
