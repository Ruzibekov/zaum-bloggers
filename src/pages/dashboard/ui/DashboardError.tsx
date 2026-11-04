import { useState } from "react";
import { isDemoSheet, type SourcePreference } from "@/entities/placement";
import { SourceDialog } from "@/features/data-source";
import { Button, StateBlock } from "@/shared/ui";
import { AppBar } from "./AppBar";
import styles from "./DashboardPage.module.css";

interface DashboardErrorProps {
  message: string;
  source: SourcePreference;
  onSourceChange: (next: SourcePreference) => void;
  onRefresh: () => void;
}

export function DashboardError({ message, source, onSourceChange, onRefresh }: DashboardErrorProps) {
  const [sourceOpen, setSourceOpen] = useState(false);
  const sheet = source.kind === "sheet";
  return (
    <>
      <AppBar
        homeHref="#"
        demo={!sheet || isDemoSheet(source.url)}
        sourceName={sheet ? "Google Таблица" : "Снимок таблицы"}
        sourceWhen="не загружено"
        sourceHint="данные не загружены, настроить источник"
        refreshing={false}
        onSource={() => setSourceOpen(true)}
        onRefresh={onRefresh}
      />
      <main className={styles.errorMain}>
        <StateBlock
          title="Не получилось загрузить данные"
          action={
            <>
              <Button onClick={onRefresh}>Повторить</Button>
              {sheet ? (
                <Button variant="outline" onClick={() => onSourceChange({ kind: "file" })}>
                  Открыть сохранённый снимок
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setSourceOpen(true)}>
                  Выбрать источник
                </Button>
              )}
            </>
          }
        >
          {message}. Проверьте соединение и попробуйте ещё раз.
        </StateBlock>
      </main>
      <SourceDialog open={sourceOpen} current={source} onClose={() => setSourceOpen(false)} onSave={onSourceChange} />
    </>
  );
}
