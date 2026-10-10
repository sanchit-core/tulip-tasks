import { emptyFilters, filterActive, matchesTask, type Filters } from "./filters";
import * as mutate from "./mutations";
import { coerceWorkspace, readWorkspace, toWorkspaceFile, writeWorkspace } from "./persist";
import * as select from "./selectors";
import { seedWorkspace } from "./seed";
import { emptyWorkspace } from "./workspace";
import {
  DEFAULT_SETTINGS,
  type Board,
  type Column,
  type Priority,
  type Settings,
  type Task,
  type Workspace,
} from "./types";

export { uid } from "./ids";
export type { Filters } from "./filters";
export { PRIORITY_RANK } from "./sorting";

export type View = "board" | "calendar" | "backlog";

/**
 * The single reactive app store.
 *
 * All state lives here so Svelte 5 runes can track it. The actual domain logic
 * (lookups, filtering, mutations) lives in plain, framework-free modules
 * (`selectors`, `filters`, `mutations`, `seed`) so it stays easy to read,
 * reuse and unit-test. Methods below are thin adapters that run a pure
 * function against `this.workspace` and then persist.
 */
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
  filters = $state<Filters>(emptyFilters());
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
    return select.boards(this.workspace);
  }

  board(id: string | null): Board | null {
    return select.board(this.workspace, id);
  }

  activeBoard(): Board | null {
    return this.board(this.activeBoardId);
  }

  columns(boardId: string | null = this.activeBoardId): Column[] {
    return select.columnsOf(this.workspace, boardId);
  }

  column(id: string | null): Column | null {
    return select.column(this.workspace, id);
  }

  task(id: string | null): Task | null {
    return select.task(this.workspace, id);
  }

  allTasks(): Task[] {
    return this.workspace.tasks;
  }

  /** Raw (unfiltered) tasks for a column, in board order. */
  rawColumnTasks(columnId: string): Task[] {
    return select.rawColumnTasks(this.workspace, columnId);
  }

  rawBacklog(boardId: string | null = this.activeBoardId): Task[] {
    return select.rawBacklog(this.workspace, boardId);
  }

  // ---- filtering ------------------------------------------------------
  allTags(): string[] {
    return select.allTags(this.workspace);
  }

  filterActive(): boolean {
    return filterActive(this.filters);
  }

  matches(task: Task): boolean {
    return matchesTask(task, this.filters);
  }

  columnTasks(columnId: string): Task[] {
    return select.columnTasks(this.workspace, columnId, this.filters);
  }

  backlogTasks(boardId: string | null = this.activeBoardId): Task[] {
    return select.backlogTasks(this.workspace, boardId, this.filters);
  }

  visibleToRaw(columnId: string | null, visibleIndex: number, boardId: string): number {
    return select.visibleToRaw(this.workspace, this.filters, columnId, visibleIndex, boardId);
  }

  visibleTasks(boardId: string | null = this.activeBoardId): Task[] {
    return select.visibleTasks(this.workspace, boardId, this.filters);
  }

  dueOn(iso: string, boardId: string | null = this.activeBoardId): Task[] {
    return select.dueOn(this.workspace, iso, boardId, this.filters);
  }

  overdueTasks(boardId: string | null = this.activeBoardId): Task[] {
    return select.overdueTasks(this.workspace, boardId, this.filters);
  }

  stats(boardId: string | null = this.activeBoardId) {
    return select.stats(this.workspace, boardId);
  }

  // ---- boards ---------------------------------------------------------
  addBoard(title: string, color = "#ff4d6d"): Board {
    const board = mutate.addBoard(this.workspace, title, color);
    this.activeBoardId = board.id;
    this.commit();
    return board;
  }

  renameBoard(id: string, title: string): void {
    mutate.renameBoard(this.workspace, id, title);
    this.commit();
  }

  recolorBoard(id: string, color: string): void {
    mutate.recolorBoard(this.workspace, id, color);
    this.commit();
  }

  /** Deletes the board and everything on it. Active board falls back to the first. */
  deleteBoard(id: string): void {
    mutate.deleteBoard(this.workspace, id);
    if (this.activeBoardId === id) this.activeBoardId = this.boards()[0]?.id ?? null;
    this.commit();
  }

  moveBoard(id: string, dir: -1 | 1): void {
    mutate.moveBoard(this.workspace, id, dir);
    this.commit();
  }

  selectBoard(id: string): void {
    this.activeBoardId = id;
  }

  // ---- columns --------------------------------------------------------
  addColumn(boardId: string, title: string): Column | null {
    const col = mutate.addColumn(this.workspace, boardId, title);
    if (col) this.commit();
    return col;
  }

  renameColumn(id: string, title: string): void {
    mutate.renameColumn(this.workspace, id, title);
    this.commit();
  }

  setWipLimit(id: string, limit: number | null): void {
    mutate.setWipLimit(this.workspace, id, limit);
    this.commit();
  }

  toggleColumnDone(id: string): void {
    mutate.toggleColumnDone(this.workspace, id);
    this.commit();
  }

  deleteColumn(id: string): void {
    mutate.deleteColumn(this.workspace, id);
    this.commit();
  }

  moveColumn(id: string, dir: -1 | 1): void {
    mutate.moveColumn(this.workspace, id, dir);
    this.commit();
  }

  // ---- tasks ----------------------------------------------------------
  addTask(
    input: mutate.NewTaskInput & { boardId?: string },
  ): Task | null {
    const board = this.board(input.boardId ?? this.activeBoardId);
    if (!board) return null;
    const created = mutate.addTask(this.workspace, board.id, input);
    this.commit();
    return created;
  }

  updateTask(id: string, patch: Partial<Omit<Task, "id" | "boardId">>): void {
    mutate.updateTask(this.workspace, id, patch);
    this.commit();
  }

  deleteTask(id: string): void {
    mutate.deleteTask(this.workspace, id);
    this.commit();
  }

  duplicateTask(id: string): Task | null {
    const copy = mutate.duplicateTask(this.workspace, id);
    if (copy) this.commit();
    return copy;
  }

  moveTask(id: string, columnId: string | null, index: number): void {
    mutate.moveTask(this.workspace, id, columnId, index);
    this.commit();
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
    mutate.completeTask(this.workspace, id);
    this.commit();
  }

  reopenTask(id: string): void {
    mutate.reopenTask(this.workspace, id);
    this.commit();
  }

  toggleComplete(id: string): void {
    this.task(id)?.completedAt ? this.reopenTask(id) : this.completeTask(id);
  }

  // ---- subtasks -------------------------------------------------------
  addSubtask(taskId: string, title: string): void {
    mutate.addSubtask(this.workspace, taskId, title);
    this.commit();
  }

  toggleSubtask(taskId: string, subId: string): void {
    mutate.toggleSubtask(this.workspace, taskId, subId);
    this.commit();
  }

  renameSubtask(taskId: string, subId: string, title: string): void {
    mutate.renameSubtask(this.workspace, taskId, subId, title);
    this.commit();
  }

  removeSubtask(taskId: string, subId: string): void {
    mutate.removeSubtask(this.workspace, taskId, subId);
    this.commit();
  }

  moveSubtask(taskId: string, subId: string, dir: -1 | 1): void {
    mutate.moveSubtask(this.workspace, taskId, subId, dir);
    this.commit();
  }

  // ---- tags -----------------------------------------------------------
  addTag(taskId: string, tag: string): void {
    mutate.addTag(this.workspace, taskId, tag);
    this.commit();
  }

  removeTag(taskId: string, tag: string): void {
    mutate.removeTag(this.workspace, taskId, tag);
    this.commit();
  }

  // ---- settings & import/export ---------------------------------------
  updateSettings(patch: Partial<Settings>): void {
    mutate.updateSettings(this.workspace, patch);
    this.commit();
  }

  exportJSON(): string {
    return JSON.stringify(toWorkspaceFile(this.workspace), null, 2);
  }

  /** Replace the whole workspace from a parsed JSON string. Returns false if invalid. */
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

export const store = new KanbanStore();
