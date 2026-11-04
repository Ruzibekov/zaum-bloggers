import type { Verdict } from "../model/metrics";
import styles from "./tags.module.css";

export const VERDICT_LABEL: Record<Verdict, string> = { good: "Выгодно", normal: "Норма", bad: "Дорого" };

export function VerdictBadge({ verdict }: { verdict: Verdict | null }) {
  if (!verdict) return <span className={styles.missing}>Не с чем сравнить</span>;
  return (
    <span className={styles.verdict} data-verdict={verdict}>
      <span className={styles.verdictMark} aria-hidden="true" />
      {VERDICT_LABEL[verdict]}
    </span>
  );
}
