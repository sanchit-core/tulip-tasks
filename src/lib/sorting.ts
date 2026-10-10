import type { Priority, Task } from "./types";

/** Lower rank = more important. Used for stable, urgency-first ordering. */
export const PRIORITY_RANK: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Board/column order first, then creation time so equal orders stay stable. */
export function byOrderThenCreated(a: Task, b: Task): number {
  return a.order - b.order || a.createdAt.localeCompare(b.createdAt);
}

export function byPriority(a: Task, b: Task): number {
  return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
}
