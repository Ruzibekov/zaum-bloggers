import { useDataset } from "@/entities/placement";
import { useSourcePreference } from "@/features/data-source";
import { DashboardError, DashboardPage } from "@/pages/dashboard";
import { Skeleton } from "@/shared/ui";
import styles from "./App.module.css";

const SKELETON_BEADS = Array.from({ length: 24 }, (_, index) => `skeleton-bead-${index}`);

function LoadingView() {
  return (
    <div className={styles.loading} aria-busy="true" aria-label="Загружаем данные">
      <Skeleton height={18} width={160} radius={8} />
      <div className={styles.loadingTitle}>
        <Skeleton height={52} width="min(620px, 100%)" radius={12} />
        <Skeleton height={52} width="min(520px, 90%)" radius={12} />
      </div>
      <Skeleton height={22} width="min(420px, 80%)" radius={8} />
      <div className={styles.loadingBeads}>
        {SKELETON_BEADS.map((id) => (
          <span key={id} className={styles.loadingBead} />
        ))}
      </div>
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
    return <DashboardError message={state.message} source={source} onSourceChange={setSource} onRefresh={refresh} />;
  }
  return <DashboardPage state={state} source={source} onSourceChange={setSource} onRefresh={refresh} />;
}
