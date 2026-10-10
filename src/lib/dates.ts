const MS_DAY = 86_400_000;

export const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const WEEKDAYS_MIN = ["M", "T", "W", "T", "F", "S", "S"] as const;
export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** `yyyy-mm-dd` for a Date, using *local* time (never toISOString, which shifts to UTC). */
export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISO(new Date());
}

/** Parse `yyyy-mm-dd` into a local-midnight Date. Returns null on garbage input. */
export function fromISO(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  // Reject overflow like 2026-02-31 which JS would roll over into March.
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
}

export function addDays(iso: string, n: number): string {
  const d = fromISO(iso);
  if (!d) return iso;
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function addMonths(iso: string, n: number): string {
  const d = fromISO(iso);
  if (!d) return iso;
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  // Clamp to the last valid day (Jan 31 + 1mo => Feb 28, not Mar 3).
  d.setDate(Math.min(day, daysInMonth(d.getFullYear(), d.getMonth())));
  return toISO(d);
}

export function addYears(iso: string, n: number): string {
  const d = fromISO(iso);
  if (!d) return iso;
  const day = d.getDate();
  const month = d.getMonth();
  d.setFullYear(d.getFullYear() + n);
  if (d.getMonth() !== month) d.setDate(0); // Feb 29 -> Feb 28
  return toISO(d);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Whole days from today to `iso`. Negative = in the past. */
export function daysUntil(iso: string): number {
  const t = fromISO(todayISO());
  const d = fromISO(iso);
  if (!t || !d) return 0;
  return Math.round((d.getTime() - t.getTime()) / MS_DAY);
}

export function isOverdue(iso: string): boolean {
  return daysUntil(iso) < 0;
}

export function isToday(iso: string): boolean {
  return iso === todayISO();
}

/** 0 = Monday. */
export function startOfWeek(d: Date): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const shift = (out.getDay() + 6) % 7;
  out.setDate(out.getDate() - shift);
  return out;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function addMonthsDate(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

/** A month grid padded to whole Monday-start weeks. Always 6 rows for a stable layout. */
export function monthGrid(anchor: Date): Date[] {
  const first = startOfMonth(anchor);
  const start = startOfWeek(first);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }
  return cells;
}

/** A week grid starting from the Monday of `anchor`'s week. */
export function weekGrid(anchor: Date): Date[] {
  const start = startOfWeek(anchor);
  const cells: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }
  return cells;
}

/** "12 Mar", "12 Mar 2027" when the year differs from today. */
export function formatDate(iso: string): string {
  const d = fromISO(iso);
  if (!d) return iso;
  const now = new Date();
  const base = `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
  return d.getFullYear() === now.getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

export function formatLongDate(iso: string): string {
  const d = fromISO(iso);
  if (!d) return iso;
  return `${WEEKDAYS_SHORT[(d.getDay() + 6) % 7]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Today", "Tomorrow", "3d overdue", "in 4d", "12 Mar". */
export function dueLabel(iso: string): string {
  const n = daysUntil(iso);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "1d overdue";
  if (n < 0) return `${Math.abs(n)}d overdue`;
  if (n <= 6) return `in ${n}d`;
  return formatDate(iso);
}

/** True when the date falls inside the currently visible month grid / week. */
export function sameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
