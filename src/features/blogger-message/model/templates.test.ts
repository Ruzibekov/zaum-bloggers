import { describe, expect, it } from "vitest";
import type { Placement } from "@/entities/placement";
import { messageFor, situationOf } from "./templates";

const TODAY = "2026-11-04";

function placement(overrides: Partial<Placement>): Placement {
  return {
    id: "DEMO-1",
    row: 1,
    article: "DEMO-1",
    blogger: "Анна Петрова",
    platform: "Telegram",
    budget: "paid",
    budgetLabel: "Платное размещение",
    followers: 1000,
    audienceAge: null,
    audienceGeo: null,
    storiesReach: 1000,
    reelsViews: null,
    cost: 1000,
    productCost: null,
    format: "Короткое видео",
    stage: "approval",
    statusLabel: null,
    date: null,
    adUrl: null,
    comment: null,
    ...overrides,
  };
}

describe("messageFor", () => {
  it("asks for a new date when the date passed and the ad is not out", () => {
    const message = messageFor(placement({ stage: "scheduled", date: "2026-11-02" }), TODAY);
    expect(message?.situation).toBe("overdue");
    expect(message?.label).toBe("Спросить новую дату");
    expect(message?.text).toBe(
      "Здравствуйте, Анна Петрова! Пишу по нашей рекламе — короткое видео в Telegram. Мы договаривались на 2 ноября, но публикацию я пока не вижу. Подскажите, пожалуйста, на какой день её можно перенести?",
    );
  });

  it("proposes to agree on a date when there is none", () => {
    const message = messageFor(placement({ comment: "Нужна дата публикации" }), TODAY);
    expect(message?.situation).toBe("needDate");
    expect(message?.text).toBe(
      "Здравствуйте, Анна Петрова! Пишу по нашей рекламе — короткое видео в Telegram. Давайте договоримся о дате публикации: какой день Вам удобен?",
    );
  });

  it("confirms an upcoming date while the ad is still being approved", () => {
    const message = messageFor(placement({ date: "2026-11-12", platform: "YouTube", format: "Обзор" }), TODAY);
    expect(message?.situation).toBe("confirmDate");
    expect(message?.text).toContain("— обзор на YouTube.");
    expect(message?.text).toContain("Правильно понимаю, что публикация остаётся на 12 ноября?");
  });

  it("requests reach, views and a screenshot after publication", () => {
    const message = messageFor(placement({ stage: "published", date: "2026-11-01", comment: "Проверить результаты" }), TODAY);
    expect(message?.situation).toBe("results");
    expect(message?.label).toBe("Запросить статистику");
    expect(message?.text).toBe(
      "Здравствуйте, Анна Петрова! Спасибо за рекламу — короткое видео в Telegram! Пришлите, пожалуйста, статистику по публикации от 1 ноября: охват, просмотры и скриншот из статистики.",
    );
  });

  it("reminds about a scheduled publication within three days", () => {
    expect(messageFor(placement({ stage: "scheduled", date: "2026-11-05" }), TODAY)?.text).toBe(
      "Здравствуйте, Анна Петрова! Напоминаю: завтра у нас выходит реклама — короткое видео в Telegram. Если что-то поменялось, напишите, пожалуйста, заранее.",
    );
    expect(messageFor(placement({ stage: "scheduled", date: TODAY }), TODAY)?.text).toContain("Напоминаю: сегодня у нас");
    expect(messageFor(placement({ stage: "scheduled", date: "2026-11-06" }), TODAY)?.text).toContain("Напоминаю: послезавтра");
    expect(messageFor(placement({ stage: "scheduled", date: "2026-11-07" }), TODAY)?.text).toContain("Напоминаю: 7 ноября у нас");
    expect(messageFor(placement({ stage: "scheduled", date: "2026-11-08" }), TODAY)).toBeNull();
  });

  it("keeps sentences natural when format, platform or date are empty", () => {
    const bare = { format: null, platform: "  " };
    expect(messageFor(placement({ ...bare }), TODAY)?.text).toBe(
      "Здравствуйте, Анна Петрова! Пишу по нашей рекламе. Давайте договоримся о дате публикации: какой день Вам удобен?",
    );
    expect(messageFor(placement({ ...bare, stage: "published" }), TODAY)?.text).toBe(
      "Здравствуйте, Анна Петрова! Спасибо за рекламу! Пришлите, пожалуйста, статистику по публикации: охват, просмотры и скриншот из статистики.",
    );
    expect(messageFor(placement({ format: null, platform: "VK", stage: "scheduled", date: "2026-11-05" }), TODAY)?.text).toContain(
      "у нас выходит реклама в VK.",
    );
    expect(messageFor(placement({ format: "Пост", platform: null, stage: "scheduled", date: "2026-11-05" }), TODAY)?.text).toContain(
      "у нас выходит реклама — пост.",
    );
    expect(messageFor(placement({ blogger: " " }), TODAY)?.text.startsWith("Здравствуйте! Пишу")).toBe(true);
  });

  it("keeps latin abbreviations in the format as written", () => {
    expect(messageFor(placement({ format: "UGC-ролик" }), TODAY)?.text).toContain("— UGC-ролик в Telegram.");
  });

  it("returns nothing when no message is needed", () => {
    expect(situationOf(placement({ stage: "results", date: "2026-10-20" }), TODAY)).toBeNull();
    expect(situationOf(placement({ stage: "published", date: "2026-11-10" }), TODAY)).toBeNull();
    expect(situationOf(placement({ stage: "other", date: "2026-11-01" }), TODAY)).toBeNull();
    expect(situationOf(placement({ stage: "scheduled", date: "2026-11-20" }), TODAY)).toBeNull();
  });

  it("prefers the overdue date question over the comment", () => {
    expect(situationOf(placement({ date: "2026-11-02", comment: "Нужна дата публикации" }), TODAY)).toBe("overdue");
  });
});
