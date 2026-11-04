import type { Dataset } from "../model/types";

function isDataset(value: unknown): value is Dataset {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Dataset>;
  return (
    typeof candidate.generatedAt === "string" &&
    !!candidate.source &&
    typeof candidate.source === "object" &&
    Array.isArray(candidate.placements) &&
    candidate.placements.every(
      (p) => p && typeof p === "object" && typeof p.id === "string" && typeof p.blogger === "string" && typeof p.stage === "string",
    )
  );
}

export async function loadFileDataset(signal?: AbortSignal): Promise<Dataset> {
  const response = await fetch(`${import.meta.env.BASE_URL}data.json`, { signal, cache: "no-cache" });
  if (!response.ok) throw new Error(`Не удалось загрузить data.json (HTTP ${response.status})`);
  const payload: unknown = await response.json();
  if (!isDataset(payload)) throw new Error("Файл data.json имеет неожиданный формат");
  return payload;
}
