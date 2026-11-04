import type { ToastMessage } from "@/shared/ui";

export interface RefreshOutcome {
  loadedAt: number;
  loadedTime: string;
  refreshError: string | null;
  sheetFailed: boolean;
  snapshotDate: string;
}

export function refreshToastOf(outcome: RefreshOutcome): ToastMessage {
  const { loadedAt, loadedTime, refreshError, sheetFailed, snapshotDate } = outcome;
  if (refreshError) {
    return { id: loadedAt, tone: "error", title: "Обновить не получилось", text: `${refreshError}. На экране данные с прошлой загрузки.` };
  }
  if (sheetFailed) {
    return { id: loadedAt, tone: "error", title: "Обновить не получилось", text: `Google Таблица не ответила. На экране снимок от ${snapshotDate}.` };
  }
  return { id: loadedAt, tone: "done", title: `Данные обновлены · ${loadedTime}` };
}
