import styles from "./Skeleton.module.css";

export function Skeleton({ height, width = "100%", radius = 12 }: { height: number; width?: number | string; radius?: number }) {
  return <span className={styles.skeleton} style={{ height, width, borderRadius: radius }} aria-hidden="true" />;
}
