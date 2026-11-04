import type { Summary } from "@/entities/placement";
import { formatCompact, formatCompactRub, formatInt, formatRub, pluralRu } from "@/shared/lib/format";
import styles from "./BudgetOverview.module.css";

function share(part: number, total: number): number {
  return total > 0 ? (part / total) * 100 : 0;
}

export function BudgetOverview({ summary }: { summary: Summary }) {
  const partial = summary.cpmCoverage < summary.count;
  const known = summary.paid.total + summary.barter.total;
  return (
    <section className={styles.section} aria-labelledby="budget-title">
      <div className={styles.head}>
        <h2 id="budget-title" className={styles.title}>
          Затраты
        </h2>
        <p className={styles.total}>{formatRub(summary.total)}</p>
        <p className={styles.parts}>
          размещения {formatCompactRub(summary.cost)} + товар {formatCompactRub(summary.productCost)}
        </p>
      </div>
      {known > 0 ? (
        <div
          className={styles.split}
          role="img"
          aria-label={`Платно ${formatRub(summary.paid.total)}, бартер ${formatRub(summary.barter.total)}`}
        >
          {summary.paid.total > 0 ? (
            <span className={styles.splitPaid} style={{ flexBasis: `${share(summary.paid.total, known)}%` }} />
          ) : null}
          {summary.barter.total > 0 ? (
            <span className={styles.splitBarter} style={{ flexBasis: `${share(summary.barter.total, known)}%` }} />
          ) : null}
        </div>
      ) : null}
      <ul className={styles.legend}>
        <li>
          <span className={styles.swatch} data-kind="paid" aria-hidden="true" />
          Платно · {summary.paid.count} {pluralRu(summary.paid.count, "размещение", "размещения", "размещений")}
          <strong>{formatCompactRub(summary.paid.total)}</strong>
        </li>
        <li>
          <span className={styles.swatch} data-kind="barter" aria-hidden="true" />
          Бартер · {summary.barter.count} {pluralRu(summary.barter.count, "размещение", "размещения", "размещений")}
          <strong>{formatCompactRub(summary.barter.total)}</strong>
        </li>
        {summary.unknownBudget ? <li className={styles.muted}>Без категории бюджета · {summary.unknownBudget}</li> : null}
      </ul>
      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt>Охват сторис</dt>
          <dd>{formatCompact(summary.reach)}</dd>
        </div>
        <div className={styles.stat}>
          <dt>Просмотры рилс</dt>
          <dd>{formatCompact(summary.reels)}</dd>
        </div>
        <div className={styles.stat}>
          <dt>Средний CPM</dt>
          <dd>{summary.cpm === null ? "нет данных" : formatRub(summary.cpm)}</dd>
        </div>
      </dl>
      <p className={styles.footnote}>
        {partial
          ? `CPM предварительный: посчитан по ${formatInt(summary.cpmCoverage)} из ${formatInt(summary.count)} размещений. `
          : `CPM по всем ${formatInt(summary.count)} размещениям. `}
        Как в таблице: стоимость размещения ÷ охват сторис × 1000, без товара; средний — суммарная стоимость ÷
        суммарный охват. Охват и просмотры — сумма по блогерам.
      </p>
    </section>
  );
}
