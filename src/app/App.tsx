import { useDataset } from "@/entities/placement";
import { useSourcePreference } from "@/features/data-source";
import { DashboardPage } from "@/pages/dashboard";
import { Button, Skeleton, StateBlock } from "@/shared/ui";
import styles from "./App.module.css";

function LoadingView() {
  return (
    <div className={styles.loading} aria-busy="true" aria-label="Загружаем данные">
      <Skeleton height={18} width={160} radius={6} />
      <Skeleton height={56} width="min(560px, 100%)" radius={12} />
      <Skeleton height={20} width={260} radius={6} />
      <Skeleton height={190} radius={20} />
      <div className={styles.loadingSplit}>
        <Skeleton height={300} radius={20} />
        <Skeleton height={300} radius={20} />
      </div>
    </div>
  );
}

export function App() {
  const [source, setSource] = useSourcePreference();
  const { state, refresh } = useDataset(source);
  if (state.kind === "loading") return <LoadingView />;
  if (state.kind === "error") {
    return (
      <div className={styles.center}>
        <StateBlock title="Не получилось загрузить данные" action={<Button onClick={refresh}>Повторить</Button>}>
          {state.message}. Проверьте соединение и попробуйте ещё раз.
        </StateBlock>
      </div>
    );
  }
  return <DashboardPage state={state} source={source} onSourceChange={setSource} onRefresh={refresh} />;
}
