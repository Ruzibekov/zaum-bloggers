const intFormat = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });
const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
const MONTHS_GENITIVE = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const MONTHS_NOMINATIVE = [
  "январь", "февраль", "март", "апрель", "май", "июнь",
  "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
];

export const DASH = "—";

function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function formatInt(value: number | null | undefined): string {
  return finite(value) ? intFormat.format(Math.round(value)) : DASH;
}

export function formatRub(value: number | null | undefined): string {
  return finite(value) ? `${intFormat.format(Math.round(value))}\u00a0₽` : DASH;
}

export function formatCompact(value: number | null | undefined): string {
  if (!finite(value)) return DASH;
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${oneDecimal.format(value / 1_000_000)}\u00a0млн`;
  if (abs >= 10_000) return `${intFormat.format(value / 1_000)}\u00a0тыс.`;
  if (abs >= 1_000) return `${oneDecimal.format(value / 1_000)}\u00a0тыс.`;
  return intFormat.format(Math.round(value));
}

export function formatCompactRub(value: number | null | undefined): string {
  const compact = formatCompact(value);
  return compact === DASH ? DASH : `${compact}\u00a0₽`;
}

function monthParts(month: string): { year: number; index: number } | null {
  const match = /^(\d{4})-(\d{2})/.exec(month);
  if (!match) return null;
  const index = Number(match[2]) - 1;
  if (index < 0 || index > 11) return null;
  return { year: Number(match[1]), index };
}

export function formatMonthLong(month: string): string {
  const parts = monthParts(month);
  if (!parts) return month;
  const name = MONTHS_NOMINATIVE[parts.index] ?? "";
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${parts.year}`;
}

export function formatDate(date: string | null | undefined, withYear = false): string {
  if (!date) return DASH;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!match) return DASH;
  const index = Number(match[2]) - 1;
  const day = Number(match[3]);
  const base = `${day}\u00a0${MONTHS_GENITIVE[index] ?? ""}`;
  return withYear ? `${base} ${match[1]}` : base;
}

export function formatShortDate(date: string | null | undefined, currentYear: number): string {
  if (!date) return DASH;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!match) return DASH;
  const short = MONTHS_SHORT[Number(match[2]) - 1] ?? "";
  const year = Number(match[1]);
  return year === currentYear ? `${Number(match[3])}\u00a0${short}` : `${Number(match[3])}\u00a0${short} ${String(year).slice(2)}`;
}

export function pluralRu(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

const WEEKDAYS_SHORT = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
const WEEKDAYS_LONG = ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"];

function weekday(date: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;
  return (new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))).getUTCDay() + 6) % 7;
}

export function formatWeekdayShort(date: string): string {
  const index = weekday(date);
  return index === null ? DASH : (WEEKDAYS_SHORT[index] ?? DASH);
}

export function formatLongDay(date: string): string {
  const index = weekday(date);
  if (index === null) return DASH;
  const name = WEEKDAYS_LONG[index] ?? "";
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}, ${formatDate(date)}`;
}

export function formatRelativeDay(date: string | null, today: string): string {
  if (!date) return "Дата не назначена";
  const a = Date.parse(`${date}T00:00:00Z`);
  const b = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return DASH;
  const diff = Math.round((a - b) / 86_400_000);
  if (diff === 0) return "Сегодня";
  if (diff === 1) return "Завтра";
  if (diff === -1) return "Вчера";
  return `${formatWeekdayShort(date).replace(/^./, (c) => c.toUpperCase())}, ${formatDate(date)}`;
}

export function formatDayHeading(date: string, today: string): string {
  const full = `${formatWeekdayShort(date).replace(/^./, (c) => c.toUpperCase())}, ${formatDate(date)}`;
  const relative = formatRelativeDay(date, today);
  return relative === full || relative === DASH ? full : `${full} · ${relative.toLowerCase()}`;
}

export function formatSignedPercent(value: number | null | undefined): string {
  if (!finite(value)) return DASH;
  const rounded = Math.round(value * 100);
  if (rounded === 0) return "0%";
  return `${rounded > 0 ? "+" : "−"}${Math.abs(rounded)}%`;
}
