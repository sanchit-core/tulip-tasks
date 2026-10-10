import { uid } from "./ids";
import { nextOccurrenceDue } from "./recurrence";
import {
  board,
  column,
  columnsOf,
  rawBacklog,
  rawColumnTasks,
  siblings,
  task,
} from "./selectors";
import { clamp } from "./sorting";
import type { Board, Column, Priority, Recurrence, Settings, Task, Workspace } from "./types";
import { DEFAULT_COLUMNS, nowISO } from "./workspace";

// ---- boards -----------------------------------------------------------

export function addBoard(ws: Workspace, title: string, color = "#ff4d6d"): Board {
  const created: Board = {
    id: uid("bd"),
    title: title.trim() || "New board",
    color,
    order: ws.boards.length,
    createdAt: nowISO(),
  };
  ws.boards.push(created);
  DEFAULT_COLUMNS.forEach((name, i) => {
    ws.columns.push({
      id: uid("cl"),
      boardId: created.id,
      title: name,
      order: i,
      wipLimit: null,
      done: name === "Done",
    });
  });
  return created;
}

export function renameBoard(ws: Workspace, id: string, title: string): void {
  const b = board(ws, id);
  if (!b) return;
  b.title = title.trim() || b.title;
}

export function recolorBoard(ws: Workspace, id: string, color: string): void {
  const b = board(ws, id);
  if (!b) return;
  b.color = color;
}

/** Deletes the board and everything on it. */
export function deleteBoard(ws: Workspace, id: string): void {
  ws.boards = ws.boards.filter((b) => b.id !== id);
  ws.columns = ws.columns.filter((c) => c.boardId !== id);
  ws.tasks = ws.tasks.filter((t) => t.boardId !== id);
}

export function moveBoard(ws: Workspace, id: string, dir: -1 | 1): void {
  const list = [...ws.boards].sort((a, b) => a.order - b.order);
  const i = list.findIndex((b) => b.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  list.forEach((b, idx) => {
    const target = board(ws, b.id);
    if (target) target.order = idx;
  });
  const a = board(ws, list[i].id);
  const b = board(ws, list[j].id);
  if (a && b) {
    const tmp = a.order;
    a.order = b.order;
    b.order = tmp;
  }
}

// ---- columns ----------------------------------------------------------

export function addColumn(ws: Workspace, boardId: string, title: string): Column | null {
  if (!board(ws, boardId)) return null;
  const col: Column = {
    id: uid("cl"),
    boardId,
    title: title.trim() || "New column",
    order: columnsOf(ws, boardId).length,
    wipLimit: null,
    done: false,
  };
  ws.columns.push(col);
  return col;
}

export function renameColumn(ws: Workspace, id: string, title: string): void {
  const c = column(ws, id);
  if (!c) return;
  c.title = title.trim() || c.title;
}

export function setWipLimit(ws: Workspace, id: string, limit: number | null): void {
  const c = column(ws, id);
  if (!c) return;
  c.wipLimit = limit === null || limit < 1 ? null : Math.floor(limit);
}

export function toggleColumnDone(ws: Workspace, id: string): void {
  const c = column(ws, id);
  if (!c) return;
  c.done = !c.done;
}

export function deleteColumn(ws: Workspace, id: string): void {
  const col = column(ws, id);
  if (!col) return;
  // Orphaned tasks fall back to the backlog rather than disappearing.
  for (const t of ws.tasks) {
    if (t.columnId === id) {
      t.columnId = null;
      t.order = rawBacklog(ws, t.boardId).length;
      t.updatedAt = nowISO();
    }
  }
  ws.columns = ws.columns.filter((c) => c.id !== id);
  columnsOf(ws, col.boardId).forEach((c, i) => {
    c.order = i;
  });
}

export function moveColumn(ws: Workspace, id: string, dir: -1 | 1): void {
  const col = column(ws, id);
  if (!col) return;
  const list = columnsOf(ws, col.boardId);
  const i = list.findIndex((c) => c.id === id);
  const j = i + dir;
  if (j < 0 || j >= list.length) return;
  const a = list[i];
  const b = list[j];
  const tmp = a.order;
  a.order = b.order;
  b.order = tmp;
}

// ---- tasks ------------------------------------------------------------

export interface NewTaskInput {
  title: string;
  columnId?: string | null;
  due?: string | null;
  priority?: Priority;
  tags?: string[];
  notes?: string;
  recurrence?: Recurrence;
}

export function addTask(ws: Workspace, boardId: string, input: NewTaskInput): Task {
  const columnId = input.columnId ?? null;
  const created: Task = {
    id: uid("tk"),
    boardId,
    columnId,
    title: input.title.trim() || "Untitled task",
    notes: input.notes ?? "",
    priority: input.priority ?? "medium",
    tags: input.tags ?? [],
    due: input.due ?? null,
    order: ws.tasks.filter((t) =>
      columnId ? t.columnId === columnId : t.boardId === boardId && t.columnId === null,
    ).length,
    subtasks: [],
    recurrence: input.recurrence ?? { kind: "none", interval: 1 },
    createdAt: nowISO(),
    updatedAt: nowISO(),
    completedAt: null,
    spawnedFrom: null,
  };
  ws.tasks.push(created);
  return created;
}

export function updateTask(
  ws: Workspace,
  id: string,
  patch: Partial<Omit<Task, "id" | "boardId">>,
): void {
  const t = task(ws, id);
  if (!t) return;
  Object.assign(t, patch);
  t.updatedAt = nowISO();
}

export function deleteTask(ws: Workspace, id: string): void {
  ws.tasks = ws.tasks.filter((x) => x.id !== id);
}

export function duplicateTask(ws: Workspace, id: string): Task | null {
  const t = task(ws, id);
  if (!t) return null;
  return addTask(ws, t.boardId, {
    title: `${t.title} (copy)`,
    columnId: t.columnId,
    due: t.due,
    priority: t.priority,
    tags: [...t.tags],
    notes: t.notes,
    recurrence: { ...t.recurrence },
  });
}

/**
 * Move a task into `columnId` (null = backlog) at `index` among its siblings.
 * Orders are renumbered densely so the board never drifts.
 */
export function moveTask(ws: Workspace, id: string, columnId: string | null, index: number): void {
  const t = task(ws, id);
  if (!t) return;
  const from = t.columnId;
  const source = siblings(ws, from, t.boardId);
  const sourceAt = source.findIndex((x) => x.id === id);
  if (sourceAt >= 0) source.splice(sourceAt, 1);

  if (from === columnId) {
    // Pure reorder within the same column.
    source.splice(clamp(index, 0, source.length), 0, t);
    source.forEach((x, i) => {
      x.order = i;
    });
    t.updatedAt = nowISO();
    return;
  }

  t.columnId = columnId;
  t.updatedAt = nowISO();
  const target = siblings(ws, columnId, t.boardId);
  target.splice(clamp(index, 0, target.length), 0, t);
  target.forEach((x, i) => {
    x.order = i;
  });
  source.forEach((x, i) => {
    x.order = i;
  });
}

export function completeTask(ws: Workspace, id: string): void {
  const t = task(ws, id);
  if (!t || t.completedAt) return;
  t.completedAt = nowISO();
  t.updatedAt = nowISO();
  if (t.recurrence.kind !== "none") spawnOccurrence(ws, t);
}

export function reopenTask(ws: Workspace, id: string): void {
  const t = task(ws, id);
  if (!t || !t.completedAt) return;
  t.completedAt = null;
  t.updatedAt = nowISO();
}

/** Clone a recurring task forward so the series continues. Idempotent per parent. */
export function spawnOccurrence(ws: Workspace, parent: Task): void {
  if (ws.tasks.some((t) => t.spawnedFrom === parent.id)) return;
  const clone: Task = {
    ...parent,
    id: uid("tk"),
    completedAt: null,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    spawnedFrom: parent.id,
    due: parent.due ? nextOccurrenceDue(parent.recurrence, parent.due) : null,
    order: parent.columnId
      ? rawColumnTasks(ws, parent.columnId).length
      : rawBacklog(ws, parent.boardId).length,
    subtasks: parent.subtasks.map((s) => ({ ...s, id: uid("sb"), done: false })),
    tags: [...parent.tags],
    recurrence: { ...parent.recurrence },
  };
  ws.tasks.push(clone);
}

// ---- subtasks ---------------------------------------------------------

export function addSubtask(ws: Workspace, taskId: string, title: string): void {
  const t = task(ws, taskId);
  if (!t) return;
  const clean = title.trim();
  if (!clean) return;
  t.subtasks.push({ id: uid("sb"), title: clean, done: false });
  t.updatedAt = nowISO();
}

export function toggleSubtask(ws: Workspace, taskId: string, subId: string): void {
  const t = task(ws, taskId);
  const s = t?.subtasks.find((x) => x.id === subId);
  if (!t || !s) return;
  s.done = !s.done;
  t.updatedAt = nowISO();
}

export function renameSubtask(ws: Workspace, taskId: string, subId: string, title: string): void {
  const s = task(ws, taskId)?.subtasks.find((x) => x.id === subId);
  if (!s) return;
  s.title = title.trim() || s.title;
}

export function removeSubtask(ws: Workspace, taskId: string, subId: string): void {
  const t = task(ws, taskId);
  if (!t) return;
  t.subtasks = t.subtasks.filter((x) => x.id !== subId);
  t.updatedAt = nowISO();
}

export function moveSubtask(ws: Workspace, taskId: string, subId: string, dir: -1 | 1): void {
  const t = task(ws, taskId);
  if (!t) return;
  const i = t.subtasks.findIndex((x) => x.id === subId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= t.subtasks.length) return;
  const [item] = t.subtasks.splice(i, 1);
  t.subtasks.splice(j, 0, item);
}

// ---- tags -------------------------------------------------------------

export function addTag(ws: Workspace, taskId: string, tag: string): void {
  const t = task(ws, taskId);
  if (!t) return;
  const clean = tag.trim().replace(/^#/, "").toLowerCase();
  if (!clean || t.tags.includes(clean)) return;
  t.tags.push(clean);
  t.updatedAt = nowISO();
}

export function removeTag(ws: Workspace, taskId: string, tag: string): void {
  const t = task(ws, taskId);
  if (!t) return;
  t.tags = t.tags.filter((x) => x !== tag);
  t.updatedAt = nowISO();
}

// ---- settings ---------------------------------------------------------

export function updateSettings(ws: Workspace, patch: Partial<Settings>): void {
  ws.settings = { ...ws.settings, ...patch };
}
