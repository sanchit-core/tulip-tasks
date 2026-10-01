import type { Recurrence, RecurrenceKind } from "./types";
import { addDays, addMonths, addYears, todayISO } from "./dates";

export const RECURRENCE_KINDS: RecurrenceKind[] = ["daily", "weekly", "monthly", "yearly"];

export const RECURRENCE_LABEL: Record<RecurrenceKind, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export function describeRecurrence(r: Recurrence): string {
  if (r.kind === "none") return "Never";
  const n = Math.max(1, Math.floor(r.interval || 1));
  const unit = r.kind === "daily" ? "day" : r.kind === "weekly" ? "week" : r.kind === "monthly" ? "month" : "year";
  if (n === 1) return `Every ${unit}`;
  return `Every ${n} ${unit}s`;
}

/** Short form for cards: "↻ 2w". */
export function recurrenceBadge(r: Recurrence): string | null {
  if (r.kind === "none") return null;
  const n = Math.max(1, Math.floor(r.interval || 1));
  const suffix = r.kind === "daily" ? "d" : r.kind === "weekly" ? "w" : r.kind === "monthly" ? "mo" : "y";
  return n === 1 ? `↻ ${suffix}` : `↻ ${n}${suffix}`;
}

/** The date the next instance should land on, given the date just completed. */
export function nextDate(r: Recurrence, from: string): string | null {
  const n = Math.max(1, Math.floor(r.interval || 1));
  switch (r.kind) {
    case "daily":
      return addDays(from, n);
    case "weekly":
      return addDays(from, n * 7);
    case "monthly":
      return addMonths(from, n);
    case "yearly":
      return addYears(from, n);
    default:
      return null;
  }
}

/**
 * The due date a *newly spawned* occurrence should carry: step forward from the
 * completed date until it is today or later, so a task you let lapse for a month
 * does not spawn a backlog of 30 past-due clones.
 */
export function nextOccurrenceDue(r: Recurrence, from: string): string {
  let cursor = nextDate(r, from) ?? from;
  let guard = 0;
  while (cursor < todayISO() && guard++ < 500) {
    cursor = nextDate(r, cursor) ?? cursor;
  }
  return cursor;
}
