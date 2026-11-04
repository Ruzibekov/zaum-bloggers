import type { BudgetKind } from "../model/types";
import styles from "./tags.module.css";

export function BudgetTag({ budget, label }: { budget: BudgetKind | null; label?: string | null }) {
  if (!budget) return <span className={styles.missing}>{label ?? "Бюджет не указан"}</span>;
  return (
    <span className={styles.budget} data-budget={budget}>
      {budget === "barter" ? "Бартер" : "Платно"}
    </span>
  );
}
