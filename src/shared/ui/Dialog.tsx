import { useEffect, useRef, useState, type MouseEvent, type ReactNode, type SyntheticEvent } from "react";
import styles from "./Dialog.module.css";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  variant: "side" | "center";
  children: ReactNode;
}

const EXIT_FALLBACK_MS = 360;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Dialog({ open, onClose, labelledBy, variant, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !mounted) return;
    if (open) {
      if (!dialog.open) {
        dialog.showModal();
        dialog.getBoundingClientRect();
        dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true });
      }
      dialog.dataset.state = "open";
      return;
    }
    dialog.dataset.state = "closing";
    const finish = () => {
      if (dialog.dataset.state !== "closing") return;
      dialog.close();
      setMounted(false);
    };
    if (prefersReducedMotion()) {
      finish();
      return;
    }
    const onEnd = (event: TransitionEvent) => {
      if (event.target === dialog && event.propertyName === "transform") finish();
    };
    dialog.addEventListener("transitionend", onEnd);
    const timer = window.setTimeout(finish, EXIT_FALLBACK_MS);
    return () => {
      dialog.removeEventListener("transitionend", onEnd);
      window.clearTimeout(timer);
    };
  }, [open, mounted]);

  function onCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    onClose();
  }

  function onBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  if (!mounted) return null;
  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      data-variant={variant}
      aria-labelledby={labelledBy}
      onCancel={onCancel}
      onClick={onBackdrop}
    >
      {children}
    </dialog>
  );
}
