import { useMemo } from "react";
import {
  flagsOf,
  isActionFlag,
  pipelineOf,
  STAGE_HINT,
  STAGE_LABEL,
  type Placement,
  type Stage,
} from "@/entities/placement";
import { formatCompactRub, formatInt, pluralRu } from "@/shared/lib/format";
import styles from "./StagePipeline.module.css";

interface StagePipelineProps {
  placements: readonly Placement[];
  today: string;
  active: Stage | "all";
  onSelect: (stage: Stage) => void;
}

export function StagePipeline({ placements, today, active, onSelect }: StagePipelineProps) {
  const buckets = useMemo(() => pipelineOf(placements), [placements]);
  const units = useMemo(() => {
    const map = new Map<Stage, { id: string; blogger: string; flagged: boolean }[]>();
    const sorted = [...placements].sort((a, b) => (a.date ?? "9").localeCompare(b.date ?? "9") || a.row - b.row);
    for (const p of sorted) {
      const list = map.get(p.stage) ?? [];
      list.push({ id: p.id, blogger: p.blogger, flagged: flagsOf(p, today).some(isActionFlag) });
      map.set(p.stage, list);
    }
    return map;
  }, [placements, today]);
  const flaggedTotal = [...units.values()].flat().filter((u) => u.flagged).length;

  return (
    <section className={styles.section} aria-labelledby="pipeline-title">
      <header className={styles.head}>
        <h2 id="pipeline-title" className={styles.title}>
          Где сейчас реклама
        </h2>
        <p className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.legendUnit} aria-hidden="true" />
            одно размещение
          </span>
          {flaggedTotal ? (
            <span className={styles.legendItem}>
              <span className={styles.legendUnit} data-flagged="" aria-hidden="true" />
              требует внимания
            </span>
          ) : null}
        </p>
      </header>
      <ol className={styles.track}>
        {buckets.map((bucket, index) => {
          const list = units.get(bucket.stage) ?? [];
          const flagged = list.filter((u) => u.flagged).length;
          const pressed = active === bucket.stage;
          return (
            <li key={bucket.stage} className={styles.step} data-stage={bucket.stage}>
              <button
                type="button"
                className={styles.card}
                aria-pressed={pressed}
                onClick={() => onSelect(bucket.stage)}
              >
                <span className={styles.stepHead}>
                  <span className={styles.stepIndex} aria-hidden="true">
                    {index + 1}
                  </span>
                  <span className={styles.stepName}>{STAGE_LABEL[bucket.stage]}</span>
                </span>
                <span className={styles.figure}>
                  <span className={styles.count}>{formatInt(bucket.count)}</span>
                  <span className={styles.money}>{bucket.count ? formatCompactRub(bucket.total) : "пусто"}</span>
                </span>
                <span className={styles.units} aria-hidden="true">
                  {list.map((unit) => (
                    <span
                      key={unit.id}
                      className={styles.unit}
                      data-stage={bucket.stage}
                      data-flagged={unit.flagged ? "" : undefined}
                    />
                  ))}
                  {list.length === 0 ? <span className={styles.unitEmpty} /> : null}
                </span>
                <span className={styles.hint}>
                  {flagged ? (
                    <span className={styles.flagLine}>
                      <span className={styles.flagDot} aria-hidden="true" />
                      {flagged} {pluralRu(flagged, "требует", "требуют", "требуют")} внимания
                    </span>
                  ) : (
                    STAGE_HINT[bucket.stage]
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
