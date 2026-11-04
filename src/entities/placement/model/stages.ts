import type { Stage } from "./types";

export const PIPELINE: readonly Exclude<Stage, "other">[] = ["approval", "scheduled", "published", "results"];

export const STAGE_LABEL: Record<Stage, string> = {
  approval: "Согласование",
  scheduled: "Запланировано",
  published: "Опубликовано",
  results: "Результаты получены",
  other: "Без статуса",
};

export const STAGE_SHORT: Record<Stage, string> = {
  approval: "Согласование",
  scheduled: "Запланировано",
  published: "Опубликовано",
  results: "Результаты получены",
  other: "Без статуса",
};

export const STAGE_HINT: Record<Stage, string> = {
  approval: "договариваемся",
  scheduled: "ждём выхода",
  published: "ждём статистику",
  results: "статистика собрана",
  other: "статус не распознан",
};

export function stageIndex(stage: Stage): number {
  return stage === "other" ? -1 : PIPELINE.indexOf(stage);
}

export function isBeforePublication(stage: Stage): boolean {
  return stage === "approval" || stage === "scheduled";
}
