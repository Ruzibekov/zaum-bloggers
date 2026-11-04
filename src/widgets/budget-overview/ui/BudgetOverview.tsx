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
      <div className={styles.money}>
        <h2 id="budget-title" className={styles.label}>
          Затраты по таблице
        </h2>
        <p className={styles.total}>{formatRub(summary.total)}</p>
        <p className={styles.parts}>
          размещения {formatCompactRub(summary.cost)} + себестоимость товара {formatCompactRub(summary.productCost)}
        </p>
        <div
          className={styles.split}
          role="img"
          aria-label={`Платно ${formatRub(summary.paid.total)}, бартер ${formatRub(summary.barter.total)}`}
        >
          <span className={styles.splitPaid} style={{ flexBasis: `${share(summary.paid.total, known)}%` }} />
          <span className={styles.splitBarter} style={{ flexBasis: `${share(summary.barter.total, known)}%` }} />
        </div>
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
          {summary.unknownBudget ? (
            <li className={styles.muted}>Без категории бюджета · {summary.unknownBudget}</li>
          ) : null}
        </ul>
      </div>
      <dl className={styles.stats}>
        <div>
          <dt>Охват сторис</dt>
          <dd className={styles.value}>{formatCompact(summary.reach)}</dd>
          <dd className={styles.note}>сумма по блогерам</dd>
        </div>
        <div>
          <dt>Просмотры рилс</dt>
          <dd className={styles.value}>{formatCompact(summary.reels)}</dd>
          <dd className={styles.note}>сумма по блогерам</dd>
        </div>
        <div>
          <dt>Средний CPM</dt>
          <dd className={styles.value} data-partial={partial ? "" : undefined}>
            {summary.cpm === null ? "Нет данных" : formatRub(summary.cpm)}
          </dd>
          <dd className={styles.note}>
            {partial
              ? `предварительно: по ${formatInt(summary.cpmCoverage)} из ${formatInt(summary.count)}`
              : `по всем ${formatInt(summary.count)} размещениям`}
          </dd>
        </div>
      </dl>
      <p className={styles.footnote}>
        CPM — как в таблице: стоимость размещения ÷ охват сторис × 1000, без себестоимости товара. Средний CPM —
        суммарная стоимость ÷ суммарный охват.
      </p>
    </section>
  );
}
