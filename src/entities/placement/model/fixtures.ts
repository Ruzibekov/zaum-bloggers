import type { Placement } from "./types";

let counter = 0;

export function makePlacement(overrides: Partial<Placement> = {}): Placement {
  counter += 1;
  return {
    id: `T-${counter}`,
    row: counter,
    article: `T-${counter}`,
    blogger: `Тест ${counter}`,
    platform: "Telegram",
    budget: "paid",
    budgetLabel: "Платное размещение",
    followers: 10_000,
    audienceAge: "25–34",
    audienceGeo: "РФ 70%",
    storiesReach: 2_000,
    reelsViews: 6_000,
    cost: 4_000,
    productCost: 500,
    format: "Пост",
    stage: "scheduled",
    statusLabel: "Запланировано",
    date: "2026-11-10",
    adUrl: null,
    comment: null,
    ...overrides,
  };
}
