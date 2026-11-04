import { useEffect, useState } from "react";
import styles from "./Toast.module.css";

export interface ToastMessage {
  id: number;
  title: string;
  text?: string;
  tone: "done" | "error";
}

const VISIBLE_MS = 4200;

export function Toast({ message, onDismiss }: { message: ToastMessage | null; onDismiss: () => void }) {
  const [shown, setShown] = useState(message);
  if (message && message !== shown) setShown(message);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDismiss, VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div className={styles.region} role="status" aria-live="polite">
      {shown ? (
        <div className={styles.toast} data-open={message ? "" : undefined} data-tone={shown.tone}>
          <span className={styles.mark} aria-hidden="true" />
          <p className={styles.body}>
            <strong>{shown.title}</strong>
            {shown.text ? <span className={styles.text}>{shown.text}</span> : null}
          </p>
        </div>
      ) : null}
    </div>
  );
}
