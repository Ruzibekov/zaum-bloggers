import { cpmDeviation, VERDICT_BAND, type CpmScale } from "@/entities/placement";
import { formatRub } from "@/shared/lib/format";
import styles from "./CpmScaleBar.module.css";

export function CpmScaleBar({ value, scale }: { value: number; scale: CpmScale }) {
  const low = scale.median * (1 - VERDICT_BAND);
  const high = scale.median * (1 + VERDICT_BAND);
  const from = Math.min(scale.min, scale.median * (1 - VERDICT_BAND * 1.6));
  const to = Math.max(scale.max, scale.median * (1 + VERDICT_BAND * 1.6));
  const pos = (v: number) => `${((Math.min(to, Math.max(from, v)) - from) / (to - from)) * 100}%`;
  const deviation = cpmDeviation(value, scale) ?? 0;
  return (
    <figure className={styles.figure}>
      <div className={styles.track} aria-hidden="true">
        <span className={styles.zone} data-zone="good" style={{ left: 0, width: pos(low) }} />
        <span className={styles.zone} data-zone="normal" style={{ left: pos(low), width: `calc(${pos(high)} - ${pos(low)})` }} />
        <span className={styles.zone} data-zone="bad" style={{ left: pos(high), right: 0 }} />
        <span className={styles.range} style={{ left: pos(scale.min), width: `calc(${pos(scale.max)} - ${pos(scale.min)})` }} />
        <span className={styles.median} style={{ left: pos(scale.median) }} />
        <span className={styles.marker} style={{ left: pos(value) }} />
      </div>
      <div className={styles.labels} aria-hidden="true">
        <span>Выгодно</span>
        <span>Норма</span>
        <span>Дорого</span>
      </div>
      <figcaption className={styles.caption}>
        {Math.abs(deviation) < 0.005
          ? "Ровно на медиане"
          : `${deviation < 0 ? "Дешевле" : "Дороже"} медианы на ${Math.max(1, Math.round(Math.abs(deviation) * 100))}%`}
        . Медиана {formatRub(scale.median)}, разброс {formatRub(scale.min)} — {formatRub(scale.max)} по {scale.count}{" "}
        размещениям. Норма — ±{Math.round(VERDICT_BAND * 100)}% от медианы.
      </figcaption>
    </figure>
  );
}
