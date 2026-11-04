const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

function toUtc(iso: string): number | null {
  const match = ISO.exec(iso);
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function localIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, days: number): string {
  const base = toUtc(iso);
  if (base === null) return iso;
  return new Date(base + days * 86_400_000).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number | null {
  const a = toUtc(from);
  const b = toUtc(to);
  if (a === null || b === null) return null;
  return Math.round((b - a) / 86_400_000);
}

export function weekdayIndex(iso: string): number | null {
  const base = toUtc(iso);
  if (base === null) return null;
  return (new Date(base).getUTCDay() + 6) % 7;
}

export function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

export function monthGrid(month: string): string[][] {
  const first = `${month}-01`;
  const offset = weekdayIndex(first) ?? 0;
  const start = addDays(first, -offset);
  const weeks: string[][] = [];
  let cursor = start;
  do {
    const week: string[] = [];
    for (let i = 0; i < 7; i += 1) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  } while (monthOf(cursor) === month);
  return weeks;
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const index = (y ?? 0) * 12 + ((m ?? 1) - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}
