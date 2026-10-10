import { isOverdue, todayISO } from "./dates";
import type { Priority, Task } from "./types";

export interface Filters {
  /** Free-text search across title, notes and tags. */
  query: string;
  tags: string[];
  priorities: Priority[];
  due: "any" | "overdue" | "today" | "week" | "none";
  hideCompleted: boolean;
}

/** True when a filter would hide at least one task, so the UI can show a "filtered" chip. */
export function emptyFilters(): Filters {
  return {
    query: "",
    tags: [],
    priorities: [],
    due: "any",
    hideCompleted: true,
  };
}

export function filterActive(f: Filters): boolean {
  return (
    f.tags.length > 0 ||
    f.priorities.length > 0 ||
    f.due !== "any" ||
    f.query.trim().length > 0
  );
}

/** Text search + tag/priority/due filters, shared by board, backlog and calendar. */
export function matchesTask(task: Task, f: Filters, today: string = todayISO()): boolean {
  const q = f.query.trim().toLowerCase();
  if (q) {
    const hay = `${task.title} ${task.notes} ${task.tags.join(" ")}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (f.tags.length && !f.tags.every((tag) => task.tags.includes(tag))) return false;
  if (f.priorities.length && !f.priorities.includes(task.priority)) return false;

  switch (f.due) {
    case "none":
      if (task.due !== null) return false;
      break;
    case "overdue":
      if (!task.due || !isOverdue(task.due) || task.completedAt) return false;
      break;
    case "today":
      if (task.due !== today || task.completedAt) return false;
      break;
    case "week": {
      if (!task.due || task.completedAt) return false;
      const span = (new Date(task.due).getTime() - new Date(today).getTime()) / 86_400_000;
      if (span < 0 || span > 7) return false;
      break;
    }
  }
  if (f.hideCompleted && task.completedAt) return false;
  return true;
}

/**
 * Translate a drop slot in the *filtered* list into an index in the raw list.
 * Without this, dragging while a filter is active would drop the card at the
 * wrong position because hidden siblings occupy raw slots.
 */
export function visibleToRawIndex(raw: Task[], f: Filters, visibleIndex: number): number {
  const visible = raw.filter((t) => matchesTask(t, f));
  const next = visible[visibleIndex];
  if (!next) return raw.length;
  return raw.findIndex((t) => t.id === next.id);
}
