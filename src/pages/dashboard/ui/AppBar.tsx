import { Button, RefreshIcon, SearchIcon, SheetIcon } from "@/shared/ui";
import styles from "./DashboardPage.module.css";

interface AppBarProps {
  homeHref: string;
  sourceName: string;
  sourceWhen: string;
  sourceHint: string;
  refreshing: boolean;
  onSource: () => void;
  onRefresh: () => void;
  onSearch?: () => void;
}

export function AppBar({ homeHref, sourceName, sourceWhen, sourceHint, refreshing, onSource, onRefresh, onSearch }: AppBarProps) {
  return (
    <header className={styles.appbar}>
      <div className={styles.appbarInner}>
        <a className={styles.brand} href={homeHref}>
          <span className={styles.logo}>ZAUM</span>
          <span className={styles.brandText}>Блогеры</span>
        </a>
        <span className={styles.demo} title="Данные в таблице вымышлены">
          Демо-данные
        </span>
        <span className={styles.spacer} />
        {onSearch ? (
          <Button variant="icon" aria-label="Найти блогера" onClick={onSearch}>
            <SearchIcon />
          </Button>
        ) : null}
        <button type="button" className={styles.source} onClick={onSource}>
          <SheetIcon className={styles.sourceIcon} />
          <span className={styles.sourceName}>{sourceName}</span>
          <span className={styles.sourceTime}>{sourceWhen}</span>
          <span className="visually-hidden">{` — ${sourceHint}`}</span>
        </button>
        <Button
          variant="icon"
          className={styles.refresh}
          data-busy={refreshing ? "" : undefined}
          aria-label={refreshing ? "Обновляем данные" : "Обновить данные"}
          aria-busy={refreshing}
          disabled={refreshing}
          onClick={onRefresh}
        >
          <RefreshIcon />
        </Button>
      </div>
    </header>
  );
}
