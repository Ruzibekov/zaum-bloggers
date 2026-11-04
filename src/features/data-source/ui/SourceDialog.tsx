import { useId, useState, type FormEvent } from "react";
import { parseSheetUrl, type SourcePreference } from "@/entities/placement";
import { Button, CloseIcon, Dialog } from "@/shared/ui";
import { DEFAULT_SHEET_URL } from "../model/source-store";
import styles from "./SourceDialog.module.css";

interface SourceDialogProps {
  open: boolean;
  current: SourcePreference;
  onClose: () => void;
  onSave: (next: SourcePreference) => void;
}

export function SourceDialog({ open, current, onClose, onSave }: SourceDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} labelledBy="source-title" variant="center">
      <SourceForm current={current} onClose={onClose} onSave={onSave} />
    </Dialog>
  );
}

function SourceForm({ current, onClose, onSave }: Omit<SourceDialogProps, "open">) {
  const [kind, setKind] = useState<SourcePreference["kind"]>(current.kind);
  const [url, setUrl] = useState(current.kind === "sheet" ? current.url : DEFAULT_SHEET_URL);
  const [touched, setTouched] = useState(false);
  const urlId = useId();
  const errorId = useId();
  const invalid = kind === "sheet" && !parseSheetUrl(url);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (invalid) return;
    onSave(kind === "file" ? { kind: "file" } : { kind: "sheet", url: url.trim() });
    onClose();
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <header className={styles.head}>
        <div tabIndex={-1} data-autofocus="" className={styles.titleBlock}>
          <h2 id="source-title" className={styles.title}>
            Источник данных
          </h2>
          <p className={styles.lead}>Сервис только читает таблицу и ничего в неё не записывает.</p>
        </div>
        <Button variant="icon" aria-label="Закрыть" onClick={onClose}>
          <CloseIcon />
        </Button>
      </header>
      <fieldset className={styles.options}>
        <legend className="visually-hidden">Откуда брать данные</legend>
        <label className={styles.option} data-checked={kind === "sheet" ? "" : undefined}>
          <input type="radio" name="source" value="sheet" checked={kind === "sheet"} onChange={() => setKind("sheet")} />
          <span className={styles.optionText}>
            <span className={styles.optionTitle}>Google Таблица</span>
            <span className={styles.optionHint}>
              Свежие данные при каждом открытии. Таблица должна быть открыта по ссылке для чтения.
            </span>
          </span>
        </label>
        {kind === "sheet" ? (
          <div className={styles.field}>
            <label htmlFor={urlId} className={styles.fieldLabel}>
              Ссылка на вашу копию таблицы
            </label>
            <input
              id={urlId}
              className={styles.input}
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              value={url}
              aria-invalid={touched && invalid ? true : undefined}
              aria-describedby={touched && invalid ? errorId : undefined}
              onChange={(event) => setUrl(event.target.value)}
              onBlur={() => setTouched(true)}
            />
            {touched && invalid ? (
              <p id={errorId} className={styles.error}>
                Нужна ссылка вида docs.google.com/spreadsheets/d/…
              </p>
            ) : null}
            {url.trim() !== DEFAULT_SHEET_URL ? (
              <button type="button" className={styles.linkButton} onClick={() => setUrl(DEFAULT_SHEET_URL)}>
                Вернуть демо-таблицу ZAUM
              </button>
            ) : null}
          </div>
        ) : null}
        <label className={styles.option} data-checked={kind === "file" ? "" : undefined}>
          <input type="radio" name="source" value="file" checked={kind === "file"} onChange={() => setKind("file")} />
          <span className={styles.optionText}>
            <span className={styles.optionTitle}>Снимок data.json</span>
            <span className={styles.optionHint}>Выгрузка из .xlsx, лежит рядом с сервисом. Работает без интернета.</span>
          </span>
        </label>
      </fieldset>
      <footer className={styles.actions}>
        <Button variant="quiet" onClick={onClose}>
          Отмена
        </Button>
        <Button type="submit">Применить</Button>
      </footer>
    </form>
  );
}
