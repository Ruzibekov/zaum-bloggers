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
  published: "Вышло",
  results: "Итоги есть",
  other: "Без статуса",
};

export const STAGE_HINT: Record<Stage, string> = {
  approval: "Договариваемся об условиях и дате",
  scheduled: "Дата согласована, ждём выхода",
  published: "Реклама вышла, ждём статистику",
  results: "Статистика собрана",
  other: "Статус не распознан",
};

export function stageIndex(stage: Stage): number {
  return stage === "other" ? -1 : PIPELINE.indexOf(stage);
}

export function isBeforePublication(stage: Stage): boolean {
  return stage === "approval" || stage === "scheduled";
}
