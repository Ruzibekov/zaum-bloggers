import { flagsOf, type Placement } from "@/entities/placement";
import { daysBetween } from "@/shared/lib/dates";
import { formatDate } from "@/shared/lib/format";

export type MessageSituation = "overdue" | "needDate" | "confirmDate" | "results" | "reminder";

export interface BloggerMessage {
  situation: MessageSituation;
  label: string;
  text: string;
}

export const REMINDER_DAYS = 3;

export const SITUATION_LABEL: Record<MessageSituation, string> = {
  overdue: "Спросить новую дату",
  needDate: "Договориться о дате",
  confirmDate: "Подтвердить дату",
  results: "Запросить статистику",
  reminder: "Напомнить о публикации",
};

function clean(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function lowerFirst(value: string): string {
  const second = value.charAt(1);
  if (second && second === second.toUpperCase()) return value;
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function platformPhrase(platform: string): string {
  return /^(youtube|rutube|ютуб)/i.test(platform) ? `на ${platform}` : `в ${platform}`;
}

function aboutAd(p: Placement): string {
  const format = clean(p.format);
  const platform = clean(p.platform);
  if (format && platform) return ` — ${lowerFirst(format)} ${platformPhrase(platform)}`;
  if (format) return ` — ${lowerFirst(format)}`;
  if (platform) return ` ${platformPhrase(platform)}`;
  return "";
}

function plainDate(date: string): string {
  return formatDate(date).replace(/\u00a0/g, " ");
}

function greeting(p: Placement): string {
  const name = clean(p.blogger);
  return name ? `Здравствуйте, ${name}!` : "Здравствуйте!";
}

function whenSoon(date: string, today: string): string {
  const diff = daysBetween(today, date);
  if (diff === 0) return "сегодня";
  if (diff === 1) return "завтра";
  if (diff === 2) return "послезавтра";
  return plainDate(date);
}

export function situationOf(p: Placement, today: string): MessageSituation | null {
  const flags = flagsOf(p, today);
  if (flags.includes("overdue")) return "overdue";
  if (flags.includes("noDate")) return "needDate";
  if (p.stage === "published") return p.date === null || p.date <= today ? "results" : null;
  if (p.stage === "approval" && p.date !== null && p.date >= today) return "confirmDate";
  if (p.stage === "scheduled" && p.date !== null) {
    const diff = daysBetween(today, p.date);
    if (diff !== null && diff >= 0 && diff <= REMINDER_DAYS) return "reminder";
  }
  return null;
}

function textFor(situation: MessageSituation, p: Placement, today: string): string {
  const hello = greeting(p);
  const about = aboutAd(p);
  const date = p.date;
  switch (situation) {
    case "overdue":
      return [
        hello,
        `Пишу по нашей рекламе${about}.`,
        date ? `Мы договаривались на ${plainDate(date)}, но публикацию я пока не вижу.` : "Публикацию я пока не вижу.",
        "Подскажите, пожалуйста, на какой день её можно перенести?",
      ].join(" ");
    case "needDate":
      return [hello, `Пишу по нашей рекламе${about}.`, "Давайте договоримся о дате публикации: какой день Вам удобен?"].join(" ");
    case "confirmDate":
      return [
        hello,
        `Пишу по нашей рекламе${about}.`,
        date ? `Правильно понимаю, что публикация остаётся на ${plainDate(date)}?` : "Подскажите, пожалуйста, дата публикации в силе?",
        "Если дата сдвигается, напишите, пожалуйста, я поправлю у себя.",
      ].join(" ");
    case "results":
      return [
        hello,
        `Спасибо за рекламу${about}!`,
        `Пришлите, пожалуйста, статистику по публикации${date ? ` от ${plainDate(date)}` : ""}: охват, просмотры и скриншот из статистики.`,
      ].join(" ");
    case "reminder":
      return [
        hello,
        date ? `Напоминаю: ${whenSoon(date, today)} у нас выходит реклама${about}.` : `Напоминаю про нашу рекламу${about}.`,
        "Если что-то поменялось, напишите, пожалуйста, заранее.",
      ].join(" ");
  }
}

export function messageFor(p: Placement, today: string): BloggerMessage | null {
  const situation = situationOf(p, today);
  if (!situation) return null;
  return { situation, label: SITUATION_LABEL[situation], text: textFor(situation, p, today) };
}
