import { isOverdue, todayISO } from "./dates";
import { matchesTask, visibleToRawIndex, type Filters } from "./filters";
import { byOrderThenCreated, byPriority } from "./sorting";
import type { Board, Column, Task, Workspace } from "./types";

export function boards(ws: Workspace): Board[] {
  return [...ws.boards].sort((a, b) => a.order - b.order);
}

export function board(ws: Workspace, id: string | null): Board | null {
  if (!id) return null;
  return ws.boards.find((b) => b.id === id) ?? null;
}

export function columnsOf(ws: Workspace, boardId: string | null): Column[] {
  if (!boardId) return [];
  return ws.columns.filter((c) => c.boardId === boardId).sort((a, b) => a.order - b.order);
}

export function column(ws: Workspace, id: string | null): Column | null {
  if (!id) return null;
  return ws.columns.find((c) => c.id === id) ?? null;
}

export function task(ws: Workspace, id: string | null): Task | null {
  if (!id) return null;
  return ws.tasks.find((t) => t.id === id) ?? null;
}

/** Raw (unfiltered) tasks for a column, in board order. */
export function rawColumnTasks(ws: Workspace, columnId: string): Task[] {
  return ws.tasks.filter((t) => t.columnId === columnId).sort(byOrderThenCreated);
}

export function rawBacklog(ws: Workspace, boardId: string | null): Task[] {
  return ws.tasks
    .filter((t) => t.columnId === null && (!boardId || t.boardId === boardId))
    .sort(byOrderThenCreated);
}

/**
 * Tasks that share a home with `columnId`, in order.
 * A `null` column means the backlog, which is per-board — a plain
 * `columnId === x` filter would wrongly mix every board's inbox together.
 */
export function siblings(ws: Workspace, columnId: string | null, boardId: string): Task[] {
  return ws.tasks
    .filter((t) =>
      columnId === null ? t.columnId === null && t.boardId === boardId : t.columnId === columnId,
    )
    .sort(byOrderThenCreated);
}

export function allTags(ws: Workspace): string[] {
  const set = new Set<string>();
  for (const t of ws.tasks) for (const tag of t.tags) set.add(tag);
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function columnTasks(ws: Workspace, columnId: string, f: Filters): Task[] {
  return rawColumnTasks(ws, columnId).filter((t) => matchesTask(t, f));
}

export function backlogTasks(ws: Workspace, boardId: string | null, f: Filters): Task[] {
  return rawBacklog(ws, boardId).filter((t) => matchesTask(t, f));
}

/** All tasks in a board (or every board when `boardId` is null) that pass the filters. */
export function visibleTasks(ws: Workspace, boardId: string | null, f: Filters): Task[] {
  return ws.tasks.filter((t) => (boardId ? t.boardId === boardId : true)).filter((t) => matchesTask(t, f));
}

export function visibleToRaw(
  ws: Workspace,
  f: Filters,
  columnId: string | null,
  visibleIndex: number,
  boardId: string,
): number {
  const raw = columnId === null ? rawBacklog(ws, boardId) : rawColumnTasks(ws, columnId);
  return visibleToRawIndex(raw, f, visibleIndex);
}

export function dueOn(ws: Workspace, iso: string, boardId: string | null, f: Filters): Task[] {
  return visibleTasks(ws, boardId, f)
    .filter((t) => t.due === iso)
    .sort(byPriority);
}

export function overdueTasks(ws: Workspace, boardId: string | null, f: Filters): Task[] {
  const today = todayISO();
  return visibleTasks(ws, boardId, f)
    .filter((t) => t.due !== null && t.due < today && !t.completedAt)
    .sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""));
}

export interface Stats {
  total: number;
  open: number;
  done: number;
  backlog: number;
  overdue: number;
  dueToday: number;
  completedSubtasks: number;
  subtasks: number;
}

export function stats(ws: Workspace, boardId: string | null): Stats {
  const tasks = ws.tasks.filter((t) => (boardId ? t.boardId === boardId : true));
  const open = tasks.filter((t) => !t.completedAt);
  return {
    total: tasks.length,
    open: open.length,
    done: tasks.length - open.length,
    backlog: tasks.filter((t) => t.columnId === null && !t.completedAt).length,
    overdue: open.filter((t) => t.due !== null && isOverdue(t.due)).length,
    dueToday: open.filter((t) => t.due === todayISO()).length,
    completedSubtasks: open.reduce((n, t) => n + t.subtasks.filter((s) => s.done).length, 0),
    subtasks: open.reduce((n, t) => n + t.subtasks.length, 0),
  };
}
