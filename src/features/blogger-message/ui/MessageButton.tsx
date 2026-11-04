import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Placement } from "@/entities/placement";
import { Button, CheckIcon, CloseIcon, CopyIcon, Dialog, MessageIcon, Toast, type ToastMessage } from "@/shared/ui";
import { copyToClipboard } from "../model/clipboard";
import { messageFor, type BloggerMessage } from "../model/templates";
import styles from "./MessageButton.module.css";

interface MessageButtonProps {
  placement: Placement;
  today: string;
  variant: "chip" | "panel";
}

const COPIED_MS = 2000;

export function MessageButton({ placement, today, variant }: MessageButtonProps) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const titleId = useId();
  const message = messageFor(placement, today);
  if (!message) return null;

  function show() {
    setSession((value) => value + 1);
    setOpen(true);
  }

  const label = `Сообщение блогеру: ${message.label.toLowerCase()}`;
  return (
    <>
      {variant === "chip" ? (
        <button type="button" className={styles.chipButton} aria-label={`${label}, ${placement.blogger}`} title={label} onClick={show}>
          <MessageIcon />
        </button>
      ) : (
        <Button variant="quiet" className={styles.panelButton} onClick={show} title={label}>
          <MessageIcon />
          Сообщение блогеру
        </Button>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} labelledBy={titleId} variant="center">
        <MessageSheet key={session} titleId={titleId} blogger={placement.blogger} message={message} onClose={() => setOpen(false)} />
      </Dialog>
    </>
  );
}

interface MessageSheetProps {
  titleId: string;
  blogger: string;
  message: BloggerMessage;
  onClose: () => void;
}

function MessageSheet({ titleId, blogger, message, onClose }: MessageSheetProps) {
  const [text, setText] = useState(message.text);
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const fieldId = useId();
  const noteId = useId();
  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), COPIED_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy() {
    const ok = await copyToClipboard(text);
    if (ok) {
      setFailed(false);
      setCopied(true);
      setToast({ id: Date.now(), tone: "done", title: "Текст скопирован", text: "Вставьте его в чат с блогером" });
      return;
    }
    setFailed(true);
    setCopied(false);
    const field = fieldRef.current;
    if (field) {
      field.focus();
      field.select();
    }
    setToast({ id: Date.now(), tone: "error", title: "Скопировать не получилось", text: "Текст выделен, скопируйте его вручную" });
  }

  return (
    <div className={styles.sheet}>
      <header className={styles.head}>
        <div className={styles.titleBlock}>
          <h2 id={titleId} className={styles.title}>
            Сообщение блогеру
          </h2>
          <p className={styles.lead}>
            {blogger} · {message.label}
          </p>
        </div>
        <Button variant="icon" aria-label="Закрыть" onClick={onClose}>
          <CloseIcon />
        </Button>
      </header>
      <div className={styles.field}>
        <label htmlFor={fieldId} className={styles.fieldLabel}>
          Текст, можно поправить перед отправкой
        </label>
        <textarea
          ref={fieldRef}
          id={fieldId}
          className={styles.text}
          value={text}
          rows={5}
          spellCheck
          aria-describedby={failed ? noteId : undefined}
          onChange={(event) => {
            setText(event.target.value);
            setCopied(false);
          }}
        />
        {failed ? (
          <p id={noteId} className={styles.note} role="alert">
            Браузер не дал доступ к буферу обмена. Текст выделен: нажмите Ctrl+C (на Mac ⌘C) или скопируйте через меню.
          </p>
        ) : null}
      </div>
      <footer className={styles.actions}>
        <Button variant="quiet" onClick={onClose}>
          Закрыть
        </Button>
        <Button className={styles.copy} onClick={copy} data-autofocus="" disabled={text.trim() === ""}>
          <span className={styles.copyIcon} data-copied={copied ? "" : undefined} aria-hidden="true">
            <CopyIcon />
            <CheckIcon />
          </span>
          {copied ? "Скопировано" : "Скопировать текст"}
        </Button>
      </footer>
      <Toast message={toast} onDismiss={dismissToast} placement="sheet" />
    </div>
  );
}
