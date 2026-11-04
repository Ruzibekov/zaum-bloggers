import type { Stage } from "../model/types";
import styles from "./tags.module.css";

export function StageDot({ stage }: { stage: Stage }) {
  return <span className={styles.dot} data-stage={stage} aria-hidden="true" />;
}
