import {
  DEFAULT_SETTINGS,
  WORKSPACE_VERSION,
  type Board,
  type Column,
  type Priority,
  type Recurrence,
  type Settings,
  type Task,
  type Workspace,
} from "./types";
import { nextOccurrenceDue } from "./recurrence";
import { coerceWorkspace, readWorkspace, toWorkspaceFile, writeWorkspace } from "./persist";
import { isOverdue, todayISO, toISO } from "./dates";

let seq = 0;
export function uid(prefix = "id"): string {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}${seq.toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

export type View = "board" | "calendar" | "backlog";

export interface Filters {
  /** Free-text search across title, notes and tags. */
  query: string;
  tags: string[];
  priorities: Priority[];
  due: "any" | "overdue" | "today" | "week" | "none";
  hideCompleted: boolean;
}

export const EMPTY_FILTERS: Filters = {
  query: "",
  tags: [],
  priorities: [],
  due: "any",
  hideCompleted: true,
};

function emptyWorkspace(): Workspace {
  return {
    version: WORKSPACE_VERSION,
    boards: [],
    columns: [],
    tasks: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

function nowISO(): string {
  return new Date().toISOString();
}

const DEFAULT_COLUMNS = ["Backlog", "To Do", "In Progress", "Review", "Done"];

export class KanbanStore {
  workspace = $state<Workspace>(emptyWorkspace());
  loaded = $state(false);
  saveState = $state<"idle" | "saving" | "error">("idle");

  // ---- ui state -------------------------------------------------------
  view = $state<View>("board");
  activeBoardId = $state<string | null>(null);
  activeTaskId = $state<string | null>(null);
  calendarAnchor = $state<Date>(new Date());
  calendarMode = $state<"month" | "week">("month");
  filters = $state<Filters>({ ...EMPTY_FILTERS });
  paletteOpen = $state(false);
  sidebarOpen = $state(true);
  dragTaskId = $state<string | null>(null);

  private timer: ReturnType<typeof setTimeout> | null = null;

  // ---- boot -----------------------------------------------------------
  async boot(): Promise<void> {
    const stored = await readWorkspace();
    if (stored && stored.boards.length > 0) {
      this.workspace = stored;
    } else {
      this.workspace = seedWorkspace();
      this.activeBoardId = this.workspace.boards[0]?.id ?? null;
      await writeWorkspace(this.workspace);
    }
    this.workspace.settings = { ...DEFAULT_SETTINGS, ...this.workspace.settings };
    if (!this.activeBoardId || !this.board(this.activeBoardId)) {
      this.activeBoardId = this.boards()[0]?.id ?? null;
    }
    this.loaded = true;
  }

  // ---- persistence ----------------------------------------------------
  /** Mark dirty and flush to disk on a short debounce. */
  commit(): void {
    this.saveState = "saving";
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(async () => {
      try {
        await writeWorkspace(this.workspace);
        this.saveState = "idle";
      } catch {
        this.saveState = "error";
      }
    }, 250);
  }

  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    try {
      await writeWorkspace(this.workspace);
      this.saveState = "idle";
    } catch {
      this.saveState = "error";
    }
  }

  // ---- lookups --------------------------------------------------------
  boards(): Board[] {
    return [...this.workspace.boards].sort((a, b) => a.order - b.order);
  }

  board(id: string | null): Board | null {
    if (!id) return null;
    return this.workspace.boards.find((b) => b.id === id) ?? null;
  }

  activeBoard(): Board | null {
    return this.board(this.activeBoardId);
  }

  columns(boardId: string | null = this.activeBoardId): Column[] {
    if (!boardId) return [];
    return this.workspace.columns.filter((c) => c.boardId === boardId).sort((a, b) => a.order - b.order);
  }

  column(id: string | null): Column | null {
    if (!id) return null;
    return this.workspace.columns.find((c) => c.id === id) ?? null;
  }

  task(id: string | null): Task | null {
    if (!id) return null;
    return this.workspace.tasks.find((t) => t.id === id) ?? null;
  }

  allTasks(): Task[] {
    return this.workspace.tasks;
  }

  /** Raw (unfiltered) tasks for a column, in board order. */
  rawColumnTasks(columnId: string): Task[] {
    return this.workspace.tasks
      .filter((t) => t.columnId === columnId)
      .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
  }

  rawBacklog(boardId: string | null = this.activeBoardId): Task[] {
    return this.workspace.tasks
      .filter((t) => t.columnId === null && (!boardId || t.boardId === boardId))
      .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
  }

  // ---- filtering ------------------------------------------------------
  allTags(): string[] {
    const set = new Set<string>();
    for (const t of this.workspace.tasks) for (const tag of t.tags) set.add(tag);
    return [...set].sort((a, b) => a.localeCompare(b));
  }

  filterActive(): boolean {
    const f = this.filters;
    return (
      f.tags.length > 0 ||
      f.priorities.length > 0 ||
      f.due !== "any" ||
      f.query.trim().length > 0
    );
  }

  /** Text search + tag/priority/due filters, shared by board, backlog and calendar. */
  matches(task: Task): boolean {
    const f = this.filters;
    const q = f.query.trim().toLowerCase();
    if (q) {
      const hay = `${task.title} ${task.notes} ${task.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.tags.length && !f.tags.every((tag) => task.tags.includes(tag))) return false;
    if (f.priorities.length && !f.priorities.includes(task.priority)) return false;

    const today = todayISO();
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
        const span =
          (new Date(task.due).getTime() - new Date(today).getTime()) / 86_400_000;
        if (span < 0 || span > 7) return false;
        break;
      }
    }
    if (f.hideCompleted && task.completedAt) return false;
    return true;
  }

  columnTasks(columnId: string): Task[] {
    return this.rawColumnTasks(columnId).filter((t) => this.matches(t));
  }

  backlogTasks(boardId: string | null = this.activeBoardId): Task[] {
    return this.rawBacklog(boardId).filter((t) => this.matches(t));
  }

  /**
   * Translate a drop slot in the *filtered* list into an index in the raw list.
   * Without this, dragging while a filter is active would drop the card at the
   * wrong position because hidden siblings occupy raw slots.
   */
  visibleToRaw(columnId: string | null, visibleIndex: number, boardId: string): number {
    const raw = columnId === null ? this.rawBacklog(boardId) : this.rawColumnTasks(columnId);
    const visible = raw.filter((t) => this.matches(t));
    const next = visible[visibleIndex];
    if (!next) return raw.length;
    return raw.findIndex((t) => t.id === next.id);
  }

  /** All tasks in a board (or every board) that pass the filters. */
  visibleTasks(boardId: string | null = this.activeBoardId): Task[] {
    return this.workspace.tasks
      .filter((t) => (boardId ? t.boardId === boardId : true))
      .filter((t) => this.matches(t));
  }

  dueOn(iso: string, boardId: string | null = this.activeBoardId): Task[] {
    return this.visibleTasks(boardId)
      .filter((t) => t.due === iso)
      .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
  }

  overdueTasks(boardId: string | null = this.activeBoardId): Task[] {
    const today = todayISO();
    return this.visibleTasks(boardId)
      .filter((t) => t.due !== null && t.due < today && !t.completedAt)
      .sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""));
  }

  stats(boardId: string | null = this.activeBoardId) {
    const tasks = this.workspace.tasks.filter((t) => (boardId ? t.boardId === boardId : true));
    const open = tasks.filter((t) => !t.completedAt);
    return {
      total: tasks.length,
      open: open.length,
      done: tasks.length - open.length,
      backlog: tasks.filter((t) => t.columnId === null && !t.completedAt).length,
      overdue: open.filter((t) => t.due !== null && isOverdue(t.due)).length,
      dueToday: open.filter((t) => t.due === todayISO()).length,
      completedSubtasks: open.reduce(
        (n, t) => n + t.subtasks.filter((s) => s.done).length,
        0,
      ),
      subtasks: open.reduce((n, t) => n + t.subtasks.length, 0),
    };
  }

  // ---- boards ---------------------------------------------------------
  addBoard(title: string, color = "#ff4d6d"): Board {
    const board: Board = {
      id: uid("bd"),
      title: title.trim() || "New board",
      color,
      order: this.workspace.boards.length,
      createdAt: nowISO(),
    };
    this.workspace.boards.push(board);
    DEFAULT_COLUMNS.forEach((name, i) => {
      this.workspace.columns.push({
        id: uid("cl"),
        boardId: board.id,
        title: name,
        order: i,
        wipLimit: null,
        done: name === "Done",
      });
    });
    this.activeBoardId = board.id;
    this.commit();
    return board;
  }

  renameBoard(id: string, title: string): void {
    const b = this.board(id);
    if (!b) return;
    b.title = title.trim() || b.title;
    this.commit();
  }

  recolorBoard(id: string, color: string): void {
    const b = this.board(id);
    if (!b) return;
    b.color = color;
    this.commit();
  }

  /** Deletes the board and everything on it. Active board falls back to the first. */
  deleteBoard(id: string): void {
    this.workspace.boards = this.workspace.boards.filter((b) => b.id !== id);
    this.workspace.columns = this.workspace.columns.filter((c) => c.boardId !== id);
    this.workspace.tasks = this.workspace.tasks.filter((t) => t.boardId !== id);
    if (this.activeBoardId === id) this.activeBoardId = this.boards()[0]?.id ?? null;
    this.commit();
  }

  moveBoard(id: string, dir: -1 | 1): void {
    const list = this.boards();
    const i = list.findIndex((b) => b.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    list.forEach((b, idx) => {
      const target = this.board(b.id);
      if (target) target.order = idx;
    });
    const a = this.board(list[i].id);
    const b = this.board(list[j].id);
    if (a && b) {
      const tmp = a.order;
      a.order = b.order;
      b.order = tmp;
    }
    this.commit();
  }

  selectBoard(id: string): void {
    this.activeBoardId = id;
  }

  // ---- columns --------------------------------------------------------
  addColumn(boardId: string, title: string): Column | null {
    if (!this.board(boardId)) return null;
    const col: Column = {
      id: uid("cl"),
      boardId,
      title: title.trim() || "New column",
      order: this.columns(boardId).length,
      wipLimit: null,
      done: false,
    };
    this.workspace.columns.push(col);
    this.commit();
    return col;
  }

  renameColumn(id: string, title: string): void {
    const c = this.column(id);
    if (!c) return;
    c.title = title.trim() || c.title;
    this.commit();
  }

  setWipLimit(id: string, limit: number | null): void {
    const c = this.column(id);
    if (!c) return;
    c.wipLimit = limit === null || limit < 1 ? null : Math.floor(limit);
    this.commit();
  }

  toggleColumnDone(id: string): void {
    const c = this.column(id);
    if (!c) return;
    c.done = !c.done;
    this.commit();
  }

  deleteColumn(id: string): void {
    const col = this.column(id);
    if (!col) return;
    // Orphaned tasks fall back to the backlog rather than disappearing.
    for (const t of this.workspace.tasks) {
      if (t.columnId === id) {
        t.columnId = null;
        t.order = this.rawBacklog(t.boardId).length;
        t.updatedAt = nowISO();
      }
    }
    this.workspace.columns = this.workspace.columns.filter((c) => c.id !== id);
    this.columns(col.boardId).forEach((c, i) => {
      c.order = i;
    });
    this.commit();
  }

  moveColumn(id: string, dir: -1 | 1): void {
    const col = this.column(id);
    if (!col) return;
    const list = this.columns(col.boardId);
    const i = list.findIndex((c) => c.id === id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const a = list[i];
    const b = list[j];
    a.order = b.order;
    b.order = a.order;
    this.commit();
  }

  // ---- tasks ----------------------------------------------------------
  addTask(input: {
    title: string;
    boardId?: string;
    columnId?: string | null;
    due?: string | null;
    priority?: Priority;
    tags?: string[];
    notes?: string;
    recurrence?: Recurrence;
  }): Task | null {
    const board = this.board(input.boardId ?? this.activeBoardId);
    if (!board) return null;
    const boardId = board.id;
    const columnId = input.columnId ?? null;
    const task: Task = {
      id: uid("tk"),
      boardId,
      columnId,
      title: input.title.trim() || "Untitled task",
      notes: input.notes ?? "",
      priority: input.priority ?? "medium",
      tags: input.tags ?? [],
      due: input.due ?? null,
      order: this.workspace.tasks.filter((t) =>
        columnId ? t.columnId === columnId : t.boardId === boardId && t.columnId === null,
      ).length,
      subtasks: [],
      recurrence: input.recurrence ?? { kind: "none", interval: 1 },
      createdAt: nowISO(),
      updatedAt: nowISO(),
      completedAt: null,
      spawnedFrom: null,
    };
    this.workspace.tasks.push(task);
    this.commit();
    return task;
  }

  updateTask(id: string, patch: Partial<Omit<Task, "id" | "boardId">>): void {
    const t = this.task(id);
    if (!t) return;
    Object.assign(t, patch);
    t.updatedAt = nowISO();
    this.commit();
  }

  deleteTask(id: string): void {
    const t = this.task(id);
    if (!t) return;
    this.workspace.tasks = this.workspace.tasks.filter((x) => x.id !== id);
    this.commit();
  }

  duplicateTask(id: string): Task | null {
    const t = this.task(id);
    if (!t) return null;
    return this.addTask({
      title: `${t.title} (copy)`,
      boardId: t.boardId,
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
  moveTask(id: string, columnId: string | null, index: number): void {
    const t = this.task(id);
    if (!t) return;
    const from = t.columnId;
    const source = this.siblings(from, t.boardId);
    const sourceAt = source.findIndex((x) => x.id === id);
    if (sourceAt >= 0) source.splice(sourceAt, 1);

    if (from === columnId) {
      // Pure reorder within the same column.
      source.splice(clamp(index, 0, source.length), 0, t);
      source.forEach((x, i) => {
        x.order = i;
      });
      t.updatedAt = nowISO();
      this.commit();
      return;
    }

    t.columnId = columnId;
    t.updatedAt = nowISO();
    const target = this.siblings(columnId, t.boardId);
    target.splice(clamp(index, 0, target.length), 0, t);
    target.forEach((x, i) => {
      x.order = i;
    });
    source.forEach((x, i) => {
      x.order = i;
    });
    this.commit();
  }

  /**
   * Tasks that share a home with `columnId`, in order.
   * A `null` column means the backlog, which is per-board — a plain
   * `columnId === x` filter would wrongly mix every board's inbox together.
   */
  private siblings(columnId: string | null, boardId: string): Task[] {
    return this.workspace.tasks
      .filter((t) =>
        columnId === null ? t.columnId === null && t.boardId === boardId : t.columnId === columnId,
      )
      .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
  }

  /** Dragging onto a done-column completes; dragging out of one reopens. */
  moveTaskSmart(id: string, columnId: string | null, index: number): void {
    const col = this.column(columnId);
    const wasDone = !!this.task(id)?.completedAt;
    this.moveTask(id, columnId, index);
    if (col?.done && !wasDone) this.completeTask(id);
    else if (!col?.done && wasDone) this.reopenTask(id);
  }

  completeTask(id: string): void {
    const t = this.task(id);
    if (!t || t.completedAt) return;
    t.completedAt = nowISO();
    t.updatedAt = nowISO();
    if (t.recurrence.kind !== "none") this.spawnOccurrence(t);
    this.commit();
  }

  reopenTask(id: string): void {
    const t = this.task(id);
    if (!t || !t.completedAt) return;
    t.completedAt = null;
    t.updatedAt = nowISO();
    this.commit();
  }

  toggleComplete(id: string): void {
    this.task(id)?.completedAt ? this.reopenTask(id) : this.completeTask(id);
  }

  /** Clone a recurring task forward so the series continues. Idempotent per parent. */
  private spawnOccurrence(parent: Task): void {
    if (this.workspace.tasks.some((t) => t.spawnedFrom === parent.id)) return;
    const clone: Task = {
      ...parent,
      id: uid("tk"),
      completedAt: null,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      spawnedFrom: parent.id,
      due: parent.due ? nextOccurrenceDue(parent.recurrence, parent.due) : null,
      order: parent.columnId ? this.rawColumnTasks(parent.columnId).length : this.rawBacklog(parent.boardId).length,
      subtasks: parent.subtasks.map((s) => ({ ...s, id: uid("sb"), done: false })),
      tags: [...parent.tags],
      recurrence: { ...parent.recurrence },
    };
    this.workspace.tasks.push(clone);
  }

  // ---- subtasks -------------------------------------------------------
  addSubtask(taskId: string, title: string): void {
    const t = this.task(taskId);
    if (!t) return;
    const clean = title.trim();
    if (!clean) return;
    t.subtasks.push({ id: uid("sb"), title: clean, done: false });
    t.updatedAt = nowISO();
    this.commit();
  }

  toggleSubtask(taskId: string, subId: string): void {
    const t = this.task(taskId);
    const s = t?.subtasks.find((x) => x.id === subId);
    if (!t || !s) return;
    s.done = !s.done;
    t.updatedAt = nowISO();
    this.commit();
  }

  renameSubtask(taskId: string, subId: string, title: string): void {
    const s = this.task(taskId)?.subtasks.find((x) => x.id === subId);
    if (!s) return;
    s.title = title.trim() || s.title;
    this.commit();
  }

  removeSubtask(taskId: string, subId: string): void {
    const t = this.task(taskId);
    if (!t) return;
    t.subtasks = t.subtasks.filter((x) => x.id !== subId);
    t.updatedAt = nowISO();
    this.commit();
  }

  moveSubtask(taskId: string, subId: string, dir: -1 | 1): void {
    const t = this.task(taskId);
    if (!t) return;
    const i = t.subtasks.findIndex((x) => x.id === subId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= t.subtasks.length) return;
    const [item] = t.subtasks.splice(i, 1);
    t.subtasks.splice(j, 0, item);
    this.commit();
  }

  // ---- tags -----------------------------------------------------------
  addTag(taskId: string, tag: string): void {
    const t = this.task(taskId);
    if (!t) return;
    const clean = tag.trim().replace(/^#/, "").toLowerCase();
    if (!clean || t.tags.includes(clean)) return;
    t.tags.push(clean);
    t.updatedAt = nowISO();
    this.commit();
  }

  removeTag(taskId: string, tag: string): void {
    const t = this.task(taskId);
    if (!t) return;
    t.tags = t.tags.filter((x) => x !== tag);
    t.updatedAt = nowISO();
    this.commit();
  }

  // ---- settings & import/export ---------------------------------------
  updateSettings(patch: Partial<Settings>): void {
    this.workspace.settings = { ...this.workspace.settings, ...patch };
    this.commit();
  }

  exportJSON(): string {
    return JSON.stringify(toWorkspaceFile(this.workspace), null, 2);
  }

  /** Replace the whole workspace from a parsed JSON string. Returns null if invalid. */
  importJSON(raw: string): boolean {
    const next = coerceWorkspace(JSON.parse(raw) as unknown);
    if (!next || next.boards.length === 0) return false;
    this.workspace = next;
    this.activeBoardId = next.boards.slice().sort((a, b) => a.order - b.order)[0]?.id ?? null;
    this.activeTaskId = null;
    this.commit();
    void this.flush();
    return true;
  }

  resetToDemo(): void {
    this.workspace = seedWorkspace();
    this.activeBoardId = this.workspace.boards[0]?.id ?? null;
    this.activeTaskId = null;
    this.commit();
  }

  // ---- helpers --------------------------------------------------------
  openTask(id: string | null): void {
    this.activeTaskId = id;
  }

  closeTask(): void {
    this.activeTaskId = null;
  }

  toggleTagFilter(tag: string): void {
    const i = this.filters.tags.indexOf(tag);
    if (i >= 0) this.filters.tags.splice(i, 1);
    else this.filters.tags.push(tag);
  }

  togglePriorityFilter(p: Priority): void {
    const i = this.filters.priorities.indexOf(p);
    if (i >= 0) this.filters.priorities.splice(i, 1);
    else this.filters.priorities.push(p);
  }

  clearFilters(): void {
    this.filters.tags = [];
    this.filters.priorities = [];
    this.filters.due = "any";
    this.filters.query = "";
  }
}

export const PRIORITY_RANK: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ---- demo workspace ---------------------------------------------------
function seedWorkspace(): Workspace {
  const ws = emptyWorkspace();
  const today = new Date();
  const at = (offset: number): string => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return toISO(d);
  };

  const mk = (
    boardId: string,
    columnId: string | null,
    title: string,
    extra: Partial<Task> = {},
  ): Task => ({
    id: uid("tk"),
    boardId,
    columnId,
    title,
    notes: "",
    priority: "medium",
    tags: [],
    due: null,
    order: 0,
    subtasks: [],
    recurrence: { kind: "none", interval: 1 },
    createdAt: nowISO(),
    updatedAt: nowISO(),
    completedAt: null,
    spawnedFrom: null,
    ...extra,
  });

  const build = (
    title: string,
    color: string,
    columns: string[],
    tasks: (boardId: string, cols: Record<string, string>) => Task[],
  ): Board => {
    const board: Board = {
      id: uid("bd"),
      title,
      color,
      order: ws.boards.length,
      createdAt: nowISO(),
    };
    ws.boards.push(board);
    const colIds: Record<string, string> = {};
    columns.forEach((name, i) => {
      const id = uid("cl");
      colIds[name] = id;
      ws.columns.push({
        id,
        boardId: board.id,
        title: name,
        order: i,
        wipLimit: name === "In Progress" ? 3 : null,
        done: name === "Done",
      });
    });
    ws.tasks.push(...tasks(board.id, colIds));
    return board;
  };

  build(
    "Personal",
    "#ff4d6d",
    ["To Do", "In Progress", "Review", "Done"],
    (boardId, cols) => {
      const out: Task[] = [
        mk(boardId, null, "Renew passport", { tags: ["admin", "urgent"], priority: "urgent", due: at(9) }),
        mk(boardId, null, "Look into a standing desk", { tags: ["shopping"] }),
        mk(boardId, cols["To Do"], "Book dentist appointment", {
          tags: ["health"],
          priority: "high",
          due: at(2),
        }),
        mk(boardId, cols["To Do"], "Plan weekend trip", {
          notes: "Somewhere cheap, ideally with a train connection.",
          tags: ["travel"],
          subtasks: [
            { id: uid("sb"), title: "Pick two destinations", done: true },
            { id: uid("sb"), title: "Compare train prices", done: false },
            { id: uid("sb"), title: "Check leave days", done: false },
          ],
        }),
        mk(boardId, cols["In Progress"], "Finish the balcony repaint", {
          priority: "high",
          due: at(-2),
          tags: ["home"],
        }),
        mk(boardId, cols["In Progress"], "Weekly review", {
          due: at(0),
          recurrence: { kind: "weekly", interval: 1 },
          tags: ["ritual"],
        }),
        mk(boardId, cols["Review"], "Update CV", { tags: ["career"], due: at(6) }),
        mk(boardId, cols["Done"], "Cancel old subscription", {
          completedAt: nowISO(),
          tags: ["admin"],
        }),
      ];
      out.forEach((t, i) => {
        t.order = i;
      });
      return out;
    },
  );

  build(
    "Work",
    "#7c6cf0",
    ["Backlog", "To Do", "In Progress", "Review", "Done"],
    (boardId, cols) => [
      mk(boardId, cols["Backlog"], "Draft Q3 roadmap", { tags: ["planning"], priority: "medium" }),
      mk(boardId, cols["Backlog"], "Evaluate new logging vendor", { tags: ["infra"] }),
      mk(boardId, cols["To Do"], "Fix flaky checkout test", {
        priority: "urgent",
        due: at(1),
        tags: ["bug"],
      }),
      mk(boardId, cols["In Progress"], "Migrate build to Nix", {
        notes: "Reproducible builds for CI. Watch out for the sandbox paths.",
        tags: ["infra", "tooling"],
        priority: "high",
        due: at(4),
        subtasks: [
          { id: uid("sb"), title: "Pin flake inputs", done: true },
          { id: uid("sb"), title: "Swap CI actions", done: false },
        ],
      }),
      mk(boardId, cols["In Progress"], "Standup", {
        due: at(0),
        recurrence: { kind: "daily", interval: 1 },
        tags: ["ritual"],
      }),
      mk(boardId, cols["Review"], "Write incident postmortem", {
        priority: "high",
        tags: ["docs"],
        due: at(-1),
      }),
      mk(boardId, cols["Done"], "Ship dark mode", { completedAt: nowISO(), tags: ["feature"] }),
    ],
  );

  return ws;
}

export const store = new KanbanStore();
