import { STAGE_LABEL, STAGE_SHORT } from "../model/stages";
import type { Stage } from "../model/types";
import styles from "./tags.module.css";

export function StageBadge({ stage, label, short = false }: { stage: Stage; label?: string | null; short?: boolean }) {
  const text = stage === "other" ? (label ?? STAGE_LABEL.other) : short ? STAGE_SHORT[stage] : STAGE_LABEL[stage];
  return (
    <span className={styles.stage} data-stage={stage} title={short ? STAGE_LABEL[stage] : undefined}>
      <span className={styles.dot} data-stage={stage} aria-hidden="true" />
      {text}
    </span>
  );
}
