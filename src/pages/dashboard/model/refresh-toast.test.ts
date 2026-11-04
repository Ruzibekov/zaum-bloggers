import { describe, expect, it } from "vitest";
import { refreshToastOf } from "./refresh-toast";

const base = { loadedAt: 1, loadedTime: "21:40", refreshError: null, sheetFailed: false, snapshotDate: "4 ноября" };

describe("refreshToastOf", () => {
  it("reports success only when the sheet was actually read", () => {
    expect(refreshToastOf(base)).toMatchObject({ tone: "done", title: "Данные обновлены · 21:40" });
  });

  it("reports an error when the sheet failed and the snapshot was shown instead", () => {
    const toast = refreshToastOf({ ...base, sheetFailed: true });
    expect(toast.tone).toBe("error");
    expect(toast.title).toBe("Обновить не получилось");
    expect(toast.text).toBe("Google Таблица не ответила. На экране снимок от 4 ноября.");
  });

  it("prefers the refresh error over the fallback reason", () => {
    const toast = refreshToastOf({ ...base, refreshError: "Нет сети", sheetFailed: true });
    expect(toast.text).toContain("Нет сети");
  });
});
